// models/Referral.js
const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: [true, 'Clinic reference is required']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: [true, 'Hospital reference is required']
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: [true, 'Unit reference is required']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: [true, 'Patient reference is required']
  },
  reason: {
    type: String,
    required: [true, 'Referral reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  urgency: {
    type: String,
    required: [true, 'Urgency level is required'],
    enum: ["low", "moderate", "high"],
    lowercase: true
  },
  additionalNote: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional note cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
    lowercase: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Referral", referralSchema);
