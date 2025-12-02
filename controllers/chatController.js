const { ObjectId } = require("mongodb");

// 1. Get or Create Room
exports.getOrCreateRoom = async (req, res) => {
    const db = req.app.locals.db;
    const { chatRoomId, associatedPostId, postOwnerId, postFinderId, itemStatus, ownerName, finderName } = req.body;

    try {
        let chat = await db.collection("chats").findOne({ chatRoomId });

        if (!chat) {
            chat = {
                chatRoomId,
                associatedPostId,
                postOwnerId,
                postFinderId,
                itemStatus,
                ownerName: ownerName || "Unknown",
                finderName: finderName || "Unknown",
                verificationState: 'none',
                claimData: { itemName: '', description: '', proofImageUrl: '' },
                messages: [],
                createdAt: new Date()
            };
            await db.collection("chats").insertOne(chat);
        }
        res.json(chat);
    } catch (e) {
        console.error("Error creating room:", e);
        res.status(500).json({ error: e.message });
    }
};

// 2. Send Message
exports.sendMessage = async (req, res) => {
    const db = req.app.locals.db;
    const { chatRoomId, senderId, message, type, imageUrl } = req.body;

    const newMessage = {
        senderId,
        message,
        type: type || 'text',
        imageUrl: imageUrl || '',
        timestamp: new Date()
    };

    try {
        await db.collection("chats").updateOne(
            { chatRoomId },
            { $push: { messages: newMessage } }
        );
        res.json({ success: true });
    } catch (e) {
        console.error("Error sending message:", e);
        res.status(500).json({ error: e.message });
    }
};

// 3. Get Messages
exports.getMessages = async (req, res) => {
    const db = req.app.locals.db;
    try {
        const chat = await db.collection("chats").findOne({ chatRoomId: req.params.roomId });
        res.json(chat ? chat.messages.reverse() : []);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 4. Update State (Reward & Close Post Logic)
exports.updateState = async (req, res) => {
    const db = req.app.locals.db;
    const { chatRoomId, newState, claimData } = req.body;

    console.log(`🔄 Updating State for ${chatRoomId} to: ${newState}`);

    try {
        let updateFields = { "verificationState": newState };
        if (claimData) updateFields["claimData"] = claimData;

        // 1. Update Chat Status
        await db.collection("chats").updateOne(
            { chatRoomId },
            { $set: updateFields }
        );

        // 2. IF RECOVERED -> CLOSE POST & GIVE POINTS
        if (newState === 'recovered') {
            const chat = await db.collection("chats").findOne({ chatRoomId });
            
            if (chat) {
                 // A. AWARD POINTS
                 if (chat.postFinderId) {
                     let finderId = chat.postFinderId;
                     console.log(`💰 Awarding points to: ${finderId}`);
                     
                     // Try updating by ObjectId (if it's a real Mongo ID)
                     let userUpdate = await db.collection("users").updateOne({ _id: new ObjectId(finderId) }, { $inc: { points: 100 } }).catch(() => null);
                     
                     // If that failed (matched 0), try updating by String ID
                     if (!userUpdate || userUpdate.matchedCount === 0) {
                        await db.collection("users").updateOne({ _id: finderId }, { $inc: { points: 100 } });
                     }
                 }

                 // B. CLOSE THE POST (ROBUST FIX)
                 if (chat.associatedPostId) {
                     const postId = chat.associatedPostId;
                     console.log(`🔒 Attempting to close Post ID: ${postId}`);

                     // Try 1: Update using ObjectId
                     let postUpdate = await db.collection("posts").updateOne(
                         { _id: new ObjectId(postId) },
                         { $set: { status: 'recovered' } }
                     ).catch(() => ({ matchedCount: 0 }));

                     // Try 2: If ObjectId didn't find it, try String ID
                     if (postUpdate.matchedCount === 0) {
                         console.log("⚠️ ObjectId failed, trying String ID...");
                         postUpdate = await db.collection("posts").updateOne(
                             { _id: postId }, // Plain string check
                             { $set: { status: 'recovered' } }
                         );
                     }

                     if (postUpdate.matchedCount > 0) {
                         console.log("✅ Post successfully marked as recovered!");
                     } else {
                         console.log("❌ Failed to find Post to close. Check IDs in DB.");
                     }
                 }
            }
        }
        res.json({ success: true });
    } catch (e) {
        console.error("Error updating state:", e);
        res.status(500).json({ error: e.message });
    }
};

// 5. Get Chat Meta
exports.getChatMeta = async (req, res) => {
    const db = req.app.locals.db;
    try {
        const chat = await db.collection("chats").findOne({ chatRoomId: req.params.roomId });
        
        if (chat) {
            res.json({
                verificationState: chat.verificationState,
                itemStatus: chat.itemStatus,
                postOwnerId: chat.postOwnerId,
                postFinderId: chat.postFinderId,
                claimData: chat.claimData
            });
        } else {
            res.json({ verificationState: 'none' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 6. Get User Chats
exports.getUserChats = async (req, res) => {
    const db = req.app.locals.db;
    const { userId } = req.params;

    try {
        const chats = await db.collection("chats").find({
            $or: [
                { postOwnerId: userId },
                { postFinderId: userId }
            ]
        }).sort({ "messages.timestamp": -1 }).toArray();

        res.json(chats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 7. Delete Chat
exports.deleteChat = async (req, res) => {
    const db = req.app.locals.db;
    const { roomId } = req.params;

    try {
        await db.collection("chats").deleteOne({ chatRoomId: roomId });
        res.json({ message: "Chat deleted successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};