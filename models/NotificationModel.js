// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientType: {
    type: String,
    required: [true, 'Recipient type is required'],
    enum: ["clinic", "unit"],
    lowercase: true
  },
  recipientId: {
    type: String,
    required: [true, 'Recipient ID is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    trim: true,
    maxlength: [100, 'Type cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);
