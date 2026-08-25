/**
 * 메이플링(웹) 전송단.
 *
 * 봇용 /api/* 와 나란히 두되 응답 형식이 다르다. 봇은
 * { success, result(URI 인코딩), resultRaw } 를 읽지만 웹은 순수 JSON 을 받는다.
 * 실패는 HTTP 상태 코드와 { message } 로 알린다.
 *
 * 계산 로직은 봇과 같은 services/ 를 쓴다. 전송 형식만 갈라진다.
 * 나중에 별개 서버로 떼어낼 때 이 디렉터리만 들고 나가면 된다.
 */
const express = require('express');
const router = express.Router();

router.use('/enforcements', require('./enforcements.js'));
router.use('/probability', require('./probability.js'));

module.exports = router;
