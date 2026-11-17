// 사용법: node collect.js [이전 data.json 경로] [출력 경로]
const fs = require('fs');
const path = require('path');
const boards = require('./boards');
const { parseClien, parseRss, parsePpomppuHot } = require('./parsers');

const PREV = process.argv[2] || 'web/data.json';
const OUT = process.argv[3] || 'web/data.json';
const KEEP_PER_BOARD = 50;          // 게시판당 보관 개수 (최신순)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const SITE_GAP = { '다모앙': 12000 };   // 다모앙은 RSS 요청 제한이 있어 12초 간격
const parsers = { clien: parseClien, rss: parseRss, ppomppu_hot: parsePpomppuHot };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOnce(url) {
  const origin = new URL(url).origin;
  return fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Referer': origin + '/',
    },
    signal: AbortSignal.timeout(20000),
  });
}

async function fetchText(url) {
  let res;
  for (let i = 0; i < 2; i++) {           // 429/5xx만 한 번 쉬었다 재시도 (403 차단은 재시도 안 함)
    res = await fetchOnce(url);
    if (res.ok || ![429, 500, 502, 503, 504].includes(res.status)) break;
    await sleep(15000);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const ct = res.headers.get('content-type') || '';
  let charset = (ct.match(/charset=([\w-]+)/i) || [])[1];
  if (!charset) {
    const head = Buffer.from(buf.slice(0, 2000)).toString('latin1');
    charset = (head.match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
  }
  return new TextDecoder(charset.toLowerCase()).decode(buf);
}

function loadPrev() {
  try { return JSON.parse(fs.readFileSync(PREV, 'utf8')); } catch { return { posts: [], status: {} }; }
}

(async () => {
  const prev = loadPrev();
  const prevByBoard = {};
  for (const p of prev.posts || []) (prevByBoard[p.board] ||= []).push(p);

  const posts = [];
  const status = {};
  // 같은 사이트에 연달아 요청하지 않도록 사이트를 번갈아 가며 수집
  const bySite = {};
  for (const b of boards.filter((b) => !b.linkOnly)) (bySite[b.site] ||= []).push(b);
  const order = [];
  for (let i = 0; Object.values(bySite).some((l) => l[i]); i++)
    for (const l of Object.values(bySite)) if (l[i]) order.push(l[i]);

  const slot = Math.floor(Date.now() / 600e3);   // 10분 단위 실행 순번
  const lastHit = {};
  for (const b of order) {
    let fresh = [];
    if (b.every && slot % b.every !== (b.offset || 0)) {
      // 이번 순번이 아니면 이전 데이터 유지
      status[b.id] = prev.status?.[b.id] || { ok: true, count: 0, at: null };
      const kept = prevByBoard[b.id] || [];
      posts.push(...kept);
      console.log(`${b.site} ${b.name}: 이번 회차 건너뜀, 보관 ${kept.length}건`);
      continue;
    }
    const gap = SITE_GAP[b.site] || 1500;           // 같은 사이트 연속 요청 간격
    const wait = (lastHit[b.site] || 0) + gap - Date.now();
    if (wait > 0) await sleep(wait);
    lastHit[b.site] = Date.now();
    try {
      const body = await fetchText(b.url);
      fresh = parsers[b.type](body, b).map((p) => ({ ...p, board: b.id }));
      if (!fresh.length) throw new Error('글 0건 (페이지 구조 변경 또는 차단 의심)');
      status[b.id] = { ok: true, count: fresh.length, at: new Date().toISOString() };
    } catch (e) {
      status[b.id] = { ok: false, error: String(e.message || e), at: new Date().toISOString(),
                       lastOk: prev.status?.[b.id]?.ok ? prev.status[b.id].at : prev.status?.[b.id]?.lastOk };
      console.error(`[실패] ${b.site} ${b.name}: ${status[b.id].error}`);
    }

    // 이전 데이터와 합치기 (URL 기준 중복 제거, 새 값 우선)
    const map = new Map();
    for (const p of prevByBoard[b.id] || []) map.set(p.url, p);
    for (const p of fresh) map.set(p.url, { ...map.get(p.url), ...p, firstSeen: map.get(p.url)?.firstSeen || new Date().toISOString() });
    const merged = [...map.values()]
      .sort((x, y) => new Date(y.date || y.firstSeen) - new Date(x.date || x.firstSeen))
      .slice(0, KEEP_PER_BOARD);
    posts.push(...merged);
    console.log(`${b.site} ${b.name}: 새로 ${fresh.length}건, 보관 ${merged.length}건`);
  }

  const data = {
    updatedAt: new Date().toISOString(),
    boards: boards.map(({ id, site, name, url, linkOnly }) => ({ id, site, name, linkOnly: !!linkOnly, url: url.replace('/rss.php?id=', '/zboard/zboard.php?id=').replace('/bbs/rss.php?bo_table=', '/') })),
    status,
    posts,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data));
  const fails = Object.values(status).filter((s) => !s.ok).length;
  console.log(`완료: 총 ${posts.length}건, 실패 게시판 ${fails}개`);
})();
