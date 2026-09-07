/**
 * 로컬 개발용 최소 서버 — 메이플링 백오피스(/admin/bot)가 부르는 라우트만 얹는다.
 *
 *   node tools/admin_harness.js          # 3001 포트, .env 의 MONGO_URI 사용
 *
 * index.js 는 FCM 자격증명(firebase-service-account.json)이 없으면 뜨지 않아
 * 로컬에서 통째로 못 돌린다. 보스·메시지 템플릿·정기 메시지·웹 전송단만 필요한
 * 메이플링 개발에는 이걸로 충분하다. 메이플링 .env.local 에
 * BOT_API_URL=http://localhost:3001/api 와 MAPLE_API_URL=http://localhost:3001/api/web 을
 * 잡으면 된다. 보스가 비어 있으면 먼저 `npm run seed`.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const express = require('express');
const mongoose = require('mongoose');

const PORT = process.env.HARNESS_PORT || 3001;

(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gsbot_db');
    const app = express();
    app.use(express.json());
    app.use('/api/boss', require('../routes/boss.js'));
    app.use('/api/boss-template', require('../routes/boss_template.js'));
    app.use('/api/intervalMessage', require('../routes/interval_message.js'));
    app.use('/api/web', require('../routes/web/index.js'));
    app.listen(PORT, () => console.log(`admin harness on ${PORT}`));
})();
