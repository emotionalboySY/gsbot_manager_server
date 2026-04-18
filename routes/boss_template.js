const express = require('express');
const router = express.Router();
const BossMessageTemplate = require('../models/boss_message_template');
const Boss = require('../models/boss');
const {
    DEFAULT_TEMPLATE,
    RESERVED_KEYWORDS,
    renderBossMessage
} = require('../utils/boss_message');

async function getOrCreateTemplate() {
    let doc = await BossMessageTemplate.findOne({ key: 'default' });
    if (!doc) {
        doc = await BossMessageTemplate.create({ key: 'default', template: DEFAULT_TEMPLATE });
    }
    return doc;
}

// 템플릿 조회
router.get('/', async (req, res) => {
    try {
        const doc = await getOrCreateTemplate();
        res.json({
            template: doc.template,
            defaultTemplate: DEFAULT_TEMPLATE,
            reservedKeywords: RESERVED_KEYWORDS,
            updatedAt: doc.updatedAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 템플릿 저장
router.put('/', async (req, res) => {
    try {
        const { template } = req.body;
        if (typeof template !== 'string') {
            return res.status(400).json({ error: '템플릿(template) 필드는 문자열이어야 합니다.' });
        }
        const doc = await BossMessageTemplate.findOneAndUpdate(
            { key: 'default' },
            { template },
            { new: true, upsert: true, runValidators: true }
        );
        res.json({ template: doc.template, updatedAt: doc.updatedAt });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 기본 템플릿으로 초기화
router.post('/reset', async (req, res) => {
    try {
        const doc = await BossMessageTemplate.findOneAndUpdate(
            { key: 'default' },
            { template: DEFAULT_TEMPLATE },
            { new: true, upsert: true }
        );
        res.json({ template: doc.template, updatedAt: doc.updatedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 미리보기: 임의 템플릿 + 보스/난이도 조합으로 렌더링
router.post('/preview', async (req, res) => {
    try {
        const { template, bossId, difficulty } = req.body;
        if (typeof template !== 'string') {
            return res.status(400).json({ error: '템플릿(template) 필드는 문자열이어야 합니다.' });
        }
        if (!bossId) {
            return res.status(400).json({ error: '미리보기에 사용할 보스를 선택해주세요.' });
        }

        const boss = await Boss.findById(bossId);
        if (!boss) return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });

        const targetDiff = difficulty || boss.availableDifficulties[0];
        const diffData = boss.difficulties.get(targetDiff);
        if (!diffData) {
            return res.status(404).json({
                error: `${boss.name}에는 해당 난이도(${targetDiff})가 없습니다.`,
                availableDifficulties: boss.availableDifficulties
            });
        }

        const displayDiff = targetDiff === '노말' ? '노멀' : targetDiff;
        const rendered = renderBossMessage(template, boss.name, boss.entryLevel, displayDiff, diffData);
        res.json({ rendered, difficulty: targetDiff, displayDifficulty: displayDiff });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
