const express = require('express');
const router = express.Router();
const ExactTimeMessage = require('../models/exact_time_message');
const WeeklyMessage = require('../models/weekly_message');
const DailyMessage = require('../models/daily_message');

// ============================================
// 통합 조회 API (GraalJS에서 사용)
// ============================================

// 모든 활성 알림 조회 (정확한 시간 + 요일 시간)
router.get('/all', async (req, res) => {
    try {
        const exactTimeMessages = await ExactTimeMessage.find({ isActive: true })
            .select('-__v -createdAt -updatedAt -isActive')
            .lean();

        const weeklyMessages = await WeeklyMessage.find({ isActive: true })
            .select('-__v -createdAt -updatedAt -isActive')
            .lean();

        const dailyMessages = await DailyMessage.find({ isActive: true })
            .select('-__v -createdAt -updatedAt -isActive')
            .lean();

        // 세 배열을 합쳐서 반환
        const allMessages = [...exactTimeMessages, ...weeklyMessages, ...dailyMessages];

        res.json(allMessages);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '알림 조회 실패',
            error: error.message
        });
    }
});

// ============================================
// 정확한 시간 메시지 CRUD
// ============================================

// 전체 조회
router.get('/exact', async (req, res) => {
    try {
        const messages = await ExactTimeMessage.find().sort({ year: 1, month: 1, day: 1, hour: 1, minute: 1 });
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 단일 조회
router.get('/exact/:id', async (req, res) => {
    try {
        const message = await ExactTimeMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 생성
router.post('/exact', async (req, res) => {
    try {
        const { year, month, day, hour, minute, message, isActive } = req.body;

        // 필수 필드 검증
        if (!year || !month || !day || hour === undefined || minute === undefined || !message) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const newMessage = new ExactTimeMessage({
            year,
            month,
            day,
            hour,
            minute,
            message,
            isActive: isActive !== undefined ? isActive : true
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: '알림이 생성되었습니다.',
            data: newMessage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '알림 생성 실패',
            error: error.message
        });
    }
});

// 수정
router.put('/exact/:id', async (req, res) => {
    try {
        const { year, month, day, hour, minute, message, isActive } = req.body;

        const updatedMessage = await ExactTimeMessage.findByIdAndUpdate(
            req.params.id,
            {
                year,
                month,
                day,
                hour,
                minute,
                message,
                isActive,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림이 수정되었습니다.',
            data: updatedMessage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '알림 수정 실패',
            error: error.message
        });
    }
});

// 삭제
router.delete('/exact/:id', async (req, res) => {
    try {
        const deletedMessage = await ExactTimeMessage.findByIdAndDelete(req.params.id);

        if (!deletedMessage) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림이 삭제되었습니다.',
            data: deletedMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '알림 삭제 실패',
            error: error.message
        });
    }
});

// ============================================
// 요일 시간 메시지 CRUD
// ============================================

// 전체 조회
router.get('/weekly', async (req, res) => {
    try {
        const messages = await WeeklyMessage.find().sort({ dayOfWeek: 1, hour: 1, minute: 1 });
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 단일 조회
router.get('/weekly/:id', async (req, res) => {
    try {
        const message = await WeeklyMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 특정 요일의 알림 조회
router.get('/weekly/day/:dayOfWeek', async (req, res) => {
    try {
        const messages = await WeeklyMessage.find({
            dayOfWeek: req.params.dayOfWeek
        }).sort({ hour: 1, minute: 1 });

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 생성
router.post('/weekly', async (req, res) => {
    try {
        const { dayOfWeek, hour, minute, message, isActive } = req.body;

        // 필수 필드 검증
        if (!dayOfWeek || hour === undefined || minute === undefined || !message) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const newMessage = new WeeklyMessage({
            dayOfWeek,
            hour,
            minute,
            message,
            isActive: isActive !== undefined ? isActive : true
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: '알림이 생성되었습니다.',
            data: newMessage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '알림 생성 실패',
            error: error.message
        });
    }
});

// 수정
router.put('/weekly/:id', async (req, res) => {
    try {
        const { dayOfWeek, hour, minute, message, isActive } = req.body;

        const updatedMessage = await WeeklyMessage.findByIdAndUpdate(
            req.params.id,
            {
                dayOfWeek,
                hour,
                minute,
                message,
                isActive,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림이 수정되었습니다.',
            data: updatedMessage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '알림 수정 실패',
            error: error.message
        });
    }
});

// 삭제
router.delete('/weekly/:id', async (req, res) => {
    try {
        const deletedMessage = await WeeklyMessage.findByIdAndDelete(req.params.id);

        if (!deletedMessage) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림이 삭제되었습니다.',
            data: deletedMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '알림 삭제 실패',
            error: error.message
        });
    }
});

// ============================================
// 매일 시간 메시지 CRUD
// ============================================

// 전체 조회
router.get('/daily', async (req, res) => {
    try {
        const messages = await DailyMessage.find().sort({ hour: 1, minute: 1 });
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 단일 조회
router.get('/daily/:id', async (req, res) => {
    try {
        const message = await DailyMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '조회 실패',
            error: error.message
        });
    }
});

// 생성
router.post('/daily', async (req, res) => {
    try {
        const { hour, minute, message, isActive } = req.body;

        // 필수 필드 검증
        if (hour === undefined || minute === undefined || !message) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const newMessage = new DailyMessage({
            hour,
            minute,
            message,
            isActive: isActive !== undefined ? isActive : true
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: '알림이 생성되었습니다.',
            data: newMessage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '알림 생성 실패',
            error: error.message
        });
    }
});

// 수정
router.put('/daily/:id', async (req, res) => {
    try {
        const { hour, minute, message, isActive } = req.body;

        const updatedMessage = await DailyMessage.findByIdAndUpdate(
            req.params.id,
            {
                hour,
                minute,
                message,
                isActive,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림이 수정되었습니다.',
            data: updatedMessage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '알림 수정 실패',
            error: error.message
        });
    }
});

// 삭제
router.delete('/daily/:id', async (req, res) => {
    try {
        const deletedMessage = await DailyMessage.findByIdAndDelete(req.params.id);

        if (!deletedMessage) {
            return res.status(404).json({
                success: false,
                message: '해당 알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림이 삭제되었습니다.',
            data: deletedMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '알림 삭제 실패',
            error: error.message
        });
    }
});

module.exports = router;