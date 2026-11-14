const games = [
  {
    slug: 'jimao',
    title: '几猫国产3A大作',
    subtitle: 'JIMAO BLOCKBUSTER',
    status: 'published',
    playPath: '/play/jimao/',
    cover: '/assets/cover-jimao.svg',
    coverAlt: '几猫国产3A大作的原创港区海报封面',
    category: '3D 动作',
    summary: '潜入被封锁的港区，切断三处中继，在机械守卫围攻下完成撤离。',
  },
  {
    slug: 'coming-1',
    title: '第二款游戏',
    subtitle: 'NEXT DROP',
    status: 'planning',
    playPath: null,
    cover: '/assets/cover-next.svg',
    coverAlt: '第二款游戏即将上线的抽象海报',
    category: '即将上线',
    summary: '新作品正在筹备。内容确认前不提供可玩入口。',
  },
  {
    slug: 'coming-2',
    title: '第三款游戏',
    subtitle: 'NEW WORLD',
    status: 'planning',
    playPath: null,
    cover: '/assets/cover-arcade.svg',
    coverAlt: '第三款游戏开发中的抽象霓虹海报',
    category: '开发中',
    summary: '另一个原创玩法方向正在验证，完成后再加入游戏库。',
  },
  {
    slug: 'coming-3',
    title: '更多内容',
    subtitle: 'STAY TUNED',
    status: 'planning',
    playPath: null,
    cover: '/assets/cover-mystery.svg',
    coverAlt: '更多游戏即将公布的抽象海报',
    category: '规划中',
    summary: '保持深色的海报墙节奏，为后续真实上线游戏预留位置。',
  },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function renderGameCard(game, placement) {
  const published = game.status === 'published' && game.playPath;
  const href = published ? `/games/${game.slug}/` : null;
  const tagName = href ? 'a' : 'article';
  const attributes = href
    ? ` href="${escapeHtml(href)}" data-testid="game-card-${escapeHtml(game.slug)}" data-placement="${escapeHtml(placement)}" aria-label="进入${escapeHtml(game.title)}详情"`
    : ` aria-label="${escapeHtml(game.title)}：${escapeHtml(game.category)}"`;
  const status = published ? '可立即游玩' : game.category;
  const action = published ? '进入详情 <span aria-hidden="true">→</span>' : `${escapeHtml(game.category)} <span aria-hidden="true">·</span>`;
  return `
    <${tagName} class="game-card ${published ? 'playable' : 'planning'}"${attributes}>
      <img src="${escapeHtml(game.cover)}" alt="${escapeHtml(game.coverAlt)}" loading="lazy" />
      <span class="card-status ${published ? 'live' : 'muted'}">${escapeHtml(status)}</span>
      <span class="card-corner" aria-hidden="true">${published ? '▶' : '+'}</span>
      <div class="card-caption">
        <div class="card-kicker">${escapeHtml(game.subtitle)}</div>
        <h3>${escapeHtml(game.title)}</h3>
        <p>${escapeHtml(game.summary)}</p>
        <span class="card-action">${action}</span>
      </div>
    </${tagName}>`;
}

function renderCards(container, placement) {
  if (!container) return;
  container.innerHTML = games.map((game) => renderGameCard(game, placement)).join('');
}

function initializeCardTracking() {
  document.querySelectorAll('a.game-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'game_card_click',
        game_id: card.dataset.testid?.replace('game-card-', '') ?? 'unknown',
        placement: card.dataset.placement ?? 'unknown',
      });
    });
  });
}

function initializeLibraryControls() {
  const grid = document.querySelector('[data-game-grid]');
  const input = document.querySelector('#game-search');
  const empty = document.querySelector('#empty-state');
  if (!grid || !input || !empty) return;

  const render = () => {
    const query = input.value.trim().toLowerCase();
    const filtered = games.filter((game) =>
      `${game.title} ${game.subtitle} ${game.category} ${game.summary}`.toLowerCase().includes(query)
    );
    grid.innerHTML = filtered.map((game) => renderGameCard(game, 'library')).join('');
    empty.hidden = filtered.length > 0;
    const params = new URLSearchParams();
    if (query) params.set('q', input.value.trim());
    window.history.replaceState({}, '', params.toString() ? `?${params}` : window.location.pathname);
    initializeCardTracking();
  };

  input.addEventListener('input', render);
  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) input.value = initialQuery;
  render();
}

function initializeGamePlayer() {
  const stage = document.querySelector('#game-stage');
  if (!stage) return;

  const overlay = document.querySelector('#stage-overlay');
  const startButton = document.querySelector('#start-game');
  const restartButton = document.querySelector('#restart-game');
  const fullscreenButton = document.querySelector('#fullscreen-game');
  const exitButton = document.querySelector('#exit-game');
  const statusNode = document.querySelector('#stage-status');
  const playPath = stage.dataset.playPath || '/play/jimao/';
  let frame = null;
  let loadTimer = null;

  const setStatus = (message) => {
    if (statusNode) statusNode.textContent = message;
  };

  const clearFrame = () => {
    if (loadTimer) window.clearTimeout(loadTimer);
    loadTimer = null;
    if (frame) frame.remove();
    frame = null;
  };

  const loadGame = () => {
    clearFrame();
    setStatus('正在加载游戏资源…');
    if (overlay) overlay.hidden = true;
    frame = document.createElement('iframe');
    frame.id = 'game-frame';
    frame.title = '几猫国产3A大作游戏画面';
    frame.src = playPath;
    frame.allow = 'fullscreen; gamepad; autoplay; pointer-lock';
    frame.allowFullscreen = true;
    frame.setAttribute('allowpaymentrequest', 'false');
    frame.setAttribute('referrerpolicy', 'same-origin');
    frame.addEventListener('load', () => {
      setStatus('资源已加载。点击游戏画面开始操作；若长时间黑屏，请确认浏览器支持 WebGL。');
      if (loadTimer) window.clearTimeout(loadTimer);
      loadTimer = null;
    });
    stage.appendChild(frame);
    loadTimer = window.setTimeout(() => {
      setStatus('加载时间较长，通常是首次初始化 WebGL。可点击“重新加载”重试。');
    }, 15000);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'game_play_click', game_id: 'jimao' });
  };

  const showIdle = () => {
    clearFrame();
    if (overlay) overlay.hidden = false;
    setStatus('点击“开始体验”后加载真实游戏。');
  };

  const fullscreen = () => {
    if (!stage.requestFullscreen) {
      setStatus('当前浏览器不支持全屏。');
      return;
    }
    stage.requestFullscreen().then(() => setStatus('已进入全屏，按 Esc 可退出。')).catch(() => setStatus('全屏请求被浏览器拒绝。'));
  };

  startButton?.addEventListener('click', loadGame);
  restartButton?.addEventListener('click', loadGame);
  fullscreenButton?.addEventListener('click', fullscreen);
  exitButton?.addEventListener('click', showIdle);
  window.addEventListener('pagehide', clearFrame, { once: true });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'game_detail_view', game_id: 'jimao' });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCards(document.querySelector('[data-poster-rail]'), 'homepage');
  renderCards(document.querySelector('[data-game-grid]'), 'library');
  initializeCardTracking();
  initializeLibraryControls();
  initializeGamePlayer();
});
