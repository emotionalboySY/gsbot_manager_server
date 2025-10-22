const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: false,
        default: null
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    device_info: {
        type: Object,
        required: false,
        default: {}
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true,
    collection: 'fcm_tokens'
});

// upsert 메서드 추가
fcmTokenSchema.statics.upsert = async function({ token, user_id, device_info, is_active = true }) {
    const existingToken = await this.findOne({ token });

    if (existingToken) {
        // 업데이트
        existingToken.user_id = user_id;
        existingToken.device_info = device_info;
        existingToken.is_active = is_active;
        await existingToken.save();
        return [existingToken, false];
    } else {
        // 새로 생성
        const newToken = await this.create({
            token,
            user_id,
            device_info,
            is_active
        });
        return [newToken, true];
    }
};

const FCMToken = mongoose.model('FCMToken', fcmTokenSchema);

module.exports = FCMToken;