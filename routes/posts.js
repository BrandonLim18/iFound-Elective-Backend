const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createPost,
  getPosts,
  updatePost,
  deletePost
} = require("../controllers/postsController");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post("/", upload.single("image"), createPost);

router.get("/", getPosts);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

module.exports = router;