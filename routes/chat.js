const express = require("express");
const router = express.Router();
const { 
    getOrCreateRoom, 
    sendMessage, 
    getMessages, 
    updateState, 
    getChatMeta, 
    getUserChats,
    deleteChat
} = require("../controllers/chatController");

// --- POST REQUESTS ---
router.post("/init", getOrCreateRoom);
router.post("/send", sendMessage);
router.post("/state", updateState);

// --- GET REQUESTS (Order Matters!) ---

// 1. Specific Routes FIRST
// This MUST come before /:roomId, otherwise "user" is treated as an ID
router.get("/user/:userId", getUserChats); 

// 2. Sub-resource Routes SECOND
router.get("/:roomId/meta", getChatMeta); 
router.get("/:roomId/messages", getMessages);

// 3. Generic Wildcard Routes LAST
// This catches anything else (like just an ID)
router.get("/:roomId", getMessages); 

router.delete("/:roomId", deleteChat);

module.exports = router;