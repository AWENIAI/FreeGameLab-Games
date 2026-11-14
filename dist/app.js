const games = [
  {
    slug: 'pelican-ride',
    title: 'Pelican Ride',
    category: '3d',
    engine: 'Three.js',
    status: '可预览',
    playable: true,
    summary: '在三维场景中轻松骑行，体验明亮的云层、节奏与躲避挑战。',
  },
  {
    slug: 'classroom-detective',
    title: 'Classroom Detective',
    category: 'simulation',
    engine: '规划中',
    status: '开发中',
    playable: false,
    summary: '观察课堂中的行为差异，找出异常线索。当前仅登记规划状态。',
  },
];

function initializeGamesLibrary() {
  const grid = document.querySelector('[data-game-grid]');
  const input = document.querySelector('#game-search');
  const category = document.querySelector('#game-category');
  const sort = document.querySelector('#game-sort');
  const empty = document.querySelector('#empty-state');
  if (!grid || !input || !category || !sort || !empty) return;

  const params = new URLSearchParams(window.location.search);
  input.value = params.get('q') ?? '';
  category.value = params.get('category') ?? 'all';
  sort.value = params.get('sort') ?? 'newest';

  function render() {
    const query = input.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const selectedSort = sort.value;
    const filtered = games
      .filter((game) => selectedCategory === 'all' || game.category === selectedCategory)
      .filter((game) => !query || `${game.title} ${game.summary} ${game.category}`.toLowerCase().includes(query))
      .sort((first, second) => selectedSort === 'title' ? first.title.localeCompare(second.title) : Number(second.playable) - Number(first.playable));

    grid.innerHTML = filtered.map((game) => `
      <article class="game-card ${game.playable ? 'playable' : 'planning'}" data-game-card>
        <div class="cover cover-${game.slug}">
          <span class="cover-label">${game.category === '3d' ? '3D · 休闲骑行' : '观察 · 解谜'}</span>
          <span class="cover-badge ${game.playable ? '' : 'muted'}">${game.status}</span>
        </div>
        <div class="card-body">
          <h3>${game.title}</h3>
          <p>${game.summary}</p>
          <div class="card-meta"><span>${game.engine}</span><span>${game.playable ? '可打开详情' : '暂无可玩入口'}</span></div>
          ${game.playable
            ? `<a class="card-action" href="/games/${game.slug}/">进入详情 <span aria-hidden="true">→</span></a>`
            : '<span class="card-action disabled">了解计划 · 暂不可玩</span>'}
        </div>
      </article>
    `).join('');
    empty.style.display = filtered.length ? 'none' : 'block';

    const next = new URLSearchParams();
    if (input.value.trim()) next.set('q', input.value.trim());
    if (category.value !== 'all') next.set('category', category.value);
    if (sort.value !== 'newest') next.set('sort', sort.value);
    const queryString = next.toString();
    window.history.replaceState({}, '', queryString ? `/games/?${queryString}` : '/games/');
  }

  [input, category, sort].forEach((control) => control.addEventListener('input', render));
  window.addEventListener('popstate', () => {
    const current = new URLSearchParams(window.location.search);
    input.value = current.get('q') ?? '';
    category.value = current.get('category') ?? 'all';
    sort.value = current.get('sort') ?? 'newest';
    render();
  });
  render();
}

function initializeGamePlayer() {
  const canvas = document.querySelector('#game-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const overlay = document.querySelector('#stage-overlay');
  const startButton = document.querySelector('#start-game');
  const restartButton = document.querySelector('#restart-game');
  const pauseButton = document.querySelector('#pause-game');
  const shareButton = document.querySelector('#share-game');
  const scoreNode = document.querySelector('#score-value');
  const stateNode = document.querySelector('#player-state');
  let animationFrame = 0;
  let running = false;
  let paused = false;
  let score = 0;
  let lane = 1;
  let obstacleX = 820;
  let obstacleLane = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function roundRect(x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#171d4b');
    sky.addColorStop(.55, '#4b56b8');
    sky.addColorStop(1, '#90d8ff');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    context.fillStyle = 'rgba(255,255,255,.12)';
    for (let index = 0; index < 5; index += 1) {
      const x = ((index * 173 + score * .18) % (width + 160)) - 80;
      roundRect(x, 34 + (index % 2) * 38, 120, 22, 12);
      context.fill();
    }

    context.fillStyle = 'rgba(9, 14, 42, .45)';
    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(width * .38, height * .55);
    context.lineTo(width * .62, height * .55);
    context.lineTo(width, height);
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(255,255,255,.3)';
    context.lineWidth = 2;
    [0.45, 0.55, 0.65].forEach((offset) => {
      context.beginPath();
      context.moveTo(width * .5, height * .55);
      context.lineTo(width * offset + width * (offset - .5), height);
      context.stroke();
    });

    const laneWidth = width * .22;
    const playerX = width * .5 + (lane - 1) * laneWidth;
    const playerY = height * .72;
    context.fillStyle = 'rgba(255,255,255,.9)';
    context.beginPath();
    context.ellipse(playerX, playerY, 34, 24, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ff9b5c';
    context.beginPath();
    context.moveTo(playerX + 26, playerY - 4);
    context.lineTo(playerX + 62, playerY + 4);
    context.lineTo(playerX + 26, playerY + 10);
    context.closePath();
    context.fill();
    context.fillStyle = '#161b38';
    context.beginPath();
    context.arc(playerX + 13, playerY - 8, 3, 0, Math.PI * 2);
    context.fill();

    const obstacleY = height * .58 + (obstacleX / width) * height * .16;
    const obstacleSize = 18 + (obstacleX / width) * 32;
    context.fillStyle = '#ffcf70';
    roundRect(width * .5 + (obstacleLane - 1) * laneWidth - obstacleSize / 2, obstacleY, obstacleSize, obstacleSize, 6);
    context.fill();
  }

  function tick() {
    if (!running || paused) return;
    obstacleX -= 4.2;
    score += 1;
    if (obstacleX < 80) {
      if (obstacleLane === lane) score = Math.max(0, score - 80);
      obstacleX = canvas.clientWidth + 80;
      obstacleLane = Math.floor(Math.random() * 3);
    }
    scoreNode.textContent = String(Math.floor(score / 10));
    draw();
    animationFrame = window.requestAnimationFrame(tick);
  }

  function start() {
    running = true;
    paused = false;
    score = 0;
    lane = 1;
    obstacleX = canvas.clientWidth + 80;
    obstacleLane = Math.floor(Math.random() * 3);
    overlay.hidden = true;
    stateNode.textContent = 'playing';
    window.cancelAnimationFrame(animationFrame);
    tick();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    stateNode.textContent = paused ? 'paused' : 'playing';
    pauseButton.textContent = paused ? '继续' : '暂停';
    if (!paused) tick();
  }

  startButton?.addEventListener('click', start);
  restartButton?.addEventListener('click', start);
  pauseButton?.addEventListener('click', togglePause);
  shareButton?.addEventListener('click', async () => {
    const shareData = { title: 'Pelican Ride · GameHub', text: '来看看这个轻量 HTML5 小游戏预览。', url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      shareButton.textContent = '链接已复制';
      window.setTimeout(() => { shareButton.textContent = '分享'; }, 1600);
    }
  });
  window.addEventListener('keydown', (event) => {
    if (!running || paused) return;
    if (event.key === 'ArrowLeft') lane = Math.max(0, lane - 1);
    if (event.key === 'ArrowRight') lane = Math.min(2, lane + 1);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    lane = event.clientX - rect.left < rect.width / 2 ? Math.max(0, lane - 1) : Math.min(2, lane + 1);
  });
  window.addEventListener('resize', () => { resize(); draw(); });
  resize();
  draw();
}

initializeGamesLibrary();
initializeGamePlayer();
