const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Using callback-based mysql2

router.get('/', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/SignUp_SignIn.html');
    }
    db.query(
        'SELECT id, name, rating, total_played, won, lost, drawn FROM users ORDER BY rating DESC LIMIT 50',
        (err, results) => {
            if (err) {
                console.error('Leaderboard error:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.render('leaderboard', { players: results });
        }
    );
});

module.exports = router;
