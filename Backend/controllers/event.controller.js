import { log } from "console";
import { Event } from "../models/event.model.js";
import { EventCategory } from "../models/eventCategory.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import fs from "fs/promises";

// Get all public events (for users)
export const getAllEvents = async (req, res) => {
    try {
        const { status, categoryId, city } = req.query;
        const statusFilter = Array.isArray(status)
            ? { status: { $in: status } }
            : status
            ? { status }
            : { status: { $in: ["upcoming", "ongoing"] } };

        const baseFilter = {
            ...statusFilter,
            isApproved: true,
            isDisabled: false,
        };

        if (categoryId) {
            baseFilter.categoryId = categoryId;
        }
        if (city) {
            baseFilter.city = new RegExp(`^${city}$`, "i");
        }

        const events = await Event.find(baseFilter)
            .populate("categoryId", "name")
            .populate("createdBy", "name email")
            .sort({ startDate: 1, createdAt: -1 });

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

        const events = await Event.find({ createdBy: organizerId })
            .populate("categoryId", "name")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

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
            isPaid: req.body.isPaid || false,
            status: "upcoming"
        });

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

        // Update fields if provided
        if (title) event.title = title;
        if (description) event.description = description;
        if (categoryId) event.categoryId = categoryId;
        if (startDate) event.startDate = startDate;
        if (endDate) event.endDate = endDate;
        if (startTime) event.startTime = startTime;
        if (endTime) event.endTime = endTime;
        if (venue) event.venue = venue;
        if (city) event.city = city;
        if (totalSeats) {
            const seatDifference = totalSeats - event.totalSeats;
            event.totalSeats = totalSeats;
            event.availableSeats = event.availableSeats + seatDifference;
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
            }
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

        const event = await Event.findById(eventId)
            .populate("categoryId", "name")
            .populate("createdBy", "name email");

        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                success: false
            });
        }

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
        const events = await Event.find(filter)
            .populate("categoryId", "name")
            .populate("createdBy", "name email")
            .sort({ startDate: 1, createdAt: -1 });
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
