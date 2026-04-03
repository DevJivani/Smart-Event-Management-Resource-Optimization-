import { Voucher } from "../models/voucher.model.js";
import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";
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
      eventIds,
      requiredBadge,
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
      eventIds: eventIds || [],
      requiredBadge: requiredBadge || null,
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

// Get all vouchers for an organizer
export const getOrganizerVouchers = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const vouchers = await Voucher.find({ createdBy: organizerId }).populate("eventIds", "title").sort({ createdAt: -1 });

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

    if (updateData.code && updateData.code.toUpperCase() !== voucher.code) {
      const existingVoucher = await Voucher.findOne({ code: updateData.code.toUpperCase() });
      if (existingVoucher) {
        return res.status(400).json({
          message: "Voucher code already exists",
          success: false,
        });
      }
    }

    // Clean up updateData to handle empty strings/arrays for ObjectIds
    if (updateData.eventIds === "" || (Array.isArray(updateData.eventIds) && updateData.eventIds.length === 0)) {
      updateData.eventIds = [];
    }
    if (updateData.requiredBadge === "") updateData.requiredBadge = null;

    // Ensure boolean is not sent as string
    if (typeof updateData.isAdvertised === 'string') {
      updateData.isAdvertised = updateData.isAdvertised === 'true';
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

// Get vouchers eligible for the current user
export const getEligibleVouchers = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const userBadgeNames = (user.badges || []).map(b => b.name);

    // Find vouchers that:
    // 1. Are active
    // 2. Haven't expired
    // 3. Haven't reached usage limit
    // 4. Either have NO required badge OR require a badge the user has
    const vouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $gte: new Date() },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
      ],
      $or: [
        { requiredBadge: null },
        { requiredBadge: { $in: userBadgeNames } }
      ]
    }).populate("eventIds", "title bannerImage");

    return res.status(200).json({
      success: true,
      vouchers
    });
  } catch (error) {
    console.error("Error in getEligibleVouchers:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// Get all advertised vouchers
export const getAdvertisedVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      isActive: true,
      isAdvertised: true,
      expiryDate: { $gte: new Date() },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
      ],
    }).populate("eventIds", "title bannerImage").populate("createdBy", "name");

    return res.status(200).json({ success: true, vouchers });
  } catch (error) {
    console.error("Error fetching advertised vouchers:", error);
    return res.status(500).json({ message: "Server error", success: false });
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

    // Check if voucher requires a badge
    if (voucher.requiredBadge) {
      const user = req.user;
      const hasBadge = user.badges?.some(b => b.name === voucher.requiredBadge);
      if (!hasBadge) {
        return res.status(400).json({
          message: `This is an exclusive discount for "${voucher.requiredBadge}" badge holders only!`,
          success: false,
        });
      }
    }

    // Check if voucher is valid for this specific event
    if (voucher.eventIds && voucher.eventIds.length > 0) {
      if (!voucher.eventIds.includes(eventId)) {
        return res.status(400).json({
          message: "Voucher not applicable for this event",
          success: false,
        });
      }
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
