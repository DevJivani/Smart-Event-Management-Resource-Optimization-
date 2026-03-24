import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Sends an email if the user has enabled email notifications.
 * @param {string} userId - The ID of the recipient user.
 * @param {object} mailOptions - Nodemailer mail options (subject, html, etc.).
 */
export const sendNotificationEmail = async (userId, mailOptions) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.emailNotifications) {
      console.log(`Skipping email to ${user?.email || userId} (Notifications disabled)`);
      return;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log(`\n========== EMAIL NOTIFICATION (DEMO) ==========`);
        console.log(`To: ${user.email}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content: ${mailOptions.html.replace(/<[^>]*>?/gm, '')}`);
        console.log(`================================================\n`);
        return;
    }

    const finalOptions = {
      from: `"EventHub" <${process.env.EMAIL_USER}>`,
      to: user.email,
      ...mailOptions,
    };

    await transporter.sendMail(finalOptions);
    console.log(`Email sent successfully to ${user.email}`);
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};
