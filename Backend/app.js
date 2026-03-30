import express from 'express';
import cors from "cors";
import cookieparser from "cookie-parser";
import userRouter from "./Routes/user.route.js";
import eventRouter from "./Routes/event.route.js";
import bookingRouter from "./Routes/booking.route.js";
import reviewRouter from "./Routes/review.route.js";
import notificationRouter from "./Routes/notification.route.js";
import voucherRouter from "./Routes/voucher.route.js";
import messageRouter from "./Routes/message.route.js";
import memoryBoxRouter from "./Routes/memoryBox.route.js";
import matchmakerRouter from "./Routes/matchmaker.route.js";
import chatRouter from "./Routes/chat.route.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"]
}));

// Parse incoming JSON payloads with a safe size limit
app.use(express.json({ limit: "32mb" }));

// Parse URL-encoded payloads (e.g. form submissions)
app.use(express.urlencoded({ extended: true, limit: "32mb" }));

// Serve static files (e.g. uploaded images, documents) from the public folder
app.use(express.static("public"));

// Allow server to read and modify cookies stored in the user's browser
app.use(cookieparser());

// User-related routes
app.use("/api/v1/user", userRouter);

// Event-related routes
app.use("/api/v1/event", eventRouter);

// Booking-related routes
app.use("/api/v1/booking", bookingRouter);
// Review-related routes
app.use("/api/v1/review", reviewRouter);
// Notification-related routes
app.use("/api/v1/notification", notificationRouter);
// Voucher-related routes
app.use("/api/v1/voucher", voucherRouter);
// Message-related routes
app.use("/api/v1/message", messageRouter);

// Memory Box routes
app.use("/api/v1/memory-box", memoryBoxRouter);

// Matchmaker routes
app.use("/api/v1/matchmaker", matchmakerRouter);

// Chat routes
app.use("/api/v1/chat", chatRouter);

export { app };
