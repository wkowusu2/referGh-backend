const Unit = require("../models/UnitModel");
const Referral = require("../models/ReferralModel");
const Patient = require("../models/PatientModel");
const Notification = require("../models/NotificationModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); 

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const unit = await Unit.findOne({ email });
    if (!unit) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, unit.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: unit._id, type: "unit", hospital: unit.hospital }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const unit = await Unit.findById(req.user.id).populate('hospital');
    const latestReferrals = await Referral.find({ unit: req.user.id })
      .populate("patient")
      .populate("clinic")
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      name: unit.name,
      hospital: unit.hospital,
      availableBeds: unit.availableBeds,
      isOnline: unit.isOnline,
      acceptingReferrals: unit.acceptingReferrals,
      latestReferrals,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { isOnline, acceptingReferrals, availableBeds } = req.body;
    const unit = await Unit.findByIdAndUpdate(
      req.user.id,
      { isOnline, acceptingReferrals, availableBeds, lastUpdated: new Date() },
      { new: true }
    ).populate('hospital');

    // Emit real-time updates via WebSocket
    const io = req.app.get('io');
    
    // Emit to hospital room
    io.to(`hospital-${unit.hospital._id}`).emit('unit-status-updated', {
      unitId: unit._id,
      unitName: unit.name,
      isOnline,
      acceptingReferrals,
      availableBeds,
      hospitalId: unit.hospital._id,
      timestamp: new Date()
    });

    // Emit to admin dashboard for real-time stats
    io.emit('admin-stats-update', {
      type: 'unit_status_updated',
      data: {
        unitId: unit._id,
        hospitalId: unit.hospital._id,
        isOnline,
        acceptingReferrals,
        availableBeds,
        timestamp: new Date()
      }
    });

    // Emit to all clinics for bed availability updates
    io.emit('bed-count-updated', {
      unitId: unit._id,
      unitName: unit.name,
      hospitalId: unit.hospital._id,
      hospitalName: unit.hospital.name,
      availableBeds,
      acceptingReferrals,
      timestamp: new Date()
    });

    res.json({ message: "Status updated", unit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getIncomingReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ unit: req.user.id })
      .populate("patient")
      .populate("clinic")
      .populate("hospital")
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.respondToReferral = async (req, res) => {
  try {
    const { referralId, status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Verify this referral belongs to this unit
    const referral = await Referral.findOne({ _id: referralId, unit: req.user.id })
      .populate(['patient', 'clinic', 'hospital', 'unit']);
    
    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    referral.status = status;
    await referral.save();

    // Create notification for the clinic
    const notification = await Notification.create({
      recipientType: "clinic",
      recipientId: referral.clinic._id,
      type: "referral_response",
      message: `Your referral for ${referral.patient.fullname} has been ${status}`,
    });

    // Emit real-time notifications via WebSocket
    const io = req.app.get('io');
    
    // Emit to clinic that created the referral
    io.to(`clinic-${referral.clinic._id}`).emit('referral-response', {
      referral: referral,
      notification: notification,
      status: status,
      message: `Referral for ${referral.patient.fullname} ${status} by ${referral.unit.name}`
    });

    // Emit to hospital room for dashboard updates
    io.to(`hospital-${referral.hospital._id}`).emit('referral-updated', {
      referralId: referral._id,
      status: status,
      unitId: referral.unit._id,
      hospitalId: referral.hospital._id
    });

    // Emit to admin dashboard for real-time stats
    io.emit('admin-stats-update', {
      type: 'referral_responded',
      data: {
        referralId: referral._id,
        status: status,
        unitId: referral.unit._id,
        hospitalId: referral.hospital._id,
        urgency: referral.urgency,
        timestamp: new Date()
      }
    });

    res.json({ message: `Referral ${status}`, referral });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ recipientType: "unit", recipientId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
