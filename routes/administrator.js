const express = require('express');
const router = express.Router();

const json = require('../utils/json.js');
const time = require('../utils/time.js');
const Suggestion = require('../models/suggestion.js');

/** 목록 표시용 날짜. utils/time 에는 임의 Date 를 받는 포맷터가 없어 여기서 만든다. */
function formatDate(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 사용자가 "/건의 [내용]" 으로 보낸 건의를 저장한다.
// 봇은 저장 성공 여부와 무관하게 관리자에게 내용을 따로 전달하므로,
// 여기서는 유실 방지를 위한 기록이 목적이다.
router.post("/suggestion", async (req, res) => {
    const { chatRoomName, talkProfileName, content, clientKey } = req.body || {};

    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) {
        return res.status(200).json(json.failure("건의 내용을 함께 입력해 주세요.\n\n/건의 [건의내용]"));
    }
    if (!chatRoomName || !talkProfileName) {
        return res.status(200).json(json.failure("건의 접수에 필요한 정보가 누락되었습니다."));
    }

    console.log(`${time.getNowDateTime()} - 건의(${chatRoomName} / ${talkProfileName})`);

    const key = typeof clientKey === 'string' ? clientKey.trim() : '';

    try {
        // 키가 있으면 그대로 싣는다. 중복은 clientKey 의 unique 인덱스가
        // 막고 아래 catch 가 E11000 을 성공으로 되돌린다. findOneAndUpdate 의
        // upsert 로도 되지만 신규/기존 판별에 쓰는 rawResult 가 Mongoose 9 에서
        // 빠져 버전을 타므로, 어느 버전에서나 같게 도는 이쪽을 쓴다.
        const doc = { chatRoomName, talkProfileName, content: trimmed };
        if (key) doc.clientKey = key;

        await new Suggestion(doc).save();

        return res.status(200).json(json.success("건의가 접수되었습니다. 검토 후 반영하겠습니다. 감사합니다."));
    } catch (e) {
        // 같은 clientKey 가 다시 들어오면 unique 인덱스가 E11000 으로 막는다.
        // 그건 이미 저장돼 있다는 뜻이라 실패로 돌려주면 안 된다 — 봇이 또
        // 재시도하고 사용자는 접수된 건의를 실패로 본다.
        if (e && e.code === 11000) {
            console.log(`${time.getNowDateTime()} - 건의 중복 요청 흡수(${key})`);
            return res.status(200).json(json.success("건의가 접수되었습니다. 검토 후 반영하겠습니다. 감사합니다."));
        }
        console.error(`건의 저장 실패: ${e.message}`);
        return res.status(200).json(json.failure("건의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
    }
});

// 접수된 건의 조회. 봇에서 관리자만 호출하도록 막아두었지만,
// 이 라우트 자체에는 인증이 없다(이 서버의 다른 라우트와 동일한 상태).
// 건의는 사용자가 자발적으로 보낸 기능 제안이라 민감도가 낮다고 보고 우선 이대로 둔다.
router.get("/suggestion", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    try {
        const items = await Suggestion.find().sort({ createdAt: -1 }).limit(limit).lean();
        if (items.length === 0) {
            return res.status(200).json(json.success("접수된 건의가 없습니다."));
        }

        let message = `[건의 목록] 최근 ${items.length}건`;
        items.forEach((item, i) => {
            message += `\n\n${i + 1}. ${formatDate(item.createdAt)}`;
            message += `\n${item.chatRoomName} / ${item.talkProfileName}`;
            message += `\n${item.content}`;
            message += `\nid: ${item._id}`;
        });
        return res.status(200).json(json.success(message));
    } catch (e) {
        console.error(`건의 조회 실패: ${e.message}`);
        return res.status(200).json(json.failure("건의 목록을 불러오지 못했습니다."));
    }
});

// id 를 알아야만 지울 수 있다. 목록 조회를 거치지 않으면 대상을 특정할 수 없다.
router.post("/suggestion/delete", async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
        return res.status(200).json(json.failure("삭제할 건의의 id 를 입력해 주세요."));
    }

    try {
        const deleted = await Suggestion.findByIdAndDelete(String(id).trim());
        if (!deleted) {
            return res.status(200).json(json.failure(`해당 id 의 건의를 찾을 수 없습니다: ${id}`));
        }
        console.log(`${time.getNowDateTime()} - 건의 삭제(${id})`);
        return res.status(200).json(json.success(`건의를 삭제했습니다.\n${deleted.content}`));
    } catch (e) {
        console.error(`건의 삭제 실패: ${e.message}`);
        return res.status(200).json(json.failure("건의 삭제 중 오류가 발생했습니다."));
    }
});

module.exports = router;
