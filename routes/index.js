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

router.use("/history", history);
router.use("/main_character", mainCharacter);
router.use("/ranking", ranking);
router.use("/boss", boss);
router.use("/boss-template", bossTemplate);
router.use("/administrator", administrator);
router.use("/enforcements", enforcements);
router.use("/extra", extra);
router.use("/intervalMessage", intervalMessage);
router.use("/fcm", fcmRouter);
router.use("/probability", probability);
router.use("/homepage", homepage);
router.use("/berry", berry);

// 메이플링(웹)용. 봇과 응답 형식이 달라 갈라 둔다.
router.use("/web", web);

module.exports = router;