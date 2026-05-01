const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
// const uri = process.env.MONGODB_URI;
const User = require('./models/user.js');
const Pictures = require('./models/pictures.js');
const cors = require('cors');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
const { title } = require("process");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
// app.use('/uploads', express.static('uploads'));


/* ---------- MongoDB Connection ---------- */
mongoose.connect("mongodb://127.0.0.1:27017/testdb")
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });




app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.use(expressLayouts);
app.use(cors());
app.use(express.json()); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Make sure folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Limit max 3 files per form submission
const upload = multer({ storage: storage, limits: { files: 3 } });


/* ---------- First Route ---------- */
app.get("/", (req, res) => {
  res.render("home", { title: 'Embassy Visa' });
});

app.get('/addvisa', (req, res) => {
    res.render('addvisa', { title: 'Add Visa' });
});

  app.post('/savevisa', upload.array('images', 3), async (req, res) => {
  try {
    // Extract text fields from form
    const { name, passportNumber, documentNumber, country } = req.body;
    
    // Extract uploaded files
    const files = req.files;

    // Validation: make sure at least 1 image uploaded
    if (!files || files.length === 0) {
      return res.status(400).send("Please upload at least 1 image");
    }

    // Map file paths
    const imagePaths = files.map(file => `/uploads/${file.filename}`);

    // Create new Visa document
    const newVisa = new User({
      name,
      passportNumber,
      documentNumber,
      country,
      images: imagePaths
    });

    // Save to MongoDB
    await newVisa.save();

    res.send("Visa application saved successfully!");
  } catch (err) {
    console.error(err);

    // Handle duplicate passport number error
    if (err.code === 11000) {
      return res.status(400).send("Passport number already exists");
    }

    // Validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).send(messages.join(', '));
    }

    res.status(500).send("Server error");
  }
});
 app.post('/searchData', async(req, res)=>
    {
        try{
   const { name, passportNumber, documentNumber, country } = req.body;
  const result = await User.findOne({
    passportNumber,
    documentNumber,
    country: { $regex: new RegExp(`^${country}$`, 'i') }
});

        if (result) {
            // If found, redirect to results page with record ID
            res.render('result', { images: result.images, title: 'Embassy Visa' });
        } else {
            // If not found, render page with JS popup
            res.send(`
                <script>
                    alert('No record found! Please enter query correctly');
                    window.history.back();
                </script>
            `);
        }
    }
         catch (err) {
        console.error(err);
        res.send('Server error');
    }
});

app.get('/view', async (req, res) => {
    try {
        const users = await User.find({});
        res.render('users', { users, title:'All Visa Holders' }); // Pass all users to EJS
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
});


// selectionpic to show 
app.get('/showselect', async (req, res) => {
    try {
       const pictures  = await Pictures.find({});
       res.render('showselectpics', {pictures, title:'Approved Deleting'});
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
});

        // remove only one image

app.post('/pictures/delete-one/:id', async (req, res) => {
        const {id} = req.params;

        const record = await Pictures.findByIdAndDelete(id);
        if (!record) {
            return res.send('Record not found');
        }


        res.redirect('/showselect');
});

app.post('/users/delete/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/view'); // Redirect back to users page
    } catch (err) {
        console.error(err);
        res.send('Delete failed');
    }
});

app.get('/addpictures', async(req, res)=>
(
 res.render('pictures', {title:'Add Picture'})
));

app.post("/pictures", upload.array("pictures"), async (req, res) => {
    const { applicantName } = req.body;

    const imagePaths = req.files.map(file =>
        file.path.replace('public\\', '').replace('public/', '') // Windows/Linux fix
    );

    await Pictures.create({
        applicantName,
        pictures: imagePaths
    });

    res.send("Saved");
});

// showing pictures to site
app.get("/applications", async (req, res) => {
    const pictures = await Pictures.find({});
    res.render("index", { pictures, title:'Approved' });
});

/* ---------- Local Server ONLY ---------- */
// 


app.listen(3000, function()
{
 console.log("Running App Success! ");
});

// module.exports = app;
// /*
// ⚠️ NOTE:
// Hosting (cPanel) پر app.listen() ہٹا کر
//  کریں گ
// */ے