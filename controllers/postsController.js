const { ObjectId } = require("mongodb");

exports.createPost = async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 1. Get the text data (title, description, etc.)
    // When using Multer, req.body contains the text fields
    const postData = req.body; 

    // 2. Handle the Image File
    if (req.file) {
      // If Multer saved a file, save the path to MongoDB
      // We replace backslashes (Windows) with forward slashes (Web standard)
      postData.imageUrl = req.file.path.replace(/\\/g, "/"); 
    } else {
      // If no image was picked, save an empty string
      postData.imageUrl = "";
    }

    // 3. Save to Database
    await db.collection("posts").insertOne(postData);
    
    console.log("✅ Post created:", postData.itemName);
    res.json({ message: "Post created", post: postData });

  } catch (e) {
    console.error("Error creating post:", e);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getPosts = async (req, res) => {
  const db = req.app.locals.db;
  try {
    //  ADD THE FILTER { status: 'active' }
    const posts = await db.collection("posts")
        .find({ status: "active" }) 
        .sort({ _id: -1 }) 
        .toArray();

    res.json(posts);
  } catch (e) {
    console.error("Error getting posts:", e);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updatePost = async (req, res) => {
  const db = req.app.locals.db;
  await db.collection("posts").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.json({ message: "Post updated" });
};

exports.deletePost = async (req, res) => {
  const db = req.app.locals.db;
  await db.collection("posts").deleteOne({
    _id: new ObjectId(req.params.id)
  });
  res.json({ message: "Post deleted" });
};