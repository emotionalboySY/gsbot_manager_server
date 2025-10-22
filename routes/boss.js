const express = require('express');
const router = express.Router();
const Boss = require('../models/boss');

// 모든 보스 조회
router.get('/', async (req, res) => {
    try {
        const { level, difficulty, search } = req.query;
        let query = {};

        if (level) {
            query.entryLevel = { $lte: parseInt(level) };
        }

        if (difficulty) {
            query.availableDifficulties = difficulty;
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { aliases: new RegExp(search, 'i') }
            ];
        }

        const bosses = await Boss.find(query).sort({ entryLevel: 1 });
        res.json(bosses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 특정 보스 조회
router.get('/:id', async (req, res) => {
    try {
        const boss = await Boss.findById(req.params.id);
        if (!boss) {
            return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
        }
        res.json(boss);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 새 보스 생성
router.post('/', async (req, res) => {
    try {
        const boss = new Boss(req.body);
        await boss.save();
        res.status(201).json(boss);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 보스 정보 수정
router.put('/:id', async (req, res) => {
    try {
        const boss = await Boss.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!boss) {
            return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
        }
        res.json(boss);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 보스 삭제
router.delete('/:id', async (req, res) => {
    try {
        const boss = await Boss.findByIdAndDelete(req.params.id);
        if (!boss) {
            return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
        }
        res.json({ message: '보스가 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 특정 난이도 정보 조회
router.get('/:id/difficulties/:difficulty', async (req, res) => {
    try {
        const boss = await Boss.findById(req.params.id);
        if (!boss) {
            return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
        }

        const difficultyInfo = boss.getDifficulty(req.params.difficulty);
        if (!difficultyInfo) {
            return res.status(404).json({ error: '해당 난이도를 찾을 수 없습니다.' });
        }

        res.json(difficultyInfo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 특정 난이도 정보 수정
router.put('/:id/difficulties/:difficulty', async (req, res) => {
    try {
        const boss = await Boss.findById(req.params.id);
        if (!boss) {
            return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
        }

        // 난이도 정보 업데이트
        const updatedDifficulties = new Map(boss.difficulties);
        updatedDifficulties.set(req.params.difficulty, req.body);

        boss.difficulties = updatedDifficulties;
        await boss.save();

        res.json(boss);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;