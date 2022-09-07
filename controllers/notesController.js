const Note = require('../models/Note');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all notes
// @route   GET /notes
// @access  Private
const getAllNotes = asyncHandler(async (req, res) => {
    //get all notes from db
    const notes = await Note.find().lean()

    //if no notes found
    if (!notes?.length) {
        return res.status(400).json({message: 'No notes found'})
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async note => {
        const user = await User.findById(note.user).lean().exec()
        return {...note, username: user.username}
    }))

    res.json(notesWithUser);
});

// @desc    Create New Note
// @route   POST /notes
// @access  Private
const createNewNote = asyncHandler(async (req, res) => {
    const {user, title, text} = req.body;

    //confirm data
    if (!user || !title || !text) {
        return res.status(400).json({message: 'Please enter all fields'})
    }

    //check for duplicate title
    const duplicate = await Note.findOne({title}).lean().exec();

    if (duplicate) {
        return res.status(409).json({message: 'Note title already exists'})
    }

    //check if user exists
    const userExists = await User.findById(user).lean().exec();

    if (!userExists) {
        return res.status(400).json({message: 'User does not exist'})
    }

    //create and store new note
    const note = await Note.create({user, title, text});

    if (note) {
        res.status(201).json({message: `Note ${title} created`})
    } else {
        res.status(400).json({message: 'Invalid note data'})
    }

    

});

// @desc    Update Note
// @route   PATCH /notes
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
    const {id, title, text, completed} = req.body

    //confirm data
    if (!id || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({message: 'All fields are required'})
    }

    // confirm note exists to update
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({message: 'Note does not exist'})
    }

    // check for duplicate title
    const duplicate = await Note.findOne({title}).lean().exec();

    // Allow renaming of the original note
    if (duplicate && duplicate._id.toString() !== id) {
        return res.status(409).json({message: 'Note title already exists'})
    }

    // update note
    const updatedNote = await Note.findByIdAndUpdate(id, {title, text, completed}, {new: true}).lean().exec()

    if (updatedNote) {
        return res.status(200).json({message: 'Note updated', updatedNote})
    } else {
        return res.status(400).json({message: 'Invalid note data'})
    }
})

// @desc    Delete Note
// @route   DELETE /notes
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
    const {id} = req.body

    // confirm data
    if (!id) {
        return res.status(400).json({message: 'Note ID required'})
    }

    // confirm note exists to delete
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({message: 'Note does not exist'})
    }

    const result = await note.deleteOne()

    const reply = `Note '${result.title}' with ID ${result._id} deleted`

    res.json({message: reply})
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}