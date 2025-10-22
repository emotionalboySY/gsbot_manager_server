const express = require('express');
const router = express.Router();

const history = require('./history.js');
const mainCharacter = require('./main_character.js');
const ranking = require('./ranking.js');
const boss = require('./boss.js');
const administrator = require('./administrator.js');
const enforcements = require('./enforcements.js');
const extra = require('./extra.js');
const intervalMessage = require('./interval_message.js');
const fcmRouter = require('./fcm.js');

router.use("/history", history);
router.use("/main_character", mainCharacter);
router.use("/ranking", ranking);
router.use("/boss", boss);
router.use("/administrator", administrator);
router.use("/enforcements", enforcements);
router.use("/extra", extra);
router.use("/intervalMessage", intervalMessage);
router.use("/fcm", fcmRouter);

module.exports = router;