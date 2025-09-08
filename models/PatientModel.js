// models/Patient.js
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Patient full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems invalid']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
  },
  nhisNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'NHIS number cannot exceed 50 characters']
  },
  vitals: {
    temperature: {
      type: String,
      trim: true
    },
    bp: {
      type: String,
      trim: true
    },
    pulse: {
      type: String,
      trim: true
    },
    o2Sat: {
      type: String,
      trim: true
    },
    respirationRate: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Patient", patientSchema);
