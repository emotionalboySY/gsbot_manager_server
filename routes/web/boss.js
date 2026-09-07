/**
 * 메이플링용 보스 정보 전송단.
 *
 * 보스 원본은 이 서버의 Mongo(bosses)다. 백오피스(메이플링 /admin/bot)가
 * /api/boss* 로 고치고, 웹 화면은 여기서 읽기만 한다. 봇 응답의 _id·__v 를
 * 걷어내고, 난이도 Map 은 availableDifficulties 순서의 배열로 편다 — 웹은
 * 순서가 있는 표로 그리기 때문이다. 난이도 이름은 DB 키('노말') 그대로 준다.
 * 표시 이름은 받는 쪽이 정한다.
 */
const express = require('express');
const router = express.Router();

const Boss = require('../../models/boss');
const time = require('../../utils/time.js');

// 백오피스에서 고친 값이 10분 안에는 웹에 닿아야 한다. 확률표(1시간)보다 짧다.
const CACHE = 'public, max-age=600';

function toWebPhase(phase) {
    return {
        phaseNumber: phase.phaseNumber,
        hp: phase.hp,
        shield: phase.shield ?? null,
        monsterLevel: phase.monsterLevel ?? null,
        authenticForce: phase.authenticForce ?? null,
        description: phase.description ?? null
    };
}

function toWebDifficulty(name, diff) {
    const rewards = diff.rewards || {};
    return {
        name,
        monsterLevel: diff.monsterLevel,
        defenseRate: diff.defenseRate,
        arcaneForce: diff.arcaneForce ?? null,
        authenticForce: diff.authenticForce ?? null,
        phases: (diff.phases || []).map(toWebPhase),
        rewards: {
            crystalPrice: rewards.crystalPrice ?? 0,
            solErda: rewards.solErda ?? null,
            items: rewards.items || [],
            specialItems: rewards.specialItems || {},
            liberationMaterials: rewards.liberationMaterials || {}
        }
    };
}

function toWebBoss(doc) {
    const map = doc.difficulties || {};
    const order = Array.isArray(doc.availableDifficulties) ? doc.availableDifficulties : [];
    return {
        id: String(doc._id),
        name: doc.name,
        aliases: doc.aliases || [],
        entryLevel: doc.entryLevel,
        imageName: doc.imageName ?? null,
        difficulties: order.filter((name) => map[name]).map((name) => toWebDifficulty(name, map[name])),
        updatedAt: doc.updatedAt ?? null
    };
}

// 보스 전체. 입장 레벨 순. 웹은 15종 남짓을 한 번에 받아 화면에서 고른다.
router.get('/', async (req, res) => {
    try {
        const bosses = await Boss.find().sort({ entryLevel: 1 }).lean();
        res.set('Cache-Control', CACHE);
        return res.status(200).json({ bosses: bosses.map(toWebBoss) });
    } catch (e) {
        console.error(`${time.getNowDateTime()} - [web] boss 목록 실패: ${e}`);
        return res.status(500).json({ message: '보스 정보를 불러오지 못했습니다.' });
    }
});

module.exports = router;
module.exports.toWebBoss = toWebBoss;
