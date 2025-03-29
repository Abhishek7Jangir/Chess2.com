const mysql = require('mysql2');
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
const redis = require('redis');
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'backend',
    password: 'abhishek'
});//

app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

app.get('/check-name', (req, res) => {
    const { value } = req.query;
    connection.query('SELECT COUNT(*) AS count FROM users WHERE name = ?', [value], (err, results) => {
        if (err) throw err;
        res.json({ unique: results[0].count === 0 });
        console.log('results[0].count:', results[0].count);
    });
});//

app.get('/check-email', (req, res) => {
    const { value } = req.query;
    connection.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [value], (err, results) => {
        if (err) throw err;
        res.json({ unique: results[0].count === 0 });
    });
});//

function isValidPassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPattern.test(password);
}

// const otpStore = {}; // In-memory store for OTPs

app.get('/send-otp', (req, res) => {
    const { email } = req.query;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).send('Invalid email address');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP in redis
    redisClient.set(`otp:${email}`, otp, 'EX', 300); // Store OTP for 5 minutes

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'abhijangir07aj@gmail.com',
            pass: 'fucx fbob vcdp aesr' // Use App Password here
        }
    });

    const mailOptions = {
        from: 'abhijangir07aj@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Failed to send OTP');
        }
        console.log('Email sent:', info.response);
        res.json({ message: 'OTP sent successfully' });
    });
});//

async function getStoredOtp(email) {
    try {
        const storedOtp = await redisClient.get(`otp:${email}`);
        return storedOtp;
    } catch (err) {
        console.error('Error retrieving OTP from Redis:', err);
        return null;
    }
}

app.get('/verify-otp', async (req, res) => {
    const { email, otp } = req.query;

    try {
        const storedOtp = await getStoredOtp(email);

        if (storedOtp === otp) {
            res.json({ verified: true });
        } else {
            res.json({ verified: false });
        }
    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).send('Internal server error');
    }
});

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if(!isValidPassword(password)) {
        return res.status(400).send('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err) => {
            if (err) throw err;
            res.send('User registered successfully');
        });
    } catch (err) {
        console.error('Error while hashing password:', err);
        res.status(500).send('Internal server error');
    }
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.json({ message: 'User not registered' });
        }
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            res.json({ message: 'Login Successful', id: user.id });
        }
        else {
            res.json({ message: 'Incorrect password' });
        }
    })
})

app.post('/update-password', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
            if (err) throw err;
            res.send('Password updated successfully');
        });
    } catch (err) {
        console.error('Error while hashing password:', err);
        res.status(500).send('Internal server error');
    }
});

app.post('/hash-password', async (req, res) => {
    const { password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        res.json({ hashedPassword });
    } catch (err) {
        console.error('Error while hashing password:', err);
        res.status(500).send('Internal server error');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

