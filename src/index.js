const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const app = express();

//Configuration of cloudinary
cloudinary.config({ 
  cloud_name: 'dmnebzeuw', 
  api_key: '813125944918776', 
  api_secret: 'qHCAxfV0k05E4EApEGKklreLZok',
  secure: true
});

// Connecting to MongoDB database
mongoose.connect("mongodb://127.0.0.1:27017/wardrobe", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });

// This is the path for all the hbs files
const templatePath = path.join(__dirname, "../templates");

// Static files and middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "/public/")));
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(fileUpload({
  useTempFiles:true,
  limits: { fileSize: 10*1024*1024 },
}));
app.use(express.urlencoded({ extended: false }));


// Schema for login collection
const LogInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const collection = mongoose.model("login", LogInSchema);

//schema for image upload
const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  imageId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

const ImageModel = mongoose.model("Image", ImageSchema);

// Schema for image history collection
const ImageHistorySchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  occasion: {
    type: String,
    required: true
  }
});

const ImageHistoryModel = mongoose.model("ImageHistory", ImageHistorySchema);

// Routes
app.get("/", (req, res) => {
  res.render("start");
});

app.get("/loginorsignup", (req, res) => {
  res.render("loginorsignup");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/location", (req, res) => {
  res.render("location");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/tup", (req, res) => {
  res.render("tup");
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.get("/vw", (req, res) => {
  res.render("vw");
});

// This is to post the new user's details into the login collection
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.name,
    password: req.body.password
  };

  await collection.insertMany([data]);

  res.render("home");
});

// This is to validate the password for "already a user"
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.name });
    if (check && check.password === req.body.password) {
      res.render("home");
    } else {
      res.send("Wrong password!");
    }
  } catch (error) {
    res.send("Wrong details");
  }
});

// image upload
app.post("/upload", (req, res, next) => {
  const file = req.files.file;
  const category = req.body.category && req.body.category.length > 0 ? req.body.category[0] : "";

  cloudinary.uploader.upload(file.tempFilePath, (err, result) => {
    if (err) {
      console.log("Failed to upload image", err);
      return res.status(500).json({ error: "Failed to upload image" });
    }

    const image = new ImageModel({
      url: result.url,
      imageId: result.public_id,
      category: category
    });

    // Save the image to the database
    image.save()
      .then(() => {
        console.log("Image uploaded and saved successfully");
        res.status(200).json({ message: "Image uploaded and saved successfully" });
      })
      .catch((error) => {
        console.log("Failed to save image to database", error);
        res.status(500).json({ error: "Failed to save image to database" });
      });
  });
});

//Traditional photos fetch
app.get("/t", (req, res) => {
  const category = "t";
  ImageModel.find({ category: category })
    .then((images) => {
      if (images.length > 0) {
        res.render("t", { images });
      } else {
        res.send("No images found for the category");
      }
    })
    .catch((error) => {
      console.log("Failed to fetch images from the database", error);
      res.send("Failed to fetch images from the database");
    });
});

//Party photos fetch
app.get("/p", (req, res) => {
  const category = "p";
  ImageModel.find({ category: category })
    .then((images) => {
      if (images.length > 0) {
        res.render("p", { images });
      } else {
        res.send("No images found for the category");
      }
    })
    .catch((error) => {
      console.log("Failed to fetch images from the database", error);
      res.send("Failed to fetch images from the database");
    });
});

//Casual photos fetch
app.get("/c", (req, res) => {
  const category = "c";
  ImageModel.find({ category: category })
    .then((images) => {
      if (images.length > 0) {
        res.render("c", { images });
      } else {
        res.send("No images found for the category");
      }
    })
    .catch((error) => {
      console.log("Failed to fetch images from the database", error);
      res.send("Failed to fetch images from the database");
    });
});

//Storing image history in the database
app.post("/add-to-history", (req, res) => {
  const { imageUrl, date, occasion } = req.body;

  const imageHistory = new ImageHistoryModel({
    imageUrl: imageUrl,
    date: date,
    occasion: occasion
  });

  imageHistory.save()
    .then(() => {
      console.log("Image history added to the database successfully");
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log("Failed to add image history to the database", error);
      res.sendStatus(500);
    });
});

// Route to fetch all image history records from the database
app.get("/history", (req, res) => {
  ImageHistoryModel.find({})
    .then((imageHistories) => {
      if (imageHistories.length > 0) {
        res.render("history", { imageHistories });
      } else {
        console.log("No image histories found");
        res.render("history", { imageHistories: [] });
      }
    })
    .catch((error) => {
      console.log("Failed to fetch image histories from the database", error);
      res.render("history", { imageHistories: [] });
    });
});

// Start the server
app.listen(2009, () => {
  console.log("Server started");
});
