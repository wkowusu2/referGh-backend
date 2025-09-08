const express = require("express");
const router = express.Router();
const clinicController = require("../controllers/clinicController");
const adminController = require("../controllers/adminController");
const verifyClinic = require("../middlewares/clinicMiddleware"); 

//Authentication
router.post("/signup", clinicController.signup);
router.post("/login", clinicController.login);

// Referral actions
router.post("/referrals", verifyClinic, clinicController.createReferral);
router.get("/referrals", verifyClinic, clinicController.getReferrals);
router.get("/referrals/:id", verifyClinic, clinicController.getReferralById);

// Hospital directory (for creating referrals)
router.get("/hospitals", verifyClinic, adminController.getHospitals);
router.get("/units", verifyClinic, adminController.getUnits);
router.get("/hospital/:hospitalId/units", verifyClinic, adminController.getUnitsByHospital);

// Notifications
router.get("/notifications", verifyClinic, clinicController.getNotifications);

module.exports = router;