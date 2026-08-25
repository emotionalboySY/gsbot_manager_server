/**
 * 확률·시뮬레이션 봇 전송단.
 *
 * HTTP 바인딩만 한다 — 쿼리를 읽어 services/probability.js 에 넘기고,
 * 돌아온 결과를 presenters/probability.js 로 텍스트로 옮겨 봇 응답 형식에 담는다.
 * 검증도 계산도 문구도 여기 없다. 메이플링용 전송단은 같은 서비스를 불러
 * 텍스트 대신 JSON 을 내보내면 된다.
 */
const express = require('express');
const router = express.Router();

const time = require('../utils/time.js');
const json = require('../utils/json.js');
const probability = require('../services/probability.js');
const present = require('../presenters/probability.js');

/** 서비스 결과 → 봇 응답. 실패는 마크다운 없이 평문으로만 나간다. */
function reply(res, data, render) {
    if (!data.ok) {
        return res.status(200).json(json.failure(data.message));
    }
    const { plain, markdown } = render(data);
    return res.status(200).json(json.successWithMarkdown(plain, markdown));
}

// 게임 주문서 시뮬레이션. 이름이나 번호를 생략하면 전체 목록을 낸다.
router.get('/orderSheet', (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const iterationRaw = req.query.iteration;

    console.log(`${time.getNowDateTime()} - 주문서(${query || '목록'}, ${iterationRaw || 1})`);

    if (!query) {
        return reply(res, probability.orderSheetList(), present.orderSheetList);
    }
    return reply(res, probability.orderSheet(query, iterationRaw), present.orderSheetResult);
});

// 반지 연마 시뮬레이션. 성공하면 반지가 올라가므로 성공하는 순간 멈춘다.
router.get('/ringPolish', (req, res) => {
    console.log(`${time.getNowDateTime()} - 연마석(${req.query.level}, ${req.query.stones}, ${req.query.attempts})`);

    return reply(
        res,
        probability.ringPolish(req.query.level, req.query.stones, req.query.attempts),
        present.ringPolishResult
    );
});

// 캐시샵 확률형 아이템 5종. 확률은 넥슨 공시 페이지에서 실시간으로 읽어온다.
// 5개 라우트가 URL·라벨·단가만 다른 동일 구조였다.
for (const key of probability.CASH_BOX_KEYS) {
    router.get(`/${key}`, async (req, res) => {
        console.log(`${time.getNowDateTime()} - ${probability.CASH_BOXES[key].label}(${req.query.iteration})`);

        return reply(res, await probability.cashBox(key, req.query.iteration), present.cashBoxResult);
    });
}

module.exports = router;
