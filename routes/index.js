const express = require('express');
const router = express.Router();

const history = require('./history.js');
const mainCharacter = require('./main_character.js');
const ranking = require('./ranking.js');
const boss = require('./boss.js');
const bossTemplate = require('./boss_template.js');
const administrator = require('./administrator.js');
const enforcements = require('./enforcements.js');
const extra = require('./extra.js');
const intervalMessage = require('./interval_message.js');
const fcmRouter = require('./fcm.js');
const probability = require('./probability.js');
const homepage = require('./home_page_scrapping.js');
const berry = require('./berry.js');
const web = require('./web/index.js');
const { requireToken, requireTokenForWrite } = require('../utils/bot_auth.js');

// 메이플링(웹)용. 봇과 응답 형식이 달라 갈라 둔다. 공개 읽기 전용이라 토큰 검사 앞에 둔다.
router.use("/web", web);

// 이 아래 라우터의 쓰기는 전부 토큰이 있어야 한다. 경로 문자열로 가리지 않고 마운트에
// 건다. Express 는 대소문자를 안 가려서 문자열 비교는 /FCM/tokens 로 비껴갈 수 있다.
router.use(requireTokenForWrite);

router.use("/history", history);
router.use("/main_character", mainCharacter);
router.use("/ranking", ranking);
router.use("/boss", boss);
router.use("/boss-template", bossTemplate);
router.use("/administrator", requireToken, administrator);
router.use("/enforcements", enforcements);
router.use("/extra", extra);
router.use("/intervalMessage", requireToken, intervalMessage);
router.use("/fcm", requireToken, fcmRouter);
router.use("/probability", probability);
router.use("/homepage", homepage);
router.use("/berry", berry);

module.exports = router;