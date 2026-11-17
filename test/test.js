const fs = require('fs'); const assert = require('assert');
const { parseClien, parseRss, parsePpomppuHot, ppomppuDate } = require('../parsers');
const f = (n) => fs.readFileSync(__dirname + '/fixtures/' + n, 'utf8');
const c = parseClien(f('clien.html'));
assert.strictEqual(c.length, 2);
assert.deepStrictEqual(c[0], { url: 'https://www.clien.net/service/board/cm_car/19293809', title: '현대차 자율주행 이야기', author: '이미지닉', comments: 7, views: 34, date: '2026-11-17T01:32:34.000Z' });
assert.strictEqual(c[1].author, 'a57'); assert.strictEqual(c[1].views, 1204);
const r = parseRss(f('rss.xml'));
assert.strictEqual(r.length, 2);
assert.strictEqual(r[0].url, 'https://www.ppomppu.co.kr/zboard/view.php?id=money&no=549737');
assert.strictEqual(r[0].author, '아자차가호'); assert.strictEqual(r[0].date, '2026-11-17T01:05:26.000Z');
const now = new Date('2026-11-17T01:40:00Z'); // KST 10:40
const h = parsePpomppuHot(f('hot.html'), {}, now);
assert.strictEqual(h.length, 2);
assert.strictEqual(h[0].title, '일본 지방도시가 한국 항공사에 돈 퍼주는 이유');
assert.strictEqual(h[0].sub, '여행포럼'); assert.strictEqual(h[0].comments, 59); assert.strictEqual(h[0].views, 20381);
assert.strictEqual(h[0].date, '2026-11-17T01:32:01.000Z');
assert.strictEqual(h[0].url, 'https://www.ppomppu.co.kr/zboard/view.php?id=travel&no=1');
assert.strictEqual(h[1].date, '2024-03-31T15:00:00.000Z');
// 자정 직후: KST 00:05에 '23:50:00' 글은 전날
assert.strictEqual(ppomppuDate('23:50:00', new Date('2026-11-16T15:05:00Z')), '2026-11-16T14:50:00.000Z');
console.log('파서 테스트 통과');
