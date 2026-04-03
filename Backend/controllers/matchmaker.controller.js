import { Booking } from "../models/booking.model.js";
import { User } from "../models/user.model.js";
import { Connection } from "../models/connection.model.js";
import { Notification } from "../models/notification.model.js";
import { Event } from "../models/event.model.js";
import mongoose from "mongoose";

/**
 * @desc    Get matching attendees for an event based on shared interests
 * @route   GET /api/v1/matchmaker/matches/:eventId
 * @access  Private
 */
export const getMatches = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // 1. Get current user's interests
    const currentUser = await User.findById(userId).populate("interests");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userInterestIds = currentUser.interests.map((i) => i._id.toString());
    const blockedUserIds = (currentUser.blockedUsers || []).map((id) => id.toString());

    // 2. Find all confirmed bookings for this event (excluding the current user and blocked users)
    const bookings = await Booking.find({
      eventId,
      bookingStatus: "confirmed",
      userId: { 
        $ne: userId,
        $nin: blockedUserIds // Exclude users that the current user has blocked
      },
    }).populate({
      path: "userId",
      select: "name profileImage interests publicProfile blockedUsers",
      populate: {
        path: "interests",
        select: "name",
      },
    });

    // 3. Filter and score matches based on shared interests
    const matches = bookings
      .map((booking) => {
        const attendee = booking.userId;
        if (!attendee || !attendee.publicProfile) return null;

        // Also check if the attendee has blocked the current user
        const attendeeBlockedUsers = (attendee.blockedUsers || []).map(id => id.toString());
        if (attendeeBlockedUsers.includes(userId.toString())) return null;

        const sharedInterests = attendee.interests.filter((interest) =>
          userInterestIds.includes(interest._id.toString())
        );

        if (sharedInterests.length === 0) return null;

        return {
          _id: attendee._id,
          name: attendee.name,
          profileImage: attendee.profileImage,
          sharedInterests: sharedInterests.map((i) => i.name),
          matchScore: sharedInterests.length,
        };
      })
      .filter((match) => match !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    // 4. Get existing connections to show status
    const connections = await Connection.find({
      $or: [
        { senderId: userId, eventId },
        { receiverId: userId, eventId },
      ],
    });

    const matchesWithStatus = matches.map((match) => {
      const connection = connections.find(
        (c) =>
          (c.senderId.toString() === userId.toString() &&
            c.receiverId.toString() === match._id.toString()) ||
          (c.receiverId.toString() === userId.toString() &&
            c.senderId.toString() === match._id.toString())
      );

      return {
        ...match,
        connectionStatus: connection ? connection.status : "none",
        isSender: connection ? connection.senderId.toString() === userId.toString() : false,
      };
    });

    res.status(200).json({
      success: true,
      matches: matchesWithStatus,
    });
  } catch (error) {
    console.error("Error in getMatches:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Send a connection request or a "Quick Hello"
 * @route   POST /api/v1/matchmaker/connect
 * @access  Private
 */
export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId, eventId, message } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !eventId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if either user has blocked the other
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (sender.blockedUsers.includes(receiverId)) {
      return res.status(400).json({ success: false, message: "You have blocked this user" });
    }
    if (receiver.blockedUsers.includes(senderId)) {
      return res.status(400).json({ success: false, message: "This user has blocked you" });
    }

    // Check if a connection already exists (either way)
    const existingConnection = await Connection.findOne({
      $or: [
        { senderId, receiverId, eventId },
        { senderId: receiverId, receiverId: senderId, eventId }
      ]
    });

    if (existingConnection) {
      // If a rejected connection exists, we allow a new one
      if (existingConnection.status === "rejected") {
        await Connection.findByIdAndDelete(existingConnection._id);
      } else {
        return res.status(400).json({ success: false, message: "Connection request already exists or you're already connected!" });
      }
    }

    const newConnection = await Connection.create({
      senderId,
      receiverId,
      eventId,
      message: message || "Hi! I saw we have shared interests and are attending the same event. Would love to connect!",
      status: "pending",
    });

    // Create a notification for the receiver
    // const sender = await User.findById(senderId).select("name"); // already fetched sender above
    const event = await Event.findById(eventId).select("title");
    
    await Notification.create({
      userId: receiverId,
      title: "New Connection Request!",
      message: `${sender.name} wants to connect with you for the event: ${event.title}. Check your dashboard to respond!`,
    });

    res.status(201).json({
      success: true,
      message: "Connection request sent",
      connection: newConnection,
    });
  } catch (error) {
    console.error("Error in sendConnectionRequest:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Update connection status (accept/reject)
 * @route   PATCH /api/v1/matchmaker/status
 * @access  Private
 */
export const updateConnectionStatus = async (req, res) => {
  try {
    const { connectionId, status } = req.body;
    const userId = req.user._id;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }

    if (connection.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this connection" });
    }

    if (status === "rejected") {
      // If rejected, delete the connection so they can connect again as requested
      await Connection.findByIdAndDelete(connectionId);
      return res.status(200).json({
        success: true,
        message: "Connection request ignored",
      });
    }

    connection.status = status;
    await connection.save();

    res.status(200).json({
      success: true,
      message: `Connection request ${status}`,
      connection,
    });
  } catch (error) {
    console.error("Error in updateConnectionStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Block a user
 * @route   POST /api/v1/matchmaker/block
 * @access  Private
 */
export const blockUser = async (req, res) => {
  try {
    const { blockUserId } = req.body;
    const userId = req.user._id;

    if (!blockUserId) {
      return res.status(400).json({ success: false, message: "Missing blockUserId" });
    }

    const user = await User.findById(userId);
    if (!user.blockedUsers.includes(blockUserId)) {
      user.blockedUsers.push(blockUserId);
      await user.save();
    }

    // Also delete any existing connections or chats between them
    await Connection.deleteMany({
      $or: [
        { senderId: userId, receiverId: blockUserId },
        { senderId: blockUserId, receiverId: userId }
      ]
    });

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Error in blockUser:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Unblock a user
 * @route   POST /api/v1/matchmaker/unblock
 * @access  Private
 */
export const unblockUser = async (req, res) => {
  try {
    const { unblockUserId } = req.body;
    const userId = req.user._id;

    if (!unblockUserId) {
      return res.status(400).json({ success: false, message: "Missing unblockUserId" });
    }

    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== unblockUserId.toString());
    await user.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error in unblockUser:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc    Get blocked users list
 * @route   GET /api/v1/matchmaker/blocked-list
 * @access  Private
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("blockedUsers", "name profileImage email");

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers,
    });
  } catch (error) {
    console.error("Error in getBlockedUsers:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



/**
 * @desc    Get all connection requests for the current user
 * @route   GET /api/v1/matchmaker/requests
 * @access  Private
 */
export const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await Connection.find({
      receiverId: userId,
      status: "pending",
    })
      .populate("senderId", "name profileImage email")
      .populate("eventId", "title bannerImage startDate");

    const sentRequests = await Connection.find({
      senderId: userId,
    })
      .populate("receiverId", "name profileImage email")
      .populate("eventId", "title bannerImage startDate");

    res.status(200).json({
      success: true,
      received: requests,
      sent: sentRequests,
    });
  } catch (error) {
    console.error("Error in getConnectionRequests:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

