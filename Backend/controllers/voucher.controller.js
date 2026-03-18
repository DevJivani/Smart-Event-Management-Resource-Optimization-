import { Voucher } from "../models/voucher.model.js";
import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { Booking } from "../models/booking.model.js";

// Create a new voucher (Organizer only)
export const createVoucher = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      expiryDate,
      usageLimit,
      minAmount,
      maxDiscount,
      eventId,
    } = req.body;

    const organizerId = req.user._id; // From auth middleware

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({
        message: "Please provide all required fields",
        success: false,
      });
    }

    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      return res.status(400).json({
        message: "Voucher code already exists",
        success: false,
      });
    }

    const voucher = await Voucher.create({
      code,
      discountType,
      discountValue,
      expiryDate,
      usageLimit,
      minAmount,
      maxDiscount,
      eventId: eventId || null,
      createdBy: organizerId,
    });

    return res.status(201).json({
      message: "Voucher created successfully",
      voucher,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Notify users about a voucher
export const notifyUsers = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const organizerId = req.user._id;

    const voucher = await Voucher.findOne({ _id: voucherId, createdBy: organizerId }).populate("eventId", "title");

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found or unauthorized",
        success: false,
      });
    }

    // Restrict scope: Notify ONLY users with role "user"
    const usersToNotify = await User.find({ role: "user" });
    console.log(`Voucher Notification: Notifying ${usersToNotify.length} regular users.`);

    if (usersToNotify.length === 0) {
      return res.status(200).json({
        message: "No users found to notify.",
        success: true,
      });
    }

    const notificationTitle = `Special Offer: ${voucher.code}`;
    const discountText = voucher.discountType === "percentage" ? `${voucher.discountValue}% OFF` : `₹${voucher.discountValue} OFF`;
    const eventText = voucher.eventId ? `on ${voucher.eventId.title}` : "on any event";
    
    const notificationMessage = `Use code ${voucher.code} to get ${discountText} ${eventText}! Valid until ${new Date(voucher.expiryDate).toLocaleDateString()}.`;

    const notifications = usersToNotify.map(user => ({
      userId: user._id,
      title: notificationTitle,
      message: notificationMessage,
    }));

    try {
      await Notification.insertMany(notifications);
      console.log(`Voucher Notification Debug: Successfully inserted ${notifications.length} notifications into DB.`);
    } catch (dbError) {
      console.error("Voucher Notification Debug: Error during insertMany:", dbError);
      throw dbError;
    }

    return res.status(200).json({
      message: `Successfully sent notifications to ${notifications.length} users.`,
      success: true,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Get all vouchers for an organizer
export const getOrganizerVouchers = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const vouchers = await Voucher.find({ createdBy: organizerId }).populate("eventId", "title").sort({ createdAt: -1 });

    return res.status(200).json({
      vouchers,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Update a voucher
export const updateVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const updateData = req.body;
    const organizerId = req.user._id;

    const voucher = await Voucher.findOne({ _id: voucherId, createdBy: organizerId });

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found or unauthorized",
        success: false,
      });
    }

    const updatedVoucher = await Voucher.findByIdAndUpdate(
      voucherId,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      message: "Voucher updated successfully",
      voucher: updatedVoucher,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Delete a voucher
export const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const organizerId = req.user._id;

    const voucher = await Voucher.findOneAndDelete({ _id: voucherId, createdBy: organizerId });

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found or unauthorized",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Voucher deleted successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Validate a voucher (for User during booking)
export const validateVoucher = async (req, res) => {
  try {
    const { code, eventId, amount } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Voucher code is required",
        success: false,
      });
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

    if (!voucher) {
      return res.status(404).json({
        message: "Invalid voucher code",
        success: false,
      });
    }

    // Check expiry
    if (new Date(voucher.expiryDate) < new Date()) {
      return res.status(400).json({
        message: "Voucher has expired",
        success: false,
      });
    }

    // Check usage limit
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({
        message: "Voucher usage limit reached",
        success: false,
      });
    }

    // Check if applicable to the event
    if (voucher.eventId && voucher.eventId.toString() !== eventId) {
      return res.status(400).json({
        message: "Voucher is not applicable for this event",
        success: false,
      });
    }

    // Check minimum amount
    if (amount < voucher.minAmount) {
      return res.status(400).json({
        message: `Minimum amount to use this voucher is ${voucher.minAmount}`,
        success: false,
      });
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discountType === "percentage") {
      discount = (amount * voucher.discountValue) / 100;
      if (voucher.maxDiscount !== null && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else {
      discount = voucher.discountValue;
    }

    return res.status(200).json({
      message: "Voucher validated successfully",
      discount,
      voucherId: voucher._id,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
