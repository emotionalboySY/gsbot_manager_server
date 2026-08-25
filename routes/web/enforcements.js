/**
 * 메이플링용 강화 시뮬레이션 전송단.
 *
 * 시뮬 "결과" 가 아니라 "확률표" 를 내보낸다.
 * 시뮬은 브라우저에서 돌리는 편이 맞다 — 순수 계산이라 클라이언트에서 그대로
 * 돌아가고, t4g.small 한 대에 앱 셋과 MongoDB 가 얹혀 있어 29성 시뮬 같은
 * 반복 연산을 서버가 대신 지면 봇 응답까지 같이 느려진다.
 */
const express = require('express');
const router = express.Router();
const enforcements = require('../../services/enforcements.js');

// 배포 사이에는 바뀌지 않는 값이다. 매번 받아갈 이유가 없다.
const STATIC_CACHE = 'public, max-age=3600';

router.get('/tables', (req, res) => {
    res.set('Cache-Control', STATIC_CACHE);
    return res.status(200).json({
        starForce: {
            success: enforcements.STAR_FORCE.success,
            break: enforcements.STAR_FORCE.break,
            maxStar: enforcements.STAR_FORCE.maxStar,
            brokenTo: enforcements.STAR_FORCE.brokenTo,
            // 인덱스가 강화 단계. 비용 = 1000 + itemLev^3 * (star+1)^exponent / denominator
            costTable: enforcements.COST_TABLE,
            // 스타캐치는 성공 확률에만 곱해진다
            starCatchMultiplier: 1.05,
            events: enforcements.EVENT,
            // 파괴방지: 파괴 확률이 0 이 되는 대신 추가 비용을 낸다.
            // 추가분은 "할인 전" 기본 비용 기준이다 — 할인 이벤트와 겹쳐도
            // 할인가의 3배가 아니라 (할인가 + 기본가 x 2) 가 된다.
            breakShield: { fromStar: 15, toStar: 18, extraCostMultiplier: 2 }
        },
        tyrant: {
            success: enforcements.TYRANT.success,
            break: enforcements.TYRANT.break,
            successStarCatch: enforcements.TYRANT.successStarCatch,
            breakStarCatch: enforcements.TYRANT.breakStarCatch,
            costPerAttempt: enforcements.TYRANT.costPerAttempt,
            maxStar: enforcements.TYRANT.maxStar,
            // 연속 2회 실패하면 다음 한 번은 무조건 성공한다
            chanceTimeAfterFails: 2
        }
    });
});

module.exports = router;
