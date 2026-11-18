/**
 * 로컬 개발 DB 에 보스를 채운다 — 운영 공개 API 의 보스 목록을 그대로 옮겨 온다.
 *
 *   npm run seed                    # 로컬 Mongo 의 bosses 가 비어 있을 때
 *   npm run seed -- --replace       # 이미 있으면 지우고 다시 채운다
 *   npm run seed -- --dry-run       # 받아서 바꿔 보기만 한다. DB 에 붙지 않는다
 *
 * .env 의 MONGO_URI 를 쓴다(.env.example 은 mongodb://127.0.0.1:27017/gsbot_dev).
 *
 * ── 왜 API 에서 받나 ─────────────────────────────────────────────
 * 보스 원본은 운영 Mongo 다. 고칠 때는 메이플링 백오피스(/bot/bosses, /bot/rewards)로
 * 고친다. 예전에는 이 자리에 보스 표를 하드코딩해 두었는데 운영과 금방 어긋났고,
 * 지운 뒤 넣는 구조라 운영 DB 에 잘못 붙으면 옛 값으로 덮어썼다. 지금은 운영이
 * 내보내는 값(routes/web/boss.js)을 받아 models/boss.js 모양으로 되돌려 넣기만 한다.
 *
 * ── 안전장치 ─────────────────────────────────────────────────────
 * - MONGO_URI 의 호스트가 전부 localhost·127.0.0.1·::1 이어야 한다. 드라이버가 실제로
 *   쓸 호스트를 읽어 판단한다. mongodb+srv 와 proxyHost 는 거부한다.
 * - Mongo 가 같은 기계에 있는 서버라면 호스트만으로는 로컬 개발인지 못 가른다.
 *   그래서 bosses 에 문서가 하나라도 있으면 --replace 없이는 멈춘다.
 * - 받은 문서를 전부 스키마로 검증한 뒤에 지운다. 하나라도 틀리면 지우기 전에 멈춘다.
 *
 * _id 는 운영 값을 그대로 쓴다 — 보스 템플릿처럼 bossId 로 가리키는 데이터가
 * 로컬에서도 같은 보스를 가리키게.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');
const Boss = require('../models/boss');

const SOURCE_URL = 'https://maple-api.emotionbsy.com/boss';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function parseArgs(argv) {
  const args = { replace: false, dryRun: false };
  for (const a of argv) {
    if (a === '--replace') args.replace = true;
    else if (a === '--dry-run') args.dryRun = true;
    else throw new Error(`모르는 인자: ${a}`);
  }
  return args;
}

/**
 * MONGO_URI 가 이 기계의 Mongo 만 가리키는지 본다. 드라이버의 파서로 호스트를 읽고
 * 연결은 하지 않는다. 통과하면 화면에 찍을 대상(호스트·DB 이름)을 돌려준다 —
 * URI 를 통째로 찍으면 비밀번호가 섞일 수 있다.
 */
function checkLocalTarget(uri) {
  if (!uri) {
    throw new Error('MONGO_URI 가 없다. .env 에 mongodb://127.0.0.1:27017/gsbot_dev 처럼 로컬 주소를 잡는다');
  }
  let options;
  try {
    options = new mongoose.mongo.MongoClient(uri).options;
  } catch (err) {
    throw new Error(`MONGO_URI 를 읽지 못했다: ${err.message}`);
  }
  const hosts = options.hosts.map((h) => (h.host || '').toLowerCase());
  const remote = options.srvHost || options.proxyHost || hosts.length === 0
    || hosts.some((h) => !LOCAL_HOSTS.has(h));
  if (remote) {
    const shown = options.srvHost ? `srv ${options.srvHost}` : hosts.join(',');
    throw new Error(`로컬 Mongo 가 아니다(${shown}${options.proxyHost ? `, proxy ${options.proxyHost}` : ''}). 이 스크립트는 로컬 개발 DB 에만 넣는다`);
  }
  const ports = options.hosts.map((h) => `${h.host}:${h.port}`).join(',');
  return { label: `${ports}/${options.dbName}`, dbName: options.dbName };
}

/** 공개 API 의 보스 하나(WebBoss) → models/boss.js 문서. 난이도 배열 순서가 availableDifficulties 가 된다 */
function toBossDoc(web) {
  const difficulties = {};
  const order = [];
  for (const { name, ...difficulty } of web.difficulties || []) {
    if (Object.hasOwn(difficulties, name)) throw new Error(`${web.name}: 난이도 ${name} 가 두 번 나온다`);
    difficulties[name] = difficulty;
    order.push(name);
  }
  const doc = {
    name: web.name,
    aliases: web.aliases || [],
    entryLevel: web.entryLevel,
    availableDifficulties: order,
    difficulties,
    imageName: web.imageName ?? null,
  };
  if (mongoose.isObjectIdOrHexString(web.id)) doc._id = new mongoose.Types.ObjectId(web.id);
  return doc;
}

async function fetchBosses() {
  const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${SOURCE_URL} 응답 ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body?.bosses) || body.bosses.length === 0) {
    throw new Error(`${SOURCE_URL} 에 보스가 없다 — 로컬을 비우지 않고 멈춘다`);
  }
  return body.bosses;
}

/** 스키마 검증(해방 재료 pre-validate 훅 포함). 하나라도 틀리면 던진다 */
async function validateAll(docs) {
  const names = new Set();
  for (const d of docs) {
    if (names.has(d.name)) throw new Error(`보스 이름이 겹친다: ${d.name}`);
    names.add(d.name);
  }
  const results = await Promise.all(docs.map((d) => new Boss(d).validate().then(() => null, (e) => `${d.name}: ${e.message}`)));
  const errors = results.filter(Boolean);
  if (errors.length) throw new Error(`스키마에 안 맞는 보스가 있다 — 아무것도 지우지 않았다\n  ${errors.join('\n  ')}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = checkLocalTarget(process.env.MONGO_URI);

  const docs = (await fetchBosses()).map(toBossDoc);
  await validateAll(docs);

  console.log(`받은 보스 ${docs.length}개 (${SOURCE_URL})`);
  for (const d of docs) console.log(`  - ${d.name} (${d.availableDifficulties.join(', ')})`);

  if (args.dryRun) {
    console.log(`미리보기만 했다. 넣을 곳: ${target.label}`);
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const existing = await Boss.countDocuments();
    if (existing > 0 && !args.replace) {
      throw new Error(`${target.label} 의 bosses 에 이미 ${existing}개가 있다. 지우고 다시 넣으려면 --replace (npm run seed -- --replace)`);
    }
    const deleted = existing > 0 ? (await Boss.deleteMany({})).deletedCount : 0;
    const inserted = await Boss.insertMany(docs);
    console.log(`${target.label}: 기존 ${deleted}개 지우고 ${inserted.length}개 넣었다`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = { checkLocalTarget, toBossDoc, fetchBosses, SOURCE_URL };
