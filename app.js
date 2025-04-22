const mysql = require('mysql2');
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
const redis = require('redis');
const ejs = require('ejs');
const session = require('express-session');
const router = express.Router();

app.use(session({
    secret: 'chessGameByAbhishek',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Debug session data for every request
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
});

// Debugging middleware to log static file requests
app.use((req, res, next) => {
    console.log('Static file request:', req.url);
    next();
});

const profileRoutes = require('./routes/profile');
app.use('/profile', profileRoutes);

const multiPlayer = require('./routes/multiPlayer');
app.use('/multiplayer', multiPlayer);

const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

app.use(express.urlencoded({ extended: true }));

const connection = require('./config/db'); // Import the MySQL connection from db.js

app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/views')));

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
    console.log('in stored otp function!');
    console.log('stored otp:', await redisClient.get(`otp:${email}`));
    try {
        const storedOtp = await redisClient.get(`otp:${email}`);
        return storedOtp;
    } catch (err) {
        console.error('Error retrieving OTP from Redis:', err);
        return null;
    }
}//

app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    console.log('verify-otp:', email, otp);

    try {
        const storedOtp = await getStoredOtp(email);
        console.log('Stored OTP:', storedOtp);
        if (storedOtp === otp) {
            res.json({ verified: true });
        } else {
            res.json({ verified: false });
        }
        console.log('OTP verification result:', storedOtp === otp);
    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).send('Internal server error');
    }
});//

app.post('/signup', async (req, res) => {
    console.log('Entered into signup route!');
    console.log('client data: ', req.body);
    const { name, email, password } = req.body;
    if(!isValidPassword(password)) {
        return res.status(400).send('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }
    try {
        console.log('hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('hashed password:', hashedPassword);
        console.log('storing into database...');
        ////Can Check again if email is already registered or not// maybe someone from front end is doing wrong
        connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err) => {
            if (err) throw err;
            res.send('User registered successfully');
        });
        console.log('User registered successfully');
    } catch (err) {
        console.error('Error while hashing password:', err);
        res.status(500).send('Internal server error');
    }
});//

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    console.log('Entered into signin route!');
    console.log('client data: ', req.body);
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            console.log('User not registered!');
            return res.json({ message: 'User not registered' });
        }
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('isPasswordValid:', isPasswordValid);
        if (isPasswordValid) {
            req.session.userId = user.id; // Store user ID in session
            console.log('Session userId set:', req.session.userId);
            res.json({message: 'Login Successful'}); // Send user ID in the response
        }
        else {
            res.json({ message: 'Incorrect password' });
        }
    });
});

app.get('/home', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/SignUp_SignIn.html'); // or any login page
    }

     // 🔒 Prevent caching
     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
     res.setHeader('Pragma', 'no-cache');
     res.setHeader('Expires', '0');

    // res.render('home', { id: req.session.userId }); // ✅ safely render using session

    connection.query('SELECT name, email, profile_photo FROM users WHERE id = ?', [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).send('Failed to load profile.');
        }

        const user = results[0];
        console.log('Username:', user?.name, 'Email:', user?.email);
        const profilePhoto = user?.profile_photo || '/uploads/default-profile.jpg'; // Use default photo if none exists
        res.render('home', { id: req.session.userId, profilePhoto, username: user?.name, email: user?.email });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Logout failed');
        }

        res.clearCookie('connect.sid'); // remove session cookie
        res.redirect('/SignUp_SignIn.html'); // or send JSON if frontend handles it
    });
});


app.post('/update-password', async (req, res) => {
    console.log('Entered into update-password route!');
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
            if (err) throw err;
            console.log('Password updated successfully!');
            res.send('Password updated successfully');
        });
    } catch (err) {
        console.error('Error while hashing password:', err);
        res.status(500).send('Internal server error');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});


module.exports = connection;