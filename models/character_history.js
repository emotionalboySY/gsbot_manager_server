const mongoose = require('mongoose');

const characterHistorySchema = new mongoose.Schema({
    characterName: {
        type: String,
        required: true,
        unique: true,
    },
    levHistory: [{
        lev: Number,
        date: Date,
    }],
    updatedDate: {
        type: Date,
        required: true,
    }
});

module.exports = mongoose.model('CharacterHistory', characterHistorySchema);