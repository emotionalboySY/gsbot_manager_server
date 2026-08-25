/**
 * 메이플링용 확률 시뮬레이션 전송단.
 *
 * 주문서·보스 반지 상자·연마석은 확률이 고정된 정적 데이터라 그대로 내보내고
 * 브라우저가 돌린다. 캐시샵만 넥슨 공시 페이지를 긁어야 해서 서버를 거친다.
 */
const express = require('express');
const router = express.Router();

const { ORDER_SHEETS, MAX_ITERATION: ORDER_SHEET_MAX, labelOf, groupNotesOf } = require('../../utils/order_sheet.js');
const { SEED_RING_BOXES } = require('../../utils/seed_ring_data.js');
const ringPolish = require('../../utils/ring_polish.js');
const cashProbability = require('../../utils/cash_probability.js');
const time = require('../../utils/time.js');

const STATIC_CACHE = 'public, max-age=3600';

// 주문서 확률 데이터. 번호는 봇의 /주문서 [번호] 와 같게 1-based 로 맞춘다.
router.get('/orderSheets', (req, res) => {
    res.set('Cache-Control', STATIC_CACHE);
    return res.status(200).json({
        maxIteration: ORDER_SHEET_MAX,
        scrolls: ORDER_SHEETS.map((scroll, i) => ({
            number: i + 1,
            category: scroll.category,
            label: labelOf(scroll),
            notes: groupNotesOf(scroll),
            ...scroll
        }))
    });
});

// 보스 반지 상자 확률 데이터
router.get('/seedRings', (req, res) => {
    res.set('Cache-Control', STATIC_CACHE);
    return res.status(200).json({ boxes: SEED_RING_BOXES });
});

// 반지 연마 확률·비용표
router.get('/ringPolish', (req, res) => {
    res.set('Cache-Control', STATIC_CACHE);
    return res.status(200).json({
        maxAttempts: ringPolish.MAX_ATTEMPTS,
        // 키가 현재 반지 레벨. 연마석 n 개를 쓰면 성공 확률과 소모 메소가 n 배가 된다.
        levels: ringPolish.POLISH_TABLE
    });
});

// 캐시샵 확률형 아이템 목록
router.get('/cash', (req, res) => {
    res.set('Cache-Control', STATIC_CACHE);
    return res.status(200).json({
        maxIteration: cashProbability.MAX_ITERATION,
        boxes: Object.entries(cashProbability.CASH_BOXES).map(([key, box]) => ({
            key,
            label: box.label,
            unitCost: box.unitCost,
            feverEvery: box.feverEvery || null,
            quantityUnit: box.quantityUnit || null
        }))
    });
});

/**
 * 캐시샵 확률표. 넥슨 공시 페이지를 긁어야 하므로 브라우저가 직접 못 가져온다
 * (CORS). 시뮬은 이 표를 받아 클라이언트에서 돌리면 된다.
 */
router.get('/cash/:box', async (req, res) => {
    const key = req.params.box;
    const box = cashProbability.CASH_BOXES[key];
    if (!box) {
        return res.status(404).json({ message: `알 수 없는 상자입니다: ${key}` });
    }

    let items;
    try {
        items = await cashProbability.fetchItems(box.url, box.cleanName);
    } catch (e) {
        console.error(`${time.getNowDateTime()} - [web] ${box.label} 확률 조회 실패: ${e.message}`);
        return res.status(502).json({
            message: `${box.label} 확률 정보를 넥슨에서 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.`
        });
    }

    if (items.length === 0) {
        return res.status(502).json({
            message: `${box.label} 확률 표를 읽지 못했습니다. 공시 페이지 구조가 바뀌었을 수 있습니다.`
        });
    }

    // 공시가 바뀔 수 있어 정적 데이터보다 짧게 잡는다. 스크래핑 자체는
    // utils/cash_probability.js 가 10분 캐시한다.
    res.set('Cache-Control', 'public, max-age=600');
    return res.status(200).json({
        key,
        label: box.label,
        unitCost: box.unitCost,
        feverEvery: box.feverEvery || null,
        quantityUnit: box.quantityUnit || null,
        maxIteration: cashProbability.MAX_ITERATION,
        source: box.url,
        // 공시 표가 반올림 표기라 합이 정확히 100% 가 아니다. 뽑기는 마지막 항목으로 보정한다.
        items
    });
});

module.exports = router;
