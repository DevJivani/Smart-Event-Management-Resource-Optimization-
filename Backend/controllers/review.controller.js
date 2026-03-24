import { Review } from "../models/review.model.js";
import { Event } from "../models/event.model.js";
import { Notification } from "../models/notification.model.js";

export const getReviewsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required", success: false });
    }
    const reviews = await Review.find({ eventId, visible: true })
      .populate("userId", "name email role")
      .populate("replies.userId", "name email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ message: "Reviews fetched", reviews, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const createReviewForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    if (!eventId || !rating) {
      return res.status(400).json({ message: "Event ID and rating are required", success: false });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found", success: false });
    }
    const review = await Review.create({
      userId: req.user._id,
      eventId,
      rating: Number(rating),
      comment: comment || "",
    });
    const populated = await Review.findById(review._id).populate("userId", "name email");
    return res.status(201).json({ message: "Review created", review: populated, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAllPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ visible: true })
      .populate("userId", "name email role")
      .populate("eventId", "title")
      .populate("replies.userId", "name email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ message: "Public reviews fetched", reviews, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const adminGetAllReviews = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can perform this action", success: false });
    }
    const reviews = await Review.find({})
      .populate("userId", "name email")
      .populate("eventId", "title")
      .sort({ createdAt: -1 });
    return res.status(200).json({ message: "Admin reviews fetched", reviews, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const approveReview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can perform this action", success: false });
    }
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found", success: false });
    }
    review.visible = true;
    await review.save();
    const populated = await Review.findById(review._id).populate("userId", "name email").populate("eventId", "title");
    return res.status(200).json({ message: "Review approved", review: populated, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const hideReview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can perform this action", success: false });
    }
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found", success: false });
    }
    review.visible = false;
    await review.save();
    const populated = await Review.findById(review._id).populate("userId", "name email").populate("eventId", "title");
    return res.status(200).json({ message: "Review hidden", review: populated, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const replyToReview = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    const { reviewId } = req.params;
    const { comment } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found", success: false });
    }
    const event = await Event.findById(review.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found", success: false });
    }
    if (req.user.role === "organizer") {
      if (String(event.createdBy) !== String(req.user._id)) {
        return res.status(403).json({ message: "Not allowed to reply for this event", success: false });
      }
    } else if (req.user.role === "user") {
      if (String(review.userId) !== String(req.user._id)) {
        return res.status(403).json({ message: "Only the review author can reply", success: false });
      }
    } else {
      return res.status(403).json({ message: "Forbidden", success: false });
    }
    review.replies = review.replies || [];
    review.replies.push({ userId: req.user._id, comment, createdAt: new Date() });
    await review.save();
    if (req.user.role === "organizer") {
      try {
        await Notification.create({
          userId: review.userId,
          title: "Organizer replied to your review",
          message: `Organizer responded on "${event.title}": ${comment}`,
        });
      } catch {
        // ignore notification errors
      }
    } else if (req.user.role === "user") {
      try {
        await Notification.create({
          userId: event.createdBy,
          title: "User replied to your event review",
          message: `User responded on "${event.title}": ${comment}`,
        });
      } catch {
        // ignore notification errors
      }
    }
    const populated = await Review.findById(review._id)
      .populate("userId", "name email role")
      .populate("eventId", "title")
      .populate("replies.userId", "name email role");
    return res.status(201).json({ message: "Reply added", review: populated, success: true });
  } catch (e) {
    return res.status(500).json({ message: "Server error", success: false });
  }
};
