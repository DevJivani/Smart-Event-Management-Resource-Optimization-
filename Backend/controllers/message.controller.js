import { Message } from "../models/message.model.js";
import { Notification } from "../models/notification.model.js";
import { sendNotificationEmail } from "../utils/email.js";

export const getOrganizerMessages = async (req, res) => {
  try {
    let messages = await Message.find({ organizerId: req.user._id })
      .populate("eventId", "title")
      .sort({ createdAt: -1 });

    // Filter sub-messages that are deleted for the current user or everyone
    messages = messages
      .map((msg) => {
        const filteredMessages = msg.messages.filter(
          (m) =>
            !m.isDeletedForEveryone &&
            !m.deletedBy.some((id) => String(id) === String(req.user._id))
        );
        msg.messages = filteredMessages;
        return msg;
      })
      .filter((msg) => msg.messages.length > 0);

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserMessages = async (req, res) => {
  try {
    let messages = await Message.find({ senderId: req.user._id })
      .populate("eventId", "title")
      .populate("organizerId", "userName email")
      .sort({ createdAt: -1 });

    // Filter sub-messages that are deleted for the current user or everyone
    messages = messages
      .map((msg) => {
        const filteredMessages = msg.messages.filter(
          (m) =>
            !m.isDeletedForEveryone &&
            !m.deletedBy.some((id) => String(id) === String(req.user._id))
        );
        msg.messages = filteredMessages;
        return msg;
      })
      .filter((msg) => msg.messages.length > 0);

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { threadId, messageId, deleteType } = req.body; // deleteType: "me" or "everyone"
    if (!threadId || !messageId || !deleteType) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const thread = await Message.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

    // Check if the user is part of the conversation
    if (String(thread.senderId) !== String(req.user._id) && String(thread.organizerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const messageToUpdate = thread.messages.id(messageId);
    if (!messageToUpdate) return res.status(404).json({ success: false, message: "Message not found" });

    if (deleteType === "me") {
      // Add the user to deletedBy list if not already there
      if (!messageToUpdate.deletedBy.some(id => String(id) === String(req.user._id))) {
        messageToUpdate.deletedBy.push(req.user._id);
      }
    } else if (deleteType === "everyone") {
      // Security check: Only the sender can delete for everyone
      const isUser = String(thread.senderId) === String(req.user._id);
      const isOrganizer = String(thread.organizerId) === String(req.user._id);
      
      if ((messageToUpdate.senderType === "user" && !isUser) || 
          (messageToUpdate.senderType === "organizer" && !isOrganizer)) {
        return res.status(403).json({ success: false, message: "You can only delete your own messages for everyone" });
      }
      messageToUpdate.isDeletedForEveryone = true;
    } else {
      return res.status(400).json({ success: false, message: "Invalid delete type" });
    }

    await thread.save();
    return res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { threadId } = req.body;
    if (!threadId) {
      return res.status(400).json({ success: false, message: "Thread ID is required" });
    }

    const thread = await Message.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

    // Check if user is part of the conversation
    if (String(thread.senderId) !== String(req.user._id) && String(thread.organizerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Add user ID to deletedBy array of all messages in the thread if not already there
    thread.messages.forEach(m => {
      if (!m.deletedBy.some(id => String(id) === String(req.user._id))) {
        m.deletedBy.push(req.user._id);
      }
    });

    await thread.save();
    return res.status(200).json({ success: true, message: "Chat cleared successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const userFollowUp = async (req, res) => {
  try {
    const { messageId, followUp } = req.body;
    if (!messageId || !followUp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (String(message.senderId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Add follow-up to the message thread
    message.messages.push({
      senderType: "user",
      content: followUp,
      timestamp: new Date()
    });
    
    message.isReplied = false; // Reset status so organizer sees it as pending
    await message.save();

    // Notify Organizer
    await Notification.create({
      userId: message.organizerId,
      title: "New Follow-up Inquiry",
      message: `A user has sent a follow-up question regarding their previous inquiry.`,
    });

    return res.status(200).json({ success: true, message: "Follow-up sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const replyToMessage = async (req, res) => {
  try {
    const { messageId, reply } = req.body;
    if (!messageId || !reply) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (String(message.organizerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Add organizer reply to the message thread
    message.messages.push({
      senderType: "organizer",
      content: reply,
      timestamp: new Date()
    });

    message.isReplied = true;
    await message.save();

    // If sender was a logged in user, send them a notification
    if (message.senderId) {
      await Notification.create({
        userId: message.senderId,
        title: "Organizer Replied to Your Inquiry",
        message: `Organizer replied to your message about ${message.eventId?.title || "an event"}: "${reply}"`,
      });

      // Send Email Notification
      await sendNotificationEmail(message.senderId, {
        subject: `New Reply from Organizer - EventHub`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">New Reply Received</h2>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="color: #374151;">Hello,</p>
                    <p style="color: #6b7280;">An organizer has replied to your inquiry about <strong>${message.eventId?.title || "an event"}</strong>:</p>
                    
                    <div style="background: #f3f4f6; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; font-style: italic; color: #4b5563;">
                        "${reply}"
                    </div>

                    <p style="color: #6b7280; font-size: 14px;">Log in to your dashboard to see more details and continue the conversation.</p>
                </div>
                <div style="background: #f9fafb; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                    &copy; 2026 EventHub. All rights reserved.
                </div>
            </div>
        `
      });
    }

    return res.status(200).json({ success: true, message: "Reply sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
