import mongoose from "mongoose";
import Notification from "./models/Notification.js";

try {
  await mongoose.connect("mongodb://127.0.0.1:27017/real-time-collab");

  const results = await Notification.find().sort({ timestamp: -1 });
  console.log("📬 Notifications:");
  console.log(results);
} catch (err) {
  console.error("❌ Error fetching notifications:", err);
} finally {
  mongoose.disconnect();
}
