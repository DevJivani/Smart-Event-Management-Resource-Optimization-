import { Booking } from "../models/booking.model.js";
import { Event } from "../models/event.model.js";
import { Ticket } from "../models/ticket.model.js";
import { Payment } from "../models/payment.model.js";
import { Voucher } from "../models/voucher.model.js";
import PDFDocument from "pdfkit";
import { sendNotificationEmail } from "../utils/email.js";

export const createPaidBooking = async (req, res) => {
  try {
    const user = req.user;
    const { eventId, quantity, paymentMethod, voucherCode } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    if (!eventId || !quantity || !paymentMethod) {
      return res.status(400).json({ message: "eventId, quantity and paymentMethod are required", success: false });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer", success: false });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found", success: false });
    }
    if (!event.isApproved || event.isDisabled) {
      return res.status(400).json({ message: "Event is not available for booking", success: false });
    }
    if (!event.isPaid) {
      return res.status(400).json({ message: "Only paid events can be booked", success: false });
    }
    if (event.availableSeats < qty) {
      return res.status(400).json({ message: "Not enough seats available", success: false });
    }

    let ticket = await Ticket.findOne({ eventId: event._id, ticketType: "Regular" });
    if (!ticket) {
      ticket = await Ticket.create({
        eventId: event._id,
        ticketType: "Regular",
        price: event.price || 0,
        quantity: event.totalSeats,
        soldQuantity: 0
      });
    }

    const baseAmount = (ticket.price || 0) * qty;
    if (baseAmount <= 0) {
      return res.status(400).json({ message: "Ticket price is invalid for this event", success: false });
    }

    let discountAmount = 0;
    let voucherId = null;

    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase(), isActive: true });
      if (!voucher) {
        return res.status(400).json({ message: "Invalid voucher code", success: false });
      }

      // Validate voucher
      if (new Date(voucher.expiryDate) < new Date()) {
        return res.status(400).json({ message: "Voucher has expired", success: false });
      }
      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({ message: "Voucher usage limit reached", success: false });
      }
      if (voucher.eventId && voucher.eventId.toString() !== eventId) {
        return res.status(400).json({ message: "Voucher is not applicable for this event", success: false });
      }
      if (baseAmount < voucher.minAmount) {
        return res.status(400).json({ message: `Minimum amount to use this voucher is ${voucher.minAmount}`, success: false });
      }

      // Calculate discount
      if (voucher.discountType === "percentage") {
        discountAmount = (baseAmount * voucher.discountValue) / 100;
        if (voucher.maxDiscount !== null && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount;
        }
      } else {
        discountAmount = voucher.discountValue;
      }
      voucherId = voucher._id;
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);

    // Generate unique ticket secret
    const ticketSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const booking = await Booking.create({
      userId: user._id,
      eventId: event._id,
      ticketId: ticket._id,
      quantity: qty,
      totalAmount: finalAmount,
      discountAmount,
      voucherId,
      bookingStatus: "confirmed",
      paymentStatus: "pending",
      ticketSecret
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      paymentMethod,
      transactionId: `TXN-${Date.now()}`,
      amount: finalAmount,
      paymentStatus: "success"
    });

    booking.paymentStatus = "paid";
    await booking.save();

    if (voucherId) {
      await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } });
    }

    event.availableSeats = event.availableSeats - qty;
    await event.save();
    ticket.soldQuantity = (ticket.soldQuantity || 0) + qty;
    await ticket.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("eventId", "title venue startDate startTime bannerImage price")
      .populate("ticketId", "ticketType price")
      .populate("userId", "name email");

    // Send Confirmation Email
    try {
        await sendNotificationEmail(user._id, {
            subject: `Booking Confirmed: ${event.title} - EventHub`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Pack your bags, you're going to an event!</p>
                    </div>
                    <div style="padding: 30px; background: white;">
                        <p style="color: #374151; font-size: 16px;">Hi ${user.name},</p>
                        <p style="color: #6b7280; line-height: 1.6;">Your booking for <strong>${event.title}</strong> has been successfully confirmed. Below are your booking details:</p>
                        
                        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: bold;">Order ID</span>
                                <span style="color: #111827; font-size: 14px; font-weight: bold;">#${booking._id}</span>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: bold;">Event Date</span>
                                <p style="color: #111827; font-size: 14px; margin: 4px 0;">${new Date(event.startDate).toLocaleDateString()} at ${event.startTime}</p>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: bold;">Venue</span>
                                <p style="color: #111827; font-size: 14px; margin: 4px 0;">${event.venue}, ${event.city}</p>
                            </div>
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #374151; font-weight: bold;">Total Paid</span>
                                    <span style="color: #4f46e5; font-weight: bold; font-size: 18px;">₹${finalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <p style="color: #6b7280; font-size: 14px; text-align: center;">You can download your invoice from your dashboard.</p>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                        &copy; 2026 EventHub. All rights reserved.
                    </div>
                </div>
            `
        });
    } catch (emailErr) {
        console.error("Failed to send booking confirmation email:", emailErr);
    }

    return res.status(201).json({
      message: "Booking confirmed and payment successful",
      booking: populatedBooking,
      payment,
      success: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const adminGetAllBookings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can perform this action", success: false });
    }
    const list = await Booking.find({})
      .sort({ createdAt: -1 })
      .populate("eventId", "title venue city startDate startTime price")
      .populate("ticketId", "ticketType price")
      .populate("userId", "-password");
    return res.status(200).json({
      message: "All bookings fetched successfully",
      bookings: list,
      success: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getOrganizerBookings = async (req, res) => {
  try {
    const { organizerId } = req.params;
    if (!organizerId) {
      return res.status(400).json({ message: "Organizer ID is required", success: false });
    }
    if (!req.user || (req.user.role !== "organizer" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }
    if (req.user.role === "organizer" && String(req.user._id) !== String(organizerId)) {
      return res.status(403).json({ message: "You can only view your own bookings", success: false });
    }
    const events = await Event.find({ createdBy: organizerId }).select("_id");
    const ids = events.map((e) => e._id);
    if (ids.length === 0) {
      return res.status(200).json({ message: "No bookings found", bookings: [], success: true });
    }
    const list = await Booking.find({ eventId: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate("eventId", "title venue city startDate startTime price")
      .populate("ticketId", "ticketType price")
      .populate("userId", "-password");
    return res.status(200).json({
      message: "Organizer bookings fetched successfully",
      bookings: list,
      success: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const adminGetBookingById = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can perform this action", success: false });
    }
    const { bookingId } = req.params;
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required", success: false });
    }
    const booking = await Booking.findById(bookingId)
      .populate({
        path: "eventId",
        select: "title description venue city startDate endDate startTime endTime price createdBy",
        populate: { path: "createdBy", select: "name email phone role" }
      })
      .populate("ticketId", "ticketType price")
      .populate("userId", "name email phone role");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", success: false });
    }
    const payments = await Payment.find({ bookingId: booking._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Booking fetched successfully",
      booking,
      payments,
      success: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    const bookings = await Booking.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("eventId", "title venue startDate startTime bannerImage price")
      .populate("ticketId", "ticketType price");
    return res.status(200).json({
      message: "Bookings fetched successfully",
      bookings,
      success: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const verifyTicket = async (req, res) => {
  try {
    const { ticketSecret } = req.body;
    const organizer = req.user;

    if (!ticketSecret) {
      return res.status(400).json({ message: "Ticket secret is required", success: false });
    }

    const booking = await Booking.findOne({ ticketSecret })
      .populate("eventId", "title venue startDate startTime createdBy")
      .populate("userId", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Invalid Ticket: No booking found", success: false });
    }

    // Verify if the requester is the organizer of the event
    if (String(booking.eventId.createdBy) !== String(organizer._id) && organizer.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: You are not the organizer of this event", success: false });
    }

    if (booking.checkInStatus === "checked-in") {
      return res.status(400).json({ 
        message: "Already Checked In", 
        success: false,
        checkInTime: booking.checkInTime,
        booking 
      });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Invalid Ticket: Booking was cancelled", success: false });
    }

    // Mark as checked in
    booking.checkInStatus = "checked-in";
    booking.checkInTime = new Date();
    await booking.save();

    return res.status(200).json({
      message: "Check-in successful! Ticket verified.",
      success: true,
      booking
    });
  } catch (error) {
    console.error("Verify Ticket Error:", error);
    return res.status(500).json({ message: "Error verifying ticket", success: false });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const user = req.user;
    const { bookingId } = req.params;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required", success: false });
    }
    const booking = await Booking.findById(bookingId)
      .populate("eventId", "title venue city startDate startTime endDate endTime price createdBy")
      .populate("ticketId", "ticketType price")
      .populate("userId", "-password");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", success: false });
    }

    const isOwner = String(booking.userId._id) === String(user._id);
    const isOrganizer = user.role === "organizer" && String(booking.eventId.createdBy) === String(user._id);
    const isAdmin = user.role === "admin";

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to download this invoice", success: false });
    }
    const payment = await Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${booking._id}.pdf`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    const evt = booking.eventId;
    const unitPrice = booking.ticketId?.price ?? evt.price ?? 0;
    const qty = booking.quantity;
    const amount = booking.totalAmount;
    const margin = 50;
    const contentWidth = doc.page.width - margin * 2;
    doc.rect(margin, margin, contentWidth, 60).fill("#111827");
    doc.fillColor("#ffffff").fontSize(20).text("EventHub", margin + 16, margin + 18, { width: contentWidth / 2 - 16 });
    doc.fontSize(16).text("INVOICE", margin + contentWidth / 2, margin + 22, { width: contentWidth / 2 - 16, align: "right" });
    doc.fillColor("#000000");
    let y = margin + 80;
    const colW = contentWidth / 2;
    doc.fontSize(12).text("Billed To", margin, y);
    doc.fontSize(10).text(booking.userId.name, margin, y + 18);
    doc.text(booking.userId.email, margin, y + 34);
    doc.fontSize(12).text("Invoice", margin + colW, y);
    doc.fontSize(10).text(`Invoice #: ${booking._id}`, margin + colW, y + 18, { align: "right", width: colW });
    doc.text(`Date: ${new Date().toLocaleString()}`, margin + colW, y + 34, { align: "right", width: colW });
    y += 70;
    doc.moveTo(margin, y).lineTo(margin + contentWidth, y).stroke("#e5e7eb");
    y += 16;
    doc.fontSize(12).text("Event", margin, y);
    doc.fontSize(10).text(evt.title, margin, y + 18);
    doc.text(`${evt.venue}${evt.city ? ", " + evt.city : ""}`, margin, y + 34);
    doc.text(`Start: ${new Date(evt.startDate).toLocaleDateString()} ${evt.startTime || ""}`, margin, y + 50);
    doc.text(`End: ${new Date(evt.endDate).toLocaleDateString()} ${evt.endTime || ""}`, margin, y + 66);
    y += 96;
    doc.moveTo(margin, y).lineTo(margin + contentWidth, y).stroke("#e5e7eb");
    y += 16;
    const descW = contentWidth * 0.46;
    const qtyW = contentWidth * 0.14;
    const unitW = contentWidth * 0.18;
    const amtW = contentWidth * 0.22;
    doc.rect(margin, y, contentWidth, 28).fill("#f3f4f6");
    doc.fillColor("#374151").fontSize(10).text("Description", margin + 8, y + 8, { width: descW - 16 });
    doc.text("Qty", margin + descW, y + 8, { width: qtyW, align: "center" });
    doc.text("Unit Price", margin + descW + qtyW, y + 8, { width: unitW, align: "right" });
    doc.text("Amount", margin + descW + qtyW + unitW, y + 8, { width: amtW, align: "right" });
    doc.fillColor("#000000");
    y += 36;
    doc.fontSize(10).text(`Ticket - ${booking.ticketId?.ticketType || "Regular"}`, margin + 8, y, { width: descW - 16 });
    doc.text(String(qty), margin + descW, y, { width: qtyW, align: "center" });
    doc.text(`₹${Number(unitPrice).toFixed(2)}`, margin + descW + qtyW, y, { width: unitW, align: "right" });
    doc.text(`₹${Number(amount).toFixed(2)}`, margin + descW + qtyW + unitW, y, { width: amtW, align: "right" });
    y += 28;
    doc.moveTo(margin, y).lineTo(margin + contentWidth, y).stroke("#e5e7eb");
    y += 16;
    doc.fontSize(12).text("Payment", margin, y);
    doc.fontSize(10).text(`Status: ${booking.paymentStatus}`, margin, y + 18);
    if (payment) {
      doc.text(`Method: ${payment.paymentMethod}`, margin, y + 34);
      doc.text(`Transaction: ${payment.transactionId}`, margin, y + 50);
      doc.text(`Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleString()}`, margin, y + 66);
    }
    const totalBoxY = y;
    doc.rect(margin + contentWidth - 220, totalBoxY, 220, 90).stroke("#e5e7eb");
    doc.fontSize(10).text("Subtotal", margin + contentWidth - 200, totalBoxY + 12, { width: 140 });
    doc.text(`₹${Number(amount).toFixed(2)}`, margin + contentWidth - 60, totalBoxY + 12, { width: 40, align: "right" });
    doc.fontSize(12).text("Total", margin + contentWidth - 200, totalBoxY + 40, { width: 140 });
    doc.fontSize(12).text(`₹${Number(amount).toFixed(2)}`, margin + contentWidth - 60, totalBoxY + 40, { width: 40, align: "right" });
    doc.fontSize(9).fillColor("gray").text("Thank you for your purchase!", margin, doc.page.height - margin - 20, { align: "center", width: contentWidth });

    doc.end();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
