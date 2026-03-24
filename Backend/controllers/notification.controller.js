import { Notification } from "../models/notification.model.js";

export const getMyNotifications = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized", success: false });
    const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized", success: false });
    const { id } = req.params;
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    if (String(n.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Forbidden" });
    n.isRead = true;
    await n.save();
    return res.status(200).json({ success: true, notification: n });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized", success: false });
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized", success: false });
    const { id } = req.params;
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    if (String(n.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Forbidden" });
    await Notification.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
