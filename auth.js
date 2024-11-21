const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { readFile, writeFile } = require('../utils/fshelper'); 
const { JWT_SECRET } = process.env;
const router = express.Router();

const usersFile = './data/users.json';

// Function to generate the next ID
const generateNextId = (users) => {
    if (users.length === 0) return 1; // If no users exist, start with ID 1
    const lastUser = users[users.length - 1]; // Get the last user
    return lastUser.id + 1; // Increment the last user's ID by 1
};

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use readFile function to get existing users
    let users = readFile(usersFile);

    // Generate the next ID for the new user
    const newUser = { 
        id: generateNextId(users), 
        username, 
        password: hashedPassword, 
        bio: '', 
        followers: [], 
        // followerscount: [],
        following: [],
        // followingcount: []
        isAdmin: false,  // Default to false, meaning the user is not an admin
        role: 'user' 
    };

    // Add the new user to the users array
    users.push(newUser);

    // Use writeFile function to save updated users
    writeFile(usersFile, users);
    
    res.status(201).json({ message: 'User registered!' });
});

// Login user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Use readFile function to get existing users
    let users = readFile(usersFile);
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

module.exports = router;
