// routes/user.js
const express = require('express');
const fs = require('fs');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const usersFile = './data/users.json';

const adminMiddleware = (req, res, next) => {
    const { userId } = req.user;

    const users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.find(u => u.id === userId);

    if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
    }

    // Check if the user is a superadmin
    if (user.role === "superadmin") {
        req.isSuperadmin = true; // Add a flag for routes to identify superadmin
    }

    next();
};



// View All Profiles (Admin Only)
router.get('/admin/view-all', authMiddleware, adminMiddleware, (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFile));
    res.json(users);
});

// Update Any Profile (Admin Only)
router.patch('/admin/update-profile/:username', authMiddleware, adminMiddleware, (req, res) => {
    const { username } = req.params;
    const { bio } = req.body;

    let users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.bio = bio || user.bio;
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({ message: `Profile of ${username} updated` });
});

router.post('/admin/make-admin/:username', authMiddleware, adminMiddleware, (req, res) => {
    const { username } = req.params;

    let users = JSON.parse(fs.readFileSync(usersFile));

    // Only the superadmin can promote users
    if (!req.isSuperadmin) {
        return res.status(403).json({ message: 'Only the superadmin can promote users to admin' });
    }

    // Find the user to be promoted
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
        return res.status(400).json({ message: `${username} is already an admin` });
    }

    // Promote the user to admin
    user.isAdmin = true;
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({ message: `${username} has been promoted to admin` });
});


// View Profile
router.get('/:username', authMiddleware, (req, res) => {
    const { username } = req.params;
    const { userId } = req.user;

    const users = JSON.parse(fs.readFileSync(usersFile));
    const posts = JSON.parse(fs.readFileSync('./data/posts.json')); // Assuming posts are stored here

    // Find the logged-in user and the target user
    const loggedInUser = users.find(u => u.id === userId);
    const targetUser = users.find(u => u.username === username);

    if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if the logged-in user follows the target user
    if (!loggedInUser.following.includes(username)) {
        return res.status(403).json({ message: 'You must follow this user to view their profile' });
    }

    // Filter posts by the target user's ID
    const userPosts = posts.filter(post => post.userId === targetUser.id);

    // Return the profile data and posts
    res.json({
        username: targetUser.username,
        bio: targetUser.bio || '',
        followersCount: targetUser.followers.length,
        followingCount: targetUser.following.length,
        posts: userPosts,
    });
});


// View Profile
// router.get('/:username', authMiddleware, (req, res) => {
//     const { username } = req.params;
//     const users = JSON.parse(fs.readFileSync(usersFile));
//     const user = users.find(u => u.username == username);
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
// });

// Update bio
router.patch('/bio', authMiddleware, (req, res) => {
    const { userId } = req.user;
    const { bio } = req.body;

    let users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.find(u => u.id === userId);
    user.bio = bio;
    fs.writeFileSync(usersFile, JSON.stringify(users));
    res.json({ message: 'Bio updated' });
});

// Follow a user
router.post('/follow/:username', authMiddleware, (req, res) => {
    const { userId } = req.user; // Get the authenticated user's ID
    const { username } = req.params; // Get the username to follow

    let users = JSON.parse(fs.readFileSync(usersFile));

    // Find the authenticated user and the user to follow
    const user = users.find(u => u.id === userId);
    const followUser = users.find(u => u.username === username);

    // Check if the user to follow exists
    if (!followUser) {
        return res.status(404).json({ message: 'User to follow not found' });
    }

    // Check if the authenticated user is trying to follow themselves
    if (followUser.id === userId) {
        return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if the authenticated user is already following the target user
    if (followUser.followers.includes(user.username)) {
        return res.status(400).json({ message: 'You are already following this user' });
    }

    // Add the authenticated user's username to the target user's followers list
    followUser.followers.push(user.username);

    // Add the target user's username to the authenticated user's following list
    user.following.push(followUser.username);

    // Update follower and following counts
    followUser.followersCount = followUser.followers.length;
    user.followingCount = user.following.length;

    // Save the updated data back to the file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); // Pretty-print for readability

    res.json({ message: `You are now following ${username}` });
});

// Unfollow a user
router.post('/unfollow/:username', authMiddleware, (req, res) => {
    const { userId } = req.user; // Get the authenticated user's ID
    const { username } = req.params; // Get the username to unfollow

    let users = JSON.parse(fs.readFileSync(usersFile));

    // Find the authenticated user and the user to unfollow
    const user = users.find(u => u.id === userId);
    const followUser = users.find(u => u.username === username);

    // Check if the user to unfollow exists
    if (!followUser) {
        return res.status(404).json({ message: 'User to unfollow not found' });
    }

    // Check if the authenticated user is actually following the target user
    if (!followUser.followers.includes(user.username)) {
        return res.status(400).json({ message: 'You are not following this user' });
    }

    // Remove the authenticated user's username from the target user's followers list
    followUser.followers = followUser.followers.filter(name => name !== user.username);

    // Remove the target user's username from the authenticated user's following list
    user.following = user.following.filter(name => name !== followUser.username);

    // Save the updated data back to the file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); // Pretty-print for readability

    res.json({ message: `You have unfollowed ${username}` });
});


module.exports = router;

