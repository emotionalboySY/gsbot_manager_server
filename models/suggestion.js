const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    chatRoomName: {
        type: String,
        required: true,
    },
    talkProfileName: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
