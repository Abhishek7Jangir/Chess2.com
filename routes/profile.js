const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max size: 2MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
        }
    }
});

// Route to handle profile photo upload
router.post('/upload-profile-photo', upload.single('profilePhoto'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded or invalid file type.');
    }

    // Save the file path to the user's profile in the database (mocked here)
    const filePath = `/uploads/${req.file.filename}`;
    console.log('Uploaded file path:', filePath);

    // Mock saving to database
    // Update the user's profile photo path in the database

    res.json({ message: 'Profile photo uploaded successfully!', filePath });
});//

module.exports = router;