import mongoose from "mongoose";
import { EventCategory } from "./models/eventCategory.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Check if categories already exist
        const existingCategories = await EventCategory.countDocuments();
        if (existingCategories > 0) {
            console.log("Categories already exist in database");
            await mongoose.connection.close();
            return;
        }

        const categories = [
            { name: "Music", description: "Music concerts and festivals" },
            { name: "Sports", description: "Sports events and tournaments" },
            { name: "Technology", description: "Tech conferences and workshops" },
            { name: "Art", description: "Art exhibitions and cultural events" },
            { name: "Food", description: "Food festivals and culinary events" },
            { name: "Education", description: "Seminars, workshops, and training events" },
            { name: "Business", description: "Business conferences and networking events" },
            { name: "Entertainment", description: "Comedy shows, theater, and entertainment" },
            { name: "Health & Wellness", description: "Fitness events and wellness workshops" },
            { name: "Travel", description: "Travel and adventure events" }
        ];

        const createdCategories = await EventCategory.insertMany(categories);
        console.log(`${createdCategories.length} categories created successfully`);

        await mongoose.connection.close();
        console.log("Database connection closed");
    } catch (error) {
        console.error("Error seeding categories:", error);
        process.exit(1);
    }
};

seedCategories();
