import { Booking } from "../models/booking.model.js";
import { Event } from "../models/event.model.js";
import { Ticket } from "../models/ticket.model.js";
import { Payment } from "../models/payment.model.js";
import PDFDocument from "pdfkit";

export const createPaidBooking = async (req, res) => {
  try {
    const user = req.user;
    const { eventId, quantity, paymentMethod } = req.body;

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

    const amount = (ticket.price || 0) * qty;
    if (amount <= 0) {
      return res.status(400).json({ message: "Ticket price is invalid for this event", success: false });
    }

    const booking = await Booking.create({
      userId: user._id,
      eventId: event._id,
      ticketId: ticket._id,
      quantity: qty,
      totalAmount: amount,
      bookingStatus: "confirmed",
      paymentStatus: "pending"
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      paymentMethod,
      transactionId: `TXN-${Date.now()}`,
      amount,
      paymentStatus: "success"
    });

    booking.paymentStatus = "paid";
    await booking.save();
    event.availableSeats = event.availableSeats - qty;
    await event.save();
    ticket.soldQuantity = (ticket.soldQuantity || 0) + qty;
    await ticket.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("eventId", "title venue startDate startTime bannerImage price")
      .populate("ticketId", "ticketType price")
      .populate("userId", "name email");

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
      .populate("eventId", "title venue city startDate startTime endDate endTime price")
      .populate("ticketId", "ticketType price")
      .populate("userId", "name email");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", success: false });
    }
    if (String(booking.userId._id) !== String(user._id)) {
      return res.status(403).json({ message: "You can only download your own invoices", success: false });
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
