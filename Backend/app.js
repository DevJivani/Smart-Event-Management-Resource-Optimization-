import express from 'express';
import cors from "cors";
import cookieparser from "cookie-parser";
import userRouter from "./Routes/user.route.js";
import eventRouter from "./Routes/event.route.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"]
}));

// Parse incoming JSON payloads with a safe size limit
app.use(express.json({ limit: "16mb" }));

// Parse URL-encoded payloads (e.g. form submissions)
app.use(express.urlencoded({ extended: true, limit: "16mb" }));

// Serve static files (e.g. uploaded images, documents) from the public folder
app.use(express.static("public"));

// Allow server to read and modify cookies stored in the user's browser
app.use(cookieparser());

// User-related routes
app.use("/api/v1/user", userRouter);

// Event-related routes
app.use("/api/v1/event", eventRouter);

export { app };