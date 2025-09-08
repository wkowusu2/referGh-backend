const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unitController");
const verifyUnit = require("../middlewares/unitMiddleware");

router.post("/login", unitController.login);
router.get("/dashboard", verifyUnit, unitController.getDashboard);
router.put("/status", verifyUnit, unitController.updateStatus);
router.get("/referrals", verifyUnit, unitController.getIncomingReferrals);
router.post("/referrals/respond", verifyUnit, unitController.respondToReferral);
router.get("/notifications", verifyUnit, unitController.getNotifications);

module.exports = router;