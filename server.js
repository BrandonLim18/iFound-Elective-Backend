const express = require("express");
const cors = require("cors");
const path = require("path"); // 1. IMPORT PATH
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// 2. MAKE UPLOADS FOLDER PUBLIC
// This allows the frontend to access images at /uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/claims", require("./routes/claims"));

connectDB().then((db) => {
  app.locals.db = db;

  // 3. LISTEN ON '0.0.0.0' FOR EMULATOR ACCESS
  app.listen(process.env.PORT || 3000, '0.0.0.0', () =>
    console.log(`Server running on port ${process.env.PORT || 3000}`)
  );
});