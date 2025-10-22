const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

class FCMService {
    /**
     * 단일 기기에 알림 전송
     */
    static async sendToDevice(token, title, body, data = {}) {
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: data,
            token: token,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'gsbot_notification_channel',
                    sound: 'default'
                }
            }
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('✅ 알림 전송 성공:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ 알림 전송 실패:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 여러 기기에 알림 전송
     */
    static async sendToMultipleDevices(tokens, title, body, data = {}) {
        if (!tokens || tokens.length === 0) {
            return { success: false, error: '토큰이 없습니다' };
        }

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: data,
            tokens: tokens,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'gsbot_notification_channel',
                    sound: 'default'
                }
            }
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`✅ ${response.successCount}/${tokens.length}개 알림 전송 성공`);

            // 실패한 토큰 로그
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`❌ 토큰 ${idx} 전송 실패:`, resp.error);
                    }
                });
            }

            return { success: true, response };
        } catch (error) {
            console.error('❌ 알림 전송 실패:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 토픽 구독
     */
    static async subscribeToTopic(tokens, topic) {
        try {
            const response = await admin.messaging().subscribeToTopic(tokens, topic);
            console.log('✅ 토픽 구독 성공:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ 토픽 구독 실패:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 토픽에 알림 전송
     */
    static async sendToTopic(topic, title, body, data = {}) {
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: data,
            topic: topic,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'gsbot_notification_channel',
                    sound: 'default'
                }
            }
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('✅ 토픽 알림 전송 성공:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ 토픽 알림 전송 실패:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = FCMService;