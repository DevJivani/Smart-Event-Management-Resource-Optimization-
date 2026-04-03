import { Event } from "../models/event.model.js";
import { MemoryBox } from "../models/memoryBox.model.js";
import { Booking } from "../models/booking.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import fs from "fs/promises";

// Get memory box data for an event
export const getMemoryBoxData = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?._id;

        const event = await Event.findById(eventId)
            .populate("categoryId", "name")
            .populate("createdBy", "name");

        if (!event) {
            return res.status(404).json({ message: "Event not found", success: false });
        }

        // Check if user attended the event (has a paid booking) OR is the organizer
        const isOrganizer = userId ? event.createdBy._id.toString() === userId.toString() : false;
        const booking = userId ? await Booking.findOne({ eventId, userId, paymentStatus: "paid" }) : null;
        
        if (!booking && !isOrganizer) {
            return res.status(403).json({ message: "Access denied. Only attendees and organizers can view the Memory Box.", success: false });
        }

        // Fetch attendee uploads for this event
        const attendeeUploads = await MemoryBox.find({ eventId }).populate("userId", "name profileImage");

        return res.status(200).json({
            success: true,
            event: {
                title: event.title,
                startDate: event.startDate,
                venue: event.venue,
                officialPhotos: event.officialPhotos || [],
                organizer: event.createdBy.name,
                organizerId: event.createdBy._id
            },
            attendeeGallery: attendeeUploads,
            certificateData: {
                userName: req.user.name,
                eventTitle: event.title,
                date: event.startDate
            },
            isOrganizer
        });
    } catch (error) {
        console.error("Error fetching memory box:", error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// Upload attendee photo to memory box
export const uploadAttendeePhoto = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { message } = req.body;
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ message: "Photo is required", success: false });
        }

        // Validate eventId
        if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid event ID", success: false });
        }

        const booking = await Booking.findOne({ eventId, userId, paymentStatus: "paid" });
        if (!booking) {
            return res.status(403).json({ message: "You must attend the event to upload photos.", success: false });
        }

        const cloudinaryRes = await uploadToCloudinary(req.file.path);
        if (!cloudinaryRes) {
            return res.status(500).json({ message: "Failed to upload photo to cloud storage", success: false });
        }

        let memory = await MemoryBox.findOne({ eventId, userId });
        if (memory) {
            memory.photos.push(cloudinaryRes.secure_url);
            if (message) memory.message = message;
            await memory.save();
        } else {
            memory = await MemoryBox.create({
                eventId,
                userId,
                photos: [cloudinaryRes.secure_url],
                message: message || ""
            });
        }

        return res.status(201).json({
            success: true,
            message: "Photo added to Memory Box",
            memory
        });
    } catch (error) {
        console.error("Error uploading to memory box:", error);
        return res.status(500).json({ message: error.message || "Server error during photo upload", success: false });
    }
};

// Organizer add official photos
export const addOfficialPhotos = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;

        console.log("Adding official photos for event:", eventId);
        console.log("Files received:", req.files ? req.files.length : "None");

        // Validate eventId
        if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid event ID", success: false });
        }

        const event = await Event.findOne({ _id: eventId, createdBy: userId });
        if (!event) {
            return res.status(403).json({ message: "Only the event organizer can add official photos.", success: false });
        }

        if (!req.files || req.files.length === 0) {
            console.warn("No files in req.files for officialPhotos field");
            return res.status(400).json({ message: "Photos are required", success: false });
        }

        const uploadPromises = req.files.map(async (file) => {
            try {
                const result = await uploadToCloudinary(file.path);
                if (!result) throw new Error("Cloudinary upload failed");
                return result.secure_url;
            } catch (err) {
                console.error(`Error uploading file ${file.path}:`, err);
                throw err;
            }
        });

        const photoUrls = await Promise.all(uploadPromises);
        
        // Filter out any null values just in case
        const validUrls = photoUrls.filter(url => url != null);
        
        if (validUrls.length === 0) {
            return res.status(500).json({ message: "Failed to upload any photos", success: false });
        }

        event.officialPhotos = [...(event.officialPhotos || []), ...validUrls];
        event.isMemoryBoxEnabled = true;
        await event.save();

        return res.status(200).json({
            success: true,
            message: `${validUrls.length} official photos added successfully`,
            officialPhotos: event.officialPhotos
        });
    } catch (error) {
        console.error("Error adding official photos:", error);
        return res.status(500).json({ message: error.message || "Server error during official photo upload", success: false });
    }
};
