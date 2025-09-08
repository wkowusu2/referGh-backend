// controllers/adminController.js
const Admin = require("../models/AdminModel");
const Hospital = require("../models/HospitalModel");
const Unit = require("../models/UnitModel");
const Referral = require("../models/ReferralModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await Admin.findOne({ username });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, password: hashed });
    res.status(201).json({ message: "Admin created", admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, type: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const { name, email, location, phone } = req.body;
    const exists = await Hospital.findOne({ email });
    if (exists) return res.status(400).json({ message: "Hospital already exists" });

    const hospital = await Hospital.create({ name, email, location, phone });
    res.status(201).json({ hospitalId: hospital._id, message: "Hospital created", hospital });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUnit = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { name, email, password, availableBeds } = req.body;

    const exists = await Unit.findOne({ email });
    if (exists) return res.status(400).json({ message: "Unit already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const unit = await Unit.create({
      name,
      email,
      password: hashedPassword,
      hospital: hospitalId,
      availableBeds,
      isOnline: false,
      acceptingReferrals: false,
      lastUpdated: new Date(),
    });

    res.status(201).json({ message: "Unit created", unit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all hospitals
exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all units
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.find().populate('hospital').sort({ createdAt: -1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get units by hospital
exports.getUnitsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const units = await Unit.find({ hospital: hospitalId }).populate('hospital');
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get admin statistics
exports.getStats = async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const totalUnits = await Unit.countDocuments();
    const totalReferrals = await Referral.countDocuments();
    const activeUnits = await Unit.countDocuments({ isOnline: true });
    const pendingReferrals = await Referral.countDocuments({ status: 'pending' });
    const acceptedReferrals = await Referral.countDocuments({ status: 'accepted' });
    const declinedReferrals = await Referral.countDocuments({ status: 'declined' });

    res.json({
      totalHospitals,
      totalUnits,
      totalReferrals,
      activeUnits,
      pendingReferrals,
      acceptedReferrals,
      declinedReferrals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all referrals
exports.getReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('clinic', 'name email')
      .populate('hospital', 'name location')
      .populate('unit', 'name')
      .populate('patient', 'fullname age gender')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get referrals by unit
exports.getReferralsByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const referrals = await Referral.find({ unit: unitId })
      .populate('clinic', 'name email')
      .populate('hospital', 'name location')
      .populate('unit', 'name')
      .populate('patient', 'fullname age gender')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get referrals by hospital
exports.getReferralsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const referrals = await Referral.find({ hospital: hospitalId })
      .populate('clinic', 'name email')
      .populate('hospital', 'name location')
      .populate('unit', 'name')
      .populate('patient', 'fullname age gender')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
