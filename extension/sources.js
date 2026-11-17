// 게시판 목록 + 목록/본문 파서 + HTML 정리. (DOM만 사용하는 순수 함수)
(function (g) {
  const BOARDS = [
    { id: 'clien-park',     site: '클리앙', name: '모두의공원',   type: 'clien', url: 'https://www.clien.net/service/board/park' },
    { id: 'clien-news',     site: '클리앙', name: '새로운소식',   type: 'clien', url: 'https://www.clien.net/service/board/news' },
    { id: 'clien-car',      site: '클리앙', name: '굴러간당',     type: 'clien', url: 'https://www.clien.net/service/board/cm_car' },
    { id: 'clien-iphone',   site: '클리앙', name: '아이포니앙',   type: 'clien', url: 'https://www.clien.net/service/board/cm_iphonien' },
    { id: 'clien-useful',   site: '클리앙', name: '유용한사이트', type: 'clien', url: 'https://www.clien.net/service/board/useful' },
    { id: 'clien-lecture',  site: '클리앙', name: '팁과강좌',     type: 'clien', url: 'https://www.clien.net/service/board/lecture' },
    { id: 'clien-use',      site: '클리앙', name: '사용기',       type: 'clien', url: 'https://www.clien.net/service/board/use' },

    { id: 'ppomppu-hot',    site: '뽐뿌', name: 'HOT게시글',  type: 'ppomppu_hot', url: 'https://www.ppomppu.co.kr/hot.php', web: 'https://www.ppomppu.co.kr/hot.php' },
    { id: 'ppomppu-car',    site: '뽐뿌', name: '자동차포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=car',   web: 'https://www.ppomppu.co.kr/zboard/zboard.php?id=car' },
    { id: 'ppomppu-money',  site: '뽐뿌', name: '재테크포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=money', web: 'https://www.ppomppu.co.kr/zboard/zboard.php?id=money' },
    { id: 'ppomppu-phone',  site: '뽐뿌', name: '휴대폰포럼', type: 'rss', url: 'https://www.ppomppu.co.kr/rss.php?id=phone', web: 'https://www.ppomppu.co.kr/zboard/zboard.php?id=phone' },

    { id: 'damoang-free',   site: '다모앙', name: '자유게시판', type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=free',       web: 'https://damoang.net/free' },
    { id: 'damoang-new',    site: '다모앙', name: '새소식',     type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=new',        web: 'https://damoang.net/new' },
    { id: 'damoang-review', site: '다모앙', name: '사용기',     type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=tutorial',   web: 'https://damoang.net/tutorial' },
    { id: 'damoang-lecture',site: '다모앙', name: '강좌/팁',    type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=lecture',    web: 'https://damoang.net/lecture' },
    { id: 'damoang-car',    site: '다모앙', name: '굴러간당',   type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=car',        web: 'https://damoang.net/car' },
    { id: 'damoang-apple',  site: '다모앙', name: '애플모앙',   type: 'rss', url: 'https://damoang.net/bbs/rss.php?bo_table=applemoang', web: 'https://damoang.net/applemoang' },
  ];

  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const toInt = (s) => { const n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10); return Number.isFinite(n) ? n : null; };
  const kst = (s) => {
    const m = s && s.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}+09:00`).toISOString() : null;
  };
  const abs = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };

  // ── 목록 ─────────────────────────────────
  function parseClienList(doc) {
    return [...doc.querySelectorAll('.list_item.symph_row')].map((row) => {
      const a = row.querySelector('a.list_subject');
      const title = txt(row.querySelector('.subject_fixed'));
      if (!a || !title) return null;
      const nick = row.querySelector('.list_author .nickname');
      return {
        url: abs(a.getAttribute('href').split('?')[0], 'https://www.clien.net'),
        title,
        author: txt(nick) || nick?.querySelector('img')?.getAttribute('alt') || row.getAttribute('data-author-id') || '',
        comments: toInt(row.getAttribute('data-comment-count')),
        views: toInt(txt(row.querySelector('.list_hit .hit'))),
        date: kst(txt(row.querySelector('.list_time .timestamp'))),
      };
    }).filter(Boolean);
  }

  function parseRss(doc) {
    return [...doc.querySelectorAll('item')].map((it) => {
      const get = (t) => txt(it.getElementsByTagName(t)[0]);
      const title = get('title'); let url = get('link');
      if (!title || !url) return null;
      const d = new Date(get('pubDate'));
      return { url: url.replace(/^http:\/\//, 'https://'), title, author: get('author') || get('dc:creator'),
               comments: null, views: null, date: isNaN(d) ? null : d.toISOString() };
    }).filter(Boolean);
  }

  function ppomppuDate(s, now = new Date()) {
    let m = s.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (m) {
      const k = new Date(now.getTime() + 9 * 3600e3);
      const p = (n) => String(n).padStart(2, '0');
      let t = new Date(`${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${m[1]}:${m[2]}:${m[3]}+09:00`);
      if (t - now > 10 * 60e3) t = new Date(t - 86400e3);
      return t.toISOString();
    }
    m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    return m ? new Date(`20${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`).toISOString() : null;
  }

  function parsePpomppuHot(doc, now = new Date()) {
    return [...doc.querySelectorAll('tr.baseList')].map((row) => {
      const a = [...row.querySelectorAll('a.baseList-title')].filter((x) => txt(x)).pop();
      if (!a) return null;
      const cols = row.querySelectorAll('td.board_date');
      return {
        url: abs(a.getAttribute('href'), 'https://www.ppomppu.co.kr'),
        title: txt(a),
        author: txt(row.querySelector('.list_name')) || row.querySelector('.list_name img')?.getAttribute('alt') || '',
        comments: toInt(txt(row.querySelector('.list_comment2'))),
        views: toInt(txt(cols[2])),
        date: ppomppuDate(txt(cols[0]), now),
        sub: txt(row.querySelector('td a')),
      };
    }).filter(Boolean);
  }

  const LIST_PARSERS = { clien: parseClienList, rss: parseRss, ppomppu_hot: parsePpomppuHot };

  // ── 본문 ─────────────────────────────────
  // 반환: { author, date, views, body(Element), comments:[{author,date,body(Element),reply}], commentNote }
  function parsePost(doc, url) {
    const host = new URL(url).hostname;
    if (host.endsWith('clien.net')) {
      const info = doc.querySelector('.post_author');
      const dateEl = info && info.querySelector('.view_count.date');
      return {
        author: txt(doc.querySelector('.post_contact .contact_name')) || doc.querySelector('.post_info .nickname img')?.getAttribute('alt') || '',
        date: kst(txt(dateEl)),
        views: toInt(txt(info && [...info.querySelectorAll('.view_count')].find((e) => e.classList.length === 1))),
        body: doc.querySelector('.post_article'),
        comments: [...doc.querySelectorAll('.comment_row')].map((c) => ({
          author: txt(c.querySelector('.nickname')) || c.querySelector('.nickname img')?.getAttribute('alt') || '',
          date: kst(txt(c.querySelector('.timestamp'))),
          body: c.querySelector('.comment_view'),
          reply: /(^|\s)re(\s|$)/.test(c.className),
        })).filter((c) => c.body),
      };
    }
    if (host.endsWith('ppomppu.co.kr')) {
      const info = [...doc.querySelectorAll('.topTitle-mainbox li, .topTitle li')].map(txt);
      const d = info.find((s) => s.startsWith('등록일'));
      const v = info.find((s) => s.startsWith('조회수'));
      return {
        author: txt(doc.querySelector('.topTitle-name')),
        date: d ? kst(d.replace('등록일', '').trim().replace(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})$/, '$1:00')) : null,
        views: v ? toInt(v) : null,
        body: doc.querySelector('td.board-contents'),
        comments: [],
        commentNote: '뽐뿌 댓글은 원문에서 볼 수 있어요.',
      };
    }
    if (host.endsWith('damoang.net')) {
      return {
        author: '',
        date: null,
        views: null,
        body: doc.querySelector('.prose'),
        comments: [...doc.querySelectorAll('li.comment-item')].map((c) => {
          const time = c.querySelector('p.text-muted-foreground');
          return {
            // 작성자: 클래스 없는 첫 span (아바타 글자·시간·버튼 제외)
            author: txt(c.querySelector('[class*="nick"], [class*="author"]')) ||
                    txt([...c.querySelectorAll('span')].find((s) => !s.className && !s.children.length && s.textContent.trim())),
            date: null,
            dateText: txt(time),
            body: c.querySelector('.comment-body'),
            reply: /\bpl-\d/.test(c.className),
          };
        }).filter((c) => c.body),
      };
    }
    return { body: doc.body, comments: [] };
  }

  // ── HTML 정리 (허용 태그·속성만 남기고 스크립트/이벤트 제거) ──
  const OK_TAGS = new Set('P BR DIV SPAN A IMG B STRONG I EM U S STRIKE DEL BLOCKQUOTE UL OL LI H1 H2 H3 H4 H5 H6 TABLE THEAD TBODY TR TD TH PRE CODE HR FIGURE FIGCAPTION VIDEO SOURCE FONT CENTER SMALL SUB SUP'.split(' '));
  const DROP_TAGS = new Set('SCRIPT STYLE NOSCRIPT FORM INPUT BUTTON TEXTAREA SELECT OBJECT EMBED LINK META SVG TEMPLATE'.split(' '));

  function sanitize(src, base, targetDoc) {
    const out = targetDoc.createDocumentFragment();
    if (!src) return out;
    const walk = (node, parent) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { parent.appendChild(targetDoc.createTextNode(n.nodeValue)); continue; }
        if (n.nodeType !== 1) continue;
        const tag = n.tagName.toUpperCase();
        if (DROP_TAGS.has(tag)) continue;
        if (tag === 'IFRAME') {
          const s = abs(n.getAttribute('src') || '', base);
          if (s && /^https?:/.test(s)) {
            const a = targetDoc.createElement('a');
            a.href = s; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'embed';
            a.textContent = /youtu/.test(s) ? '▶ 유튜브 영상 보기' : '▶ 첨부 콘텐츠 보기';
            parent.appendChild(a);
          }
          continue;
        }
        if (!OK_TAGS.has(tag)) { walk(n, parent); continue; }
        const el = targetDoc.createElement(tag === 'FONT' || tag === 'CENTER' ? 'span' : tag.toLowerCase());
        if (tag === 'A') {
          const h = abs(n.getAttribute('href') || '', base);
          if (h && /^https?:/.test(h)) { el.setAttribute('href', h); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
        } else if (tag === 'IMG') {
          const s = abs(n.getAttribute('data-src') || n.getAttribute('data-original') || n.getAttribute('src') || '', base);
          if (!s || !/^https?:/.test(s)) continue;
          el.setAttribute('src', s); el.setAttribute('loading', 'lazy'); el.setAttribute('referrerpolicy', 'no-referrer');
          if (n.getAttribute('alt')) el.setAttribute('alt', n.getAttribute('alt'));
        } else if (tag === 'VIDEO' || tag === 'SOURCE') {
          const s = abs(n.getAttribute('src') || '', base);
          if (s && /^https?:/.test(s)) el.setAttribute('src', s);
          if (tag === 'VIDEO') { el.setAttribute('controls', ''); el.setAttribute('preload', 'metadata'); }
        } else if (tag === 'TD' || tag === 'TH') {
          for (const k of ['colspan', 'rowspan']) if (n.getAttribute(k)) el.setAttribute(k, n.getAttribute(k));
        }
        parent.appendChild(el);
        walk(n, el);
      }
    };
    walk(src, out);
    return out;
  }

  g.CB = { BOARDS, LIST_PARSERS, parsePost, sanitize, parseClienList, parseRss, parsePpomppuHot };
})(globalThis);
