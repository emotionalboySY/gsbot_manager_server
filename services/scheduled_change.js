// 정기 메시지 변경 예약 적용
//
// 따로 도는 작업이 없다. 목록을 읽는 쪽(봇의 /all, 백오피스의 /daily·/weekly)이
// 먼저 여기를 불러 때가 된 예약을 본문에 반영한 뒤 읽는다. 같은 예약을 두
// 요청이 동시에 적용해도 결과는 같다 — 마지막 예약의 본문으로 끝난다.
//
// 봇은 하루 한 번(00:10 KST) 받아 가므로 예약 시각에 다시 받아 가도록 /all 의
// 항목마다 가장 이른 예약 시각(changeAt)을 실어 준다.

const MAX_PENDING = 20;

// at 이 now 이하인 예약을 본문에 반영하고 지운다. 여러 개면 at 순으로 마지막 것이 남는다
async function applyDueChanges(Model, now = new Date()) {
    const docs = await Model.find({ 'scheduledChanges.at': { $lte: now } });
    let applied = 0;
    for (const doc of docs) {
        const due = doc.scheduledChanges
            .filter((c) => c.at <= now)
            .sort((a, b) => a.at - b.at);
        if (due.length === 0) continue;
        doc.message = due[due.length - 1].message;
        doc.scheduledChanges = doc.scheduledChanges.filter((c) => c.at > now);
        await doc.save();
        applied += 1;
    }
    return applied;
}

// 봇에 주는 모양 — 예약 본문은 빼고, 가장 이른 예약 시각만 changeAt 으로
function forBot(items) {
    return items.map(({ scheduledChanges, ...rest }) => {
        const pending = (scheduledChanges || []).map((c) => c.at).sort((a, b) => a - b);
        return pending.length > 0 ? { ...rest, changeAt: pending[0] } : rest;
    });
}

// 예약 추가. 문제가 있으면 { error } 를 돌려준다
async function addScheduledChange(Model, id, { at, message }, now = new Date()) {
    const when = at ? new Date(at) : null;
    if (!when || Number.isNaN(when.getTime())) return { error: '시각이 올바르지 않습니다.' };
    if (when <= now) return { error: '지난 시각입니다.' };
    const body = typeof message === 'string' ? message.trim() : '';
    if (!body) return { error: '메시지를 입력해 주세요.' };

    const doc = await Model.findById(id);
    if (!doc) return { error: '해당 알림을 찾을 수 없습니다.', status: 404 };
    if (doc.scheduledChanges.length >= MAX_PENDING) {
        return { error: `예약은 ${MAX_PENDING}개까지입니다.` };
    }
    doc.scheduledChanges.push({ at: when, message: body });
    doc.scheduledChanges.sort((a, b) => a.at - b.at);
    await doc.save();
    return { doc };
}

async function removeScheduledChange(Model, id, changeId) {
    const doc = await Model.findById(id);
    if (!doc) return { error: '해당 알림을 찾을 수 없습니다.', status: 404 };
    const change = doc.scheduledChanges.id(changeId);
    if (!change) return { error: '해당 예약을 찾을 수 없습니다.', status: 404 };
    change.deleteOne();
    await doc.save();
    return { doc };
}

module.exports = { applyDueChanges, forBot, addScheduledChange, removeScheduledChange };
