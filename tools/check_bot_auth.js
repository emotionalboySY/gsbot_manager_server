#!/usr/bin/env node
/**
 * check_bot_auth.js — 봇 API 토큰 검사가 실제 라우터에서 도는지 본다
 *
 * routes/index.js 를 그대로 띄운다. 서비스 계정이 없어도 돌도록 FCM 만 막고, DB 는
 * 붙이지 않아 핸들러까지 간 요청은 금방 실패한다. 그래서 401 인지만 본다.
 *
 *   node tools/check_bot_auth.js
 */
const Module = require('module');
const http = require('http');

const realLoad = Module._load;
Module._load = function (request, ...rest) {
    if (request.endsWith('fcm_service.js') || request.endsWith('fcm_service')) return {};
    return realLoad.call(this, request, ...rest);
};

const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const express = require('express');
const TOKEN = 'check-token-value';

const app = express();
app.use(express.json());
app.use('/api', require('../routes/index.js'));

let fail = 0;
const check = (name, ok, extra) => {
    console.log(`${ok ? '  OK  ' : '  FAIL'} ${name}${extra ? ` (${extra})` : ''}`);
    if (!ok) fail++;
};

const warnings = [];
const realWarn = console.warn;
console.warn = (line) => warnings.push(String(line));
console.error = () => {};

function call(port, method, path, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({ port, method, path, headers: { 'content-type': 'application/json', ...headers } }, (res) => {
            res.resume();
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', reject);
        if (method !== 'GET' && method !== 'HEAD') req.write('{}');
        req.end();
    });
}

const LOCKED = [
    ['POST', '/api/boss'],
    ['PUT', '/api/boss/abc'],
    ['DELETE', '/api/boss/abc'],
    ['PATCH', '/api/boss/abc/difficulties/hard/rewards'],
    ['PUT', '/api/boss-template'],
    ['POST', '/api/main_character/set'],
    ['POST', '/api/administrator/suggestion'],
    ['POST', '/api/administrator/suggestion/delete'],
    ['POST', '/api/fcm/send-all'],
    ['POST', '/api/fcm/register'],
    ['DELETE', '/api/fcm/tokens/abc'],
    ['POST', '/api/intervalMessage/daily'],
    ['GET', '/api/fcm/tokens'],
    ['HEAD', '/api/fcm/tokens'],
    ['GET', '/api/administrator/suggestion'],
    ['GET', '/api/intervalMessage/all'],
    // Express 는 대소문자를 안 가린다
    ['GET', '/api/FCM/tokens'],
    ['POST', '/api/FCM/send-all'],
    ['GET', '/api/INTERVALMESSAGE/all'],
];

// 네트워크로 나가지 않는 공개 GET
const OPEN = [['GET', '/api/boss'], ['GET', '/api/web/boss'], ['GET', '/api/boss-template']];

(async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    console.log('[1] enforce: 토큰 없으면 막는다');
    process.env.BOT_AUTH_MODE = 'enforce';
    process.env.BOT_API_TOKEN = TOKEN;
    for (const [m, p] of LOCKED) {
        const code = await call(port, m, p);
        check(`${m} ${p}`, code === 401, code);
    }

    console.log('\n[2] enforce: 공개 GET 은 연다');
    for (const [m, p] of OPEN) {
        const code = await call(port, m, p);
        check(`${m} ${p}`, code !== 401, code);
    }

    console.log('\n[3] enforce: 토큰');
    for (const [m, p] of LOCKED) {
        const code = await call(port, m, p, { 'x-bot-token': TOKEN });
        check(`맞는 토큰 ${m} ${p}`, code !== 401, code);
    }
    check('틀린 토큰', (await call(port, 'GET', '/api/fcm/tokens', { 'x-bot-token': 'wrong' })) === 401);
    check('길이가 같은 틀린 토큰', (await call(port, 'GET', '/api/fcm/tokens', { 'x-bot-token': 'x'.repeat(TOKEN.length) })) === 401);
    check('헤더 이름 대소문자 무관', (await call(port, 'GET', '/api/fcm/tokens', { 'X-Bot-Token': TOKEN })) !== 401);

    console.log('\n[4] warn: 막지 않고 기록한다');
    process.env.BOT_AUTH_MODE = 'warn';
    warnings.length = 0;
    check('토큰 없어도 통과', (await call(port, 'POST', '/api/fcm/send-all?x=1')) !== 401);
    check('기록 남음', warnings.some((l) => l.includes('[bot-auth] 토큰 없음 POST /api/fcm/send-all')), warnings[0]);
    check('기록에 쿼리 없음', !warnings.some((l) => l.includes('x=1')));
    warnings.length = 0;
    await call(port, 'GET', '/api/boss');
    check('공개 GET 은 기록 안 함', warnings.length === 0);
    await call(port, 'POST', '/api/boss', { 'x-bot-token': TOKEN });
    check('맞는 토큰은 기록 안 함', warnings.length === 0);
    await call(port, 'POST', '/api/boss', { 'x-bot-token': 'leaked-value' });
    check('틀린 토큰 값은 기록에 없음', warnings.length === 1 && !warnings[0].includes('leaked-value'), warnings[0]);

    console.log('\n[5] off 와 실수');
    delete process.env.BOT_AUTH_MODE;
    warnings.length = 0;
    check('값 없으면 검사 안 함', (await call(port, 'GET', '/api/fcm/tokens')) !== 401 && warnings.length === 0);
    process.env.BOT_AUTH_MODE = 'enforced';
    check('모드 오타는 막는다', (await call(port, 'GET', '/api/fcm/tokens')) === 401);
    process.env.BOT_AUTH_MODE = 'enforce';
    delete process.env.BOT_API_TOKEN;
    check('토큰 설정이 없으면 전부 막는다', (await call(port, 'GET', '/api/fcm/tokens', { 'x-bot-token': TOKEN })) === 401);
    check('빈 토큰으로 통과 못 함', (await call(port, 'GET', '/api/fcm/tokens', { 'x-bot-token': '' })) === 401);

    server.close();
    console.warn = realWarn;
    console.log(fail ? `\n실패 ${fail}건` : '\n모두 통과');
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.log('시험 오류', e);
    process.exit(2);
});
