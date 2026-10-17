//@name asset_drawer
//@display-name Asset Drawer
//@api 3.0
//@version 1.1.0
//@update-url https://raw.githubusercontent.com/sat7312/risu-asset-drawer/main/asset_drawer.js
//@link https://github.com/sat7312/risu-asset-drawer GitHub

/*
 * Asset Drawer — RisuAI 에셋 서랍
 * - 봇(감정/추가 에셋)과 모듈 에셋을 한곳에서 관리
 * - 목록 / 그리드 보기, 칸을 눌러 선택(Shift+클릭 범위 선택)
 * - 키워드 검색으로 일괄 선택/해제 (/정규식/ 지원)
 * - 폴더(플러그인 저장소에 보관), 드래그 앤 드롭, 폴더 순서를 실제 에셋 순서에 적용
 * - 이름 일괄 변경, 다른 봇/모듈로 복사·이동(사이드바로 끌어다 놓기), 삭제
 * - 에셋 추가(파일 선택·끌어다 놓기), 크게 보기, zip 내보내기
 * - 라이트 / 다크 / 자동(리스 테마 따라가기)
 */

(async () => {
  const R = globalThis.risuai || globalThis.Risuai;
  if (!R) return;

  // ---------------------------------------------------------------- utils
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rid = () => Math.random().toString(36).slice(2, 10);
  const clone = (v) => JSON.parse(JSON.stringify(v));

  const KIND = { emo: '감정', add: '추가', mod: '모듈' };

  const P = {
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4-4"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".9"/><circle cx="4.5" cy="12" r=".9"/><circle cx="4.5" cy="18" r=".9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" stroke="none"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.5.7l1.1 1.3h6.8a2 2 0 0 1 2 2v7.9a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2Z"/>',
    folderPlus: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.5.7l1.1 1.3h6.8a2 2 0 0 1 2 2v7.9a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2Z"/><path d="M12 11v5M9.5 13.5h5"/>',
    folderOut: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.5.7l1.1 1.3h6.8a2 2 0 0 1 2 2v7.9a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2Z"/><path d="M9.5 13.5h5"/>',
    check: '<path d="M20 6.5 9.5 17 4 11.5"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    chevU: '<path d="m18 15-6-6-6 6"/>',
    trash: '<path d="M4 7h16M18 7v11.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M10 11v6M14 11v6"/>',
    pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
    send: '<path d="M4 12h12M12 6l6 6-6 6"/><path d="M20 4v16"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v6h-6"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    box: '<path d="M20.5 7.8 12 3.5 3.5 7.8v8.4l8.5 4.3 8.5-4.3Z"/><path d="m3.5 7.8 8.5 4.3 8.5-4.3M12 12.1v8.4"/>',
    more: '<circle cx="5.5" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="18.5" cy="12" r="1.1"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    image: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="m20.5 15-4-4-9.5 9.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8Z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
    checks: '<path d="M17 7.5 7.5 17 3 12.5"/><path d="m21.5 9.5-7 7.5-1.2-1.2"/>',
    sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
    invert: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 20.5 20.5 3.5"/>',
    sparkle: '<path d="M12 3.5c.6 4.3 2.6 6.4 7 7-4.4.6-6.4 2.7-7 7-.6-4.3-2.6-6.4-7-7 4.4-.6 6.4-2.7 7-7Z"/>',
    drop: '<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M5 19.5h14"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
    zoom: '<path d="M14.5 3.5h6v6M9.5 20.5h-6v-6M20.5 3.5l-7 7M3.5 20.5l7-7"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    grip: '<circle cx="9" cy="6.5" r=".9"/><circle cx="15" cy="6.5" r=".9"/><circle cx="9" cy="12" r=".9"/><circle cx="15" cy="12" r=".9"/><circle cx="9" cy="17.5" r=".9"/><circle cx="15" cy="17.5" r=".9"/>',
    move: '<path d="M5 12h14M13 6l6 6-6 6"/><path d="M5 5v14"/>',
  };
  const ic = (n, s = 18) => `<svg class="i" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  const LAUNCH_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M14 17h6M17 14v6"/></svg>';

  // ---------------------------------------------------------------- state
  const S = {
    prefs: { theme: 'system', view: 'grid', thumb: 136, srcTab: 'char', lastSrc: null },
    sources: [],
    src: null,
    assets: [],
    sel: new Set(),
    anchor: null,
    order: [],
    groups: {},
    fdata: { folders: [], map: {}, collapsed: {} },
    query: '',
    kind: 'all',
    folder: 'all',
    srcQuery: '',
    loading: false,
    error: null,
    dragging: null,
    busy: false,
  };
  let mounted = false;
  let risuDark = null;

  // ---------------------------------------------------------------- storage
  const store = {
    async get(k, d) {
      try { const v = await R.pluginStorage.getItem(k); return v ?? d; } catch { return d; }
    },
    async set(k, v) {
      try { await R.pluginStorage.setItem(k, clone(v)); } catch (e) { console.warn('[asset_drawer] storage', e); }
    },
  };
  const savePrefs = () => store.set('ad.prefs', S.prefs);
  const saveF = () => S.src && store.set('ad.f.' + S.src.key, S.fdata);
  const normF = (d) => tidyTree({ folders: Array.isArray(d?.folders) ? d.folders : [], map: d?.map && typeof d.map === 'object' ? d.map : {}, collapsed: d?.collapsed && typeof d.collapsed === 'object' ? d.collapsed : {} });

  // 예전 이름(asset_manager)으로 쓰던 폴더·설정을 가져오기.
  // 리스의 플러그인 저장소는 플러그인끼리 공유되므로 옛 키(am.*)를 그대로 읽을 수 있음.
  // 옛 데이터는 지우지 않고, 새 키(ad.*)에 이미 데이터가 있으면 덮어쓰지 않음.
  async function migrateLegacy() {
    if (await store.get('ad.migrated', false)) return 0;
    let keys = [];
    try { keys = (await R.pluginStorage.keys()) || []; } catch { return 0; }
    let n = 0;
    for (const k of keys) {
      if (typeof k !== 'string') continue;
      if (k.startsWith('am.f.')) {
        const nk = 'ad.f.' + k.slice(5);
        if (await store.get(nk, null)) continue;
        const d = await store.get(k, null);
        if (!d || !Array.isArray(d.folders) || typeof d.map !== 'object') continue;
        await store.set(nk, normF(d));
        if (d.folders.length) n++;
      } else if (k === 'am.prefs') {
        const old = await store.get(k, null);
        if (old && typeof old === 'object' && !(await store.get('ad.prefs', null))) await store.set('ad.prefs', old);
      }
    }
    await store.set('ad.migrated', true);
    return n;
  }

  // ---------------------------------------------------------------- media
  const media = new Map();     // path -> {url, mime, ext, kind}
  const pending = new Map();
  const queue = [];
  let active = 0;

  const EXT_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac' };

  function sniff(u8, hint) {
    const b = (i) => u8[i];
    const s = (a, z) => String.fromCharCode(...u8.slice(a, z));
    let r = null;
    if (b(0) === 0x89 && b(1) === 0x50) r = ['image/png', 'png'];
    else if (b(0) === 0xff && b(1) === 0xd8) r = ['image/jpeg', 'jpg'];
    else if (s(0, 3) === 'GIF') r = ['image/gif', 'gif'];
    else if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') r = ['image/webp', 'webp'];
    else if (s(0, 4) === 'RIFF' && s(8, 12) === 'WAVE') r = ['audio/wav', 'wav'];
    else if (s(4, 8) === 'ftyp') {
      const brand = s(8, 12);
      if (/avi[fs]/.test(brand)) r = ['image/avif', 'avif'];
      else if (/M4A/.test(brand)) r = ['audio/mp4', 'm4a'];
      else r = ['video/mp4', 'mp4'];
    } else if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) r = ['video/webm', 'webm'];
    else if (s(0, 4) === 'OggS') r = ['audio/ogg', 'ogg'];
    else if (s(0, 4) === 'fLaC') r = ['audio/flac', 'flac'];
    else if (s(0, 3) === 'ID3' || (b(0) === 0xff && (b(1) & 0xe0) === 0xe0)) r = ['audio/mpeg', 'mp3'];
    else if (s(0, 5) === '<?xml' || s(0, 4) === '<svg') r = ['image/svg+xml', 'svg'];
    else if (b(0) === 0x42 && b(1) === 0x4d) r = ['image/bmp', 'bmp'];
    if (!r) {
      const e = String(hint || '').toLowerCase();
      r = [EXT_MIME[e] || 'image/png', e || 'png'];
    }
    return { mime: r[0], ext: r[1], kind: r[0].split('/')[0] };
  }

  function toBytes(d) {
    if (!d) return null;
    if (typeof d === 'string') return d;
    if (d instanceof Uint8Array) return d;
    if (d instanceof ArrayBuffer) return new Uint8Array(d);
    if (ArrayBuffer.isView(d)) return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
    if (Array.isArray(d)) return Uint8Array.from(d);
    if (typeof d === 'object') {
      const k = Object.keys(d);
      if (k.length && /^\d+$/.test(k[0])) return Uint8Array.from(k.map((x) => d[x]));
    }
    return null;
  }

  function loadMedia(path, hint) {
    if (!path) return Promise.resolve(null);
    if (media.has(path)) return Promise.resolve(media.get(path));
    if (pending.has(path)) return pending.get(path);
    const p = new Promise((res) => { queue.push({ path, hint, res }); pump(); });
    pending.set(path, p);
    return p;
  }

  // 나중에 요청한 것(지금 화면에 보이는 칸)부터 읽어서, 빠르게 스크롤해도 지나간 칸에 밀리지 않게 함.
  function pump() {
    while (active < 6 && queue.length) {
      const job = queue.pop();
      active++;
      (async () => {
        let info = null;
        try {
          if (/^(https?:|data:|blob:)/.test(job.path)) {
            const m = job.path.match(/^data:([^;,]+)/);
            const mime = m ? m[1] : (EXT_MIME[(job.path.split('.').pop() || '').toLowerCase()] || 'image/png');
            info = { url: job.path, mime, ext: mime.split('/')[1], kind: mime.split('/')[0] };
          } else {
            const raw = toBytes(await R.readImage(job.path));
            if (typeof raw === 'string') {
              const url = raw.startsWith('data:') ? raw : 'data:image/png;base64,' + raw;
              const mime = (url.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
              info = { url, mime, ext: mime.split('/')[1], kind: mime.split('/')[0] };
            } else if (raw && raw.length) {
              const sn = sniff(raw, job.hint);
              const blob = new Blob([raw], { type: sn.mime });
              info = { url: URL.createObjectURL(blob), blob, ...sn };
            }
          }
        } catch (e) { console.warn('[asset_drawer] readImage', job.path, e); }
        if (info) media.set(job.path, info);
        pending.delete(job.path);
        job.res(info);
        active--;
        pump();
      })();
    }
  }

  // ---------------------------------------------------------------- thumbnails
  // 원본(수 MB, 1000px 넘는 그림)을 칸에 그대로 넣으면 스크롤할 때마다 큰 그림을 디코딩·축소하느라 버벅임.
  // 칸과 목록에는 줄인 사본을 쓰고, 원본은 크게 보기 · 내보내기에서만 씀.
  const THUMB_PX = Math.round(260 * Math.min(globalThis.devicePixelRatio || 1, 2));
  const thumbs = new Map();    // path -> 칸에 쓸 url (줄일 필요가 없으면 원본 url)
  const tpending = new Map();
  const tqueue = [];
  let tactive = 0;

  async function shrink(info) {
    if (typeof createImageBitmap !== 'function' || /svg|gif/.test(info.mime)) return null;
    const blob = info.blob || (/^(data|blob):/.test(info.url) ? await (await fetch(info.url)).blob() : null);
    if (!blob) return null;
    const bmp = await createImageBitmap(blob);
    try {
      const k = THUMB_PX / Math.max(bmp.width, bmp.height);
      if (k >= 0.8) return null;
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(bmp.width * k));
      cv.height = Math.max(1, Math.round(bmp.height * k));
      const cx = cv.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(bmp, 0, 0, cv.width, cv.height);
      const out = await new Promise((r) => cv.toBlob(r, 'image/webp', 0.86));
      return out ? URL.createObjectURL(out) : null;
    } finally { bmp.close && bmp.close(); }
  }

  function loadThumb(path, info) {
    if (!info || info.kind !== 'image') return Promise.resolve(null);
    if (thumbs.has(path)) return Promise.resolve(thumbs.get(path));
    if (tpending.has(path)) return tpending.get(path);
    const p = new Promise((res) => { tqueue.push({ path, info, res }); pumpThumb(); });
    tpending.set(path, p);
    return p;
  }

  function pumpThumb() {
    while (tactive < 2 && tqueue.length) {
      const job = tqueue.pop();
      tactive++;
      shrink(job.info).catch(() => null).then((url) => {
        const u = url || job.info.url;
        thumbs.set(job.path, u);
        tpending.delete(job.path);
        job.res(u);
        tactive--;
        pumpThumb();
      });
    }
  }

  // 원본 정보와 칸에 쓸 url을 함께 받기
  const loadTile = (path, hint) => loadMedia(path, hint).then((info) => loadThumb(path, info).then((thumb) => ({ info, thumb })));

  function clearMedia() {
    for (const m of media.values()) if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
    for (const [p, u] of thumbs) if (u.startsWith('blob:') && u !== (media.get(p) || {}).url) URL.revokeObjectURL(u);
    media.clear(); thumbs.clear();
    pending.clear(); tpending.clear();
    queue.length = 0; tqueue.length = 0;
  }

  function mediaHTML(info, name, thumb) {
    if (!info) return `<div class="ph-ico" title="불러올 수 없음">${ic('image', 22)}</div>`;
    if (info.kind === 'video') return `<video src="${esc(info.url)}" muted loop playsinline preload="metadata"></video><span class="mbadge">${ic('eye', 12)}VIDEO</span>`;
    if (info.kind === 'audio') return `<div class="ph-ico audio">${ic('music', 26)}<span>${esc((info.ext || '').toUpperCase())}</span></div>`;
    return `<img src="${esc(thumb || info.url)}" alt="${esc(name)}" draggable="false" decoding="async">`;
  }

  let io = null;
  function hydrate(root) {
    if (io) io.disconnect();
    const scroller = $('#content');
    io = new IntersectionObserver((ents) => {
      for (const e of ents) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        io.unobserve(el);
        loadTile(el.dataset.path, el.dataset.hint).then(({ info, thumb }) => {
          el.classList.remove('loading');
          el.innerHTML = mediaHTML(info, el.dataset.name, thumb);
          const card = el.closest('[data-uid]');
          const extEl = card && card.querySelector('.ext[data-auto]');
          if (extEl && info) extEl.textContent = (info.ext || '').toUpperCase();
        });
      }
    }, { root: scroller, rootMargin: '400px 0px' });
    $$('.ph.loading', root).forEach((el) => io.observe(el));
  }

  function phHTML(a) {
    const info = media.get(a.path);
    if (info && (info.kind !== 'image' || thumbs.has(a.path))) return `<div class="ph">${mediaHTML(info, a.name, thumbs.get(a.path))}</div>`;
    return `<div class="ph loading" data-path="${esc(a.path)}" data-hint="${esc(a.ext)}" data-name="${esc(a.name)}"></div>`;
  }

  // ---------------------------------------------------------------- data
  async function loadSources() {
    S.loading = true; S.error = null;
    renderAll();
    try {
      const db = await R.getDatabase(['characters', 'modules', 'enabledModules']);
      if (!db) { S.error = 'perm'; S.sources = []; return; }
      let cur = -1;
      try { cur = await R.getCurrentCharacterIndex(); } catch {}
      const chars = (db.characters || []).map((c, i) => {
        if (!c || c.type === 'group') return null;
        const lists = {
          emo: (c.emotionImages || []).map((a) => [a[0], a[1]]),
          add: (c.additionalAssets || []).map((a) => [a[0], a[1], a[2] || '']),
        };
        return { type: 'char', key: 'char:' + (c.chaId || 'idx' + i), index: i, chaId: c.chaId, name: c.name || '이름 없는 봇', image: c.image || '', lists, count: lists.emo.length + lists.add.length, current: i === cur };
      }).filter(Boolean);
      chars.sort((a, b) => (b.current - a.current));
      const enabled = new Set(db.enabledModules || []);
      const mods = (db.modules || []).map((m) => {
        const lists = { mod: (m.assets || []).map((a) => [a[0], a[1], a[2] || '']) };
        return { type: 'mod', key: 'mod:' + m.id, id: m.id, name: m.name || '이름 없는 모듈', lists, count: lists.mod.length, enabled: enabled.has(m.id) };
      });
      S.sources = [...chars, ...mods];
    } catch (e) {
      console.error(e);
      S.error = String(e?.message || e);
    } finally {
      S.loading = false;
    }
  }

  function buildAssets() {
    const out = [];
    if (S.src) {
      for (const kind of ['emo', 'add', 'mod']) {
        (S.src.lists[kind] || []).forEach((t, i) => out.push({ uid: kind + '#' + i, kind, idx: i, name: String(t[0] ?? ''), path: t[1], ext: t[2] || '', fkey: kind + '::' + t[0] }));
      }
    }
    S.assets = out;
    S.byUid = new Map(out.map((a) => [a.uid, a]));
    for (const u of [...S.sel]) if (!S.byUid.has(u)) S.sel.delete(u);
  }

  async function selectSource(src, keepSel = false) {
    if (!src) return;
    const same = S.src && S.src.key === src.key;
    S.src = src;
    if (!same || !keepSel) { S.sel.clear(); S.anchor = null; }
    if (!same) { S.folder = 'all'; S.kind = 'all'; }
    S.fdata = normF(await store.get('ad.f.' + src.key, null));
    S.prefs.lastSrc = src.key; savePrefs();
    if (src.type !== S.prefs.srcTab) { S.prefs.srcTab = src.type; }
    buildAssets();
    closeSide();
    renderAll();
    $('#content').scrollTop = 0;
  }

  async function mutateSource(src, fn) {
    if (src.type === 'char') {
      const c = await R.getCharacterFromIndex(src.index);
      if (!c || (src.chaId && c.chaId !== src.chaId)) throw new Error('봇 위치가 바뀌었어요. 새로고침 후 다시 시도해 주세요.');
      const lists = { emo: c.emotionImages || [], add: c.additionalAssets || [] };
      await fn(lists);
      c.emotionImages = lists.emo;
      c.additionalAssets = lists.add;
      await R.setCharacterToIndex(src.index, c);
      src.lists = { emo: lists.emo.map((a) => [a[0], a[1]]), add: lists.add.map((a) => [a[0], a[1], a[2] || '']) };
      src.count = src.lists.emo.length + src.lists.add.length;
    } else {
      const db = await R.getDatabase(['modules']);
      if (!db) throw new Error('데이터베이스 접근 권한이 필요해요.');
      const m = (db.modules || []).find((x) => x.id === src.id);
      if (!m) throw new Error('모듈을 찾을 수 없어요. 새로고침 후 다시 시도해 주세요.');
      const lists = { mod: m.assets || [] };
      await fn(lists);
      m.assets = lists.mod;
      await R.setDatabase({ modules: db.modules });
      src.lists = { mod: lists.mod.map((a) => [a[0], a[1], a[2] || '']) };
      src.count = src.lists.mod.length;
    }
  }

  // ---------------------------------------------------------------- derived
  const folderIds = () => new Set(S.fdata.folders.map((f) => f.id));
  function folderOf(a, ids = folderIds()) { const id = S.fdata.map[a.fkey]; return id && ids.has(id) ? id : null; }

  // 폴더 나무: 최대 두 단계(폴더 → 하위 폴더). 하위 폴더는 parent에 위 폴더 id를 가짐.
  // 부모가 사라졌거나 하위 폴더를 부모로 가리키면 최상위 폴더로 바로잡음.
  function tidyTree(d) {
    const by = new Map(d.folders.map((f) => [f.id, f]));
    for (const f of d.folders) if (f.parent && (!by.has(f.parent) || f.parent === f.id)) delete f.parent;
    for (const f of d.folders) if (f.parent && by.get(f.parent).parent) delete f.parent;
    return d;
  }
  const fget = (id) => S.fdata.folders.find((f) => f.id === id);
  const tops = () => S.fdata.folders.filter((f) => !f.parent);
  const kids = (id) => S.fdata.folders.filter((f) => f.parent === id);
  const treeOrder = () => tops().flatMap((f) => [f, ...kids(f.id)]);
  const fullName = (f) => { const p = f && f.parent && fget(f.parent); return p ? `${p.name} / ${f.name}` : (f ? f.name : ''); };
  // 에셋이 이 폴더(하위 폴더 포함) 안에 있는지
  function within(a, fid, ids) { const f = folderOf(a, ids); return !!f && (f === fid || (fget(f) || {}).parent === fid); }
  // 같은 무리(최상위끼리, 또는 같은 위 폴더의 하위 폴더끼리)의 순서만 ids 순서대로 바꿈
  function reorderPeers(ids) {
    const set = new Set(ids), by = new Map(S.fdata.folders.map((f) => [f.id, f]));
    let k = 0;
    const next = S.fdata.folders.map((f) => (set.has(f.id) ? by.get(ids[k++]) : f));
    const changed = next.some((f, i) => f !== S.fdata.folders[i]);
    S.fdata.folders = next;
    return changed;
  }
  const kindOk = (a) => S.kind === 'all' || a.kind === S.kind;

  function matcher() {
    const q = S.query.trim();
    if (!q) return () => true;
    const rx = q.match(/^\/(.+)\/([a-z]*)$/);
    if (rx) {
      try { const re = new RegExp(rx[1], rx[2].includes('i') ? rx[2] : rx[2] + 'i'); return (a) => re.test(a.name); } catch { return () => false; }
    }
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (a) => { const n = a.name.toLowerCase(); return terms.every((t) => n.includes(t)); };
  }

  function visibleAssets() {
    const m = matcher(); const ids = folderIds();
    return S.assets.filter((a) => {
      if (!kindOk(a) || !m(a)) return false;
      if (S.folder === 'all') return true;
      return within(a, S.folder, ids);
    });
  }

  // ---------------------------------------------------------------- CSS
  const CSS = `
:root,[data-theme=light]{
  --bg:#f3f1ec;--panel:#faf9f6;--surface:#ffffff;--surface-2:#efece6;--surface-3:#e7e3db;
  --line:#e3dfd6;--line-strong:#cfc9be;--ink:#1e1b17;--ink-2:#58524a;--ink-3:#8f887d;
  --accent:#d65a3d;--accent-2:#b8462c;--accent-ink:#ffffff;--accent-soft:rgba(214,90,61,.11);
  --danger:#c7382c;--ab-bg:#1e1b17;--ab-ink:#f6f3ee;--ab-danger:#ff9a8a;--ab-accent:#ff9d83;
  --chk-a:#ffffff;--chk-b:#f0ede7;
  --shadow:0 1px 2px rgba(30,27,23,.05),0 10px 28px -14px rgba(30,27,23,.22);
  --shadow-lg:0 30px 70px -24px rgba(30,27,23,.45);
  color-scheme:light;
}
[data-theme=dark]{
  --bg:#121114;--panel:#17161a;--surface:#1d1c21;--surface-2:#25242a;--surface-3:#2e2d34;
  --line:#2c2b31;--line-strong:#3b3a42;--ink:#f0ede7;--ink-2:#b6b0a6;--ink-3:#7f796f;
  --accent:#ff7c5e;--accent-2:#ff9478;--accent-ink:#1b0f0b;--accent-soft:rgba(255,124,94,.15);
  --danger:#ff6b5c;--ab-bg:#f0ede7;--ab-ink:#1b1a1e;--ab-danger:#c3362a;--ab-accent:#c9472b;
  --chk-a:#222126;--chk-b:#1b1a1f;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 12px 30px -14px rgba(0,0,0,.6);
  --shadow-lg:0 30px 70px -20px rgba(0,0,0,.75);
  color-scheme:dark;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif;background:var(--bg);color:var(--ink);font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased;letter-spacing:-.01em;overflow:hidden;transition:background .25s,color .25s}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
input,select{font:inherit;color:inherit}
.i{flex:none;display:block}
::selection{background:var(--accent-soft)}
::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:var(--surface-3);border-radius:10px;border:3px solid transparent;background-clip:content-box}::-webkit-scrollbar-track{background:transparent}
.mono{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}

.app{display:grid;grid-template-columns:292px minmax(0,1fr);height:100vh;height:100dvh}
.side{background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;z-index:40}
.brand{display:flex;align-items:center;gap:11px;padding:18px 18px 14px}
.logo{width:32px;height:32px;border-radius:10px;background:linear-gradient(145deg,var(--accent),var(--accent-2));color:var(--accent-ink);display:grid;place-items:center;box-shadow:0 8px 18px -8px var(--accent)}
.brand b{display:block;font-weight:750;font-size:15px;letter-spacing:-.025em}
.brand small{display:block;color:var(--ink-3);font-size:11.5px;margin-top:1px}
.seg{display:flex;background:var(--surface-2);border-radius:11px;padding:3px;gap:2px}
.seg button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 10px;border-radius:8px;color:var(--ink-3);font-weight:600;font-size:12.5px;white-space:nowrap;transition:color .15s,background .15s}
.seg button:hover{color:var(--ink-2)}
.seg button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 1px var(--line)}
.seg .cnt{font-size:11px;color:var(--ink-3);font-weight:600}
.side .seg{margin:0 14px}
.field{display:flex;align-items:center;gap:8px;height:38px;padding:0 6px 0 12px;border-radius:11px;background:var(--surface);border:1px solid var(--line);color:var(--ink-3);transition:border-color .15s,box-shadow .15s}
.field:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.field input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--ink);height:100%}
.field input::placeholder{color:var(--ink-3)}
.field .clr{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--ink-3)}
.field .clr:hover{background:var(--surface-2);color:var(--ink)}
.field kbd{font:600 10.5px/1 'JetBrains Mono',monospace;color:var(--ink-3);border:1px solid var(--line);border-radius:6px;padding:4px 6px;margin-right:4px}
.side .field{margin:10px 14px 6px;height:36px}
.src-list{flex:1 1 55%;overflow:auto;padding:4px 8px 10px;min-height:120px}
.src{display:flex;align-items:center;gap:11px;width:100%;padding:7px 8px;border-radius:11px;text-align:left;transition:background .12s}
.src:hover{background:var(--surface-2)}
.src.on{background:var(--accent-soft)}
.src.over{background:var(--accent-soft);box-shadow:inset 0 0 0 1.5px var(--accent)}
.src.over .src-sub::after{content:'여기로 이동';margin-left:auto;font-weight:700;color:var(--accent)}
.src.on .src-name{color:var(--accent)}
.src.zero{opacity:.55}
.src-av{width:36px;height:36px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;overflow:hidden;color:var(--ink-3);flex:none;border:1px solid var(--line)}
.src-av img{width:100%;height:100%;object-fit:cover}
.src-meta{min-width:0;flex:1;display:flex;flex-direction:column}
.src-name{font-weight:620;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.src-sub{font-size:11.5px;color:var(--ink-3);display:flex;gap:6px;align-items:center}
.tag{font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;background:var(--surface-3);color:var(--ink-2)}
.tag.hot{background:var(--accent);color:var(--accent-ink)}
.side-empty{padding:30px 14px;text-align:center;color:var(--ink-3);font-size:12.5px}
.side-folders{flex:1 1 45%;border-top:1px solid var(--line);display:flex;flex-direction:column;min-height:150px;padding:12px 8px 12px}
.side-h{display:flex;align-items:center;justify-content:space-between;padding:0 6px 8px 10px;font-size:11px;font-weight:750;color:var(--ink-3);letter-spacing:.08em}
.mini{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--ink-2)}
.mini:hover{background:var(--surface-2);color:var(--ink)}
.folder-list{overflow:auto;flex:1;display:flex;flex-direction:column;gap:1px;position:relative}
.fold{display:flex;align-items:center;gap:10px;width:100%;min-height:35px;padding:0 4px 0 10px;border-radius:10px;color:var(--ink-2);font-weight:580;cursor:pointer;text-align:left;transition:background .12s,box-shadow .12s}
.fold:hover{background:var(--surface-2)}
.fold.on{background:var(--surface);color:var(--ink);box-shadow:0 0 0 1px var(--line),0 1px 3px rgba(0,0,0,.05)}
.fold.over,.grp.over{background:var(--accent-soft)!important;box-shadow:inset 0 0 0 1.5px var(--accent)!important}
.fold .i{color:var(--ink-3)}
.fname{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.n{font-size:11.5px;color:var(--ink-3);font-variant-numeric:tabular-nums;padding-right:4px}
.fmore{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--ink-3);opacity:0;flex:none}
.fmore:hover{background:var(--surface-3);color:var(--ink)}
.fold:hover .fmore,.fold.on .fmore{opacity:1}
@media (hover:none){.fmore{opacity:1}}
.fold-hint{font-size:11.5px;color:var(--ink-3);padding:10px 12px;line-height:1.5}
.fold-hint.sm{display:flex;align-items:center;gap:5px;font-size:11px;padding:8px 10px 2px;opacity:.85}
.fgrip{width:18px;height:26px;margin-left:-6px;margin-right:-4px;display:grid;place-items:center;color:var(--ink-3);cursor:grab;touch-action:none;opacity:0;transition:opacity .15s;flex:none}
.fold:hover .fgrip{opacity:1}
@media (hover:none){.fgrip{opacity:.7}}
.fold.slot{background:var(--accent-soft)!important;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--accent) 45%,transparent)!important}
.slot>*{visibility:hidden}
.tile.slot,.row.slot{background:var(--accent-soft);border:1.5px dashed color-mix(in srgb,var(--accent) 55%,transparent);box-shadow:none}
.row.slot{border-width:1.5px 0}
.dragsrc{display:none!important}
.tile,.row{-webkit-touch-callout:none}
.drag-ghost{position:fixed!important;z-index:90;margin:0;pointer-events:none;opacity:.75;box-shadow:0 0 0 1.5px var(--accent),var(--shadow-lg)!important;will-change:transform;transition:none!important;content-visibility:visible}
.drag-ghost .tile-media{transform:none!important}
.ghost-n{position:absolute;top:8px;right:8px;z-index:3;min-width:26px;height:26px;padding:0 8px;border-radius:13px;background:var(--accent);color:var(--accent-ink);font-weight:750;font-size:13px;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.25)}
body.asset-dragging,body.asset-dragging *{cursor:grabbing!important}
body.asset-dragging .tile:hover{box-shadow:none}
body.asset-dragging .zoomb,body.asset-dragging .tick{opacity:0!important}
.fold-ghost{position:fixed;z-index:90;margin:0;pointer-events:none;opacity:.72;background:var(--surface);color:var(--ink);box-shadow:0 0 0 1.5px var(--accent),var(--shadow-lg);will-change:transform}
.fold-ghost .fgrip{opacity:1;color:var(--accent)}
.fold-ghost .fmore{opacity:0}
body.fold-dragging,body.fold-dragging *{cursor:grabbing!important}
.folder-list.sorting .fold:hover{background:none}
.folder-list.sorting{user-select:none;-webkit-user-select:none}
.fold[data-fid]{user-select:none;-webkit-user-select:none}
.side-foot{padding:8px 4px 0}
.ghost{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;height:34px;border-radius:10px;border:1px dashed var(--line-strong);color:var(--ink-2);font-size:12.5px;font-weight:600}
.ghost:hover{border-style:solid;color:var(--ink);background:var(--surface)}
.ghost:disabled{opacity:.45;cursor:default}

.main{display:flex;flex-direction:column;min-width:0;min-height:0;position:relative}
.top{display:flex;align-items:flex-start;gap:14px;padding:18px 24px 12px}
.title{flex:1;min-width:0}
.crumb{font-size:12px;color:var(--ink-3);display:flex;gap:6px;align-items:center;font-weight:550}
.title h1{font-size:23px;font-weight:780;letter-spacing:-.035em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25;margin-top:2px}
.stats{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.stat{font-size:11.5px;padding:3px 9px;border-radius:999px;background:var(--surface-2);color:var(--ink-2);font-variant-numeric:tabular-nums}
.stat b{color:var(--ink);font-weight:700}
.stat.acc{background:var(--accent-soft);color:var(--accent)}
.stat.acc b{color:var(--accent)}
.top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.top-win{display:flex;gap:8px}
.top-actions .seg button{height:32px}
@media (max-width:1240px){#themeSeg .lbl-t{display:none}}
.icon-btn{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:var(--ink-2);border:1px solid var(--line);background:var(--surface);transition:.15s;flex:none}
.icon-btn:hover{color:var(--ink);border-color:var(--line-strong);box-shadow:var(--shadow)}
.icon-btn.close:hover{color:var(--accent)}
.toolbar{display:flex;align-items:center;gap:8px;padding:0 24px 14px;flex-wrap:wrap}
.toolbar .field{flex:1 1 220px;max-width:420px}
.qcount{font-size:11.5px;color:var(--ink-3);white-space:nowrap;font-variant-numeric:tabular-nums;padding:0 4px}
.qcount b{color:var(--accent)}
.btn{height:38px;padding:0 13px;border-radius:11px;display:inline-flex;align-items:center;gap:7px;font-weight:620;font-size:13px;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);white-space:nowrap;transition:.15s}
.btn:hover:not(:disabled){color:var(--ink);border-color:var(--line-strong);box-shadow:var(--shadow)}
.btn:disabled{opacity:.42;cursor:default}
.btn.primary{background:var(--accent);border-color:transparent;color:var(--accent-ink)}
.btn.primary:hover:not(:disabled){background:var(--accent-2);color:var(--accent-ink)}
.btn.danger{color:var(--danger)}
.btn.danger.solid{background:var(--danger);color:#fff;border-color:transparent}
.btn.sm{height:30px;padding:0 10px;font-size:12px;border-radius:9px}
.grow{flex:1}
.size{display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border-radius:11px;border:1px solid var(--line);background:var(--surface);color:var(--ink-3)}
.size input{width:96px;accent-color:var(--accent)}

.content{position:relative;flex:1;overflow:auto;padding:0 24px 130px;overscroll-behavior:contain}
.grp{margin-bottom:14px;border-radius:18px;transition:background .15s,box-shadow .15s;padding:0 2px 6px}
.grp-h{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:9px;padding:10px 6px 10px 2px;background:var(--grp-bg,var(--bg));cursor:pointer;user-select:none;-webkit-user-select:none}
.grp.boxed{--grp-bg:color-mix(in srgb,var(--surface) 55%,var(--bg));background:var(--grp-bg);border:1px solid var(--line);padding:0 12px 12px}
.grp.boxed>.grp-h{margin:0 -12px;padding:10px 12px 10px 8px;border-radius:17px 17px 0 0}
.grp.boxed.collapsed{padding-bottom:0}
.grp.boxed.collapsed>.grp-h{border-radius:17px}
.grp-sorting>.grp.boxed>:not(.grp-h){display:none}
.grp-sorting>.grp.boxed{padding-bottom:0}
.grp-sorting>.grp.boxed>.grp-h{position:static;border-radius:17px}
.grp-sorting>.grp.boxed>.grp-h .grp-tg{transform:rotate(-90deg)}
.subs{display:flex;flex-direction:column;gap:10px}
.grp>.grid+.subs,.grp>.list+.subs{margin-top:14px}
.grp.boxed.sub{--grp-bg:var(--surface);margin-bottom:0}
.grp.sub>.grp-h{position:static}
.fold.sub{padding-left:28px}
.fold.sub .fgrip{margin-left:-24px;margin-right:6px}
.folder-list.tops-only .fold.sub{display:none}
.mi.sub{padding-left:30px}
.grp.boxed.slot{background:var(--accent-soft);border:1.5px dashed color-mix(in srgb,var(--accent) 55%,transparent)}
.grp.boxed.slot>.grp-h{background:transparent}
.grp-ghost{position:fixed!important;z-index:90;margin:0!important;pointer-events:none;opacity:.78;box-shadow:0 0 0 1.5px var(--accent),var(--shadow-lg);will-change:transform}
.grp-ghost>.grp-h{position:static;border-radius:17px}
.grp-ghost .grp-tg{transform:rotate(-90deg)}
.grp-h:hover .grp-tg{background:var(--surface-2);color:var(--ink)}
.grp.solo>.grp-h{cursor:default;padding-left:4px}
.grp.solo .grp-name{font-size:16px}
.grp-tg{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--ink-3);transition:transform .18s}
.grp-tg:hover{background:var(--surface-2);color:var(--ink)}
.grp.collapsed .grp-tg{transform:rotate(-90deg)}
.grp-name{font-weight:720;font-size:14.5px;letter-spacing:-.02em}
.grp-n{font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.grp-sel{font-size:12px;font-weight:650;color:var(--ink-2);height:28px;padding:0 10px;border-radius:9px;border:1px solid var(--line);background:var(--surface);display:inline-flex;align-items:center;gap:6px}
.grp-sel:hover{color:var(--ink);border-color:var(--line-strong)}
.grp-sel.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
.grp-empty{border:1.5px dashed var(--line-strong);border-radius:14px;padding:22px;text-align:center;color:var(--ink-3);font-size:12.5px;display:flex;align-items:center;justify-content:center;gap:8px}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--thumb,136px),1fr));gap:12px}
.tile{position:relative;border-radius:15px;background:var(--surface);border:1px solid var(--line);overflow:hidden;cursor:pointer;user-select:none;-webkit-user-select:none;transition:border-color .15s,box-shadow .18s,background .15s;contain:layout paint;content-visibility:auto;contain-intrinsic-size:auto calc(var(--thumb,136px) + 38px)}
.tile:hover{border-color:var(--line-strong);box-shadow:var(--shadow)}
.tile-media{aspect-ratio:1;position:relative;overflow:hidden;background:repeating-conic-gradient(var(--chk-b) 0 25%,var(--chk-a) 0 50%) 0 0/16px 16px;transition:transform .2s cubic-bezier(.2,.8,.2,1),border-radius .2s}
.ph{position:absolute;inset:0}
.ph img,.ph video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.ph.loading{background:linear-gradient(100deg,transparent 30%,rgba(127,127,127,.13) 50%,transparent 70%) 0 0/200% 100%;animation:sh 1.3s linear infinite}
@keyframes sh{to{background-position:-200% 0}}
.ph-ico{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:6px;color:var(--ink-3);font:700 10.5px 'JetBrains Mono',monospace}
.ph-ico.audio{color:var(--accent)}
.mbadge{position:absolute;bottom:7px;left:7px;display:flex;gap:4px;align-items:center;font:700 9.5px 'JetBrains Mono',monospace;color:#fff;background:rgba(0,0,0,.5);padding:2px 6px;border-radius:6px}
.tick{position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;border:1.6px solid rgba(255,255,255,.95);background:rgba(20,18,16,.32);display:grid;place-items:center;color:transparent;opacity:0;transition:opacity .15s,background .15s,transform .15s;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.tile:hover .tick{opacity:1}
.zoomb{position:absolute;right:7px;bottom:7px;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:rgba(20,18,16,.66);color:#fff;opacity:0;transform:translateY(3px);transition:opacity .15s,transform .15s;z-index:2}
.zoomb:hover{background:var(--accent);color:var(--accent-ink)}
.tile:hover .zoomb,.row:hover .zoomb{opacity:1;transform:none}
.row-th .zoomb{inset:0;width:auto;height:auto;border-radius:0;background:rgba(20,18,16,.45)}
@media (hover:none){.tile .zoomb{opacity:.9;transform:none;width:26px;height:26px}}
.tile.sel{border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 0 1.5px var(--accent)}
.tile.sel .tile-media{transform:scale(.86);border-radius:11px;box-shadow:0 6px 16px -8px rgba(0,0,0,.35)}
.tile.sel .tick,.row.sel .tick{opacity:1;background:var(--accent);border-color:var(--accent);color:var(--accent-ink);transform:scale(1.04)}
.kbadge{font-size:10px;font-weight:750;padding:2px 7px;border-radius:999px;letter-spacing:.02em;white-space:nowrap}
.tile .kbadge{position:absolute;top:9px;left:9px;background:rgba(20,18,16,.66);color:#fff;z-index:2}
.kbadge.k-emo{--k:#e3a33b}.kbadge.k-add{--k:#4a8fd6}.kbadge.k-mod{--k:#8a6fd8}
.tile .kbadge::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--k);margin-right:5px;vertical-align:1px}
.tile-cap{display:flex;align-items:center;gap:7px;padding:8px 10px 9px;border-top:1px solid var(--line);min-height:36px}
.tile.sel .tile-cap{border-top-color:transparent}
.tile-name{flex:1;min-width:0;font-size:12.5px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hl{background:var(--accent-soft);color:var(--accent);border-radius:3px;padding:0 1px}

.list{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:15px;overflow:hidden;background:var(--surface)}
.row{display:grid;grid-template-columns:24px 46px minmax(0,1fr) auto auto minmax(0,150px);align-items:center;gap:14px;padding:8px 16px 8px 14px;border-bottom:1px solid var(--line);cursor:pointer;user-select:none;-webkit-user-select:none;position:relative;transition:background .12s;content-visibility:auto;contain-intrinsic-size:auto 63px}
.row:last-child{border-bottom:0}
.row:hover{background:var(--surface-2)}
.row.sel{background:var(--accent-soft)}
.row.sel::before{content:'';position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:0 3px 3px 0;background:var(--accent)}
.row .tick{position:static;opacity:1;border-color:var(--line-strong);background:transparent;width:20px;height:20px;backdrop-filter:none;box-shadow:none}
.row-th{width:46px;height:46px;border-radius:10px;overflow:hidden;position:relative;background:repeating-conic-gradient(var(--chk-b) 0 25%,var(--chk-a) 0 50%) 0 0/10px 10px;border:1px solid var(--line)}
.row-th .ph-ico span{display:none}
.row-name{font-weight:630;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row-sub{font-size:11px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.row .kbadge{background:var(--surface-2);color:var(--ink-2);display:inline-flex;align-items:center;gap:5px}
.row .kbadge::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--k)}
.ext{font:650 10px 'JetBrains Mono',monospace;color:var(--ink-3);border:1px solid var(--line);border-radius:6px;padding:2px 6px;text-transform:uppercase;min-width:38px;text-align:center}
.fchip{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-2);min-width:0}
.fchip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fchip.none{color:var(--ink-3)}

.actionbar{position:absolute;left:50%;bottom:22px;transform:translate(-50%,24px) scale(.98);opacity:0;pointer-events:none;transition:opacity .2s,transform .25s cubic-bezier(.2,.8,.2,1);display:flex;align-items:center;gap:2px;padding:6px;border-radius:17px;background:var(--ab-bg);color:var(--ab-ink);box-shadow:var(--shadow-lg);width:max-content;max-width:calc(100% - 24px);flex-wrap:wrap;justify-content:center;z-index:20}
.actionbar.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.ab-count{padding:0 12px 0 12px;font-weight:650;font-size:13px;white-space:nowrap;display:flex;align-items:center;gap:7px}
.ab-count b{color:var(--ab-accent);font-size:15px;font-variant-numeric:tabular-nums}
.ab-btn{height:36px;padding:0 11px;border-radius:11px;display:inline-flex;align-items:center;gap:7px;font-weight:620;font-size:12.5px;color:inherit;opacity:.86;white-space:nowrap}
.ab-btn:hover{background:rgba(127,127,127,.2);opacity:1}
.ab-btn.danger{color:var(--ab-danger);opacity:1}
.ab-sep{width:1px;height:20px;background:currentColor;opacity:.16;margin:0 3px}

.dropzone{position:absolute;inset:8px;z-index:25;border-radius:22px;border:2px dashed var(--accent);background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;place-items:center;pointer-events:none}
.dropzone.show{display:grid;animation:fade .15s}
.dz-card{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--accent);text-align:center}
.dz-card b{font-size:16px;color:var(--ink)}
.dz-card span{font-size:12.5px;color:var(--ink-3)}
.upgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px}
.upitem{display:flex;flex-direction:column;gap:4px;min-width:0}
.upthumb{aspect-ratio:1;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:repeating-conic-gradient(var(--chk-b) 0 25%,var(--chk-a) 0 50%) 0 0/10px 10px;display:grid;place-items:center;color:var(--ink-3)}
.upthumb img{width:100%;height:100%;object-fit:contain}
.upitem small{font-size:10.5px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
.upitem.dup small{color:var(--danger)}
.upmore{display:grid;place-items:center;border-radius:10px;background:var(--surface-2);color:var(--ink-3);font-size:12px;font-weight:650;aspect-ratio:1}
.empty{display:grid;place-items:center;text-align:center;padding:90px 20px;color:var(--ink-3)}
.empty .art{width:76px;height:76px;border-radius:24px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;margin:0 auto 16px;color:var(--accent);box-shadow:var(--shadow)}
.empty h3{color:var(--ink);font-size:16px;font-weight:720;margin-bottom:6px;letter-spacing:-.02em}
.empty p{font-size:13px;max-width:360px;margin:0 auto}
.empty .btn{margin-top:16px}
.spin{width:28px;height:28px;border-radius:50%;border:3px solid var(--surface-3);border-top-color:var(--accent);animation:rot .8s linear infinite;margin:0 auto 14px}
@keyframes rot{to{transform:rotate(360deg)}}

.layer{position:fixed;inset:0;pointer-events:none;z-index:50}
.layer>*{pointer-events:auto}
.scrim{position:fixed;inset:0;background:rgba(12,10,8,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:grid;place-items:center;padding:16px;animation:fade .16s ease}
.modal{width:min(540px,100%);max-height:min(88vh,760px);display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow-lg);animation:pop .2s cubic-bezier(.2,.8,.2,1)}
.m-h{padding:20px 22px 4px;display:flex;gap:12px;align-items:flex-start}
.m-ic{width:38px;height:38px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex:none}
.m-ic.danger{background:rgba(199,56,44,.12);color:var(--danger)}
.m-h h2{font-size:17px;font-weight:760;letter-spacing:-.025em}
.m-h p{color:var(--ink-3);font-size:12.5px;margin-top:3px}
.m-b{padding:14px 22px 6px;overflow:auto;display:flex;flex-direction:column;gap:16px}
.m-f{padding:14px 22px 20px;display:flex;justify-content:flex-end;gap:8px;align-items:center}
.lbl{font-size:12px;font-weight:680;color:var(--ink-2);margin-bottom:7px;display:block}
.input,.select{width:100%;height:40px;padding:0 12px;border-radius:11px;border:1px solid var(--line);background:var(--bg);outline:0;transition:border-color .15s,box-shadow .15s}
.input:focus,.select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.check{display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;color:var(--ink-2)}
.check input{accent-color:var(--accent);width:17px;height:17px;flex:none}
.check b{color:var(--ink);font-weight:620}
.help{font-size:11.5px;color:var(--ink-3);margin-top:6px}
.preview{border:1px solid var(--line);border-radius:13px;overflow:auto;max-height:240px;font-size:12.5px;background:var(--bg)}
.pv-row{display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);gap:8px;padding:7px 12px;border-bottom:1px solid var(--line);align-items:center}
.pv-row:last-child{border-bottom:0}
.pv-row>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-row .old{color:var(--ink-3)}
.pv-row .new{font-weight:620}
.pv-row.same .new{color:var(--ink-3);font-weight:400}
.pv-row.dup .new{color:var(--danger)}
.pv-row .i{color:var(--ink-3)}
.warn{font-size:12px;color:var(--danger);font-weight:600}
.note{font-size:12px;color:var(--ink-3);background:var(--surface-2);border-radius:11px;padding:10px 12px;line-height:1.55}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chipr{height:30px;padding:0 11px;border-radius:9px;border:1px solid var(--line);font-size:12.5px;font-weight:620;color:var(--ink-2);background:var(--surface)}
.chipr.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}

.menu{position:fixed;min-width:236px;max-width:300px;max-height:70vh;overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:15px;padding:6px;box-shadow:var(--shadow-lg);animation:pop .14s cubic-bezier(.2,.8,.2,1)}
.mi{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:10px;text-align:left;font-size:13px;font-weight:580;color:var(--ink-2)}
.mi:hover{background:var(--surface-2);color:var(--ink)}
.mi small{margin-left:auto;color:var(--ink-3);font-size:11.5px;font-variant-numeric:tabular-nums;padding-left:10px}
.mi .lbl2{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msep{height:1px;background:var(--line);margin:5px 6px}
.mh{font-size:10.5px;font-weight:750;color:var(--ink-3);padding:7px 10px 4px;letter-spacing:.08em}

.lb{position:fixed;inset:0;z-index:60;background:rgba(9,8,11,.93);color:#f3f0ea;display:grid;grid-template-rows:auto 1fr;animation:fade .16s ease;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.lb-top{display:flex;align-items:center;gap:12px;padding:14px 16px 10px 22px}
.lb-meta{flex:1;min-width:0}
.lb-meta b{display:block;font-size:16px;font-weight:720;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.lb-name{display:flex;align-items:center;gap:6px;min-width:0;min-height:30px}
.lb-edit{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:rgba(243,240,234,.55);flex:none}
.lb-edit:hover{background:rgba(255,255,255,.12);color:#f3f0ea}
.lb-input{font-size:16px;font-weight:720;font-family:inherit;letter-spacing:-.02em;color:#f3f0ea;background:rgba(255,255,255,.08);border:1.5px solid var(--accent);border-radius:9px;padding:3px 10px;outline:0;width:min(420px,100%)}
.lb-meta span{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:rgba(243,240,234,.6);margin-top:3px}
.lb-btn{height:38px;padding:0 14px;border-radius:11px;display:inline-flex;align-items:center;gap:7px;font-weight:650;font-size:13px;background:rgba(255,255,255,.1);color:#f3f0ea}
.lb-btn:hover{background:rgba(255,255,255,.18)}
.lb-btn.on{background:var(--accent);color:var(--accent-ink)}
.lb-btn.icon{width:38px;padding:0;justify-content:center}
.lb-act{display:flex;gap:8px}
.lb-stage{position:relative;display:grid;place-items:center;min-height:0;padding:6px 76px 46px;touch-action:pan-y}
.lb-frame{max-width:100%;max-height:100%;display:grid;place-items:center;border-radius:12px;overflow:hidden;background:repeating-conic-gradient(#232128 0 25%,#1b1a20 0 50%) 0 0/18px 18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.8)}
.lb-frame img,.lb-frame video{display:block;max-width:calc(100vw - 152px);max-height:calc(100vh - 150px);max-height:calc(100dvh - 150px);object-fit:contain;animation:fade .2s}
.lb-audio{display:flex;flex-direction:column;align-items:center;gap:16px;padding:40px 48px;color:var(--accent)}
.lb-nav{position:absolute;top:50%;width:48px;height:48px;margin-top:-24px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);color:#f3f0ea;transition:background .15s,opacity .15s;z-index:2}
.lb-nav:hover{background:rgba(255,255,255,.18)}
.lb-nav:disabled{opacity:.2;cursor:default}
.lb-nav.prev{left:16px}.lb-nav.next{right:16px}
.lb-count{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);font:600 12px 'JetBrains Mono',monospace;color:rgba(243,240,234,.55)}
.lb .spin{border-color:rgba(255,255,255,.12);border-top-color:var(--accent)}
@media (max-width:880px){
  .lb-top{padding:12px 12px 8px 16px}
  .lb-stage{padding:4px 8px 52px}
  .lb-frame img,.lb-frame video{max-width:calc(100vw - 16px);max-height:calc(100dvh - 160px)}
  .lb-nav{top:auto;bottom:6px;margin-top:0;width:40px;height:40px}
  .lb-nav.prev{left:calc(50% - 110px)}.lb-nav.next{right:calc(50% - 110px)}
  .lb-btn span{display:none}.lb-btn{width:38px;padding:0;justify-content:center}
}
.toasts{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;z-index:80;pointer-events:none}
.toast{background:var(--surface);color:var(--ink);border:1px solid var(--line);box-shadow:var(--shadow-lg);padding:10px 15px 10px 12px;border-radius:13px;font-weight:620;font-size:13px;display:flex;gap:9px;align-items:center;animation:pop .2s cubic-bezier(.2,.8,.2,1);max-width:min(440px,90vw)}
.toast .i{color:var(--accent)}
.toast.err .i{color:var(--danger)}
.tspin{width:15px;height:15px;border-radius:50%;border:2px solid var(--surface-3);border-top-color:var(--accent);animation:rot .8s linear infinite;flex:none}
.toast.out{opacity:0;transform:translateY(6px);transition:.2s}
@keyframes fade{from{opacity:0}}
@keyframes pop{from{opacity:0;transform:translateY(6px) scale(.98)}}

.side-scrim{display:none}
.mobile-only{display:none!important}
@media (max-width:880px){
  .app{grid-template-columns:minmax(0,1fr)}
  .side{position:fixed;top:0;bottom:0;left:0;width:min(300px,86vw);transform:translateX(-102%);transition:transform .25s cubic-bezier(.2,.8,.2,1);box-shadow:var(--shadow-lg)}
  .app.side-open .side{transform:none}
  .app.side-open .side-scrim{display:block;position:fixed;inset:0;background:rgba(12,10,8,.4);z-index:39;animation:fade .2s}
  .mobile-only{display:grid!important}
  .top{padding:14px 14px 10px;gap:10px;flex-wrap:wrap;align-items:center}
  .title{flex:1 1 0}
  .top-actions{order:5;width:100%;justify-content:space-between}
  .top-actions .lbl-t{display:none}
  .top-actions .seg button{padding:0 14px}
  #selMatch,#deselMatch{flex:1 1 0;justify-content:center;padding:0 8px}
  .toolbar .grow{display:none}
  #kindSeg{flex:1 1 auto}
  .title h1{font-size:19px}
  .toolbar{padding:0 14px 12px}
  .content{padding:2px 14px 140px}
  .hide-sm{display:none!important}
  .row{grid-template-columns:22px 42px minmax(0,1fr) auto;gap:11px;padding:8px 12px}
  .row .ext,.row .fchip{display:none}
  .row-th{width:42px;height:42px}
  .ab-btn .t{display:none}
  .ab-btn{padding:0 10px}
}
`;

  // ---------------------------------------------------------------- shell
  const SHELL = `
<div class="app" id="app">
  <div class="side-scrim" id="sideScrim"></div>
  <aside class="side">
    <div class="brand">
      <div class="logo">${ic('layers', 18)}</div>
      <div><b>Asset Drawer</b><small>봇 · 모듈 에셋 정리함</small></div>
    </div>
    <div class="seg" id="srcTabs">
      <button data-tab="char">${ic('user', 15)}봇 <span class="cnt" id="cntChar"></span></button>
      <button data-tab="mod">${ic('box', 15)}모듈 <span class="cnt" id="cntMod"></span></button>
    </div>
    <label class="field">${ic('search', 16)}<input id="srcQ" placeholder="이름으로 찾기" autocomplete="off"></label>
    <div class="src-list" id="srcList"></div>
    <div class="side-folders">
      <div class="side-h"><span>폴더</span><button class="mini" id="addFolder" title="새 폴더">${ic('folderPlus', 17)}</button></div>
      <div class="folder-list" id="folderList"></div>
      <div class="side-foot"><button class="ghost" id="applyOrder" title="폴더 순서대로 실제 에셋 배열을 정렬">${ic('sort', 15)}폴더 순서를 실제 순서에 적용</button></div>
    </div>
  </aside>
  <main class="main">
    <header class="top">
      <button class="icon-btn mobile-only" id="sideBtn" title="목록">${ic('menu')}</button>
      <div class="title">
        <div class="crumb" id="crumb"></div>
        <h1 id="srcTitle">Asset Drawer</h1>
        <div class="stats" id="stats"></div>
      </div>
      <div class="top-actions">
        <div class="seg" id="viewSeg">
          <button data-view="grid" title="그리드">${ic('grid', 15)}<span class="lbl-t">그리드</span></button>
          <button data-view="list" title="목록">${ic('list', 15)}<span class="lbl-t">목록</span></button>
        </div>
        <div class="size hide-sm" id="sizeBox" title="썸네일 크기">${ic('image', 15)}<input type="range" id="thumb" min="88" max="260" step="4"></div>
        <div class="seg" id="themeSeg" title="테마">
          <button data-theme-set="system" title="자동 (리스 테마)">${ic('auto', 15)}<span class="lbl-t">자동</span></button>
          <button data-theme-set="light" title="라이트">${ic('sun', 15)}<span class="lbl-t">라이트</span></button>
          <button data-theme-set="dark" title="다크">${ic('moon', 15)}<span class="lbl-t">다크</span></button>
        </div>
      </div>
      <div class="top-win">
        <button class="icon-btn" id="refresh" title="새로고침">${ic('refresh')}</button>
        <button class="icon-btn close" id="closeBtn" title="닫기 (Esc)">${ic('x')}</button>
      </div>
    </header>
    <div class="toolbar">
      <label class="field">${ic('search', 16)}<input id="q" placeholder="키워드로 검색 · /정규식/" autocomplete="off"><span class="qcount" id="qcount"></span><button class="clr" id="qClear" title="지우기" hidden>${ic('x', 14)}</button><kbd class="hide-sm">/</kbd></label>
      <button class="btn" id="selMatch" title="검색 결과를 모두 선택">${ic('checks', 16)}<span>일치 선택</span></button>
      <button class="btn" id="deselMatch" title="검색 결과를 모두 선택 해제">${ic('x', 16)}<span>일치 해제</span></button>
      <div class="grow"></div>
      <div class="seg" id="kindSeg"></div>
      <button class="btn" id="selMenu">${ic('check', 16)}선택${ic('chevD', 14)}</button>
      <button class="btn primary" id="addAsset" title="이미지·영상·오디오 파일 추가 (그리드로 끌어다 놓아도 돼요)">${ic('plus', 16)}<span>에셋 추가</span></button>
      <input type="file" id="fileIn" multiple accept="image/*,video/*,audio/*" hidden>
    </div>
    <div class="content" id="content"></div>
    <div class="dropzone" id="dropzone"><div class="dz-card">${ic('upload', 28)}<b>여기에 놓으면 에셋으로 추가해요</b><span id="dzTarget"></span></div></div>
    <div class="actionbar" id="actionbar"></div>
  </main>
</div>
<div class="layer" id="layer"></div>
<div class="toasts" id="toasts"></div>`;

  // ---------------------------------------------------------------- render
  function renderAll() {
    if (!mounted) return;
    renderSources();
    renderFolders();
    renderTop();
    renderContent();
    renderActionBar();
  }

  function renderSources() {
    const tab = S.prefs.srcTab;
    $$('#srcTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    $('#cntChar').textContent = S.sources.filter((s) => s.type === 'char').length || '';
    $('#cntMod').textContent = S.sources.filter((s) => s.type === 'mod').length || '';
    const q = S.srcQuery.trim().toLowerCase();
    const list = S.sources.filter((s) => s.type === tab && (!q || s.name.toLowerCase().includes(q)));
    const el = $('#srcList');
    if (S.loading && !S.sources.length) { el.innerHTML = `<div class="side-empty"><div class="spin"></div>불러오는 중</div>`; return; }
    if (!list.length) { el.innerHTML = `<div class="side-empty">${q ? '일치하는 항목 없음' : tab === 'char' ? '봇이 없어요' : '모듈이 없어요'}</div>`; return; }
    el.innerHTML = list.map((s) => `
      <button class="src ${S.src && S.src.key === s.key ? 'on' : ''} ${s.count ? '' : 'zero'}" data-src="${esc(s.key)}">
        <span class="src-av" ${s.type === 'char' && s.image ? `data-av="${esc(s.image)}"` : ''}>${s.type === 'char' ? ic('user', 17) : ic('box', 17)}</span>
        <span class="src-meta"><span class="src-name">${esc(s.name)}</span>
        <span class="src-sub">에셋 ${s.count}${s.current ? '<span class="tag hot">현재</span>' : ''}${s.enabled ? '<span class="tag">활성</span>' : ''}</span></span>
      </button>`).join('');
    $$('[data-av]', el).forEach((av) => {
      const p = av.dataset.av;
      loadTile(p).then(({ thumb }) => { if (thumb) av.innerHTML = `<img src="${esc(thumb)}" alt="">`; });
    });
  }

  function renderFolders() {
    const el = $('#folderList');
    $('#addFolder').disabled = !S.src;
    $('#applyOrder').disabled = !S.src || !S.fdata.folders.length;
    if (!S.src) { el.innerHTML = `<div class="fold-hint">봇이나 모듈을 고르면 폴더를 만들 수 있어요.</div>`; return; }
    const ids = folderIds();
    const base = S.assets.filter(kindOk);
    const cnt = {};
    for (const a of base) {
      const f = folderOf(a, ids); if (!f) continue;
      cnt[f] = (cnt[f] || 0) + 1;
      const p = fget(f).parent; if (p) cnt[p] = (cnt[p] || 0) + 1;
    }
    el.innerHTML = `
      <button class="fold ${S.folder === 'all' ? 'on' : ''}" data-folder="all">${ic('layers', 16)}<span class="fname">전체</span><span class="n">${base.length}</span></button>
      ${treeOrder().map((f) => `
        <div class="fold ${f.parent ? 'sub' : ''} ${S.folder === f.id ? 'on' : ''}" data-folder="${f.id}" data-drop="${f.id}" data-fid="${f.id}" ${f.parent ? `data-parent="${f.parent}"` : ''} role="button" tabindex="0">
          <span class="fgrip" data-grip="${f.id}" title="끌어서 순서 바꾸기">${ic('grip', 16)}</span>
          ${ic('folder', 16)}<span class="fname">${esc(f.name)}</span><span class="n">${cnt[f.id] || 0}</span>
          <button class="fmore" data-fedit="${f.id}" title="폴더 편집">${ic('more', 16)}</button>
        </div>`).join('')}
      ${S.fdata.folders.length ? '' : `<div class="fold-hint">에셋을 골라 폴더로 묶어 보세요. 타일을 여기로 끌어다 놓아도 돼요.</div>`}
      ${S.fdata.folders.length > 1 ? `<div class="fold-hint sm">${ic('grip', 13)}폴더를 끌어서 순서를 바꿀 수 있어요</div>` : ''}`;
  }

  function renderTop() {
    const src = S.src;
    $('#srcTitle').textContent = src ? src.name : 'Asset Drawer';
    $('#crumb').innerHTML = src ? `${src.type === 'char' ? ic('user', 13) + '봇' : ic('box', 13) + '모듈'}${S.folder !== 'all' ? ` <span>›</span> ${esc(fullName(fget(S.folder))).replace(' / ', ' <span>›</span> ')}` : ''}` : '봇 · 모듈 에셋 관리';
    const base = S.assets.filter(kindOk);
    $('#stats').innerHTML = src ? `
      <span class="stat">에셋 <b>${base.length}</b></span>
      <span class="stat">폴더 <b>${S.fdata.folders.length}</b></span>
      ${S.sel.size ? `<span class="stat acc">선택 <b>${S.sel.size}</b></span>` : ''}` : '';
    $$('#themeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.themeSet === S.prefs.theme));
    $$('#viewSeg button').forEach((b) => b.classList.toggle('on', b.dataset.view === S.prefs.view));
    $('#sizeBox').style.display = S.prefs.view === 'grid' ? '' : 'none';
    $('#thumb').value = S.prefs.thumb;
    $('#content').style.setProperty('--thumb', S.prefs.thumb + 'px');
    const ks = $('#kindSeg');
    if (src && src.type === 'char') {
      const c = (k) => S.assets.filter((a) => a.kind === k).length;
      ks.style.display = '';
      ks.innerHTML = [['all', '전체', S.assets.length], ['emo', '감정', c('emo')], ['add', '추가', c('add')]]
        .map(([k, l, n]) => `<button data-kind="${k}" class="${S.kind === k ? 'on' : ''}">${l} <span class="cnt">${n}</span></button>`).join('');
    } else { ks.style.display = 'none'; ks.innerHTML = ''; }
    const on = !!src;
    ['#q', '#selMatch', '#deselMatch', '#selMenu', '#addAsset'].forEach((s) => { $(s).disabled = !on; });
    renderQueryCount();
  }

  function renderQueryCount() {
    const has = !!S.query.trim();
    $('#qClear').hidden = !has;
    if (!has || !S.src) { $('#qcount').innerHTML = ''; $('#selMatch').disabled = $('#deselMatch').disabled = !S.src || !has; return; }
    const v = visibleAssets();
    const s = v.filter((a) => S.sel.has(a.uid)).length;
    $('#qcount').innerHTML = `<b>${v.length}</b>개 일치${s ? ` · ${s} 선택` : ''}`;
    $('#selMatch').disabled = !v.length || s === v.length;
    $('#deselMatch').disabled = !s;
  }

  function hlName(name) {
    const q = S.query.trim();
    if (!q || /^\/.+\/[a-z]*$/.test(q)) return esc(name);
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length);
    const low = name.toLowerCase();
    const marks = new Array(name.length).fill(false);
    for (const t of terms) { let i = low.indexOf(t); while (i >= 0) { for (let k = i; k < i + t.length; k++) marks[k] = true; i = low.indexOf(t, i + t.length); } }
    let out = '', on = false;
    for (let i = 0; i < name.length; i++) {
      if (marks[i] !== on) { out += marks[i] ? '<span class="hl">' : '</span>'; on = marks[i]; }
      out += esc(name[i]);
    }
    return out + (on ? '</span>' : '');
  }

  function renderContent() {
    const el = $('#content');
    if (S.error === 'perm') {
      el.innerHTML = `<div class="empty"><div><div class="art">${ic('eye', 30)}</div><h3>데이터 접근 권한이 필요해요</h3><p>에셋 목록을 읽으려면 리스의 데이터베이스 접근 요청을 허용해 주세요.</p><button class="btn primary" data-act="reload">${ic('refresh', 16)}다시 시도</button></div></div>`;
      return;
    }
    if (S.error) {
      el.innerHTML = `<div class="empty"><div><div class="art">${ic('x', 30)}</div><h3>불러오지 못했어요</h3><p>${esc(S.error)}</p><button class="btn primary" data-act="reload">${ic('refresh', 16)}다시 시도</button></div></div>`;
      return;
    }
    if (S.loading) { el.innerHTML = `<div class="empty"><div><div class="spin"></div><p>에셋 목록을 불러오는 중</p></div></div>`; return; }
    if (!S.src) {
      el.innerHTML = `<div class="empty"><div><div class="art">${ic('layers', 32)}</div><h3>어떤 에셋을 정리할까요?</h3><p>왼쪽에서 봇이나 모듈을 골라 주세요. 감정 · 추가 에셋과 모듈 에셋을 모두 다룰 수 있어요.</p><button class="btn mobile-only" data-act="side" style="margin-inline:auto">${ic('menu', 16)}목록 열기</button></div></div>`;
      return;
    }
    if (!S.assets.length) {
      el.innerHTML = `<div class="empty"><div><div class="art">${ic('image', 30)}</div><h3>에셋이 없어요</h3><p>이 ${S.src.type === 'char' ? '봇' : '모듈'}에는 아직 에셋이 없어요. 파일을 여기로 끌어다 놓거나 버튼으로 추가해 보세요.</p><button class="btn primary" data-act="add" style="margin-inline:auto">${ic('plus', 16)}에셋 추가</button></div></div>`;
      return;
    }
    const vis = visibleAssets();
    const ids = folderIds();
    const hasQ = !!S.query.trim();
    // 묶음 하나 = 폴더에 바로 든 에셋 + 하위 폴더 묶음들
    const node = (f) => {
      const items = vis.filter((a) => folderOf(a, ids) === f.id);
      const subs = f.parent ? [] : kids(f.id).map(node).filter((n) => n.total || !hasQ);
      return { id: f.id, f, items, subs, total: items.length + subs.reduce((t, n) => t + n.total, 0) };
    };
    const solo = S.folder !== 'all';
    const groups = [];
    if (!solo) {
      // 폴더에 넣지 않은 에셋을 맨 위에, 그 아래로 폴더별 묶음
      const un = vis.filter((a) => !folderOf(a, ids));
      if (un.length || !S.fdata.folders.length) groups.push({ id: 'none', f: null, items: un, subs: [], total: un.length, bare: !S.fdata.folders.length });
      for (const f of tops()) { const n = node(f); if (n.total || !hasQ) groups.push(n); }
    } else {
      const f = fget(S.folder);
      groups.push(f ? node(f) : { id: S.folder, f: null, items: vis, subs: [], total: vis.length });
    }
    if (!vis.length && S.query.trim()) {
      el.innerHTML = `<div class="empty"><div><div class="art">${ic('search', 30)}</div><h3>‘${esc(S.query.trim())}’와 일치하는 에셋이 없어요</h3><p>다른 키워드로 찾아보거나 /정규식/ 으로 검색해 보세요.</p></div></div>`;
      S.order = []; S.groups = {};
      return;
    }
    S.order = []; S.groups = {};
    const isChar = S.src.type === 'char';
    const tileHTML = (a) => `<div class="tile ${S.sel.has(a.uid) ? 'sel' : ''}" data-uid="${a.uid}" title="${esc(a.name)}">
              <div class="tile-media">${phHTML(a)}<button class="zoomb" data-zoom="${a.uid}" title="크게 보기">${ic('zoom', 14)}</button></div>
              <span class="tick">${ic('check', 14)}</span>
              ${isChar ? `<span class="kbadge k-${a.kind}">${KIND[a.kind]}</span>` : ''}
              <div class="tile-cap"><span class="tile-name">${hlName(a.name)}</span></div>
            </div>`;
    const rowHTML = (a) => {
      const fid = folderOf(a, ids); const f = fid && fget(fid);
      const info = media.get(a.path);
      const ext = (a.ext || (info && info.ext) || '').toUpperCase();
      return `<div class="row ${S.sel.has(a.uid) ? 'sel' : ''}" data-uid="${a.uid}">
              <span class="tick">${ic('check', 12)}</span>
              <div class="row-th">${phHTML(a)}<button class="zoomb" data-zoom="${a.uid}" title="크게 보기">${ic('zoom', 13)}</button></div>
              <div style="min-width:0"><div class="row-name">${hlName(a.name)}</div><div class="row-sub mono">${esc(a.path)}</div></div>
              ${isChar ? `<span class="kbadge k-${a.kind}">${KIND[a.kind]}</span>` : '<span></span>'}
              <span class="ext" ${a.ext ? '' : 'data-auto'}>${esc(ext || '···')}</span>
              ${f ? `<span class="fchip">${ic('folder', 14)}<span>${esc(fullName(f))}</span></span>` : `<span class="fchip none"><span>—</span></span>`}
            </div>`;
    };
    const allOf = (g) => [...g.items, ...g.subs.flatMap(allOf)];
    // root: 폴더 하나를 열었을 때의 맨 바깥 묶음 — 접지 않고 늘 펼침
    const sec = (g, root) => {
      const uids = allOf(g).map((a) => a.uid);
      S.groups[g.id] = uids;
      const col = !root && !g.bare && !!S.fdata.collapsed[g.id];
      if (!col) S.order.push(...g.items.map((a) => a.uid));
      const allSel = uids.length && uids.every((u) => S.sel.has(u));
      const head = g.bare ? '' : `
        <div class="grp-h">
          ${root ? '' : `<button class="grp-tg" data-collapse="${g.id}" title="접기/펼치기">${ic('chevD', 16)}</button>`}
          <span style="color:var(--ink-3)">${ic(g.f ? 'folder' : 'folderOut', 16)}</span>
          <span class="grp-name">${esc(g.f ? g.f.name : '폴더 밖')}</span><span class="grp-n">${g.total}</span>
          <span class="grow"></span>
          ${uids.length ? `<button class="grp-sel ${allSel ? 'on' : ''}" data-selgrp="${g.id}">${allSel ? ic('check', 14) + '모두 선택됨' : '모두 선택'}</button>` : ''}
          ${g.f ? `<button class="mini" data-fedit="${g.f.id}" title="폴더 편집">${ic('more', 16)}</button>` : ''}
        </div>`;
      let body = '';
      if (!col) {
        if (g.items.length) body += S.prefs.view === 'grid' ? `<div class="grid">${g.items.map(tileHTML).join('')}</div>` : `<div class="list">${g.items.map(rowHTML).join('')}</div>`;
        else if (!g.subs.length) body += `<div class="grp-empty">${ic('drop', 16)}에셋을 이 폴더로 끌어다 놓거나, 선택 후 ‘폴더로’를 눌러 주세요</div>`;
        if (g.subs.length) body += `<div class="subs">${g.subs.map((n) => sec(n, false)).join('')}</div>`;
      }
      const cls = ['grp', g.f && !root ? 'boxed' : '', g.f && g.f.parent && !root ? 'sub' : '', col ? 'collapsed' : '', root ? 'solo' : ''].filter(Boolean).join(' ');
      return `<section class="${cls}" data-drop="${g.id}">${head}${body}</section>`;
    };
    const html = groups.map((g) => sec(g, solo)).join('');
    el.innerHTML = html;
    hydrate(el);
  }

  function refreshSelection() {
    $$('[data-uid]', $('#content')).forEach((n) => n.classList.toggle('sel', S.sel.has(n.dataset.uid)));
    $$('[data-selgrp]', $('#content')).forEach((b) => {
      const list = S.groups[b.dataset.selgrp] || [];
      const all = list.length && list.every((u) => S.sel.has(u));
      b.classList.toggle('on', !!all);
      b.innerHTML = all ? ic('check', 14) + '모두 선택됨' : '모두 선택';
    });
    renderTop();
    renderActionBar();
  }

  function renderActionBar() {
    const el = $('#actionbar');
    const n = S.sel.size;
    el.classList.toggle('show', n > 0);
    if (!n) return;
    const anyFiled = [...S.sel].some((u) => { const a = S.byUid.get(u); return a && folderOf(a); });
    el.innerHTML = `
      <span class="ab-count"><b>${n}</b>개 선택</span>
      <span class="ab-sep"></span>
      <button class="ab-btn" data-act="move" title="폴더로 이동">${ic('folder', 16)}<span class="t">폴더로</span></button>
      ${anyFiled ? `<button class="ab-btn" data-act="unfile" title="폴더에서 빼기">${ic('folderOut', 16)}<span class="t">폴더에서 빼기</span></button>` : ''}
      <button class="ab-btn" data-act="rename" title="이름 변경">${ic('pencil', 16)}<span class="t">이름 변경</span></button>
      <button class="ab-btn" data-act="copy" title="다른 봇·모듈로 이동·복사 (사이드바로 끌어다 놓아도 돼요)">${ic('move', 16)}<span class="t">이동·복사</span></button>
      <button class="ab-btn" data-act="export" title="내보내기 (여러 개면 zip)">${ic('download', 16)}<span class="t">내보내기</span></button>
      <button class="ab-btn danger" data-act="delete" title="삭제">${ic('trash', 16)}<span class="t">삭제</span></button>
      <span class="ab-sep"></span>
      <button class="ab-btn" data-act="clear" title="선택 해제 (Esc)">${ic('x', 16)}</button>`;
  }

  // ---------------------------------------------------------------- theme
  function applyTheme() {
    let t = S.prefs.theme;
    if (t === 'system') {
      if (risuDark != null) t = risuDark ? 'dark' : 'light';
      else t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = t;
    if (mounted) $$('#themeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.themeSet === S.prefs.theme));
  }
  async function detectRisuTheme() {
    try { const c = await R.getColorScheme(); risuDark = c && c.scheme ? c.scheme.type === 'dark' : null; } catch { risuDark = null; }
  }

  // ---------------------------------------------------------------- ui kit
  // type: 'ok' | 'err' | 'busy' (busy는 직접 닫을 때까지 유지)
  function toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast ' + (type === 'err' ? 'err' : '');
    t.innerHTML = (type === 'err' ? ic('x', 16) : type === 'busy' ? '<span class="tspin"></span>' : ic('check', 16)) + `<span class="tmsg">${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 220); };
    if (type !== 'busy') setTimeout(close, type === 'err' ? 4200 : 2400);
    return { set: (m) => { t.querySelector('.tmsg').textContent = m; }, close };
  }

  let menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function openMenu(anchor, html, onPick) {
    closeMenu();
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = html;
    $('#layer').appendChild(m);
    const r = anchor.getBoundingClientRect();
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let x = Math.min(Math.max(8, r.left), innerWidth - mw - 8);
    let y = r.bottom + 6;
    if (y + mh > innerHeight - 8) y = Math.max(8, r.top - mh - 6);
    m.style.left = x + 'px'; m.style.top = y + 'px';
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (!b) return; closeMenu(); onPick(b.dataset.pick); });
    menuEl = m;
    setTimeout(() => document.addEventListener('pointerdown', function h(e) { if (menuEl && !menuEl.contains(e.target)) { closeMenu(); } document.removeEventListener('pointerdown', h, true); }, true), 0);
  }

  let modalOpen = null;
  function modal({ icon = 'sparkle', tone = '', title, desc = '', body = '', ok = '확인', okTone = 'primary', cancel = '취소', extra = '', onMount, onOk }) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'scrim';
      wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
        <div class="m-h"><div class="m-ic ${tone}">${ic(icon, 19)}</div><div><h2>${esc(title)}</h2>${desc ? `<p>${desc}</p>` : ''}</div></div>
        ${body ? `<div class="m-b">${body}</div>` : ''}
        <div class="m-f">${extra}<span class="grow"></span>${cancel ? `<button class="btn" data-m="cancel">${esc(cancel)}</button>` : ''}<button class="btn ${okTone}" data-m="ok">${esc(ok)}</button></div>
      </div>`;
      $('#layer').appendChild(wrap);
      const m = wrap.firstElementChild;
      const done = (v) => { wrap.remove(); modalOpen = null; resolve(v); };
      modalOpen = () => done(null);
      wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) done(null); });
      m.querySelector('[data-m="cancel"]')?.addEventListener('click', () => done(null));
      const okBtn = m.querySelector('[data-m="ok"]');
      okBtn.addEventListener('click', async () => {
        if (okBtn.disabled) return;
        const v = onOk ? await onOk(m) : true;
        if (v === false) return;
        done(v ?? true);
      });
      m.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); okBtn.click(); } });
      onMount && onMount(m, okBtn, done);
      const first = m.querySelector('input.input');
      if (first) setTimeout(() => { first.focus(); first.select(); }, 30);
    });
  }

  async function withBusy(label, fn) {
    if (S.busy) return;
    S.busy = true;
    try { await fn(); } catch (e) { console.error(e); toast(e?.message || String(e), 'err'); } finally { S.busy = false; }
  }

  // ---------------------------------------------------------------- folders

  // 폴더 위치 고르기: 최상위, 또는 최상위 폴더 안(하위 폴더)
  const parentPick = (cur, self, locked) => {
    const opts = tops().filter((t) => t.id !== self);
    if (!opts.length && !cur) return '';
    return `<div><label class="lbl">위치</label><select class="select" id="fParent" ${locked ? 'disabled' : ''}>
      <option value="">최상위 폴더</option>
      ${opts.map((t) => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>‘${esc(t.name)}’ 안 (하위 폴더)</option>`).join('')}
    </select>${locked ? '<p class="help">하위 폴더가 있는 폴더는 다른 폴더 안으로 넣을 수 없어요.</p>' : ''}</div>`;
  };

  async function createFolder(withUids) {
    if (!S.src) return;
    // 폴더 하나를 열어 둔 상태면 그 폴더(하위 폴더면 그 위 폴더) 안에 만드는 것을 기본으로
    const cur = S.folder !== 'all' && fget(S.folder);
    const defParent = cur ? (cur.parent || cur.id) : '';
    const n = withUids ? withUids.length : 0;
    const res = await modal({
      icon: 'folderPlus', title: '새 폴더', desc: n ? `선택한 에셋 ${n}개를 이 폴더에 바로 넣을게요.` : '이 ' + (S.src.type === 'char' ? '봇' : '모듈') + '에서만 쓰는 폴더예요.',
      body: `<div><label class="lbl">이름</label><input class="input" id="fName" placeholder="예: 겨울 의상" maxlength="40"></div>${parentPick(defParent)}`,
      ok: '만들기',
      onOk: (m) => {
        const name = m.querySelector('#fName').value.trim();
        if (!name) { m.querySelector('#fName').focus(); return false; }
        return { name, parent: m.querySelector('#fParent')?.value || '' };
      },
    });
    if (!res) return null;
    const f = { id: rid(), name: res.name };
    if (res.parent && fget(res.parent)) f.parent = res.parent;
    S.fdata.folders.push(f);
    if (withUids && withUids.length) { assignFolder(withUids, f.id, true); S.sel.clear(); }
    await saveF();
    renderAll();
    toast(`‘${fullName(f)}’ 폴더를 만들었어요`);
    return f;
  }

  async function editFolder(id) {
    const f = S.fdata.folders.find((x) => x.id === id);
    if (!f) return;
    const res = await modal({
      icon: 'folder', title: '폴더 편집',
      desc: f.parent ? '하위 폴더를 지우면 안에 있던 에셋은 위 폴더로 옮겨져요. 에셋 자체는 지워지지 않아요.'
        : kids(f.id).length ? '폴더를 지우면 바로 들어 있던 에셋은 폴더 밖으로 나오고, 하위 폴더는 최상위 폴더가 돼요. 에셋 자체는 지워지지 않아요.'
        : '폴더를 지워도 안에 있던 에셋은 지워지지 않고 폴더 밖으로 나와요. 순서는 폴더를 끌어서 바꿀 수 있어요.',
      body: `<div><label class="lbl">이름</label><input class="input" id="fName" value="${esc(f.name)}" maxlength="40"></div>${parentPick(f.parent || '', f.id, kids(f.id).length > 0)}`,
      extra: `<button class="btn danger" data-del>${ic('trash', 15)}폴더 삭제</button>`,
      ok: '저장',
      onMount: (m, okBtn, done) => {
        m.querySelector('[data-del]').addEventListener('click', () => done('delete'));
      },
      onOk: (m) => {
        const name = m.querySelector('#fName').value.trim();
        if (!name) return false;
        const sel = m.querySelector('#fParent');
        return { name, parent: sel && !sel.disabled ? sel.value : null };
      },
    });
    if (res === 'delete') {
      const up = f.parent && fget(f.parent) ? f.parent : null;
      S.fdata.folders = S.fdata.folders.filter((x) => x.id !== id);
      for (const x of S.fdata.folders) if (x.parent === id) delete x.parent;
      for (const k of Object.keys(S.fdata.map)) if (S.fdata.map[k] === id) { if (up) S.fdata.map[k] = up; else delete S.fdata.map[k]; }
      delete S.fdata.collapsed[id];
      if (S.folder === id) S.folder = up || 'all';
      await saveF(); renderAll(); toast(`‘${f.name}’ 폴더를 지웠어요`);
      return;
    }
    if (!res) return;
    f.name = res.name;
    if (res.parent !== null) { if (res.parent && res.parent !== f.id && fget(res.parent)) f.parent = res.parent; else delete f.parent; }
    tidyTree(S.fdata);
    await saveF(); renderAll();
  }

  function assignFolder(uids, fid, silent) {
    const assets = uids.map((u) => S.byUid.get(u)).filter(Boolean);
    for (const a of assets) { if (fid === 'none') delete S.fdata.map[a.fkey]; else S.fdata.map[a.fkey] = fid; }
    if (silent) return;
    S.sel.clear();
    saveF();
    renderAll();
    const f = S.fdata.folders.find((x) => x.id === fid);
    toast(fid === 'none' ? `${assets.length}개를 폴더 밖으로 뺐어요` : `${assets.length}개를 ‘${fullName(f)}’로 옮겼어요`);
  }

  // 사이드바 폴더 순서: 끌어서 정렬 (마우스는 줄 전체, 터치는 손잡이)
  // 끄는 동안 반투명한 사본이 포인터를 따라오고, 원래 줄은 빈 자리가 되어 들어갈 위치를 보여 줌.
  function bindFolderSort() {
    const list = $('#folderList');
    let st = null;
    let settling = false;
    let swallowClick = false;
    const folds = () => $$('.fold[data-fid]', list);
    // 줄이 자리를 옮길 때 원래 위치에서 새 위치로 미끄러지듯 움직이게 함
    const slide = (els, tops) => {
      for (const el of els) {
        const d = tops.get(el) - el.offsetTop;
        if (!d) continue;
        el.style.transition = 'none';
        el.style.transform = `translateY(${d}px)`;
        el.getBoundingClientRect();
        el.style.transition = 'transform .18s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      }
    };
    const lift = (e) => {
      const r = st.item.getBoundingClientRect();
      const g = st.item.cloneNode(true);
      g.classList.add('fold-ghost');
      g.classList.remove('on');
      g.removeAttribute('data-fid'); g.removeAttribute('data-drop'); g.removeAttribute('data-folder');
      Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      document.body.appendChild(g);
      st.on = true; st.ghost = g; st.dx = e.clientX - r.left; st.dy = e.clientY - r.top;
      try { list.setPointerCapture(e.pointerId); } catch {}
      st.item.classList.add('slot');
      list.classList.add('sorting');
      // 최상위 폴더를 끄는 동안에는 하위 폴더 줄을 숨겨서 최상위끼리만 자리를 고르게 함
      st.parent = st.item.dataset.parent || null;
      if (!st.parent) list.classList.add('tops-only');
      document.body.classList.add('fold-dragging');
    };
    // 같이 순서를 바꿀 무리: 최상위끼리, 또는 같은 위 폴더의 하위 폴더끼리
    const peers = () => folds().filter((x) => (x.dataset.parent || null) === st.parent);
    list.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || settling) return;
      const grip = e.target.closest('[data-grip]');
      const item = e.target.closest('.fold[data-fid]');
      if (!item || e.target.closest('[data-fedit]')) return;
      if (!grip && e.pointerType === 'touch') return;
      st = { item, pid: e.pointerId, x: e.clientX, y: e.clientY, on: false };
      if (grip) { e.preventDefault(); lift(e); }
    });
    list.addEventListener('pointermove', (e) => {
      if (!st || e.pointerId !== st.pid) return;
      if (!st.on) { if (Math.hypot(e.clientX - st.x, e.clientY - st.y) < 5) return; lift(e); }
      st.ghost.style.transform = `translate(${e.clientX - st.dx - parseFloat(st.ghost.style.left)}px,${e.clientY - st.dy - parseFloat(st.ghost.style.top)}px) scale(1.02)`;
      // 포인터 위치를 목록 안 좌표로 바꿔서, 움직이는 중인 줄의 transform에 휘둘리지 않게 비교
      const lr = list.getBoundingClientRect();
      const y = e.clientY - lr.top - list.clientTop + list.scrollTop;
      const all = peers(), others = all.filter((x) => x !== st.item);
      if (others.length) {
        const before = others.find((it) => y < it.offsetTop + it.offsetHeight / 2);
        const last = others[others.length - 1];
        if (all.indexOf(st.item) !== (before ? others.indexOf(before) : others.length)) {
          const tops = new Map(all.map((el) => [el, el.offsetTop]));
          if (before) list.insertBefore(st.item, before); else last.after(st.item);
          slide(others, tops);
        }
      }
      if (e.clientY < lr.top + 24) list.scrollTop -= 8; else if (e.clientY > lr.bottom - 24) list.scrollTop += 8;
    });
    const end = (e) => {
      if (!st || e.pointerId !== st.pid) return;
      const ids = st.on ? peers().map((x) => x.dataset.fid) : null;
      const { item, on, ghost } = st; st = null;
      if (!on) return;
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
      settling = true;
      // 사본이 빈 자리로 내려앉은 뒤 정리
      const r = item.getBoundingClientRect();
      ghost.style.transition = 'transform .16s cubic-bezier(.2,.8,.2,1), opacity .16s';
      ghost.style.transform = `translate(${r.left - parseFloat(ghost.style.left)}px,${r.top - parseFloat(ghost.style.top)}px)`;
      ghost.style.opacity = '1';
      setTimeout(() => {
        ghost.remove();
        item.classList.remove('slot');
        list.classList.remove('sorting', 'tops-only');
        document.body.classList.remove('fold-dragging');
        folds().forEach((el) => { el.style.transition = el.style.transform = ''; });
        settling = false;
        if (reorderPeers(ids)) saveF();
        renderAll();
      }, 170);
    };
    list.addEventListener('pointerup', end);
    list.addEventListener('pointercancel', end);
    // 끌기를 마친 뒤 따라오는 클릭이 폴더를 여는 것을 막음
    list.addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }

  function moveMenu(anchor) {
    const items = treeOrder().map((f) => `<button class="mi ${f.parent ? 'sub' : ''}" data-pick="${f.id}">${ic('folder', 16)}<span class="lbl2">${esc(f.name)}</span></button>`).join('');
    openMenu(anchor, `<div class="mh">폴더로 이동</div>${items || '<div class="fold-hint">아직 폴더가 없어요</div>'}<div class="msep"></div><button class="mi" data-pick="__new">${ic('folderPlus', 16)}새 폴더 만들어 넣기</button>`,
      (v) => { if (v === '__new') createFolder([...S.sel]); else assignFolder([...S.sel], v); });
  }

  // ---------------------------------------------------------------- selection
  function toggleUid(u, ev) {
    if (ev && ev.shiftKey && S.anchor && S.order.includes(S.anchor) && S.order.includes(u)) {
      const a = S.order.indexOf(S.anchor), b = S.order.indexOf(u);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      const on = S.sel.has(S.anchor);
      for (let i = lo; i <= hi; i++) on ? S.sel.add(S.order[i]) : S.sel.delete(S.order[i]);
    } else {
      S.sel.has(u) ? S.sel.delete(u) : S.sel.add(u);
      S.anchor = u;
    }
    refreshSelection();
  }

  function selectMenu(anchor) {
    const ids = folderIds();
    const base = S.assets.filter(kindOk);
    const vis = visibleAssets();
    const un = base.filter((a) => !folderOf(a, ids));
    const filed = base.length - un.length;
    openMenu(anchor, `
      <div class="mh">일괄 선택</div>
      <button class="mi" data-pick="all">${ic('checks', 16)}<span class="lbl2">전체 선택 · 폴더 안 포함</span><small>${base.length}</small></button>
      <button class="mi" data-pick="unfiled">${ic('folderOut', 16)}<span class="lbl2">폴더 밖 에셋만 선택</span><small>${un.length}</small></button>
      <button class="mi" data-pick="filed">${ic('folder', 16)}<span class="lbl2">폴더 안 에셋만 선택</span><small>${filed}</small></button>
      <div class="msep"></div>
      <button class="mi" data-pick="visible">${ic('eye', 16)}<span class="lbl2">지금 보이는 에셋 추가 선택</span><small>${vis.length}</small></button>
      <button class="mi" data-pick="invert">${ic('invert', 16)}<span class="lbl2">보이는 범위 선택 반전</span></button>
      <div class="msep"></div>
      <button class="mi" data-pick="none">${ic('x', 16)}<span class="lbl2">선택 해제</span><small>${S.sel.size || ''}</small></button>`,
      (v) => {
        if (v === 'all') S.sel = new Set(base.map((a) => a.uid));
        else if (v === 'unfiled') S.sel = new Set(un.map((a) => a.uid));
        else if (v === 'filed') S.sel = new Set(base.filter((a) => folderOf(a, ids)).map((a) => a.uid));
        else if (v === 'visible') vis.forEach((a) => S.sel.add(a.uid));
        else if (v === 'invert') vis.forEach((a) => (S.sel.has(a.uid) ? S.sel.delete(a.uid) : S.sel.add(a.uid)));
        else if (v === 'none') S.sel.clear();
        refreshSelection();
      });
  }

  const selectedAssets = () => S.assets.filter((a) => S.sel.has(a.uid));

  // ---------------------------------------------------------------- actions
  async function doDelete() {
    const items = selectedAssets();
    if (!items.length) return;
    const names = items.slice(0, 6).map((a) => esc(a.name)).join(', ') + (items.length > 6 ? ` 외 ${items.length - 6}개` : '');
    const ok = await modal({
      icon: 'trash', tone: 'danger', title: `에셋 ${items.length}개 삭제`,
      desc: `${names}<br>이 ${S.src.type === 'char' ? '봇' : '모듈'}의 에셋 목록에서 빠져요. 되돌릴 수 없어요.`,
      ok: '삭제', okTone: 'danger solid',
    });
    if (!ok) return;
    await withBusy('delete', async () => {
      const byKind = {};
      for (const a of items) (byKind[a.kind] ||= new Set()).add(a.idx);
      await mutateSource(S.src, (lists) => {
        for (const k of Object.keys(byKind)) lists[k] = (lists[k] || []).filter((_, i) => !byKind[k].has(i));
      });
      S.sel.clear(); buildAssets(); renderAll();
      toast(`${items.length}개를 삭제했어요`);
    });
  }

  // 이름 변경 결과를 리스에 반영하고 폴더 배정도 새 이름으로 옮김
  async function applyRenames(ch) {
    ch = ch.filter((o) => o.nn && o.nn !== o.a.name);
    if (!ch.length) return 0;
    await mutateSource(S.src, (lists) => { for (const o of ch) { const t = lists[o.a.kind] && lists[o.a.kind][o.a.idx]; if (t) t[0] = o.nn; } });
    const moved = new Set(ch.map((o) => o.a.uid));
    for (const o of ch) {
      const fid = S.fdata.map[o.a.fkey];
      if (!fid) continue;
      S.fdata.map[o.a.kind + '::' + o.nn] = fid;
      if (!S.assets.some((x) => x.fkey === o.a.fkey && !moved.has(x.uid))) delete S.fdata.map[o.a.fkey];
    }
    await saveF();
    buildAssets(); renderAll();
    return ch.length;
  }

  const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 키워드를 지운 뒤 겹치거나 양 끝에 남은 구분자(_ - . 공백) 정리
  const tidySep = (t) => t.replace(/[\s_\-.]{2,}/g, (m) => (/[_\-.]/.exec(m) || [' '])[0]).replace(/^[\s_\-.]+|[\s_\-.]+$/g, '');

  async function doRename(only) {
    const items = only ? [only] : selectedAssets();
    if (!items.length) return;
    const single = items.length === 1;
    let mode = single ? 'one' : 'replace';
    let pos = 'end', cas = 'lower';
    const compute = (m) => {
      const v = (id) => m.querySelector('#' + id);
      const out = [];
      let n = +(v('rStart').value || 1); const pad = +(v('rPad').value || 0);
      let re = null, err = '';
      const cs = (id) => v(id) && v(id).checked;
      if (mode === 'replace' && v('rFind').value) {
        try { re = cs('rRegex') ? new RegExp(v('rFind').value, cs('rCase') ? 'g' : 'gi') : new RegExp(escRe(v('rFind').value), cs('rCase') ? 'g' : 'gi'); }
        catch { err = '정규식이 올바르지 않아요'; }
      }
      const rmWords = mode === 'remove' ? v('rDel').value.split(',').map((x) => x.trim()).filter(Boolean) : [];
      const ins = v('rIns').value, anchor = v('rAnchor').value;
      if (mode === 'insert' && (pos === 'before' || pos === 'after') && ins && !anchor) err = '기준이 되는 글자를 입력해 주세요';
      for (const a of items) {
        let nn = a.name;
        if (mode === 'one') nn = v('rOne').value;
        else if (mode === 'replace' && re) nn = cs('rRegex') ? a.name.replace(re, v('rRep').value) : a.name.replace(re, () => v('rRep').value);
        else if (mode === 'remove') {
          for (const w of rmWords) nn = nn.replace(new RegExp(escRe(w), cs('rDelCase') ? 'g' : 'gi'), '');
          if (rmWords.length && cs('rTidy')) nn = tidySep(nn);
        } else if (mode === 'insert' && ins) {
          const has = nn.toLowerCase().includes(ins.toLowerCase());
          if (!(cs('rSkipHas') && has)) {
            if (pos === 'start') nn = ins + nn;
            else if (pos === 'end') nn = nn + ins;
            else if (anchor) {
              const i = nn.toLowerCase().indexOf(anchor.toLowerCase());
              if (i >= 0) nn = pos === 'before' ? nn.slice(0, i) + ins + nn.slice(i) : nn.slice(0, i + anchor.length) + ins + nn.slice(i + anchor.length);
            }
          }
        } else if (mode === 'number') {
          const base = v('rBase').value; const num = String(n++).padStart(pad, '0');
          nn = (base.includes('{n}') ? base.split('{n}').join(num) : base + num).replace(/\{name\}/g, a.name);
        } else if (mode === 'case') {
          if (cas === 'lower') nn = nn.toLowerCase();
          else if (cas === 'upper') nn = nn.toUpperCase();
          else nn = nn.toLowerCase().replace(/(^|[\s_\-.])(\p{L})/gu, (_, s1, c) => s1 + c.toUpperCase());
        }
        out.push({ a, nn: nn.trim() });
      }
      const selSet = new Set(items.map((a) => a.uid));
      const taken = {};
      for (const a of S.assets) if (!selSet.has(a.uid)) (taken[a.kind] ||= new Set()).add(a.name);
      const seen = {};
      let dups = 0, empty = 0;
      for (const o of out) {
        const t = taken[o.a.kind] ||= new Set(); const s2 = seen[o.a.kind] ||= new Set();
        o.dup = o.nn !== o.a.name && (t.has(o.nn) || s2.has(o.nn)); s2.add(o.nn);
        if (o.dup) dups++;
        if (!o.nn) empty++;
      }
      return { out, err, dups, empty, changed: out.filter((o) => o.nn !== o.a.name).length };
    };
    const tab = (k, label) => `<button class="chipr ${mode === k ? 'on' : ''}" data-mode="${k}">${label}</button>`;
    const pane = (k, html) => `<div data-pane="${k}" ${mode === k ? '' : 'hidden'}>${html}</div>`;
    const body = `
      <div class="chips" id="rModes">
        ${single ? tab('one', '이름 고치기') : ''}${tab('replace', '바꾸기')}${tab('remove', '지우기')}${tab('insert', '넣기')}${tab('number', '번호 매기기')}${tab('case', '대소문자')}
      </div>
      ${pane('one', `<label class="lbl">새 이름</label><input class="input" id="rOne" value="${esc(items[0].name)}" maxlength="200">`)}
      ${pane('replace', `
        <div class="row2"><div><label class="lbl">찾을 글자</label><input class="input" id="rFind" placeholder="예: winter"></div>
        <div><label class="lbl">바꿀 글자</label><input class="input" id="rRep" placeholder="예: summer"></div></div>
        <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">
          <label class="check"><input type="checkbox" id="rCase">대소문자 구분</label>
          <label class="check"><input type="checkbox" id="rRegex">정규식 ($1 등 사용 가능)</label>
        </div>`)}
      ${pane('remove', `
        <label class="lbl">지울 키워드</label><input class="input" id="rDel" placeholder="예: winter_, _old  (쉼표로 여러 개)">
        <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">
          <label class="check"><input type="checkbox" id="rTidy" checked>남는 _ - . 공백 정리</label>
          <label class="check"><input type="checkbox" id="rDelCase">대소문자 구분</label>
        </div>`)}
      ${pane('insert', `
        <label class="lbl">넣을 글자</label><input class="input" id="rIns" placeholder="예: fuyuka_">
        <label class="lbl" style="margin-top:12px">위치</label>
        <div class="chips" id="rPos">
          <button class="chipr" data-pos="start">맨 앞</button><button class="chipr on" data-pos="end">맨 뒤</button>
          <button class="chipr" data-pos="before">특정 글자 앞</button><button class="chipr" data-pos="after">특정 글자 뒤</button>
        </div>
        <div id="rAnchorBox" hidden style="margin-top:10px"><input class="input" id="rAnchor" placeholder="기준 글자 (처음 나오는 곳에 넣어요)"></div>
        <label class="check" style="margin-top:10px"><input type="checkbox" id="rSkipHas" checked>이미 들어 있는 이름은 건너뛰기</label>`)}
      ${pane('number', `
        <label class="lbl">이름 형식</label><input class="input" id="rBase" value="{name}_">
        <div class="help">{n} 자리에 번호가 들어가요. {n}이 없으면 끝에 붙고, {name}은 원래 이름이에요.</div>
        <div class="row2" style="margin-top:10px"><div><label class="lbl">시작 번호</label><input class="input" id="rStart" type="number" value="1"></div>
        <div><label class="lbl">자릿수</label><input class="input" id="rPad" type="number" value="2" min="0" max="6"></div></div>`)}
      ${pane('case', `<div class="chips" id="rCaseMode">
          <button class="chipr on" data-cas="lower">소문자</button><button class="chipr" data-cas="upper">대문자</button><button class="chipr" data-cas="title">단어 첫 글자만 대문자</button></div>`)}
      <div><label class="lbl" id="pvLbl">미리보기</label><div class="preview" id="pv"></div><div class="warn" id="pvWarn" style="margin-top:8px"></div></div>`;
    let last = null;
    const res = await modal({
      icon: 'pencil', title: single ? '이름 변경' : `이름 일괄 변경 · ${items.length}개`,
      desc: '감정 에셋 이름은 {{emotion}}·로어북에서 쓰일 수 있으니 참조도 함께 확인해 주세요.',
      body, ok: '적용',
      onMount: (m, okBtn) => {
        const upd = () => {
          last = compute(m);
          m.querySelector('#pvLbl').textContent = `미리보기 · ${last.changed}개 변경`;
          m.querySelector('#pv').innerHTML = last.out.slice(0, 200).map((o) => `<div class="pv-row ${o.nn === o.a.name ? 'same' : ''} ${o.dup ? 'dup' : ''}"><span class="old">${esc(o.a.name)}</span>${ic('chevR', 14)}<span class="new">${esc(o.nn || '(빈 이름)')}</span></div>`).join('');
          const w = [];
          if (last.err) w.push(last.err);
          if (last.empty) w.push(`빈 이름 ${last.empty}개`);
          if (last.dups) w.push(`겹치는 이름 ${last.dups}개 (적용은 가능)`);
          m.querySelector('#pvWarn').textContent = w.join(' · ');
          okBtn.disabled = !!last.err || !!last.empty || !last.changed;
        };
        const pick = (sel, attr, fn) => m.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => {
          m.querySelectorAll(sel).forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset[attr]); upd();
        }));
        pick('[data-mode]', 'mode', (k) => {
          mode = k;
          m.querySelectorAll('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== mode));
          const inp = m.querySelector(`[data-pane="${mode}"] input.input`); if (inp) { inp.focus(); inp.select(); }
        });
        pick('[data-pos]', 'pos', (k) => { pos = k; m.querySelector('#rAnchorBox').hidden = !(k === 'before' || k === 'after'); });
        pick('[data-cas]', 'cas', (k) => { cas = k; });
        m.addEventListener('input', upd);
        m.addEventListener('change', upd);
        upd();
      },
      onOk: () => last,
    });
    if (!res) return;
    await withBusy('rename', async () => {
      const n = await applyRenames(res.out);
      toast(single ? `‘${res.out[0].nn}’로 바꿨어요` : `${n}개의 이름을 바꿨어요`);
    });
  }

  async function resolveExt(a) {
    if (a.ext) return a.ext;
    const info = await loadMedia(a.path);
    return (info && info.ext) || 'png';
  }

  async function doCopy(preset = {}) {
    const items = preset.uids ? S.assets.filter((a) => preset.uids.includes(a.uid)) : selectedAssets();
    if (!items.length) return;
    const others = S.sources.filter((s) => s.key !== S.src.key);
    if (!others.length) { toast('보낼 다른 봇이나 모듈이 없어요', 'err'); return; }
    const opt = (s) => `<option value="${esc(s.key)}">${esc(s.name)}${s.current ? ' (현재)' : ''}</option>`;
    const chars = others.filter((s) => s.type === 'char'), mods = others.filter((s) => s.type === 'mod');
    const def = preset.target && others.some((s) => s.key === preset.target) ? preset.target : (mods[0] || chars[0]).key;
    let move = preset.move ?? true;
    const res = await modal({
      icon: 'move', title: `다른 봇·모듈로 · ${items.length}개`, desc: '파일은 그대로 두고 에셋 목록만 옮기거나 복사해요. 저장 공간을 더 쓰지 않아요.',
      body: `
        <div class="chips" id="cMode">
          <button class="chipr ${move ? 'on' : ''}" data-mode="move">${'이동'} · 원본에서 빼기</button>
          <button class="chipr ${move ? '' : 'on'}" data-mode="copy">복사 · 원본 유지</button>
        </div>
        <div><label class="lbl">보낼 곳</label><select class="select" id="cTarget">
          ${mods.length ? `<optgroup label="모듈">${mods.map(opt).join('')}</optgroup>` : ''}
          ${chars.length ? `<optgroup label="봇">${chars.map(opt).join('')}</optgroup>` : ''}
        </select></div>
        <div id="cKindBox"><label class="lbl">봇의 어느 목록에 넣을까요?</label><div class="chips" id="cKind">
          ${S.src.type === 'char' ? '<button class="chipr on" data-k="keep">원래 종류 유지</button>' : ''}
          <button class="chipr ${S.src.type === 'char' ? '' : 'on'}" data-k="emo">감정</button>
          <button class="chipr" data-k="add">추가 에셋</button>
        </div></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <label class="check"><input type="checkbox" id="cFolders" checked><span><b>폴더 구조도 함께</b> · 같은 이름 폴더로 정리</span></label>
          <label class="check"><input type="checkbox" id="cSkip" checked><span><b>같은 이름은 건너뛰기</b> · 이동이면 원본에 남아요</span></label>
        </div>`,
      ok: move ? '이동' : '복사',
      onMount: (m, okb) => {
        const sel = m.querySelector('#cTarget');
        sel.value = def;
        const kb = m.querySelector('#cKindBox');
        const upd = () => { const t = S.sources.find((s) => s.key === sel.value); kb.hidden = !t || t.type !== 'char'; };
        sel.addEventListener('change', upd); upd();
        m.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => m.querySelectorAll('[data-k]').forEach((x) => x.classList.toggle('on', x === b))));
        m.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
          move = b.dataset.mode === 'move';
          m.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b));
          okb.textContent = move ? '이동' : '복사';
        }));
      },
      onOk: (m) => ({
        target: m.querySelector('#cTarget').value,
        kind: (m.querySelector('[data-k].on') || {}).dataset?.k || 'add',
        folders: m.querySelector('#cFolders').checked,
        skip: m.querySelector('#cSkip').checked,
        move,
      }),
    });
    if (!res) return;
    await withBusy('copy', async () => {
      const tgt = S.sources.find((s) => s.key === res.target);
      if (!tgt) throw new Error('보낼 곳을 찾을 수 없어요');
      const ids = folderIds();
      const entries = [];
      for (const a of items) {
        let tk = tgt.type === 'mod' ? 'mod' : (res.kind === 'keep' ? (a.kind === 'mod' ? 'add' : a.kind) : res.kind);
        const ext = tk === 'emo' ? '' : await resolveExt(a);
        const fid = folderOf(a, ids);
        entries.push({ a, tk, ext, folder: fid ? S.fdata.folders.find((f) => f.id === fid) : null });
      }
      let added = 0, skipped = 0;
      await mutateSource(tgt, (lists) => {
        for (const e of entries) {
          const L = lists[e.tk] || (lists[e.tk] = []);
          if (res.skip && L.some((t) => t[0] === e.a.name)) { skipped++; continue; }
          L.push(e.tk === 'emo' ? [e.a.name, e.a.path] : [e.a.name, e.a.path, e.ext]);
          e.ok = true; added++;
        }
      });
      if (res.folders && entries.some((e) => e.ok && e.folder)) {
        const td = normF(await store.get('ad.f.' + tgt.key, null));
        for (const e of entries) {
          if (!e.ok || !e.folder) continue;
          // 이름으로 같은 폴더를 찾고, 없으면 만듦 (하위 폴더면 위 폴더부터)
          const ensure = (name, parent) => {
            let tf = td.folders.find((f) => f.name === name && (f.parent || null) === (parent || null));
            if (!tf) { tf = { id: rid(), name }; if (parent) tf.parent = parent; td.folders.push(tf); }
            return tf;
          };
          const up = e.folder.parent && fget(e.folder.parent);
          const tf = up ? ensure(e.folder.name, ensure(up.name, null).id) : ensure(e.folder.name, null);
          td.map[e.tk + '::' + e.a.name] = tf.id;
        }
        await store.set('ad.f.' + tgt.key, td);
      }
      if (res.move) {
        const okSet = entries.filter((e) => e.ok);
        const byKind = {};
        for (const e of okSet) (byKind[e.a.kind] ||= new Set()).add(e.a.idx);
        if (okSet.length) await mutateSource(S.src, (lists) => { for (const k of Object.keys(byKind)) lists[k] = (lists[k] || []).filter((_, i) => !byKind[k].has(i)); });
        S.sel.clear();
        buildAssets();
      }
      renderAll();
      toast(`‘${tgt.name}’로 ${added}개 ${res.move ? '옮겼어요' : '복사했어요'}${skipped ? ` · ${skipped}개 건너뜀` : ''}`);
    });
  }

  async function applyOrder() {
    if (!S.src || !S.fdata.folders.length) return;
    const ok = await modal({
      icon: 'sort', title: '폴더 순서를 실제 순서에 적용',
      desc: '리스 안의 에셋 배열을 폴더 순서대로 다시 정렬해요. 폴더 밖 에셋은 맨 뒤로 가고, 같은 폴더 안에서는 기존 순서를 지켜요.',
      body: `<div class="note">${treeOrder().map((f, i) => `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:10px"><b style="color:var(--ink-3)">${i + 1}</b>${ic('folder', 14)}${esc(fullName(f))}</span>`).join('')}<span style="display:inline-flex;gap:6px;align-items:center"><b style="color:var(--ink-3)">${S.fdata.folders.length + 1}</b>폴더 밖</span></div>`,
      ok: '정렬하기',
    });
    if (!ok) return;
    await withBusy('order', async () => {
      const ids = folderIds();
      // 위 폴더 → 그 폴더에 바로 든 에셋 → 하위 폴더들 순서
      const order = treeOrder().map((f) => f.id);
      const rank = (fkey) => { const fid = S.fdata.map[fkey]; const i = fid && ids.has(fid) ? order.indexOf(fid) : -1; return i < 0 ? order.length : i; };
      await mutateSource(S.src, (lists) => {
        for (const k of Object.keys(lists)) {
          lists[k] = (lists[k] || []).map((t, i) => ({ t, i, r: rank(k + '::' + t[0]) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.t);
        }
      });
      S.sel.clear(); buildAssets(); renderAll();
      toast('폴더 순서대로 정렬했어요');
    });
  }

  // ---------------------------------------------------------------- add assets
  const MEDIA_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|mp4|webm|mov|mp3|wav|ogg|m4a|flac)$/i;
  const fileBase = (f) => f.name.replace(/\.[^.]+$/, '').trim() || 'asset';
  const fileExt = (f) => ((f.name.match(/\.([^.]+)$/) || [])[1] || (f.type.split('/')[1] || 'png')).toLowerCase().replace('jpeg', 'jpg');

  async function addFiles(fileList) {
    if (!S.src) { toast('먼저 봇이나 모듈을 골라 주세요', 'err'); return; }
    const files = [...fileList].filter((f) => /^(image|video|audio)\//.test(f.type) || MEDIA_EXT.test(f.name));
    const ignored = fileList.length - files.length;
    if (!files.length) { toast('이미지·영상·오디오 파일만 추가할 수 있어요', 'err'); return; }
    const isChar = S.src.type === 'char';
    const allImages = files.every((f) => /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(f.name));
    let kind = isChar ? (S.kind === 'add' || (S.kind === 'all' && !allImages) ? 'add' : 'emo') : 'mod';
    let dup = 'skip';
    const curFolder = S.folder !== 'all' ? S.folder : '';
    const urls = [];
    const shown = files.slice(0, 11);
    const thumbs = shown.map((f, i) => {
      let inner = ic(/^audio\//.test(f.type) ? 'music' : 'image', 20);
      if (/^image\//.test(f.type)) { const u = URL.createObjectURL(f); urls.push(u); inner = `<img src="${u}" alt="">`; }
      return `<div class="upitem" data-up="${i}"><div class="upthumb">${inner}</div><small>${esc(fileBase(f))}</small></div>`;
    }).join('') + (files.length > shown.length ? `<div class="upitem"><div class="upmore">+${files.length - shown.length}</div></div>` : '');
    const res = await modal({
      icon: 'upload', title: `에셋 추가 · ${files.length}개`,
      desc: `‘${esc(S.src.name)}’에 추가해요. 파일 이름(확장자 제외)이 에셋 이름이 돼요.${ignored ? ` 지원하지 않는 파일 ${ignored}개는 뺐어요.` : ''}`,
      body: `
        <div class="upgrid">${thumbs}</div>
        ${isChar ? `<div><label class="lbl">어느 목록에 넣을까요?</label><div class="chips">
          <button class="chipr ${kind === 'emo' ? 'on' : ''}" data-k="emo">감정</button>
          <button class="chipr ${kind === 'add' ? 'on' : ''}" data-k="add">추가 에셋</button></div></div>` : ''}
        <div><label class="lbl">폴더</label><select class="select" id="uFolder">
          <option value="">폴더 없음</option>
          ${treeOrder().map((f) => `<option value="${f.id}" ${f.id === curFolder ? 'selected' : ''}>${esc(fullName(f))}</option>`).join('')}
        </select></div>
        <div><label class="lbl" id="uDupLbl">같은 이름이 이미 있으면</label><div class="chips">
          <button class="chipr on" data-dup="skip">건너뛰기</button>
          <button class="chipr" data-dup="replace">이미지 교체</button>
          <button class="chipr" data-dup="keep">둘 다 유지 (번호 붙이기)</button></div>
          <div class="help">‘이미지 교체’는 이름은 그대로 두고 파일만 바꿔서, 표정 이미지를 새로 그렸을 때 편해요.</div></div>`,
      ok: '추가',
      onMount: (m) => {
        const upd = () => {
          const names = new Set((S.src.lists[kind] || []).map((t) => t[0]));
          let n = 0;
          files.forEach((f, i) => { const d = names.has(fileBase(f)); if (d) n++; const el = m.querySelector(`[data-up="${i}"]`); el && el.classList.toggle('dup', d); });
          m.querySelector('#uDupLbl').textContent = n ? `같은 이름이 이미 있으면 · ${n}개 겹침` : '같은 이름이 이미 있으면';
        };
        m.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.k; m.querySelectorAll('[data-k]').forEach((x) => x.classList.toggle('on', x === b)); upd(); }));
        m.querySelectorAll('[data-dup]').forEach((b) => b.addEventListener('click', () => { dup = b.dataset.dup; m.querySelectorAll('[data-dup]').forEach((x) => x.classList.toggle('on', x === b)); }));
        upd();
      },
      onOk: (m) => ({ folder: m.querySelector('#uFolder').value }),
    });
    urls.forEach((u) => URL.revokeObjectURL(u));
    if (!res) return;
    await withBusy('add', async () => {
      const existing = new Set((S.src.lists[kind] || []).map((t) => t[0]));
      const todo = files.filter((f) => !(dup === 'skip' && existing.has(fileBase(f))));
      let skipped = files.length - todo.length;
      const prog = toast(`저장하는 중 0 / ${todo.length}`, 'busy');
      const entries = [];
      try {
        for (const f of todo) {
          const bytes = new Uint8Array(await f.arrayBuffer());
          const path = await R.saveAsset(bytes);
          if (!path) throw new Error(`‘${f.name}’을 저장하지 못했어요`);
          entries.push({ name: fileBase(f), path, ext: fileExt(f) });
          prog.set(`저장하는 중 ${entries.length} / ${todo.length}`);
        }
      } finally { prog.close(); }
      let added = 0, replaced = 0;
      await mutateSource(S.src, (lists) => {
        const L = lists[kind] || (lists[kind] = []);
        const names = new Set(L.map((t) => t[0]));
        for (const e of entries) {
          let name = e.name;
          const at = L.findIndex((t) => t[0] === name);
          if (at >= 0) {
            if (dup === 'skip') { skipped++; continue; }
            if (dup === 'replace') { L[at] = kind === 'emo' ? [name, e.path] : [name, e.path, e.ext]; replaced++; e.final = name; continue; }
            let n = 2; while (names.has(`${name}_${n}`)) n++;
            name = `${name}_${n}`;
          }
          L.push(kind === 'emo' ? [name, e.path] : [name, e.path, e.ext]);
          names.add(name); added++; e.final = name;
        }
      });
      if (res.folder) { for (const e of entries) if (e.final) S.fdata.map[kind + '::' + e.final] = res.folder; await saveF(); }
      buildAssets(); renderAll();
      const parts = [];
      if (added) parts.push(`${added}개 추가`);
      if (replaced) parts.push(`${replaced}개 교체`);
      if (skipped) parts.push(`${skipped}개 건너뜀`);
      toast(parts.join(' · ') || '추가된 에셋이 없어요');
    });
  }

  // ---------------------------------------------------------------- export
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

  // 무압축(store) zip. 파일 이름은 UTF-8 플래그로 기록해서 한글 이름도 그대로 보존
  function makeZip(files) {
    const enc = new TextEncoder();
    const d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const local = [], central = [];
    let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true);
      local.push(new Uint8Array(h.buffer), nm, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
      c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + sz;
    }
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    return new Blob([...local, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }

  const safeName = (s) => String(s).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '_').trim().slice(0, 120) || 'asset';

  async function readBytes(a) {
    const raw = toBytes(await R.readImage(a.path));
    if (raw instanceof Uint8Array) return raw;
    if (typeof raw === 'string') {
      const b64 = raw.startsWith('data:') ? raw.slice(raw.indexOf(',') + 1) : raw;
      const bin = atob(b64); const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8;
    }
    return null;
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 4000);
  }

  async function doExport() {
    const items = selectedAssets();
    if (!items.length) return;
    const ids = folderIds();
    const anyFiled = items.some((a) => folderOf(a, ids));
    const kinds = new Set(items.map((a) => a.kind));
    let opts = { folders: anyFiled, kinds: kinds.size > 1, name: safeName(S.src.name) + '_assets' };
    if (items.length > 1) {
      const res = await modal({
        icon: 'download', title: `내보내기 · ${items.length}개`, desc: '선택한 에셋을 zip 파일 하나로 묶어서 받아요. 원본 파일 그대로 들어가요.',
        body: `
          <div><label class="lbl">파일 이름</label><input class="input" id="xName" value="${esc(opts.name)}"></div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <label class="check"><input type="checkbox" id="xFolders" ${opts.folders ? 'checked' : ''} ${anyFiled ? '' : 'disabled'}><span><b>폴더 구조대로 묶기</b> · 폴더 이름으로 하위 폴더 만들기</span></label>
            ${S.src.type === 'char' ? `<label class="check"><input type="checkbox" id="xKinds" ${opts.kinds ? 'checked' : ''}><span><b>감정 / 추가 에셋 나누기</b></span></label>` : ''}
          </div>`,
        ok: '내보내기',
        onOk: (m) => ({ name: safeName(m.querySelector('#xName').value || opts.name), folders: m.querySelector('#xFolders').checked, kinds: !!m.querySelector('#xKinds')?.checked }),
      });
      if (!res) return;
      opts = res;
    }
    await withBusy('export', async () => {
      const prog = items.length > 1 ? toast(`파일 읽는 중 0 / ${items.length}`, 'busy') : null;
      const out = [], used = new Set();
      let failed = 0;
      try {
        for (const a of items) {
          const data = await readBytes(a).catch(() => null);
          if (!data || !data.length) { failed++; continue; }
          const ext = (a.ext || sniff(data, '').ext || 'png').toLowerCase();
          const dirs = [];
          if (opts.kinds && S.src.type === 'char') dirs.push(a.kind === 'emo' ? '감정' : '추가');
          if (opts.folders) {
            const fid = folderOf(a, ids); const f = fid && fget(fid);
            if (f) { const up = f.parent && fget(f.parent); if (up) dirs.push(safeName(up.name)); dirs.push(safeName(f.name)); }
          }
          const base = [...dirs, safeName(a.name)].join('/');
          let name = `${base}.${ext}`, n = 2;
          while (used.has(name.toLowerCase())) name = `${base} (${n++}).${ext}`;
          used.add(name.toLowerCase());
          out.push({ name, data, mime: sniff(data, ext).mime });
          prog && prog.set(`파일 읽는 중 ${out.length + failed} / ${items.length}`);
        }
      } finally { prog && prog.close(); }
      if (!out.length) throw new Error('읽을 수 있는 에셋이 없어요');
      if (items.length === 1) download(new Blob([out[0].data], { type: out[0].mime }), out[0].name.split('/').pop());
      else download(makeZip(out), opts.name + '.zip');
      toast(`${out.length}개를 내보냈어요${failed ? ` · ${failed}개는 읽지 못했어요` : ''}`);
    });
  }

  // ---------------------------------------------------------------- lightbox (크게 보기)
  let lb = null;
  const lbList = () => { const v = visibleAssets().map((a) => a.uid); return S.order.length && lb && S.order.includes(lb.uid) ? S.order : v; };

  function openLightbox(uid) {
    if (!S.byUid.has(uid)) return;
    closeMenu();
    const wrap = document.createElement('div');
    wrap.className = 'lb';
    wrap.setAttribute('role', 'dialog');
    wrap.innerHTML = `
      <div class="lb-top">
        <div class="lb-meta"><div class="lb-name"><b id="lbName"></b><button class="lb-edit" id="lbEdit" title="이름 고치기 (F2)">${ic('pencil', 15)}</button></div><span id="lbSub"></span></div>
        <div class="lb-act">
          <button class="lb-btn" id="lbSel" title="선택 (Space)">${ic('check', 16)}<span>선택</span></button>
          <button class="lb-btn icon" id="lbClose" title="닫기 (Esc)">${ic('x', 18)}</button>
        </div>
      </div>
      <div class="lb-stage" id="lbStage"></div>
      <button class="lb-nav prev" id="lbPrev" title="이전 (←)">${ic('chevL', 22)}</button>
      <button class="lb-nav next" id="lbNext" title="다음 (→)">${ic('chevR', 22)}</button>
      <div class="lb-count" id="lbCount"></div>`;
    $('#layer').appendChild(wrap);
    lb = { wrap, uid };
    $('#lbClose', wrap).addEventListener('click', closeLightbox);
    $('#lbPrev', wrap).addEventListener('click', () => stepLightbox(-1));
    $('#lbNext', wrap).addEventListener('click', () => stepLightbox(1));
    $('#lbSel', wrap).addEventListener('click', () => toggleLightboxSel());
    $('#lbEdit', wrap).addEventListener('click', () => editLightboxName());
    const stage = $('#lbStage', wrap);
    stage.addEventListener('click', (e) => { if (e.target === stage) closeLightbox(); });
    let sx = null;
    stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') sx = e.clientX; });
    stage.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) stepLightbox(dx < 0 ? 1 : -1); });
    showLightbox(uid);
  }

  function closeLightbox() { if (lb) { lb.wrap.remove(); lb = null; } }

  function stepLightbox(d) {
    if (!lb) return;
    const list = lbList(); const i = list.indexOf(lb.uid);
    const j = i + d;
    if (i < 0 || j < 0 || j >= list.length) return;
    showLightbox(list[j]);
  }

  function toggleLightboxSel() {
    if (!lb) return;
    S.sel.has(lb.uid) ? S.sel.delete(lb.uid) : S.sel.add(lb.uid);
    S.anchor = lb.uid;
    refreshSelection();
    renderLightboxMeta();
  }

  // 크게 보기에서 이름을 바로 고치기: Enter 저장, Esc 취소
  function editLightboxName() {
    if (!lb || lb.editing) return;
    const a = S.byUid.get(lb.uid); if (!a) return;
    const box = $('.lb-name', lb.wrap);
    lb.editing = true;
    box.innerHTML = `<input class="lb-input" id="lbNameIn" value="${esc(a.name)}" maxlength="200" spellcheck="false">`;
    const inp = $('#lbNameIn', box);
    inp.focus(); inp.select();
    let done = false;
    const finish = async (save) => {
      if (done) return; done = true;
      const nn = inp.value.trim();
      const uid = a.uid;
      if (save && nn && nn !== a.name) {
        const clash = S.assets.some((x) => x.kind === a.kind && x.uid !== uid && x.name === nn);
        await withBusy('rename', async () => { await applyRenames([{ a, nn }]); toast(clash ? `‘${nn}’로 바꿨어요 · 같은 이름이 이미 있어요` : `‘${nn}’로 바꿨어요`); });
      }
      if (!lb) return;
      lb.editing = false;
      box.innerHTML = `<b id="lbName"></b><button class="lb-edit" id="lbEdit" title="이름 고치기 (F2)">${ic('pencil', 15)}</button>`;
      $('#lbEdit', box).addEventListener('click', () => editLightboxName());
      renderLightboxMeta();
    };
    inp.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    inp.addEventListener('blur', () => finish(true));
  }

  function renderLightboxMeta() {
    if (!lb) return;
    const a = S.byUid.get(lb.uid); if (!a) return;
    const w = lb.wrap, list = lbList(), i = list.indexOf(a.uid);
    const fid = folderOf(a); const f = fid && S.fdata.folders.find((x) => x.id === fid);
    const info = media.get(a.path);
    const bits = [];
    if (S.src.type === 'char') bits.push(KIND[a.kind]);
    if (f) bits.push(`<span style="display:inline-flex;align-items:center;gap:5px">${ic('folder', 13)}${esc(fullName(f))}</span>`);
    const ext = (a.ext || (info && info.ext) || '').toUpperCase();
    if (ext) bits.push(ext);
    if (lb.dims) bits.push(lb.dims);
    $('#lbName', w).textContent = a.name;
    $('#lbSub', w).innerHTML = bits.join('<span style="opacity:.4">·</span>');
    $('#lbCount', w).textContent = i >= 0 ? `${i + 1} / ${list.length}` : '';
    $('#lbPrev', w).disabled = i <= 0;
    $('#lbNext', w).disabled = i < 0 || i >= list.length - 1;
    const on = S.sel.has(a.uid);
    const sb = $('#lbSel', w);
    sb.classList.toggle('on', on);
    sb.querySelector('span').textContent = on ? '선택됨' : '선택';
  }

  async function showLightbox(uid) {
    if (!lb) return;
    lb.uid = uid; lb.dims = '';
    const a = S.byUid.get(uid); if (!a) { closeLightbox(); return; }
    renderLightboxMeta();
    const stage = $('#lbStage', lb.wrap);
    stage.innerHTML = '<div class="spin"></div>';
    const info = await loadMedia(a.path, a.ext);
    if (!lb || lb.uid !== uid) return;
    if (!info) { stage.innerHTML = `<div class="lb-audio" style="color:rgba(243,240,234,.6)">${ic('image', 40)}불러올 수 없는 에셋이에요</div>`; return; }
    if (info.kind === 'video') stage.innerHTML = `<div class="lb-frame"><video src="${esc(info.url)}" controls autoplay loop playsinline></video></div>`;
    else if (info.kind === 'audio') stage.innerHTML = `<div class="lb-frame"><div class="lb-audio">${ic('music', 48)}<audio src="${esc(info.url)}" controls autoplay></audio></div></div>`;
    else {
      stage.innerHTML = `<div class="lb-frame"><img src="${esc(info.url)}" alt="${esc(a.name)}" draggable="false"></div>`;
      const img = stage.querySelector('img');
      const dims = () => { if (lb && lb.uid === uid && img.naturalWidth) { lb.dims = `${img.naturalWidth} × ${img.naturalHeight}`; renderLightboxMeta(); } };
      img.complete ? dims() : img.addEventListener('load', dims, { once: true });
    }
    renderLightboxMeta();
    const list = lbList(), i = list.indexOf(uid);
    [list[i - 1], list[i + 1]].forEach((n) => { const x = n && S.byUid.get(n); if (x) loadMedia(x.path, x.ext); });
  }

  // ---------------------------------------------------------------- asset drag
  // 에셋 끌기: 반투명한 사본이 포인터를 따라오고, 놓일 자리에 빈 칸이 벌어짐.
  // - 에셋 사이에 놓기 → 리스 실제 배열 순서를 바꿈 (다른 폴더 묶음 사이면 그 폴더로도 옮김)
  // - 사이드바 폴더에 놓기 → 폴더로 옮기기 / 다른 봇·모듈에 놓기 → 그쪽으로 이동
  // 마우스는 살짝 움직이면 시작, 터치는 길게 눌러서 시작.
  function bindAssetDrag() {
    const content = $('#content');
    let st = null;
    let swallowClick = false;
    let raf = 0;

    const clearOver = (keep) => $$('.over').forEach((x) => x !== keep && x.classList.remove('over'));
    const noTouchScroll = (e) => { if (st && st.on) e.preventDefault(); };

    // 칸이 자리를 옮길 때 원래 위치에서 새 위치로 미끄러지게 함 (화면 근처 칸만).
    // 위치는 transform의 영향을 받지 않는 offsetLeft/Top으로 잼.
    const snap = () => {
      const vr = content.getBoundingClientRect();
      const m = new Map();
      for (const el of $$('[data-uid]:not(.dragsrc),[data-slot]', content)) {
        const r = el.getBoundingClientRect();
        if (r.bottom < vr.top - 200 || r.top > vr.bottom + 200) continue;
        m.set(el, [el.offsetLeft, el.offsetTop]);
      }
      return m;
    };
    const slide = (before) => {
      for (const [el, [x0, y0]] of before) {
        if (!el.isConnected) continue;
        const dx = x0 - el.offsetLeft, dy = y0 - el.offsetTop;
        if (!dx && !dy) continue;
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px,${dy}px)`;
        el.getBoundingClientRect();
        el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
        el._until = performance.now() + 220;
      }
    };
    // 미끄러지는 중인 칸은 transform을 뺀 원래 자리로 판정 (애니메이션 중에 판정이 출렁이지 않게)
    const homeRect = (el) => {
      const q = el.getBoundingClientRect();
      if (!(el._until > performance.now())) return q;
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return { left: q.left - m.e, right: q.right - m.e, top: q.top - m.f, bottom: q.bottom - m.f };
    };
    const placeSlot = (ref, after) => {
      const s = st.slot;
      if (after ? ref.nextElementSibling === s : ref.previousElementSibling === s) return;
      const before = snap();
      after ? ref.after(s) : ref.before(s);
      slide(before);
    };
    const appendSlot = (box) => {
      const s = st.slot;
      if (s.parentNode === box && !s.nextElementSibling) return;
      const before = snap();
      box.appendChild(s);
      slide(before);
    };
    const dropSlot = () => {
      if (!st.slot.isConnected) return;
      const before = snap();
      st.slot.remove();
      slide(before);
    };

    const lift = (e) => {
      const t = st.item;
      const u = t.dataset.uid;
      const vis = new Set(visibleAssets().map((a) => a.uid));
      st.uids = S.sel.has(u) ? S.assets.filter((a) => S.sel.has(a.uid) && vis.has(a.uid)).map((a) => a.uid) : [u];
      if (!st.uids.includes(u)) st.uids = [u];
      const r = t.getBoundingClientRect();
      const g = t.cloneNode(true);
      g.removeAttribute('data-uid');
      g.classList.add('drag-ghost');
      g.classList.remove('sel');
      if (st.uids.length > 1) g.insertAdjacentHTML('beforeend', `<span class="ghost-n">${st.uids.length}</span>`);
      const k = t.classList.contains('tile') ? Math.min(1, 150 / r.width) : 1;
      st.dx = e.clientX - r.left; st.dy = e.clientY - r.top; st.k = k;
      Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', transformOrigin: `${st.dx}px ${st.dy}px` });
      document.body.appendChild(g);
      st.ghost = g;
      // 원래 칸 자리에 빈 칸을 두고, 끄는 에셋들은 감춤
      const s = t.cloneNode(true);
      s.removeAttribute('data-uid'); s.removeAttribute('title');
      s.classList.remove('sel'); s.classList.add('slot');
      s.dataset.slot = '1';
      t.before(s);
      st.slot = s;
      const before = snap();
      for (const x of st.uids) { const el = content.querySelector(`[data-uid="${x}"]`); if (el) el.classList.add('dragsrc'); }
      slide(before);
      st.on = true;
      S.dragging = st.uids;
      document.body.classList.add('asset-dragging');
      window.addEventListener('touchmove', noTouchScroll, { passive: false });
      if (e.pointerType === 'touch') navigator.vibrate?.(8);
    };

    const autoScroll = () => {
      raf = 0;
      if (!st || !st.on) return;
      const r = content.getBoundingClientRect();
      const y = st.lastY, x = st.lastX;
      if (x < r.left || x > r.right) return;
      const v = y < r.top + 60 ? -(r.top + 60 - y) / 4 : y > r.bottom - 60 ? (y - r.bottom + 60) / 4 : 0;
      if (v) { content.scrollTop += Math.max(-18, Math.min(18, v)); raf = requestAnimationFrame(autoScroll); }
    };

    const track = (e) => {
      st.lastX = e.clientX; st.lastY = e.clientY;
      st.ghost.style.transform = `translate(${e.clientX - st.dx - parseFloat(st.ghost.style.left)}px,${e.clientY - st.dy - parseFloat(st.ghost.style.top)}px) scale(${st.k * 1.02})`;
      if (!raf) raf = requestAnimationFrame(autoScroll);
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      st.target = null;
      if (!hit) { clearOver(); return; }
      // 봇/모듈 탭에 올리면 탭 전환
      const tab = hit.closest('#srcTabs [data-tab]');
      if (tab && S.prefs.srcTab !== tab.dataset.tab) { S.prefs.srcTab = tab.dataset.tab; renderSources(); }
      const src = hit.closest('#srcList [data-src]');
      if (src) {
        if (S.src && src.dataset.src !== S.src.key) { st.target = { type: 'src', key: src.dataset.src }; clearOver(src); src.classList.add('over'); }
        else clearOver();
        return;
      }
      const fold = hit.closest('#folderList [data-drop]');
      if (fold) { st.target = { type: 'folder', id: fold.dataset.drop }; clearOver(fold); fold.classList.add('over'); dropSlot(); return; }
      clearOver();
      if (!content.contains(hit)) return;
      const grp = hit.closest('[data-drop]');
      if (!grp) return;
      const box = grp.querySelector('.grid,.list');
      if (!box || grp.classList.contains('collapsed')) {
        dropSlot();
        grp.classList.add('over');
        st.target = { type: 'folder', id: grp.dataset.drop };
        return;
      }
      st.target = { type: 'slot' };
      // 묶음 머리 위면 맨 앞으로
      if (hit.closest('.grp-h')) {
        const first = box.querySelector('[data-uid]:not(.dragsrc),[data-slot]');
        if (first && first !== st.slot) placeSlot(first, false); else if (!first) appendSlot(box);
        return;
      }
      const cells = $$(':scope>[data-uid]:not(.dragsrc),:scope>[data-slot]', box);
      const x = e.clientX, y = e.clientY;
      let over = null;
      for (const el of cells) { const q = homeRect(el); if (x >= q.left && x < q.right && y >= q.top && y < q.bottom) { over = el; break; } }
      if (!over) {
        // 칸 사이 틈은 그대로 두고, 마지막 칸 뒤의 빈 곳일 때만 맨 뒤로
        const last = cells[cells.length - 1];
        const q = last && homeRect(last);
        if (!q || y >= q.bottom || (y >= q.top && x >= q.right)) { if (last !== st.slot) appendSlot(box); }
        return;
      }
      if (over === st.slot) return;
      // 다른 칸에 들어가면 그 칸과 자리를 맞바꿈. 바뀐 뒤에는 포인터가 빈 칸 위에 있으므로 다시 흔들리지 않음.
      // 다른 묶음에서 처음 들어올 때만 칸의 앞/뒤 절반으로 판단.
      if (st.slot.parentNode === box) {
        placeSlot(over, cells.indexOf(st.slot) < cells.indexOf(over));
      } else {
        const q = homeRect(over);
        placeSlot(over, box.classList.contains('grid') ? x > (q.left + q.right) / 2 : y > (q.top + q.bottom) / 2);
      }
    };

    const cleanup = (cur) => {
      cur.ghost.remove();
      cur.slot.remove();
      $$('.dragsrc', content).forEach((x) => x.classList.remove('dragsrc'));
      $$('[data-uid]', content).forEach((x) => { x.style.transition = x.style.transform = ''; });
      clearOver();
      document.body.classList.remove('asset-dragging');
      window.removeEventListener('touchmove', noTouchScroll);
      S.dragging = null;
    };

    const finish = async (e, cancel) => {
      if (!st) return;
      clearTimeout(st.timer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      const cur = st; st = null;
      if (!cur.on) return;
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
      const tg = cancel ? null : cur.target;
      if (tg && tg.type === 'slot' && cur.slot.isConnected) {
        const gid = cur.slot.closest('[data-drop]')?.dataset.drop;
        const plan = reorderPlan(cur.uids, cur.slot);
        // 빈 칸 자리에 에셋들을 넣어 둔 채로 저장 (저장이 끝나면 다시 그림)
        for (const u of cur.uids) { const el = content.querySelector(`[data-uid="${u}"]`); if (el) cur.slot.before(el); }
        cleanup(cur);
        await commitDrop(cur.uids, gid, plan);
        return;
      }
      cleanup(cur);
      if (tg && tg.type === 'folder') assignFolder(cur.uids, tg.id);
      else if (tg && tg.type === 'src') doCopy({ uids: cur.uids, target: tg.key, move: true });
    };
    const onMove = (e) => {
      if (!st || e.pointerId !== st.pid) return;
      if (!st.on) {
        const d = Math.hypot(e.clientX - st.x, e.clientY - st.y);
        if (st.touch) { if (d > 8) finish(e, true); return; }
        if (d < 5) return;
        lift(e);
      }
      track(e);
    };
    const onUp = (e) => { if (st && e.pointerId === st.pid) finish(e, false); };
    const onCancel = (e) => { if (st && e.pointerId === st.pid) finish(e, true); };

    content.addEventListener('pointerdown', (e) => {
      if (st || e.button > 0 || S.busy || modalOpen) return;
      const t = e.target.closest('[data-uid]');
      if (!t || t.classList.contains('dragsrc')) return;
      st = { item: t, pid: e.pointerId, x: e.clientX, y: e.clientY, on: false, touch: e.pointerType === 'touch' };
      if (st.touch) st.timer = setTimeout(() => { if (st && !st.on) { lift(e); track(e); } }, 380);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    });
    // 끌기를 마친 뒤 따라오는 클릭이 선택을 바꾸지 않게 막음
    content.addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    // 길게 눌렀을 때 뜨는 메뉴 막기
    content.addEventListener('contextmenu', (e) => { if (st || S.dragging) e.preventDefault(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && st && st.on) { e.stopImmediatePropagation(); finish(e, true); } }, true);
  }

  // 빈 칸 위치를 보고, 종류(감정/추가/모듈)별 배열의 새 순서를 계산.
  // 화면에 안 보이는 에셋(검색에서 빠진 것, 접힌 폴더 등)은 원래 자리를 지킴.
  function reorderPlan(uids, slot) {
    const seq = $$('[data-uid]:not(.dragsrc),[data-slot]', $('#content'));
    const at = seq.indexOf(slot);
    const dragged = uids.map((u) => S.byUid.get(u)).filter(Boolean);
    const plan = {};
    for (const kind of ['emo', 'add', 'mod']) {
      const mine = dragged.filter((a) => a.kind === kind).sort((a, b) => a.idx - b.idx);
      if (!mine.length) continue;
      const moving = new Set(mine.map((a) => a.idx));
      const total = (S.src.lists[kind] || []).length;
      const rest = [];
      for (let i = 0; i < total; i++) if (!moving.has(i)) rest.push(i);
      const idxOf = (el) => { const a = el.dataset.uid && S.byUid.get(el.dataset.uid); return a && a.kind === kind && !moving.has(a.idx) ? a.idx : -1; };
      let pos = -1;
      for (let i = at + 1; i < seq.length && pos < 0; i++) { const x = idxOf(seq[i]); if (x >= 0) pos = rest.indexOf(x); }
      for (let i = at - 1; i >= 0 && pos < 0; i--) { const x = idxOf(seq[i]); if (x >= 0) pos = rest.indexOf(x) + 1; }
      if (pos < 0) pos = rest.filter((i) => i < mine[0].idx).length;
      const order = [...rest.slice(0, pos), ...mine.map((a) => a.idx), ...rest.slice(pos)];
      if (order.some((v, i) => v !== i)) plan[kind] = order;
    }
    return plan;
  }

  async function commitDrop(uids, gid, plan) {
    // 다른 폴더 묶음 사이에 놓았으면 그 폴더로 옮김
    const moved = gid ? uids.filter((u) => { const a = S.byUid.get(u); return a && (folderOf(a) || 'none') !== gid; }) : [];
    if (moved.length) { assignFolder(moved, gid, true); await saveF(); }
    const kinds = Object.keys(plan);
    if (!kinds.length) { renderAll(); return; }
    // 배열 순서가 바뀌면 uid(종류#번호)도 바뀌므로, 선택은 이름·경로로 다시 찾아 둠
    const key = (a) => a.kind + '\n' + a.name + '\n' + a.path;
    const selKeys = new Set([...S.sel].map((u) => S.byUid.get(u)).filter(Boolean).map(key));
    const snap = Object.fromEntries(kinds.map((k) => [k, S.src.lists[k].map((t) => t[0] + '\n' + t[1]).join('\n')]));
    await withBusy('순서 바꾸는 중', async () => {
      await mutateSource(S.src, (lists) => {
        for (const k of kinds) {
          const arr = lists[k] || [];
          if (arr.map((t) => t[0] + '\n' + t[1]).join('\n') !== snap[k]) throw new Error('에셋 목록이 바뀌었어요. 새로고침 후 다시 시도해 주세요.');
          lists[k] = plan[k].map((i) => arr[i]);
        }
      });
    });
    buildAssets();
    S.sel = new Set(S.assets.filter((a) => selKeys.has(key(a))).map((a) => a.uid));
    S.anchor = null;
    renderAll();
  }

  // ---------------------------------------------------------------- folder sections (main)
  // 메인 화면의 폴더 묶음도 머리 줄을 끌어서 순서를 바꿈.
  // 끄는 동안에는 모든 폴더 묶음을 접힌 모양으로 보여 줘서, 사이드바처럼 한눈에 자리를 고를 수 있게 함.
  function bindGroupSort() {
    const content = $('#content');
    let st = null;
    let swallowClick = false;
    let raf = 0;
    // 같이 순서를 바꿀 무리: 같은 곳(메인 목록, 또는 한 폴더의 하위 폴더 칸)에 있는 폴더 묶음끼리
    const secs = () => $$(':scope>.grp.boxed', st ? st.box : content);
    const slide = (els, tops) => {
      for (const el of els) {
        const d = tops.get(el) - el.offsetTop;
        if (!d) continue;
        el.style.transition = 'none';
        el.style.transform = `translateY(${d}px)`;
        el.getBoundingClientRect();
        el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      }
    };
    const lift = (e) => {
      const sec = st.sec;
      // 모두 접힌 모양으로 바꾸되, 잡은 머리 줄은 포인터 아래에 그대로 둠
      const before = sec.getBoundingClientRect().top;
      st.box.classList.add('grp-sorting');
      content.scrollTop += sec.getBoundingClientRect().top - before;
      const r = sec.getBoundingClientRect();
      const g = sec.cloneNode(false);
      g.appendChild(sec.querySelector('.grp-h').cloneNode(true));
      g.removeAttribute('data-drop');
      g.classList.add('grp-ghost', 'collapsed');
      g.classList.remove('slot');
      Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
      document.body.appendChild(g);
      sec.classList.add('slot');
      st.on = true; st.ghost = g; st.dx = e.clientX - r.left; st.dy = e.clientY - r.top;
      document.body.classList.add('fold-dragging');
    };
    const autoScroll = () => {
      raf = 0;
      if (!st || !st.on) return;
      const r = content.getBoundingClientRect(), y = st.lastY;
      const v = y < r.top + 50 ? -(r.top + 50 - y) / 3 : y > r.bottom - 50 ? (y - r.bottom + 50) / 3 : 0;
      if (v) { content.scrollTop += Math.max(-16, Math.min(16, v)); move(); raf = requestAnimationFrame(autoScroll); }
    };
    // 포인터 위치를 목록 안 좌표로 바꿔서, 미끄러지는 중인 묶음의 transform에 휘둘리지 않게 비교
    const move = () => {
      const cr = content.getBoundingClientRect();
      const y = st.lastY - cr.top - content.clientTop + content.scrollTop;
      const all = secs(), others = all.filter((x) => x !== st.sec);
      if (!others.length) return;
      const base = others[0].offsetParent === content ? 0 : content.offsetTop;
      const before = others.find((it) => y < it.offsetTop - base + it.offsetHeight / 2);
      const last = others[others.length - 1];
      if (before ? st.sec.nextElementSibling === before : last.nextElementSibling === st.sec) return;
      const tops = new Map(all.map((el) => [el, el.offsetTop]));
      if (before) before.before(st.sec); else last.after(st.sec);
      slide(others, tops);
    };
    content.addEventListener('pointerdown', (e) => {
      if (st || e.button > 0 || S.busy) return;
      const head = e.target.closest('.grp.boxed>.grp-h');
      if (!head || e.target.closest('button:not([data-collapse])')) return;
      if (e.pointerType === 'touch') return;
      st = { sec: head.parentNode, box: head.parentNode.parentNode, pid: e.pointerId, x: e.clientX, y: e.clientY, on: false };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
    const onMove = (e) => {
      if (!st || e.pointerId !== st.pid) return;
      if (!st.on) { if (Math.hypot(e.clientX - st.x, e.clientY - st.y) < 5) return; lift(e); }
      st.lastY = e.clientY;
      st.ghost.style.transform = `translate(${e.clientX - st.dx - parseFloat(st.ghost.style.left)}px,${e.clientY - st.dy - parseFloat(st.ghost.style.top)}px) scale(1.01)`;
      move();
      if (!raf) raf = requestAnimationFrame(autoScroll);
    };
    const onUp = (e) => {
      if (!st || e.pointerId !== st.pid) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const ids = st.on ? secs().map((x) => x.dataset.drop) : null;
      const { sec, box, on, ghost } = st; st = null;
      if (!on) return;
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
      ghost.remove();
      sec.classList.remove('slot');
      document.body.classList.remove('fold-dragging');
      $$(':scope>.grp.boxed', box).forEach((el) => { el.style.transition = el.style.transform = ''; });
      const fid = sec.dataset.drop;
      // 다시 펼친 뒤에도 놓은 폴더가 같은 자리에 보이도록 스크롤을 맞춤
      const at = sec.getBoundingClientRect().top;
      box.classList.remove('grp-sorting');
      if (reorderPeers(ids)) { saveF(); renderAll(); }
      const now = content.querySelector(`.grp[data-drop="${fid}"]`);
      if (now) content.scrollTop += now.getBoundingClientRect().top - at;
    };
    // 끌기를 마친 뒤 따라오는 클릭이 폴더를 접지 않게 막음
    content.addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }

  // ---------------------------------------------------------------- side (mobile)
  const openSide = () => $('#app').classList.add('side-open');
  const closeSide = () => mounted && $('#app').classList.remove('side-open');

  // ---------------------------------------------------------------- binding
  function bind() {
    $('#srcTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; S.prefs.srcTab = b.dataset.tab; savePrefs(); renderSources(); });
    $('#srcQ').addEventListener('input', (e) => { S.srcQuery = e.target.value; renderSources(); });
    $('#srcList').addEventListener('click', (e) => { const b = e.target.closest('[data-src]'); if (!b) return; selectSource(S.sources.find((s) => s.key === b.dataset.src)); });

    bindFolderSort();
    $('#folderList').addEventListener('click', (e) => {
      if (e.target.closest('[data-grip]')) return;
      const ed = e.target.closest('[data-fedit]'); if (ed) { e.stopPropagation(); editFolder(ed.dataset.fedit); return; }
      const f = e.target.closest('[data-folder]'); if (!f) return;
      S.folder = f.dataset.folder; closeSide(); renderAll(); $('#content').scrollTop = 0;
    });
    $('#addFolder').addEventListener('click', () => createFolder(S.sel.size ? [...S.sel] : null));
    $('#applyOrder').addEventListener('click', applyOrder);

    $('#sideBtn').addEventListener('click', openSide);
    $('#sideScrim').addEventListener('click', closeSide);
    $('#closeBtn').addEventListener('click', close);
    $('#refresh').addEventListener('click', async () => {
      const key = S.src && S.src.key;
      clearMedia();
      await loadSources();
      const s = key && S.sources.find((x) => x.key === key);
      if (s) await selectSource(s, true); else { S.src = null; buildAssets(); renderAll(); }
      if (!S.error) toast('새로 불러왔어요');
    });

    $('#themeSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-theme-set]'); if (!b) return; S.prefs.theme = b.dataset.themeSet; savePrefs(); applyTheme(); });
    $('#viewSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (!b) return; S.prefs.view = b.dataset.view; savePrefs(); renderTop(); renderContent(); });
    $('#kindSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-kind]'); if (!b) return; S.kind = b.dataset.kind; renderAll(); });
    $('#thumb').addEventListener('input', (e) => { S.prefs.thumb = +e.target.value; $('#content').style.setProperty('--thumb', S.prefs.thumb + 'px'); });
    $('#thumb').addEventListener('change', savePrefs);

    let qt = null;
    $('#q').addEventListener('input', (e) => { S.query = e.target.value; clearTimeout(qt); qt = setTimeout(() => { renderContent(); renderQueryCount(); }, 90); });
    $('#qClear').addEventListener('click', () => { S.query = ''; $('#q').value = ''; renderContent(); renderQueryCount(); $('#q').focus(); });
    $('#selMatch').addEventListener('click', () => { visibleAssets().forEach((a) => S.sel.add(a.uid)); refreshSelection(); });
    $('#deselMatch').addEventListener('click', () => { visibleAssets().forEach((a) => S.sel.delete(a.uid)); refreshSelection(); });
    $('#selMenu').addEventListener('click', (e) => selectMenu(e.currentTarget));

    const content = $('#content');
    content.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (act) { if (act.dataset.act === 'reload') $('#refresh').click(); if (act.dataset.act === 'side') openSide(); if (act.dataset.act === 'add') $('#fileIn').click(); return; }
      const zb = e.target.closest('[data-zoom]'); if (zb) { openLightbox(zb.dataset.zoom); return; }
      const ed = e.target.closest('[data-fedit]'); if (ed) { editFolder(ed.dataset.fedit); return; }
      const sg = e.target.closest('[data-selgrp]');
      if (sg) {
        const list = S.groups[sg.dataset.selgrp] || [];
        const all = list.every((u) => S.sel.has(u));
        list.forEach((u) => (all ? S.sel.delete(u) : S.sel.add(u)));
        refreshSelection(); return;
      }
      // 접기: 화살표뿐 아니라 묶음 머리 줄 아무 곳이나 눌러도 됨 (안의 다른 버튼은 제외)
      const col = e.target.closest('[data-collapse]') || (!e.target.closest('button') && e.target.closest('.grp-h')?.querySelector('[data-collapse]'));
      if (col) { const id = col.dataset.collapse; S.fdata.collapsed[id] = !S.fdata.collapsed[id]; saveF(); renderContent(); return; }
      const t = e.target.closest('[data-uid]');
      if (t) toggleUid(t.dataset.uid, e);
    });

    // 더블클릭으로 크게 보기 (두 번의 클릭으로 바뀐 선택 상태는 그대로 원위치)
    content.addEventListener('dblclick', (e) => {
      if (e.target.closest('[data-zoom],[data-selgrp],[data-collapse],[data-fedit]')) return;
      const t = e.target.closest('[data-uid]'); if (t) openLightbox(t.dataset.uid);
    });

    bindAssetDrag();
    bindGroupSort();

    // 에셋 추가: 버튼 또는 바깥 파일을 화면으로 끌어다 놓기
    $('#addAsset').addEventListener('click', () => $('#fileIn').click());
    $('#fileIn').addEventListener('change', (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) addFiles(fs); });
    const main = $('.main'), dz = $('#dropzone');
    const hasFiles = (e) => !S.dragging && e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
    main.addEventListener('dragover', (e) => {
      if (!hasFiles(e) || !S.src) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
      if (!dz.classList.contains('show')) {
        $('#dzTarget').textContent = `‘${S.src.name}’${S.folder !== 'all' ? ` · ${fullName(fget(S.folder))} 폴더` : ''}`;
        dz.classList.add('show');
      }
    });
    main.addEventListener('dragleave', (e) => { if (!main.contains(e.relatedTarget)) dz.classList.remove('show'); });
    main.addEventListener('drop', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); dz.classList.remove('show');
      if (S.src && e.dataTransfer.files.length) addFiles([...e.dataTransfer.files]);
    });

    $('#actionbar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'clear') { S.sel.clear(); refreshSelection(); }
      else if (a === 'move') moveMenu(b);
      else if (a === 'unfile') assignFolder([...S.sel], 'none');
      else if (a === 'delete') doDelete();
      else if (a === 'rename') doRename();
      else if (a === 'copy') doCopy();
      else if (a === 'export') doExport();
    });

    document.addEventListener('keydown', (e) => {
      if (lb && !modalOpen) {
        if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); }
        else if (e.key === ' ' || e.key === 'Enter') { if (e.target.tagName !== 'VIDEO' && e.target.tagName !== 'AUDIO') { e.preventDefault(); toggleLightboxSel(); } }
        else if (e.key === 'F2') { e.preventDefault(); editLightboxName(); }
        return;
      }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (e.key === 'Escape') {
        if (menuEl) { closeMenu(); return; }
        if (modalOpen) { modalOpen(); return; }
        if (typing) { e.target.blur(); return; }
        if ($('#app').classList.contains('side-open')) { closeSide(); return; }
        if (S.sel.size) { S.sel.clear(); refreshSelection(); return; }
        close(); return;
      }
      if (typing || modalOpen) return;
      if (e.key === '/') { e.preventDefault(); $('#q').focus(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && S.src) { e.preventDefault(); visibleAssets().forEach((a) => S.sel.add(a.uid)); refreshSelection(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel.size) { e.preventDefault(); doDelete(); }
      else if (e.key === 'F2' && S.sel.size) { e.preventDefault(); doRename(); }
    });

    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  }

  function mount() {
    if (mounted) return;
    document.head.insertAdjacentHTML('beforeend', `
      <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;650;700&display=swap">
      <style>${CSS}</style>`);
    document.body.innerHTML = SHELL;
    mounted = true;
    bind();
  }

  // ---------------------------------------------------------------- open/close
  let opening = false;
  async function open() {
    if (opening) return;
    opening = true;
    try {
      const migrated = await migrateLegacy();
      S.prefs = { ...S.prefs, ...(await store.get('ad.prefs', {})) };
      mount();
      await detectRisuTheme();
      applyTheme();
      renderAll();
      await R.showContainer('fullscreen');
      await loadSources();
      const want = (S.src && S.src.key) || S.prefs.lastSrc;
      const cur = S.sources.find((s) => s.current);
      const s = S.sources.find((x) => x.key === want) || cur || null;
      if (s) await selectSource(s, true); else { S.src = null; buildAssets(); renderAll(); }
      if (migrated) toast(`예전 Asset Manager의 폴더 구성을 가져왔어요 · 봇·모듈 ${migrated}곳`);
    } catch (e) {
      console.error('[asset_drawer]', e);
      S.error = String(e?.message || e); renderAll();
    } finally { opening = false; }
  }

  async function close() {
    closeLightbox();
    closeMenu();
    if (modalOpen) modalOpen();
    await R.hideContainer();
    S.sel.clear();
    clearMedia();
  }

  try {
    await R.registerSetting('Asset Drawer', open, LAUNCH_ICON, 'html');
  } catch (e) { console.warn('[asset_drawer] registerSetting', e); }
  try {
    await R.registerButton({ name: 'Asset Drawer', icon: LAUNCH_ICON, iconType: 'html', location: 'hamburger', id: 'asset-drawer-open' }, open);
  } catch (e) { console.warn('[asset_drawer] registerButton', e); }
  try { await R.onUnload(() => clearMedia()); } catch {}

  // 테스트 하네스용 훅 (리스에서는 쓰이지 않음)
  if (globalThis.__AD_TEST__) globalThis.__AD_OPEN__ = open;
})();
