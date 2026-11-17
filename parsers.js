const cheerio = require('cheerio');

// 'YYYY-MM-DD HH:mm:ss' (한국시간) → ISO
function kstToIso(s) {
  const m = s && s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}+09:00`).toISOString();
}

function nowKstParts(now = new Date()) {
  const k = new Date(now.getTime() + 9 * 3600e3);
  return { y: k.getUTCFullYear(), mo: k.getUTCMonth() + 1, d: k.getUTCDate() };
}
const pad = (n) => String(n).padStart(2, '0');

const toInt = (s) => {
  const n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

// ── 클리앙 목록 ───────────────────────────────
function parseClien(html, board) {
  const $ = cheerio.load(html);
  const items = [];
  $('.list_item.symph_row').each((_, el) => {
    const row = $(el);
    const a = row.find('a.list_subject').first();
    const href = a.attr('href');
    const title = row.find('.subject_fixed').first().text().trim();
    if (!href || !title) return;
    const nick =
      row.find('.list_author .nickname').first().text().trim() ||
      row.find('.list_author .nickname img').attr('alt') ||
      row.attr('data-author-id') || '';
    items.push({
      url: new URL(href.split('?')[0], 'https://www.clien.net').href,
      title,
      author: nick,
      comments: toInt(row.attr('data-comment-count')),
      views: toInt(row.find('.list_hit .hit').text()),
      date: kstToIso(row.find('.list_time .timestamp').text()),
    });
  });
  return items;
}

// ── RSS (뽐뿌 포럼, 다모앙) ───────────────────
function parseRss(xml, board) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];
  $('item').each((_, el) => {
    const it = $(el);
    const title = it.find('title').first().text().trim();
    let url = it.find('link').first().text().trim();
    if (!title || !url) return;
    url = url.replace(/^http:\/\//, 'https://');
    const pub = it.find('pubDate').first().text().trim();
    const d = pub ? new Date(pub) : null;
    items.push({
      url,
      title,
      author: it.find('author').first().text().trim() || it.find('dc\\:creator').first().text().trim() || '',
      comments: null,
      views: null,
      date: d && !isNaN(d) ? d.toISOString() : null,
    });
  });
  return items;
}

// ── 뽐뿌 HOT게시글 (hot.php, EUC-KR) ──────────
// 날짜 칸: 오늘 글은 'HH:MM:SS', 지난 글은 'YY/MM/DD'
function ppomppuDate(s, now = new Date()) {
  s = (s || '').trim();
  let m = s.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (m) {
    const { y, mo, d } = nowKstParts(now);
    let t = new Date(`${y}-${pad(mo)}-${pad(d)}T${m[1]}:${m[2]}:${m[3]}+09:00`);
    if (t - now > 10 * 60e3) t = new Date(t - 86400e3); // 자정 직후 보정
    return t.toISOString();
  }
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m) return new Date(`20${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`).toISOString();
  return null;
}

function parsePpomppuHot(html, board, now = new Date()) {
  const $ = cheerio.load(html);
  const items = [];
  $('tr.baseList').each((_, el) => {
    const row = $(el);
    const a = row.find('a.baseList-title').filter((_, x) => $(x).text().trim()).last();
    const href = a.attr('href');
    const title = a.text().trim();
    if (!href || !title) return;
    const cols = row.find('td.board_date');
    const sub = row.find('td').first().find('a').first().text().trim(); // 원래 게시판 이름
    items.push({
      url: new URL(href, 'https://www.ppomppu.co.kr').href,
      title,
      author: row.find('.list_name').first().text().trim() || row.find('.list_name img').attr('alt') || '',
      comments: toInt(row.find('.list_comment2').first().text()),
      views: toInt(cols.eq(2).text()),
      date: ppomppuDate(cols.eq(0).text(), now),
      sub,
    });
  });
  return items;
}

module.exports = { parseClien, parseRss, parsePpomppuHot, ppomppuDate, kstToIso };
