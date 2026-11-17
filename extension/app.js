(() => {
  const { BOARDS, LIST_PARSERS, parsePost, sanitize } = CB;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('cb.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('cb.' + k, JSON.stringify(v)); } catch {} },
  };

  // ── 설정 ─────────────────────────────────
  const ACTIVE_MS = { 클리앙: 30e3, 뽐뿌: 30e3, 다모앙: 60e3 };   // 보고 있는 게시판 갱신 주기
  const BG_STALE_MS = { 클리앙: 3 * 60e3, 뽐뿌: 3 * 60e3, 다모앙: 6 * 60e3 }; // 다른 게시판 백그라운드 갱신
  const SITE_GAP_MS = { 클리앙: 3e3, 뽐뿌: 3e3, 다모앙: 20e3 };   // 같은 사이트 요청 간 최소 간격
  const BG_TICK_MS = 15e3;
  const KEEP = 100;

  // ── 상태 ─────────────────────────────────
  const byId = Object.fromEntries(BOARDS.map((b) => [b.id, b]));
  const posts = store.get('posts', {});           // { boardId: [post] }
  const lastSeen = store.get('lastSeen', {});     // { boardId: ts } 그 게시판을 마지막으로 본 시각
  const read = new Set(store.get('read', []));
  const fetchedAt = {}; const errors = {};
  const nextAllowed = {};                         // 사이트별 다음 요청 가능 시각
  let current = byId[store.get('current')] ? store.get('current') : BOARDS[0].id;
  let openUrl = null; let busy = false; let lastBg = 0; let bgIdx = 0;
  const postCache = new Map();

  const save = () => { store.set('posts', posts); store.set('lastSeen', lastSeen); store.set('read', [...read].slice(-3000)); };

  // ── 가져오기 ──────────────────────────────
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function gate(site) {
    const w = (nextAllowed[site] || 0) - Date.now();
    if (w > 0) await sleep(w);
    nextAllowed[site] = Date.now() + (SITE_GAP_MS[site] || 3e3);
  }
  async function fetchDoc(url, site, xml) {
    await gate(site);
    const res = await fetch(url, { credentials: 'include', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (res.status === 429) { nextAllowed[site] = Date.now() + 120e3; throw new Error('요청이 많아 잠시 쉬는 중(429)'); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = await res.arrayBuffer();
    let cs = ((res.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1];
    if (!cs) cs = (new TextDecoder('latin1').decode(buf.slice(0, 2000)).match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
    const text = new TextDecoder(cs.toLowerCase()).decode(buf);
    return new DOMParser().parseFromString(text, xml ? 'application/xml' : 'text/html');
  }

  async function refresh(id) {
    const b = byId[id];
    busy = true; renderStatus();
    try {
      const doc = await fetchDoc(b.url, b.site, b.type === 'rss');
      const items = LIST_PARSERS[b.type](doc);
      if (!items.length) throw new Error('글 0건 (구조 변경 또는 차단 의심)');
      const now = Date.now();
      const old = new Map((posts[id] || []).map((p) => [p.url, p]));
      const firstLoad = !posts[id];
      for (const p of items) {
        const o = old.get(p.url);
        old.set(p.url, { ...o, ...p, firstSeen: o?.firstSeen || now });
      }
      posts[id] = [...old.values()].sort((a, c) => tm(c) - tm(a)).slice(0, KEEP);
      if (firstLoad || !lastSeen[id]) lastSeen[id] = now;
      delete errors[id];
      save();
    } catch (e) {
      errors[id] = String(e.message || e);
    } finally {
      fetchedAt[id] = Date.now();
      busy = false;
      renderNav();
      if (id === current) renderList();
      renderStatus();
    }
  }
  const tm = (p) => new Date(p.date || p.firstSeen).getTime();

  // ── 스케줄러: 보고 있는 게시판은 자주, 나머지는 돌아가며 ──
  async function tick() {
    if (busy) return;
    const hidden = document.hidden;
    const b = byId[current];
    const due = (ACTIVE_MS[b.site] || 30e3) * (hidden ? 3 : 1);
    if (!fetchedAt[current] || Date.now() - fetchedAt[current] >= due) return refresh(current);
    if (Date.now() - lastBg < BG_TICK_MS * (hidden ? 4 : 1)) return;
    for (let i = 0; i < BOARDS.length; i++) {
      const c = BOARDS[(bgIdx + i) % BOARDS.length];
      if (c.id === current) continue;
      if (fetchedAt[c.id] && Date.now() - fetchedAt[c.id] < BG_STALE_MS[c.site]) continue;
      if ((nextAllowed[c.site] || 0) > Date.now()) continue;
      bgIdx = (bgIdx + i + 1) % BOARDS.length;
      lastBg = Date.now();
      return refresh(c.id);
    }
  }
  setInterval(tick, 1000);

  // ── 화면 ─────────────────────────────────
  function ago(ts) {
    if (!ts) return '';
    const s = (Date.now() - new Date(ts)) / 1000;
    if (s < 60) return '방금';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const fullTime = (ts) => ts ? new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '';
  const unread = (id) => (posts[id] || []).filter((p) => p.firstSeen > (lastSeen[id] || Infinity)).length;

  function renderNav() {
    let html = ''; let site = '';
    for (const b of BOARDS) {
      if (b.site !== site) { site = b.site; html += `<div class="site-head s-${esc(site)}">${esc(site)}</div>`; }
      const n = b.id === current ? 0 : unread(b.id);
      const badge = errors[b.id] ? `<span class="err" title="${esc(errors[b.id])}">⚠</span>` : n ? `<span class="new">${n > 99 ? '99+' : n}</span>` : '';
      html += `<button class="b${b.id === current ? ' on' : ''}" data-id="${b.id}">${esc(b.name)}${badge}</button>`;
    }
    $('#nav').innerHTML = html;
    const total = BOARDS.reduce((s, b) => s + (b.id === current ? 0 : unread(b.id)), 0);
    document.title = (total ? `(${total}) ` : '') + '커뮤니티 모아보기';
  }

  function visibleRows() {
    const q = $('#q').value.trim().toLowerCase();
    return (posts[current] || []).filter((p) => !q || p.title.toLowerCase().includes(q));
  }

  function renderList() {
    const b = byId[current];
    $('#listHead').innerHTML = `<h2><span class="s-${esc(b.site)}">${esc(b.site)}</span> ${esc(b.name)}</h2><a href="${esc(b.web || b.url)}" target="_blank" rel="noopener noreferrer">원래 게시판 ↗</a>`;
    const rows = visibleRows();
    const since = lastSeen[current] || Infinity;
    const scroll = $('#list').scrollTop;
    $('#list').innerHTML = rows.length ? rows.map((p) => {
      const cls = ['row', p.url === openUrl && 'on', p.firstSeen > since && 'fresh', read.has(p.url) && 'read'].filter(Boolean).join(' ');
      const meta = [p.sub, p.author, ago(p.date || p.firstSeen), p.views != null && `조회 ${p.views.toLocaleString()}`].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('');
      return `<a class="${cls}" href="${esc(p.url)}" data-url="${esc(p.url)}"><span class="t">${esc(p.title)}${p.comments ? `<span class="cm">[${p.comments}]</span>` : ''}</span><span class="m">${meta}</span></a>`;
    }).join('') : `<div class="empty">${errors[current] ? '불러오지 못했습니다: ' + esc(errors[current]) : '불러오는 중…'}</div>`;
    $('#list').scrollTop = scroll;
  }

  function renderStatus() {
    const el = $('#status');
    const e = errors[current];
    el.className = e ? 'err' : '';
    el.textContent = busy ? '확인 중…' : e ? '⚠ ' + e : fetchedAt[current] ? `${ago(fetchedAt[current]) === '방금' ? '방금' : ago(fetchedAt[current])} 확인 · ${Math.round((ACTIVE_MS[byId[current].site]) / 1000)}초마다 자동` : '';
  }
  setInterval(renderStatus, 5000);

  function select(id) {
    if (id === current) return;
    lastSeen[current] = Date.now();
    current = id;
    store.set('current', id);
    save();
    renderNav(); renderList(); renderStatus();
    $('#list').scrollTop = 0;
    if (!fetchedAt[id] || Date.now() - fetchedAt[id] > 10e3) { fetchedAt[id] = 0; }
  }

  // ── 본문 보기 ──────────────────────────────
  async function openPost(url) {
    const p = (posts[current] || []).find((x) => x.url === url) || { url, title: '' };
    const b = byId[current];
    openUrl = url; read.add(url); save();
    renderList();
    const v = $('#viewer');
    v.classList.add('open');
    v.scrollTop = 0;
    v.innerHTML = `<div class="loading">불러오는 중…</div>`;
    try {
      let parsed = postCache.get(url);
      if (!parsed) {
        const doc = await fetchDoc(url, b.site, false);
        parsed = { doc, data: parsePost(doc, url) };
        postCache.set(url, parsed);
        if (postCache.size > 30) postCache.delete(postCache.keys().next().value);
      }
      if (openUrl !== url) return;
      renderPost(p, b, parsed.data);
    } catch (e) {
      if (openUrl !== url) return;
      v.innerHTML = `<div class="post"><h1>${esc(p.title)}</h1><div class="note">본문을 불러오지 못했습니다 (${esc(e.message)}). <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">원문 열기 ↗</a></div></div>`;
    }
  }

  function renderPost(p, b, d) {
    const v = $('#viewer');
    const meta = [d.author || p.author, fullTime(d.date || p.date), (d.views ?? p.views) != null && `조회 ${(d.views ?? p.views).toLocaleString()}`].filter(Boolean);
    v.innerHTML = `<article class="post">
      <div class="crumb"><span class="s-${esc(b.site)}">${esc(b.site)}</span> · ${esc(b.name)}${p.sub ? ' · ' + esc(p.sub) : ''}</div>
      <h1>${esc(p.title)}</h1>
      <div class="meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}
        <span class="act"><a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">원문 열기 ↗</a><a class="btn" href="#" data-close>닫기</a></span></div>
      <div class="body"></div>
      <div class="comments"></div>
    </article>`;
    const body = v.querySelector('.body');
    if (d.body) body.appendChild(sanitize(d.body, p.url, document));
    else body.innerHTML = `<div class="note">본문을 찾지 못했습니다. 원문에서 확인해 주세요.</div>`;
    const cm = v.querySelector('.comments');
    if (d.comments && d.comments.length) {
      cm.innerHTML = `<h3>댓글 ${d.comments.length}</h3>`;
      for (const c of d.comments) {
        const el = document.createElement('div');
        el.className = 'cmt' + (c.reply ? ' reply' : '');
        el.innerHTML = `<div class="ch">${c.author ? `<b>${esc(c.author)}</b>` : ''}${esc(c.date ? fullTime(c.date) : c.dateText || '')}</div><div class="cb"></div>`;
        el.querySelector('.cb').appendChild(sanitize(c.body, p.url, document));
        cm.appendChild(el);
      }
    } else if (d.commentNote && p.comments !== 0) {
      cm.innerHTML = `<div class="note">${esc(d.commentNote)} <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">원문 열기 ↗</a></div>`;
    }
    // 이미지가 막히면 링크로 대체
    v.querySelectorAll('.body img, .cb img').forEach((img) => img.addEventListener('error', () => {
      const a = document.createElement('a');
      a.href = img.src; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'imgfail'; a.textContent = '🖼 이미지 원본 보기';
      img.replaceWith(a);
    }, { once: true }));
  }

  function closePost() {
    openUrl = null;
    const v = $('#viewer');
    v.classList.remove('open');
    v.innerHTML = `<div class="placeholder">왼쪽 목록에서 글을 선택하세요<br><small>j / k 이전·다음 글 · o 원문 열기 · r 새로고침</small></div>`;
    renderList();
  }

  function move(delta) {
    const rows = visibleRows();
    if (!rows.length) return;
    let i = rows.findIndex((p) => p.url === openUrl);
    i = i < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, i + delta));
    openPost(rows[i].url);
    requestAnimationFrame(() => $('#list .row.on')?.scrollIntoView({ block: 'nearest' }));
  }

  // ── 이벤트 ─────────────────────────────────
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('.b'); if (b) select(b.dataset.id); });
  $('#list').addEventListener('click', (e) => {
    const a = e.target.closest('a.row');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // 새 탭 열기는 그대로
    e.preventDefault();
    openPost(a.dataset.url);
  });
  $('#viewer').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) { e.preventDefault(); closePost(); } });
  $('#q').addEventListener('input', renderList);
  $('#refresh').addEventListener('click', () => { nextAllowed[byId[current].site] = 0; refresh(current); });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea') ) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'j') move(1);
    else if (e.key === 'k') move(-1);
    else if (e.key === 'o' && openUrl) window.open(openUrl, '_blank', 'noopener');
    else if (e.key === 'r') $('#refresh').click();
    else if (e.key === 'Escape') closePost();
    else if (e.key === '/') { e.preventDefault(); $('#q').focus(); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  addEventListener('beforeunload', () => { lastSeen[current] = Date.now(); save(); });

  renderNav(); renderList(); tick();
})();
