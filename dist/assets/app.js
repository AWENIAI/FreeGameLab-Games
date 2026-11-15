const games = [
  {
    slug: 'jimao',
    title: '几猫国产3A大作',
    playPath: '/play/jimao/',
    cover: '/assets/cover-jimao.svg',
  },
  {
    slug: 'return-walk',
    title: '回程信标',
    playPath: '/play/return-walk/',
    cover: '/assets/cover-return-walk.svg',
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
  return `
    <a class="game-card home-card" href="/games/${escapeHtml(game.slug)}/" data-testid="game-card-${escapeHtml(game.slug)}" data-placement="${escapeHtml(placement)}" aria-label="${escapeHtml(game.title)}">
      <img src="${escapeHtml(game.cover)}" alt="" loading="lazy" />
      <span class="card-title">${escapeHtml(game.title)}</span>
    </a>`;
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
  const gameId = stage.dataset.gameId || 'jimao';
  const gameTitle = stage.dataset.gameTitle || '几猫国产3A大作';
  const loadHint = gameId === 'jimao'
    ? '资源已加载。点击游戏画面开始操作；若长时间黑屏，请确认浏览器支持 WebGL。'
    : '资源已加载。点击画面、按钮或按空格即可落步。';
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
    frame.title = `${gameTitle}游戏画面`;
    frame.src = playPath;
    frame.allow = 'fullscreen; gamepad; autoplay; pointer-lock';
    frame.allowFullscreen = true;
    frame.setAttribute('allowpaymentrequest', 'false');
    frame.setAttribute('referrerpolicy', 'same-origin');
    frame.addEventListener('load', () => {
      setStatus(loadHint);
      if (loadTimer) window.clearTimeout(loadTimer);
      loadTimer = null;
    });
    stage.appendChild(frame);
    loadTimer = window.setTimeout(() => {
      setStatus('加载时间较长，通常是首次初始化 WebGL。可点击“重新加载”重试。');
    }, 15000);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'game_play_click', game_id: gameId });
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
  window.dataLayer.push({ event: 'game_detail_view', game_id: gameId });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCards(document.querySelector('[data-poster-rail]'), 'homepage');
  renderCards(document.querySelector('[data-game-grid]'), 'library');
  initializeCardTracking();
  initializeGamePlayer();
});
