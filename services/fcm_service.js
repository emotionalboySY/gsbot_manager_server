const admin = require('firebase-admin');

// Firebase Admin 초기화 — 서비스 계정 파일은 운영 서버에만 있다(gitignore).
// 로컬에는 없으므로 그때는 FCM 만 끄고 나머지 서버는 그대로 뜬다. 예전에는
// 여기서 require 가 던져 로컬에서 서버를 아예 못 띄웠다.
let messaging = null;
try {
    const serviceAccount = require('../firebase-service-account.json');
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    messaging = admin.messaging();
} catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    console.warn('⚠️ firebase-service-account.json 이 없어 FCM 을 끕니다 (푸시 알림은 보내지 않음)');
}

const FCM_DISABLED = { success: false, error: 'FCM 미설정 (firebase-service-account.json 없음)' };

class FCMService {
    /**
     * 단일 기기에 알림 전송
     */
    static async sendToDevice(token, title, body, data = {}) {
        if (!messaging) return FCM_DISABLED;
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
            const response = await messaging.send(message);
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
        if (!messaging) return FCM_DISABLED;
        if (!tokens || tokens.length === 0) {
            return { success: false, error: '토큰이 없습니다' };
        }

        // 디버깅: 토큰 확인
        console.log('전송할 토큰 개수:', tokens.length);
        tokens.forEach((token, idx) => {
            console.log(`   [${idx}] ${token ? token.substring(0, 20) + '...' : 'null/undefined'}`);
        });

        const validTokens = tokens.filter(token => token && token.trim().length > 0);

        if(validTokens.length === 0) {
            console.error('유효한 토큰이 없습니다.');
            return {
                success: false, error: '유효한 토큰이 없습니다'
            };
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
            const response = await messaging.sendEachForMulticast(message);
            console.log(`✅ ${response.successCount}/${tokens.length}개 알림 전송 성공`);

            // 실패한 토큰 로그
            if (response.failureCount > 0) {
                const invalidTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`❌ 토큰 ${idx} 전송 실패:`, resp.error);

                        // ✅ 무효한 토큰 수집
                        if (resp.error.code === 'messaging/registration-token-not-registered' ||
                            resp.error.code === 'messaging/invalid-registration-token') {
                            invalidTokens.push(validTokens[idx]);
                        }
                    }
                });

                // ✅ 무효한 토큰이 발견되면 반환
                if (invalidTokens.length > 0) {
                    console.log('🗑️ 제거해야 할 무효한 토큰:', invalidTokens.length);
                    return {
                        success: true,
                        response,
                        invalidTokens // 호출자가 DB에서 삭제할 수 있도록
                    };
                }
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
        if (!messaging) return FCM_DISABLED;
        try {
            const response = await messaging.subscribeToTopic(tokens, topic);
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
        if (!messaging) return FCM_DISABLED;
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
            const response = await messaging.send(message);
            console.log('✅ 토픽 알림 전송 성공:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ 토픽 알림 전송 실패:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = FCMService;