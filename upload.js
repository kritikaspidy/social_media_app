// utils/upload.js
const multer = require('multer');
const path = require('path');  // Add this import

const uploadPath = path.join(__dirname, '../uploads');  // Set the path to the 'uploads' folder

// Set up storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);  // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Use timestamp as filename to avoid collisions
  },
});

// Filter to accept only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accept the file
  } else {
    cb(new Error('Invalid file type, only images are allowed'), false);  // Reject the file
  }
};

// Create an instance of multer with the storage and file filter options
const upload = multer({ storage, fileFilter });

module.exports = upload;  // Export the upload instance for use in routes
