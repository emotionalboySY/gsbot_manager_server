/**
 * 봇 API 토큰 검사.
 *
 * 쓰기 전부와 알림 토큰·건의·정기 메시지 조회는 X-Bot-Token 이 있어야 한다. 그 밖의
 * GET 은 연다. 봇의 일반 명령이 쓰는 Http.request 는 헤더를 실을 수 없다.
 *
 * IP 로는 가릴 수 없다. Caddy 가 localhost 로 붙어 공개 요청도 127.0.0.1 로 보인다.
 *
 * BOT_AUTH_MODE
 *   off      검사하지 않는다 (값이 없을 때)
 *   warn     막지 않고 기록만 한다. 토큰을 안 보내는 호출자를 찾을 때 쓴다
 *   그 밖    막는다. 오타로 인증이 꺼지지 않게 enforce 가 아닌 값도 막는 쪽으로 본다
 */
const crypto = require('crypto');

const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();

function isValid(provided) {
    const expected = process.env.BOT_API_TOKEN;
    if (!expected || !provided) return false;
    // 길이가 달라도 비교할 수 있게 해시로 맞춘다
    return crypto.timingSafeEqual(digest(provided), digest(expected));
}

function requireToken(req, res, next) {
    const mode = process.env.BOT_AUTH_MODE || 'off';
    if (mode === 'off') return next();

    const provided = req.get('x-bot-token');
    if (isValid(provided)) return next();

    const client = req.get('x-forwarded-for') || req.socket.remoteAddress;
    const agent = (req.get('user-agent') || '').slice(0, 80);
    console.warn(
        `[bot-auth] ${provided ? '틀린 토큰' : '토큰 없음'} ` +
        `${req.method} ${req.originalUrl.split('?')[0]} client=${client} ua=${JSON.stringify(agent)}`
    );

    if (mode === 'warn') return next();
    return res.status(401).json({ error: '인증이 필요합니다' });
}

function requireTokenForWrite(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    return requireToken(req, res, next);
}

module.exports = { requireToken, requireTokenForWrite };
