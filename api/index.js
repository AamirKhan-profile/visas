const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require('cors');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');

const app = express();

/* --- 1. MODELS & CONFIG --- */
// index.js is in /api, so models is in ./models
const User = require('./models/user.js');
const Pictures = require('./models/pictures.js');

// IMPORTANT: Replace the string below with your actual MongoDB Atlas connection string
// Ensure there are no extra quotes and your password is correct.
const uri = "mongodb+srv://yourUsername:yourPassword@cluster0.abcde.mongodb.net/visas?retryWrites=true&w=majority";

/* --- 2. STORAGE CONFIG --- */
// On Vercel, the filesystem is read-only. 
// For production, you usually need Cloudinary, but we will use MemoryStorage 
// to prevent the 500 error crash during the request.
const storage = (process.env.NODE_ENV === 'production') 
    ? multer.memoryStorage() 
    : multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../public/uploads')); 
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

const upload = multer({ storage: storage });

/* --- 3. MIDDLEWARE & PATHS --- */
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(expressLayouts);
app.set('layout', path.join(__dirname, '../views/layouts/main'));

/* --- 4. DATABASE CONNECTION --- */
mongoose.connect(uri)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

/* --- 5. ROUTES --- */
app.get("/", (req, res) => {
  res.render("home", { title: 'Embassy Visa' });
});

app.get('/addvisa', (req, res) => {
    res.render('addvisa', { title: 'Add Visa' });
});

app.post('/savevisa', upload.array('images', 3), async (req, res) => {
  try {
    const { name, passportNumber, documentNumber, country } = req.body;
    const files = req.files;

    if (!files || files.length === 0) return res.status(400).send("Please upload at least 1 image");

    // NOTE: Memory storage doesn't provide a 'filename'. 
    // This logic works best for local testing. 
    const imagePaths = files.map(file => file.filename ? `/uploads/${file.filename}` : "image-stored-in-memory"); 

    const newVisa = new User({
      name,
      passportNumber,
      documentNumber,
      country,
      images: imagePaths
    });

    await newVisa.save();
    res.send("Visa application saved successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.code === 11000 ? "Passport number already exists" : "Server error");
  }
});

app.post('/searchData', async(req, res) => {
  try {
    const { passportNumber, documentNumber, country } = req.body;
    const result = await User.findOne({
      passportNumber,
      documentNumber,
      country: { $regex: new RegExp(`^${country}$`, 'i') }
    });

    if (result) {
      res.render('result', { images: result.images, title: 'Embassy Visa' });
    } else {
      res.send(`<script>alert('No record found!'); window.history.back();</script>`);
    }
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/* --- 6. VERCEL EXPORT --- */
module.exports = app;

// Local listening for dev
if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
