const express = require('express');
const admin = require('../controllers/adminController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: "Welcome to the admin route" });
}); 

// Authentication routes
router.post("/register", admin.signup);
router.post("/login", admin.login);

// Hospital management routes
router.post("/hospital/register", adminMiddleware, admin.createHospital);
router.get("/hospitals", adminMiddleware, admin.getHospitals);
router.get("/hospital/:hospitalId/units", adminMiddleware, admin.getUnitsByHospital);
router.get("/hospital/:hospitalId/referrals", adminMiddleware, admin.getReferralsByHospital);

// Unit management routes
router.post("/hospital/:hospitalId/unit/register", adminMiddleware, admin.createUnit);
router.get("/units", adminMiddleware, admin.getUnits);
router.get("/unit/:unitId/referrals", adminMiddleware, admin.getReferralsByUnit);

// Analytics and monitoring routes
router.get("/stats", adminMiddleware, admin.getStats);
router.get("/referrals", adminMiddleware, admin.getReferrals);

module.exports = router;