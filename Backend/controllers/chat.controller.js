import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { Connection } from "../models/connection.model.js";
import { Notification } from "../models/notification.model.js";

/**
 * @desc    Get or create a chat between two users for an event
 * @route   POST /api/v1/chat/get-or-create
 * @access  Private
 */
export const getOrCreateChat = async (req, res) => {
  try {
    const { receiverId, eventId } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !eventId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if a connection exists and is accepted
    const connection = await Connection.findOne({
      $or: [
        { senderId, receiverId, eventId, status: "accepted" },
        { senderId: receiverId, receiverId: senderId, eventId, status: "accepted" },
      ],
    });

    if (!connection) {
      return res.status(403).json({ success: false, message: "Connection must be accepted before chatting" });
    }

    // Check if a chat already exists (order-independent)
    let chat = await Chat.findOne({
      eventId,
      $and: [
        { participants: senderId },
        { participants: receiverId },
        { participants: { $size: 2 } }
      ]
    }).populate("participants", "name profileImage");

    if (!chat) {
      chat = await Chat.create({
        eventId,
        participants: [senderId, receiverId],
        messages: [],
      });
      chat = await Chat.findById(chat._id).populate("participants", "name profileImage");
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("Error in getOrCreateChat:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Send a message in a chat
 * @route   POST /api/v1/chat/send
 * @access  Private
 */
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const senderId = req.user._id;

    if (!chatId || !content) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to send messages in this chat" });
    }

    const newMessage = {
      senderId,
      content,
      timestamp: new Date(),
      isRead: false,
    };

    chat.messages.push(newMessage);
    await chat.save();

    // Notify the other participant
    const receiverId = chat.participants.find(p => p.toString() !== senderId.toString());
    const sender = await User.findById(senderId).select("name");
    
    await Notification.create({
      userId: receiverId,
      title: "New Message!",
      message: `${sender.name} sent you a message. Click to view!`,
    });

    res.status(200).json({ success: true, message: "Message sent", chat });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Get all chats for the current user
 * @route   GET /api/v1/chat/my-chats
 * @access  Private
 */
export const getMyChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "name profileImage")
      .populate("eventId", "title bannerImage")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("Error in getMyChats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Delete a message (for me or for everyone)
 * @route   DELETE /api/v1/chat/delete-message
 * @access  Private
 */
export const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId, deleteType } = req.body;
    const userId = req.user._id;

    if (!chatId || !messageId || !deleteType) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const messageIndex = chat.messages.findIndex(m => m._id.toString() === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const message = chat.messages[messageIndex];

    if (deleteType === "everyone") {
      // Only sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Only the sender can delete a message for everyone" });
      }
      message.isDeletedForEveryone = true;
      message.content = "This message was deleted";
    } else if (deleteType === "me") {
      // Add user to deletedBy array if not already there
      if (!message.deletedBy.includes(userId)) {
        message.deletedBy.push(userId);
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid delete type" });
    }

    await chat.save();

    res.status(200).json({ success: true, message: "Message deleted successfully", chat });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

