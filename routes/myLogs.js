// routes/myLogs.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/SignUp_SignIn.html');

    db.query(
        'SELECT event_type, message, timestamp FROM user_logs WHERE user_id = ? ORDER BY timestamp DESC',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Log fetch error:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.render('myLogs', { logs: results });
        }
    );
});

module.exports = router;
