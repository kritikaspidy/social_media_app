const express = require('express');
const fs = require('fs');
const authMiddleware = require('../middleware/authmiddleware');
const router = express.Router();

const commentsFile = './data/posts.json';  // Path to store comments data


// Add a comment to a post
router.post('/:postId', authMiddleware, (req, res) => {
    const { userId } = req.user;  // Get the authenticated user's ID
    const { content } = req.body;  // Get the content of the comment
    const { postId } = req.params;  // Get the postId from the URL

    // Check if content is provided
    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    // Read the existing comments from the comments file
    let comments = JSON.parse(fs.readFileSync(commentsFile));

    // Check if the post exists
    const postExists = JSON.parse(fs.readFileSync(commentsFile)).some(post => post.id == postId);
    if (!postExists) {
        return res.status(404).json({ message: 'Post not found' });
    }

    // Create a new comment object
    const newComment = {
        id: Date.now(),  // Unique ID for the comment (using timestamp)
        postId,
        userId,
        content,  // The content of the comment
    };

    // Add the new comment to the comments array
    comments.push(newComment);

    // Save the updated comments array to the file
    fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));  // Pretty-print for readability

    // Return the created comment in the response
    res.status(201).json(newComment);
});

module.exports = router;
