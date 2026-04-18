const mongoose = require('mongoose');

const bossMessageTemplateSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'default'
    },
    template: {
        type: String,
        required: true,
        default: ''
    }
}, {
    timestamps: true,
    collection: 'boss_message_templates'
});

module.exports = mongoose.model('BossMessageTemplate', bossMessageTemplateSchema);
