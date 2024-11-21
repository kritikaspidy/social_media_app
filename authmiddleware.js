const jwt = require('jsonwebtoken');
require('dotenv').config();
const { readData } = require('../utils/fshelper');
const usersFile = './data/users.json';


const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    // Check if Authorization header is provided
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // Extract token from Authorization header
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7) // Remove 'Bearer ' prefix
        : authHeader;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user information to the request object
        req.user = decoded;

        next(); // Continue to the next middleware/route handler
    } catch (error) {
        // Token verification failed
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
