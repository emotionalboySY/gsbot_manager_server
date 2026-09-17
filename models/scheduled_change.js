const mongoose = require('mongoose');

// 정기 메시지(매일·매주)에 붙는 변경 예약 — at 이 지나면 본문(message)이
// 이 내용으로 바뀐다. 적용은 services/scheduled_change.js 가 목록을 읽을 때 한다.
// 정확한 시간 메시지는 한 번 나가고 끝이라 예약을 두지 않는다.
const scheduledChangeSchema = new mongoose.Schema({
    at: {
        type: Date,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
});

module.exports = scheduledChangeSchema;
