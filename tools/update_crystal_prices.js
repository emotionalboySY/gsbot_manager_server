/**
 * 강렬한 힘의 결정 판매 가격 갱신 — 넥슨이 가격을 조정할 때마다 표를 붙이고 다시 돌린다.
 *
 *   node tools/update_crystal_prices.js                      # 미리보기. DB 를 건드리지 않는다
 *   node tools/update_crystal_prices.js --apply              # 오늘(KST) 기준으로 적용된 조정까지 반영
 *   node tools/update_crystal_prices.js --apply --as-of 2026-10-01   # 그 날짜 기준
 *
 * .env 의 MONGO_URI 를 쓴다(seed_bosses.js 와 같다). 운영은 EC2 에서 돌린다.
 *
 * ── 왜 스크립트인가 ──────────────────────────────────────────────
 * 가격은 봇 DB(bosses.difficulties.<난이도>.rewards.crystalPrice)가 원본이고 메이플링
 * 백오피스가 한 칸씩 고칠 수 있지만, 조정은 한 번에 40여 칸이 바뀌고 검은 마법사처럼
 * 적용일이 뒤로 밀리는 항목도 있다. 공식 패치노트 표를 그대로 옮겨 두면 손으로 옮겨
 * 적다 생기는 실수가 없고, 적용일이 남은 항목은 그날 다시 돌리기만 하면 된다.
 *
 * ── 표의 규칙 ────────────────────────────────────────────────────
 * REVISIONS 는 오래된 것부터 순서대로. 항목은 [보스, 난이도, 기존 가격, 변경 가격].
 * 보스 이름과 난이도는 패치노트 표기 그대로 적는다('노멀'). DB 의 '노말' 로는 여기서
 * 바꾼다. DB 에 없는 보스(일일 보스, 벨로나)는 건너뛰고 마지막에 이름만 알려 준다.
 *
 * 기존 가격은 검산용이다 — DB 값이 기존 가격과도 변경 가격과도 다르면 누군가
 * 백오피스로 따로 손댄 것이니 경고를 내고, 그래도 변경 가격으로 맞춘다(패치노트가
 * 원본이다).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');
const Boss = require('../models/boss');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/gsbot_db';

/** 패치노트 표기 → DB 난이도 키 */
const DIFFICULTY_KEY = { 이지: '이지', 노멀: '노말', 하드: '하드', 카오스: '카오스', 익스트림: '익스트림' };

/** 패치노트 이름 → DB 이름. 그 밖에는 공백을 뺀 이름·별칭으로 맞춘다 */
const NAME_ALIASES = { '감시자 칼로스': '칼로스' };

const REVISIONS = [
  {
    // 클라이언트 1.2.416 (2026-06-18) — https://maplestory.nexon.com/news/update/806
    effectiveFrom: '2026-06-18',
    note: '1.2.416 결정 가격 조정',
    prices: [
      ['반 레온', '하드', 1390000, 1070000],
      ['아카이럼', '노멀', 1430000, 1110000],
      ['매그너스', '노멀', 1480000, 1160000],
      ['파풀라투스', '노멀', 1520000, 1200000],
      ['힐라', '하드', 5750000, 1280000],
      ['핑크빈', '카오스', 6580000, 1320000],
      ['시그너스', '노멀', 7500000, 1360000],
      ['파풀라투스', '카오스', 13800000, 13100000],
      ['스우', '노멀', 17600000, 16700000],
      ['데미안', '노멀', 18400000, 17500000],
      ['가디언 엔젤 슬라임', '노멀', 26800000, 25500000],
      ['루시드', '이지', 31400000, 29800000],
      ['윌', '이지', 34000000, 32300000],
      ['루시드', '노멀', 37500000, 35600000],
      ['윌', '노멀', 43300000, 41100000],
      ['더스크', '노멀', 46300000, 44000000],
      ['듄켈', '노멀', 50000000, 47500000],
      ['데미안', '하드', 51500000, 48900000],
      ['스우', '하드', 54200000, 51500000],
      ['루시드', '하드', 66200000, 62900000],
      ['더스크', '카오스', 73500000, 69800000],
      ['진 힐라', '노멀', 74900000, 71200000],
      ['가디언 엔젤 슬라임', '카오스', 79100000, 75100000],
      ['윌', '하드', 81200000, 77100000],
      ['듄켈', '하드', 99400000, 94400000],
      ['진 힐라', '하드', 112000000, 106000000],
      ['선택받은 세렌', '노멀', 266000000, 239000000],
      ['감시자 칼로스', '이지', 311000000, 280000000],
      ['최초의 대적자', '이지', 324000000, 308000000],
      ['선택받은 세렌', '하드', 396000000, 356000000],
      ['카링', '이지', 419000000, 377000000],
      ['감시자 칼로스', '노멀', 561000000, 505000000],
      ['최초의 대적자', '노멀', 589000000, 560000000],
      ['스우', '익스트림', 604000000, 574000000],
      ['찬란한 흉성', '노멀', 658000000, 625000000],
      ['카링', '노멀', 714000000, 678000000],
      ['림보', '노멀', 1080000000, 1026000000],
      ['감시자 칼로스', '카오스', 1340000000, 1273000000],
      ['발드릭스', '노멀', 1440000000, 1368000000],
      ['최초의 대적자', '하드', 1510000000, 1435000000],
      ['유피테르', '노멀', 1700000000, 1615000000],
      ['카링', '하드', 1830000000, 1739000000],
      ['림보', '하드', 2510000000, 2385000000],
      ['찬란한 흉성', '하드', 2819000000, 2678000000],
      ['선택받은 세렌', '익스트림', 3150000000, 2835000000],
      ['발드릭스', '하드', 3240000000, 3078000000],
      ['감시자 칼로스', '익스트림', 4320000000, 4104000000],
      ['최초의 대적자', '익스트림', 4960000000, 4712000000],
      ['유피테르', '하드', 5100000000, 4845000000],
      ['카링', '익스트림', 5670000000, 5387000000],
    ],
  },
  {
    // 같은 공지. 검은 마법사(월간)만 7월 1일부터
    effectiveFrom: '2026-07-01',
    note: '1.2.416 검은 마법사',
    prices: [
      ['검은 마법사', '하드', 700000000, 665000000],
      ['검은 마법사', '익스트림', 9200000000, 8740000000],
    ],
  },
  {
    // 클라이언트 1.2.419 (2026-09-17) — https://maplestory.nexon.com/news/update/813
    // 주간 결정 판매 12개 제한도 이때 없어졌다
    effectiveFrom: '2026-09-17',
    note: '1.2.419 결정 가격 조정',
    prices: [
      ['자쿰', '카오스', 8080000, 4040000],
      ['피에르', '카오스', 8170000, 4080000],
      ['반반', '카오스', 8150000, 4070000],
      ['블러디퀸', '카오스', 8140000, 4070000],
      ['벨룸', '카오스', 9280000, 4640000],
      ['매그너스', '하드', 8560000, 4280000],
      ['파풀라투스', '카오스', 13100000, 6550000],
      ['스우', '노멀', 16700000, 8350000],
      ['데미안', '노멀', 17500000, 8750000],
      ['가디언 엔젤 슬라임', '노멀', 25500000, 12700000],
      ['루시드', '이지', 29800000, 14900000],
      ['윌', '이지', 32300000, 16100000],
      ['루시드', '노멀', 35600000, 17800000],
      ['윌', '노멀', 41100000, 20500000],
      ['더스크', '노멀', 44000000, 22000000],
      ['듄켈', '노멀', 47500000, 23700000],
      ['데미안', '하드', 48900000, 46400000],
      ['스우', '하드', 51500000, 48900000],
      ['진 힐라', '노멀', 71200000, 67600000],
      ['루시드', '하드', 62900000, 59700000],
      ['더스크', '카오스', 69800000, 66300000],
      ['가디언 엔젤 슬라임', '카오스', 75100000, 71300000],
      ['윌', '하드', 77100000, 73200000],
      ['듄켈', '하드', 94400000, 89600000],
      ['진 힐라', '하드', 106000000, 100000000],
      ['선택받은 세렌', '노멀', 239000000, 167000000],
      ['감시자 칼로스', '이지', 280000000, 238000000],
      ['최초의 대적자', '이지', 308000000, 261000000],
      ['선택받은 세렌', '하드', 356000000, 302000000],
      ['카링', '이지', 377000000, 320000000],
      ['벨로나', '이지', 440000000, 396000000],
      ['감시자 칼로스', '노멀', 505000000, 479000000],
      ['최초의 대적자', '노멀', 560000000, 532000000],
      ['스우', '익스트림', 574000000, 545000000],
      ['찬란한 흉성', '노멀', 625000000, 576000000],
      ['카링', '노멀', 678000000, 593000000],
      ['벨로나', '노멀', 850000000, 824000000],
      ['림보', '노멀', 1026000000, 995000000],
      ['감시자 칼로스', '카오스', 1273000000, 1230000000],
      ['발드릭스', '노멀', 1368000000, 1320000000],
      ['최초의 대적자', '하드', 1435000000, 1390000000],
      ['유피테르', '노멀', 1615000000, 1560000000],
      ['카링', '하드', 1739000000, 1560000000],
      ['선택받은 세렌', '익스트림', 2835000000, 1840000000],
    ],
  },
  {
    // 같은 공지. 검은 마법사(월간)만 10월 1일부터
    effectiveFrom: '2026-10-01',
    note: '1.2.419 검은 마법사',
    prices: [
      ['검은 마법사', '하드', 665000000, 465000000],
      ['검은 마법사', '익스트림', 8740000000, 5680000000],
    ],
  },
];

/** 오늘 날짜(KST) 를 YYYY-MM-DD 로. 서버 TZ 가 무엇이든 한국 자정 기준으로 센다 */
function todayKST() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function parseArgs(argv) {
  const args = { apply: false, asOf: todayKST() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') args.apply = true;
    else if (argv[i] === '--as-of') args.asOf = argv[++i];
    else throw new Error(`모르는 인자: ${argv[i]}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.asOf || '')) throw new Error('--as-of 는 YYYY-MM-DD');
  return args;
}

const squash = (s) => s.replace(/\s+/g, '');

/** 이름·별칭을 공백 무시로 맞춘다 */
function findBoss(bosses, name) {
  const wanted = squash(NAME_ALIASES[name] ?? name);
  return bosses.find(
    (b) => squash(b.name) === wanted || (b.aliases || []).some((a) => squash(a) === wanted),
  );
}

const won = (n) => n.toLocaleString('ko-KR');

/**
 * 적용 시점까지의 조정을 순서대로 접어 항목별 최종 가격을 낸다.
 * 같은 보스·난이도가 여러 조정에 걸치면 마지막 것이 남고, 검산용 기존 가격은
 * 첫 조정의 것을 둔다 — DB 가 어느 단계에 멈춰 있어도 알려진 값이면 경고하지 않게.
 */
function foldRevisions(asOf) {
  const final = new Map(); // key → { name, difficulty, known:Set<number>, price }
  for (const rev of REVISIONS) {
    if (rev.effectiveFrom > asOf) continue;
    for (const [name, difficulty, from, to] of rev.prices) {
      const key = `${squash(NAME_ALIASES[name] ?? name)}|${difficulty}`;
      const entry = final.get(key) ?? { name, difficulty, known: new Set(), price: to };
      entry.known.add(from);
      entry.known.add(to);
      entry.price = to;
      final.set(key, entry);
    }
  }
  return [...final.values()];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pending = REVISIONS.filter((r) => r.effectiveFrom > args.asOf);

  await mongoose.connect(mongoURI);
  try {
    const bosses = await Boss.find({});
    const targets = foldRevisions(args.asOf);

    const changes = []; // { boss, key, difficulty, before, after, unexpected }
    const missingBosses = new Set();
    const missingDifficulties = [];

    for (const t of targets) {
      const boss = findBoss(bosses, t.name);
      if (!boss) {
        missingBosses.add(t.name);
        continue;
      }
      const key = DIFFICULTY_KEY[t.difficulty];
      const info = boss.difficulties.get(key);
      if (!info) {
        missingDifficulties.push(`${boss.name} ${t.difficulty}`);
        continue;
      }
      const before = info.rewards?.crystalPrice ?? null;
      if (before === t.price) continue;
      changes.push({
        boss,
        key,
        difficulty: t.difficulty,
        before,
        after: t.price,
        unexpected: before !== null && !t.known.has(before),
      });
    }

    console.log(`기준일 ${args.asOf} · 보스 ${bosses.length}개 · 바꿀 항목 ${changes.length}개`);
    for (const c of changes) {
      const flag = c.unexpected ? '  ⚠ 알려진 가격이 아님(백오피스에서 따로 고친 값?)' : '';
      console.log(`  ${c.boss.name} ${c.difficulty}: ${won(c.before ?? 0)} → ${won(c.after)}${flag}`);
    }
    if (missingBosses.size) console.log(`DB 에 없는 보스(건너뜀): ${[...missingBosses].join(', ')}`);
    if (missingDifficulties.length) console.log(`DB 에 없는 난이도(건너뜀): ${missingDifficulties.join(', ')}`);
    for (const rev of pending) {
      console.log(`아직 적용일이 안 된 조정: ${rev.effectiveFrom} ${rev.note} — 그날 --as-of 없이 다시 돌리면 된다`);
    }

    if (!args.apply) {
      if (changes.length) console.log('미리보기만 했다. 반영하려면 --apply');
      return;
    }

    // 결정석 가격 한 칸만 $set 한다. save() 로 문서 전체를 다시 검증하면 예전에 들어간
    // 다른 필드가 지금 스키마에 안 맞을 때 가격까지 못 고친다
    for (const c of changes) {
      await Boss.updateOne(
        { _id: c.boss._id },
        { $set: { [`difficulties.${c.key}.rewards.crystalPrice`]: c.after } },
      );
    }
    console.log(`반영 완료: ${changes.length}개`);
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

module.exports = { REVISIONS, foldRevisions, findBoss, DIFFICULTY_KEY };
