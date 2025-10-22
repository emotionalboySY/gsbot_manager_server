const mongoose = require('mongoose');

const mainCharacterSchema = new mongoose.Schema({
    chatRoomName: {
        type: String,
        required: true,
    },
    talkProfileName: {
        type: String,
        required: true,
    },
    characterName: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('MainCharacter', mainCharacterSchema);