// models/Unit.js
const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    trim: true,
    maxlength: [100, 'Unit name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: [true, 'Hospital reference is required']
  },
  availableBeds: {
    type: Number,
    required: [true, 'Available beds count is required'],
    min: [0, 'Available beds cannot be negative'],
    max: [1000, 'Available beds seems too high']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  acceptingReferrals: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Unit", unitSchema);
