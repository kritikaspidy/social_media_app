// routes/posts.js
const express = require('express');
const fs = require('fs');
const upload = require('../utils/upload');  // Import the upload from utils/upload.js
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const postsFile = './data/posts.json';  // Path to store posts data

// Create a new post with image and content
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
    const { userId } = req.user;  // Get the userId from the JWT token
    const { content } = req.body;  // Get the content from form data
    const image = req.file;  // Get the uploaded image file

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    // Check if an image is uploaded
    let imageUrl = '';
    if (image) {
        imageUrl = `/uploads/${image.filename}`;  // This is the relative URL to access the image
    }

    // Read the existing posts from the file
    let posts = JSON.parse(fs.readFileSync(postsFile));

    // Create a new post object
    const newPost = {
        id: Date.now(),
        userId,
        content,  // Text content from the form
        image: imageUrl,  // Image URL (relative path)
        likes: [],  // Initialize likes as an array (to store user IDs who liked the post)
        likesCount: 0,  // Initialize likesCount to track the number of likes
        comments: [],  // Initially no comments
    };

    // Add the new post to the posts array
    posts.push(newPost);

    // Save the updated posts array to the file
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));  // Pretty-print for readability

    // Return the created post in the response
    res.status(201).json(newPost);
});

// Like a post
router.post('/:postId/like', authMiddleware, (req, res) => {
    const { postId } = req.params;
    const { userId } = req.user;  // Get the authenticated user's ID

    let posts = JSON.parse(fs.readFileSync(postsFile));

    // Find the post by ID
    const post = posts.find(p => p.id == postId);

    // Check if the post exists
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
        return res.status(400).json({ message: 'You have already liked this post' });
    }

    // Add the user's ID to the likes array
    post.likes.push(userId);

    // Update the likesCount
    post.likesCount = post.likes.length;

    // Save the updated posts array to the file
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

    // Return the updated likes count with a success message
    res.json({ message: 'Post liked', likesCount: post.likesCount });
});

// Unlike a post
router.post('/:postId/unlike', authMiddleware, (req, res) => {
    const { postId } = req.params;
    const { userId } = req.user;  // Get the authenticated user's ID

    let posts = JSON.parse(fs.readFileSync(postsFile));

    // Find the post by ID
    const post = posts.find(p => p.id == postId);

    // Check if the post exists
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has liked the post
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
        return res.status(400).json({ message: 'You have not liked this post' });
    }

    // Remove the user's ID from the likes array
    post.likes.splice(likeIndex, 1);

    // Update the likes count
    post.likesCount = post.likes.length;

    // Save the updated posts array to the file
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

    // Return the updated likes count with a success message
    res.json({ message: 'Post unliked', likesCount: post.likesCount });
});


module.exports = router;
