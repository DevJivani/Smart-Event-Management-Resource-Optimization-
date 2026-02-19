import { log } from "console";
import { Event } from "../models/event.model.js";
import { EventCategory } from "../models/eventCategory.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { Ticket } from "../models/ticket.model.js";
import fs from "fs/promises";

const buildDateTime = (date, time, isEnd) => {
    const d = new Date(date);
    if (time && /^\d{1,2}:\d{2}$/.test(time)) {
        const [h, m] = time.split(":").map(Number);
        d.setHours(h, m, isEnd ? 59 : 0, isEnd ? 999 : 0);
    } else {
        d.setHours(isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    }
    return d;
};

const computeEffectiveStatus = (event) => {
    if (event.status === "cancelled") return "cancelled";
    const start = buildDateTime(event.startDate, event.startTime, false);
    const end = buildDateTime(event.endDate, event.endTime, true);
    const now = new Date();
    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "ongoing";
};

// Get all public events (for users)
export const getAllEvents = async (req, res) => {
    try {
        const { status, categoryId, city } = req.query;
        const baseFilter = {
            isApproved: true,
            isDisabled: false,
        };

        if (categoryId) {
            baseFilter.categoryId = categoryId;
        }
        if (city) {
            baseFilter.city = new RegExp(`^${city}$`, "i");
        }

        const docs = await Event.find(baseFilter)
            .populate("categoryId", "name")
            .populate("createdBy", "name email")
            .sort({ startDate: 1, createdAt: -1 });

        const eventsWithEffective = docs.map((e) => {
            const obj = e.toObject();
            obj.effectiveStatus = computeEffectiveStatus(e);
            return obj;
        });

        let events = eventsWithEffective;
        if (status) {
            const statuses = Array.isArray(status) ? status : [status];
            events = eventsWithEffective.filter((e) => statuses.includes(e.effectiveStatus));
        } else {
            events = eventsWithEffective.filter((e) => ["upcoming", "ongoing"].includes(e.effectiveStatus));
        }

        return res.status(200).json({
            message: "Events fetched successfully",
            events,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Get all events by organizer
export const getOrganizerEvents = async (req, res) => {
    try {
        const { organizerId } = req.params;

        if (!organizerId) {
            return res.status(400).json({
                message: "Organizer ID is required",
                success: false
            });
        }

        const docs = await Event.find({ createdBy: organizerId })
            .populate("categoryId", "name")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        const events = docs.map((e) => {
            const obj = e.toObject();
            obj.effectiveStatus = computeEffectiveStatus(e);
            return obj;
        });

        return res.status(200).json({
            message: "Events fetched successfully",
            events,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Create event
export const createEvent = async (req, res) => {
    try {
        const { organizerId, title, description, categoryId, startDate, endDate, startTime, endTime, venue, city, totalSeats } = req.body;

        if (!organizerId || !title || !categoryId || !startDate || !endDate || !venue || !totalSeats) {
            return res.status(400).json({
                message: "All required fields must be filled",
                success: false
            });
        }

        const paidVal = req.body.isPaid;
        const isPaid =
            paidVal === true ||
            paidVal === "true" ||
            paidVal === "on" ||
            paidVal === "1" ||
            paidVal === 1;

        // Sanitize price input like "2,000" or "₹2000"
        const rawPrice = req.body.price !== undefined ? String(req.body.price) : "";
        const cleaned = rawPrice.replace(/,/g, "").replace(/[^\d.]/g, "");
        const price = cleaned ? Number(cleaned) : NaN;
        if (isPaid) {
            if (!Number.isFinite(price) || price <= 0) {
                return res.status(400).json({
                    message: "Price must be provided for paid events and must be greater than 0",
                    success: false
                });
            }
        }

        // Validate dates/times are not in the past and end is after start
        try {
            const start = buildDateTime(startDate, startTime, false);
            const end = buildDateTime(endDate, endTime, true);
            const now = new Date();
            if (start < now) {
                return res.status(400).json({
                    message: "Start date/time cannot be in the past",
                    success: false
                });
            }
            if (end < start) {
                return res.status(400).json({
                    message: "End date/time must be after start date/time",
                    success: false
                });
            }
        } catch (e) {
            return res.status(400).json({
                message: "Invalid date or time format",
                success: false
            });
        }

        // Verify category exists
        const category = await EventCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Event category not found",
                success: false
            });
        }

        let bannerImageUrl = null;

        // Upload banner image if provided
        if (req.file?.path) {
            const uploadResult = await uploadToCloudinary(req.file.path, {
                folder: "eventhub/events",
            });

            try {
                await fs.unlink(req.file.path);
            } catch (e) {
                // ignore cleanup errors
            }

            if (uploadResult?.secure_url) {
                bannerImageUrl = uploadResult.secure_url;
            }
        }

        const event = await Event.create({
            title,
            description,
            categoryId,
            createdBy: organizerId,
            startDate,
            endDate,
            startTime,
            endTime,
            venue,
            city,
            bannerImage: bannerImageUrl,
            totalSeats,
            availableSeats: totalSeats,
            isPaid,
            price: isPaid ? price : 0,
            status: "upcoming"
        });

        if (isPaid) {
            await Ticket.create({
                eventId: event._id,
                ticketType: "Regular",
                price: price,
                quantity: totalSeats,
                soldQuantity: 0
            });
        }

        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");

        return res.status(201).json({
            message: "Event created successfully",
            event: populatedEvent,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const { eventId, organizerId } = req.params;
        const { title, description, categoryId, startDate, endDate, startTime, endTime, venue, city, totalSeats, status } = req.body;

        if (!eventId || !organizerId) {
            return res.status(400).json({
                message: "Event ID and Organizer ID are required",
                success: false
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }

        // Check if organizer owns this event
        if (event.createdBy.toString() !== organizerId) {
            return res.status(403).json({
                message: "You can only update your own events",
                success: false
            });
        }

        // Validate date/time if provided and compute next values
        const nextStartDate = startDate ?? event.startDate;
        const nextEndDate = endDate ?? event.endDate;
        const nextStartTime = startTime ?? event.startTime;
        const nextEndTime = endTime ?? event.endTime;
        if (startDate || endDate || startTime || endTime) {
            try {
                const start = buildDateTime(nextStartDate, nextStartTime, false);
                const end = buildDateTime(nextEndDate, nextEndTime, true);
                const now = new Date();
                if (start < now) {
                    return res.status(400).json({
                        message: "Start date/time cannot be in the past",
                        success: false
                    });
                }
                if (end < start) {
                    return res.status(400).json({
                        message: "End date/time must be after start date/time",
                        success: false
                    });
                }
            } catch (e) {
                return res.status(400).json({
                    message: "Invalid date or time format",
                    success: false
                });
            }
        }

        // Update fields if provided and track changes to require re-approval
        let changed = false;
        if (title && title !== event.title) { event.title = title; changed = true; }
        if (description !== undefined && description !== event.description) { event.description = description; changed = true; }
        if (categoryId && String(categoryId) !== String(event.categoryId)) { event.categoryId = categoryId; changed = true; }
        if (startDate && String(startDate) !== String(event.startDate)) { event.startDate = startDate; changed = true; }
        if (endDate && String(endDate) !== String(event.endDate)) { event.endDate = endDate; changed = true; }
        if (startTime !== undefined && startTime !== event.startTime) { event.startTime = startTime; changed = true; }
        if (endTime !== undefined && endTime !== event.endTime) { event.endTime = endTime; changed = true; }
        if (venue && venue !== event.venue) { event.venue = venue; changed = true; }
        if (city !== undefined && city !== event.city) { event.city = city; changed = true; }
        if (totalSeats) {
            const seatDifference = totalSeats - event.totalSeats;
            event.totalSeats = totalSeats;
            event.availableSeats = event.availableSeats + seatDifference;
            if (seatDifference !== 0) changed = true;
        }
        if (status && ["upcoming", "ongoing", "completed", "cancelled"].includes(status)) {
            event.status = status;
        }

        // Upload new banner image if provided
        if (req.file?.path) {
            const uploadResult = await uploadToCloudinary(req.file.path, {
                folder: "eventhub/events",
            });

            try {
                await fs.unlink(req.file.path);
            } catch (e) {
                // ignore cleanup errors
            }

            if (uploadResult?.secure_url) {
                event.bannerImage = uploadResult.secure_url;
                changed = true;
            }
        }

        // Reset approval if important fields changed so admin can re-approve
        if (changed) {
            event.isApproved = false;
        }

        await event.save();

        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");

        return res.status(200).json({
            message: "Event updated successfully",
            event: populatedEvent,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const { eventId, organizerId } = req.params;

        if (!eventId || !organizerId) {
            return res.status(400).json({
                message: "Event ID and Organizer ID are required",
                success: false
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }

        // Check if organizer owns this event
        if (event.createdBy.toString() !== organizerId) {
            return res.status(403).json({
                message: "You can only delete your own events",
                success: false
            });
        }

        await Event.findByIdAndDelete(eventId);

        return res.status(200).json({
            message: "Event deleted successfully",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Get event by ID
export const getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required",
                success: false
            });
        }

        const doc = await Event.findById(eventId)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");

        if (!doc) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }

        const event = doc.toObject();
        event.effectiveStatus = computeEffectiveStatus(doc);

        return res.status(200).json({
            message: "Event fetched successfully",
            event,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Get all event categories
export const getEventCategories = async (req, res) => {
    try {
        const categories = await EventCategory.find({ isActive: true }).select("_id name description");

        if (!categories || categories.length === 0) {
            return res.status(200).json({
                message: "No categories available",
                categories: [],
                success: true
            });
        }

        return res.status(200).json({
            message: "Categories fetched successfully",
            categories,
            success: true
        });

    } catch (error) {
        console.log("Error fetching categories:", error);
        return res.status(500).json({
            message: "Server error while fetching categories",
            success: false,
            error: error.message
        });
    }
};

// Admin: get all events (ignores approval/disable filters)
export const adminGetAllEvents = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can perform this action",
                success: false
            });
        }
        const { status, categoryId, city } = req.query;
        const filter = {};
        if (status) {
            if (Array.isArray(status)) filter.status = { $in: status };
            else filter.status = status;
        }
        if (categoryId) filter.categoryId = categoryId;
        if (city) filter.city = new RegExp(`^${city}$`, "i");
        const docs = await Event.find(filter)
            .populate("categoryId", "name")
            .populate("createdBy", "name email")
            .sort({ startDate: 1, createdAt: -1 });
        const events = docs.map((e) => {
            const obj = e.toObject();
            obj.effectiveStatus = computeEffectiveStatus(e);
            return obj;
        });
        return res.status(200).json({
            message: "Admin events fetched successfully",
            events,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Admin: approve event
export const adminApproveEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can perform this action",
                success: false
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }
        if (event.isApproved) {
            const populatedEvent = await Event.findById(event._id)
                .populate("categoryId", "name")
                .populate("createdBy", "name email");
            return res.status(200).json({
                message: "Event already approved",
                event: populatedEvent,
                alreadyApproved: true,
                success: true
            });
        }
        event.isApproved = true;
        await event.save();
        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");
        return res.status(200).json({
            message: "Event approved",
            event: populatedEvent,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Admin: unapprove event
export const adminUnapproveEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can perform this action",
                success: false
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }
        if (!event.isApproved) {
            const populatedEvent = await Event.findById(event._id)
                .populate("categoryId", "name")
                .populate("createdBy", "name email");
            return res.status(200).json({
                message: "Event already not approved",
                event: populatedEvent,
                alreadyUnapproved: true,
                success: true
            });
        }
        event.isApproved = false;
        await event.save();
        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");
        return res.status(200).json({
            message: "Event marked not approved",
            event: populatedEvent,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
// Admin: disable event
export const adminDisableEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can perform this action",
                success: false
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }
        event.isDisabled = true;
        await event.save();
        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");
        return res.status(200).json({
            message: "Event disabled",
            event: populatedEvent,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Admin: enable event
export const adminEnableEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can perform this action",
                success: false
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }
        event.isDisabled = false;
        await event.save();
        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");
        return res.status(200).json({
            message: "Event enabled",
            event: populatedEvent,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// Admin: update event status
export const adminUpdateStatus = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { status } = req.body;
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can perform this action",
                success: false
            });
        }
        if (!status || !["upcoming", "ongoing", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                success: false
            });
        }
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }
        event.status = status;
        await event.save();
        const populatedEvent = await Event.findById(event._id)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");
        return res.status(200).json({
            message: "Event status updated",
            event: populatedEvent,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
