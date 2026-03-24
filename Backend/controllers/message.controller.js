import { Message } from "../models/message.model.js";
import { Notification } from "../models/notification.model.js";
import { sendNotificationEmail } from "../utils/email.js";

export const getOrganizerMessages = async (req, res) => {
  try {
    const messages = await Message.find({ organizerId: req.user._id })
      .populate("eventId", "title")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, messages });
  } catch (error) {
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

    message.reply = reply;
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
