const Clinic = require("../models/ClinicModel");
const Patient = require("../models/PatientModel");
const Referral = require("../models/ReferralModel");
const Notification = require("../models/NotificationModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    const exists = await Clinic.findOne({ email });
    if (exists) return res.status(400).json({ message: "Clinic already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const clinic = await Clinic.create({ name, email, password: hashedPassword, location });
    res.status(201).json({ message: "Clinic registered" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clinic = await Clinic.findOne({ email });
    if (!clinic) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, clinic.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: clinic._id, type: "clinic" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReferral = async (req, res) => {
  try {
    const { patientInfo, vitals, reason, urgency, additionalNote, hospitalId, unitId } = req.body;

    const patient = await Patient.create({
      ...patientInfo,
      vitals,
    });

    const referral = await Referral.create({
      clinic: req.user.id,
      hospital: hospitalId,
      unit: unitId,
      patient: patient._id,
      reason,
      urgency,
      additionalNote,
      status: "pending",
    });

    await referral.populate(['hospital', 'unit', 'patient', 'clinic']);

    // Create notification for the unit
    const notification = await Notification.create({
      recipientType: "unit",
      recipientId: unitId,
      type: "new_referral",
      message: `New referral from ${referral.clinic.name || 'clinic'} for ${patient.fullname}`,
    });

    // Emit real-time notifications via WebSocket
    const io = req.app.get('io');
    
    // Emit to specific unit
    io.to(`unit-${unitId}`).emit('new-referral', {
      referral: referral,
      notification: notification,
      message: `New ${urgency} priority referral received`
    });

    // Emit to hospital room (for dashboard updates)
    io.to(`hospital-${hospitalId}`).emit('referral-created', {
      referral: referral,
      hospitalId: hospitalId,
      unitId: unitId
    });

    // Emit to admin dashboard for real-time stats
    io.emit('admin-stats-update', {
      type: 'referral_created',
      data: {
        hospitalId,
        unitId,
        urgency,
        timestamp: new Date()
      }
    });

    res.status(201).json({ message: "Referral sent", referral });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ clinic: req.user.id })
      .populate("hospital")
      .populate("unit")
      .populate("patient")
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReferralById = async (req, res) => {
  try {
    const referral = await Referral.findOne({ _id: req.params.id, clinic: req.user.id })
      .populate("hospital")
      .populate("unit")
      .populate("patient");
    if (!referral) return res.status(404).json({ message: "Referral not found" });
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ recipientType: "clinic", recipientId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
