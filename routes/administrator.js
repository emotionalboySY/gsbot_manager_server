const express = require('express');
const router = express.Router();

const json = require('../utils/json.js');
const time = require('../utils/time.js');
const Suggestion = require('../models/suggestion.js');

// 사용자가 "/건의 [내용]" 으로 보낸 건의를 저장한다.
// 봇은 저장 성공 여부와 무관하게 관리자에게 내용을 따로 전달하므로,
// 여기서는 유실 방지를 위한 기록이 목적이다.
router.post("/suggestion", async (req, res) => {
    const { chatRoomName, talkProfileName, content } = req.body || {};

    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) {
        return res.status(200).json(json.failure("건의 내용을 함께 입력해 주세요.\n\n/건의 [건의내용]"));
    }
    if (!chatRoomName || !talkProfileName) {
        return res.status(200).json(json.failure("건의 접수에 필요한 정보가 누락되었습니다."));
    }

    console.log(`${time.getNowDateTime()} - 건의(${chatRoomName} / ${talkProfileName})`);

    try {
        await new Suggestion({
            chatRoomName,
            talkProfileName,
            content: trimmed
        }).save();

        return res.status(200).json(json.success("건의가 접수되었습니다. 검토 후 반영하겠습니다. 감사합니다."));
    } catch (e) {
        console.error(`건의 저장 실패: ${e.message}`);
        return res.status(200).json(json.failure("건의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
    }
});

module.exports = router;
