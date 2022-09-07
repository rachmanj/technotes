const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
// const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');

// @desc    Get all users
// @route   GET /users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({message: 'No users found'})
    }
    res.json(users);
});

// @desc    Create New User
// @route   POST /users
// @access  Private
const createNewUser = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body;

    //confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'Please enter all fields'})
    }

    //check if user exists
    const duplicate = await User.findOne({username}).lean().exec();

    if (duplicate) {
        return res.status(409).json({message: 'User already exists'})
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userObject = {username, password: hashedPassword, roles};

    // create new user
    const user = await User.create(userObject);

    if (user) {
        res.status(201).json({message: `User ${username} created`})
    } else {
        res.status(400).json({message: 'Invalid user data'})
    }
})

// @desc    Update User
// @route   PATCH /users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
    const {id, username, roles, active, password} = req.body;

    //confirm data
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({message: 'All fields except password are required'})
    }

    // cek if user exist
    // const userId = mongoose.Types.ObjectId(id)
    const user = await User.findById(id).exec();
    // const user = await User.findOne({_id: ObjectId(id)});

    if (!user) {
        return res.status(400).json({message: 'User not found'})
    }

    //check duplicate
    const duplicate = await User.findOne({username}).lean().exec();

    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message: `User ${username} already exists`})
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.json({message: `User ${updatedUser.username} updated`})
})

// @desc    Delete User
// @route   DELETE /users/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.body;

    //confirm data
    if (!id) {
        return res.status(400).json({message: 'ID is required'})
    }

    const note = await Note.findOne({user: id}).lean().exec();

    if (note) {
        return res.status(400).json({message: 'User has assigned notes'})
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(404).json({message: 'User not found'})
    }

    const result = await user.deleteOne()
    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getUsers,
    createNewUser,
    updateUser,
    deleteUser
}

