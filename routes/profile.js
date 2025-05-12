const express = require('express');
const router = express.Router();
const multer = require('multer'); // multer is used for handling file uploads
const path = require('path');
const fs = require('fs'); // fs is used for file system operations
const connection = require('../config/db'); // Use the MySQL connection from db.js

router.get('/', (req, res) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    console.log('User ID:', req.session.userId); // Log the user ID from the session

    if (!req.session || !req.session.userId) {
        return res.redirect('/SignUp_SignIn.html');
    }

    connection.query(
        'SELECT name, email, profile_photo, rating, total_played, won, lost, drawn FROM users WHERE id = ?',
        [req.session.userId], (err, results) => {
            if (err) {
                console.error('Error fetching user data:', err);
                return res.status(500).send('Failed to load profile.');
            }

            const user = results[0];
            console.log('Username:', user?.name, 'Email:', user?.email, 'Rating:', user?.rating);
            const profilePhoto = user?.profile_photo || '/uploads/default-profile.jpg'; // Use default photo if none exists
            res.render('profile', {
                profilePhoto,
                username: user?.name,
                email: user?.email,
                rating: user?.rating || 300,
                matches_played: user?.total_played || 0,
                matches_won: user?.won || 0,
                matches_lost: user?.lost || 0,
                matches_drawn: user?.drawn || 0
            });

        });
});

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        if (req.session && req.session.userId) {
            const userId = req.session.userId;
            const newFileName = `user_Id_${userId}${path.extname(file.originalname)}`;
            cb(null, newFileName);
        } else {
            cb(new Error('User not logged in or session not found'));
        }
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
router.post('/upload-profile-photo', (req, res, next) => {
    if (!req.session || !req.session.userId) {
        console.error('User not logged in or session not found');
        return res.status(401).send('User not logged in');
    }
    next();
}, upload.single('profilePhoto'), (req, res) => {
    if (!req.file) {
        console.error('No file uploaded or invalid file type.');
        return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
    }

    const userId = req.session.userId;
    const newFileName = `user_Id_${userId}${path.extname(req.file.originalname)}`;
    const filePath = `/uploads/${newFileName}`;

    connection.query('SELECT profile_photo FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching existing profile photo:', err);
            return res.status(500).json({ message: 'Failed to fetch existing profile photo.' });
        }

        const existingPhoto = results[0]?.profile_photo;
        const uploadDir = path.join(__dirname, '../public/uploads');
        const newPhotoPath = path.join(uploadDir, newFileName);

        if (existingPhoto && existingPhoto !== '/uploads/default-profile.png') {
            fs.rename(req.file.path, newPhotoPath, (renameErr) => {
                if (renameErr) {
                    console.error('Error replacing existing profile photo:', renameErr);
                    return res.status(500).json({ message: 'Failed to replace profile photo.' });
                }
                res.json({ message: 'Profile photo replaced successfully!' });
            });
        } else {
            fs.rename(req.file.path, newPhotoPath, (renameErr) => {
                if (renameErr) {
                    console.error('Error saving new profile photo:', renameErr);
                    return res.status(500).json({ message: 'Failed to save profile photo.' });
                }

                connection.query('UPDATE users SET profile_photo = ? WHERE id = ?', [filePath, userId], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating profile photo in database:', updateErr);
                        return res.status(500).json({ message: 'Failed to update profile photo in database.' });
                    }

                    res.json({ message: 'Profile photo uploaded successfully!' });
                });
            });
        }
    });
});

module.exports = router;
