const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getLeaderboard } = require("../controllers/usersController");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/leaderboard", getLeaderboard);
module.exports = router;