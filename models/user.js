const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: 3,
        maxlength: 100
    },

    passportNumber: {
        type: String,
        required: [true, "Passport number is required"],
        trim: true,
        unique: true,
        uppercase: true
    },

    documentNumber: {
        type: String,
        required: [true, "Document number is required"],
        trim: true
    },

    country: {
        type: String,
        required: [true, "Country is required"],
        trim: true
    },

    images: {
        type: [String],  // Array of image paths
        validate: {
            validator: function (val) {
                return val.length >= 1 && val.length <= 3;
            },
            message: "You must upload between 1 to 3 images"
        }
    }

}, { timestamps: true });

module.exports = mongoose.model('Visa', visaSchema);
