/**
 * 강화 시뮬레이션 봇 전송단.
 *
 * 쿼리를 services/enforcements.js 에 넘기고, 결과를 presenters/enforcements.js
 * 로 텍스트로 옮겨 봇 응답 형식에 담는다. 확률표도 검증도 여기 없다.
 */
const express = require('express');
const router = express.Router();

const time = require('../utils/time.js');
const json = require('../utils/json.js');
const enforcements = require('../services/enforcements.js');
const present = require('../presenters/enforcements.js');

/**
 * 봇 응답 형식.
 * 성공·실패 모두 200 에 json.success 로 나간다 — 봇이 오래전부터 이 형식을
 * 읽고 있어 유지한다. 성패는 본문 첫 줄로 구분된다.
 */
function reply(res, data, renderResult, renderFailure) {
    const head = `명령어 실행 결과: ${data.ok ? '성공' : '실패'}`;
    const content = data.ok ? renderResult(data) : renderFailure(data);
    return res.status(200).json(json.success(`${head}\n\n${content}`));
}

// 타일런트(슈페리얼) 강화 시뮬레이션
router.get('/superial', (req, res) => {
    const { start, goal, isStarCatch } = req.query;
    console.log(`${time.getNowDateTime()} - 스타포스시뮬(슈페리얼, ${start}, ${goal}, ${isStarCatch})`);

    return reply(
        res,
        enforcements.superial(start, goal, isStarCatch),
        present.superialResult,
        present.superialFailure
    );
});

// 스타포스 강화 시뮬레이션
router.get('/starForce', (req, res) => {
    const { itemLev, startForce, goalForce, isStarCatch, isEvent, isBreakShield } = req.query;
    console.log(`${time.getNowDateTime()} - 스타포스시뮬(${itemLev}, ${startForce}, ${goalForce}, ${isStarCatch}, ${isEvent}, ${isBreakShield})`);

    return reply(
        res,
        enforcements.starForce(itemLev, startForce, goalForce, isStarCatch, isEvent, isBreakShield),
        present.starForceResult,
        present.starForceFailure
    );
});

module.exports = router;
