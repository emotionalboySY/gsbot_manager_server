const express = require('express');
const router = express.Router();
const FCMToken = require('../models/fcm_token');
const FCMService = require('../services/fcm_service');

/**
 * FCM 토큰 등록/업데이트
 * POST /api/fcm/register
 */
router.post('/register', async (req, res) => {
    try {
        const { token, user_id, device_info } = req.body;

        if (!token) {
            return res.status(400).json({ error: '토큰이 필요합니다' });
        }

        console.log('📱 FCM 토큰 등록 요청:', token.substring(0, 20) + '...');

        if (device_info && device_info.platform) {
            const deleteResult = await FCMToken.deleteMany({
                token: { $ne: token },
                'device_info_platform': device_info.plahform
            });

            if (deleteResult.deletedCount > 0) {
                console.log(`🗑️ ${deleteResult.deletedCount}개의 구 토큰 삭제됨`);
            }
        }

        // upsert 메서드 사용
        const [fcmToken, created] = await FCMToken.upsert({
            token,
            user_id,
            device_info,
            is_active: true
        });

        console.log(created ? '✅ 새 토큰 등록' : '✅ 토큰 업데이트');

        res.json({
            success: true,
            message: created ? '토큰 등록 완료' : '토큰 업데이트 완료',
            token_id: fcmToken._id
        });
    } catch (error) {
        console.error('❌ 토큰 등록 실패:', error);
        res.status(500).json({ error: '토큰 등록 실패', details: error.message });
    }
});

/**
 * 테스트 알림 전송 (단일 토큰)
 * POST /api/fcm/test
 */
router.post('/test', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: '토큰이 필요합니다' });
        }

        console.log('🔔 테스트 알림 전송:', token.substring(0, 20) + '...');

        const result = await FCMService.sendToDevice(
            token,
            '테스트 알림',
            '이것은 테스트 알림입니다',
            {
                type: 'test',
                timestamp: new Date().toISOString()
            }
        );

        if(!result.success && result.error && (result.error.includes('not-registered') || result.error.includes('invalid-registration-token'))) {
            await FCMToken.deleteOne({ token });
            console.log('🗑️ 무효한 토큰 삭제됨');
        }

        res.json(result);
    } catch (error) {
        console.error('❌ 알림 전송 실패:', error);
        res.status(500).json({ error: '알림 전송 실패', details: error.message });
    }
});

/**
 * 모든 활성 기기에 알림 전송
 * POST /api/fcm/send-all
 */
router.post('/send-all', async (req, res) => {
    try {
        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: '제목과 내용이 필요합니다' });
        }

        console.log('🔔 전체 알림 전송:', title);

        // 모든 활성 토큰 가져오기
        const tokens = await FCMToken.find({ is_active: true }).select('token');

        if (tokens.length === 0) {
            return res.json({
                success: false,
                message: '등록된 토큰이 없습니다'
            });
        }

        const tokenStrings = tokens.map(t => t.token);
        console.log(`📤 ${tokenStrings.length}개 기기에 전송 중...`);

        const result = await FCMService.sendToMultipleDevices(
            tokenStrings,
            title,
            body,
            data || {}
        );

        // ✅ 개선: 무효한 토큰이 있으면 DB에서 삭제
        if (result.invalidTokens && result.invalidTokens.length > 0) {
            const deleteResult = await FCMToken.deleteMany({
                token: { $in: result.invalidTokens }
            });
            console.log(`🗑️ ${deleteResult.deletedCount}개의 무효한 토큰 DB에서 삭제됨`);
        }

        res.json(result);
    } catch (error) {
        console.error('❌ 알림 전송 실패:', error);
        res.status(500).json({ error: '알림 전송 실패', details: error.message });
    }
});

/**
 * 등록된 토큰 목록 조회
 * GET /api/fcm/tokens
 */
router.get('/tokens', async (req, res) => {
    try {
        const tokens = await FCMToken.find({ is_active: true })
            .select('token device_info createdAt updatedAt');

        res.json({
            success: true,
            count: tokens.length,
            tokens: tokens.map(t => ({
                id: t._id,
                token: t.token.substring(0, 30) + '...',
                device_info: t.device_info,
                created_at: t.createdAt,
                updated_at: t.updatedAt
            }))
        });
    } catch (error) {
        console.error('❌ 토큰 조회 실패:', error);
        res.status(500).json({ error: '토큰 조회 실패' });
    }
});

module.exports = router;