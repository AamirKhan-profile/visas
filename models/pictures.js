const mongoose = require("mongoose");

const pictureSchema = new mongoose.Schema({
    applicantName: {
        type: String,
        required: true
    },
    pictures: [
        {
            type: String,   // image path or URL
            required: true
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Picture", pictureSchema);