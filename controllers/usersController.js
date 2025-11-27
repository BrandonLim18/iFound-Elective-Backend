exports.registerUser = async (req, res) => {
  const db = req.app.locals.db;

  const user = req.body;
  await db.collection("users").insertOne(user);

  res.json({ message: "User registered" });
};

exports.loginUser = async (req, res) => {
  try {
    console.log("Login attempt:", req.body);

    const db = req.app.locals.db;
    const { email, password } = req.body;

    // Make sure email/password are trimmed
    const user = await db.collection("users").findOne({ 
      email: email.trim(), 
      password: password.trim() 
    });

    if (!user) {
      console.log("Invalid login attempt for", email);
      return res.status(200).json({ success: false, message: "Invalid credentials" });
    }

    console.log("Login successful for", email);
    res.status(200).json({ success: true, message: "Login successful", user });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};