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
    },
    // 봇이 요청마다 만들어 보내는 키. 응답만 유실됐을 때 봇이 같은 키로 다시
    // 보내면 새 문서를 만들지 않고 기존 것을 그대로 돌려준다.
    //
    // sparse 가 필요하다 — 이 필드가 없는 기존 문서들이 전부 null 로 잡혀
    // unique 에 걸린다. sparse 면 값이 있는 문서끼리만 유일성을 본다.
    clientKey: {
        type: String,
        index: { unique: true, sparse: true },
    }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
