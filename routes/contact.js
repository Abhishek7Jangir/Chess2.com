const express = require('express');
const bodyParser = require('body-parser'); // local import
const router = express.Router();
const db = require('../config/db'); // DB connection

// Apply body-parser locally to this router
router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res) => {
    res.render('contact', { success: null, error: null });
});

router.post('/', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message || message.length > 500) {
        return res.render('contact', {
            success: false,
            error: 'Please fill in all fields and keep message under 500 characters.'
        });
    }

    const sql = 'INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)';
    db.query(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error('DB error:', err);
            return res.render('contact', { success: false, error: 'Database error occurred.' });
        }

        res.render('contact', { success: true, error: null });
    });
});

module.exports = router;
