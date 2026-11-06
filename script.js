const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const resetBtn = document.getElementById('resetBtn');
const graphicsSelect = document.getElementById('graphicsSelect');
const particleToggle = document.getElementById('particleToggle');
const trailToggle = document.getElementById('trailToggle');
const scoreBlueEl = document.getElementById('scoreBlue');
const scoreOrangeEl = document.getElementById('scoreOrange');
const boostFill = document.getElementById('boostFill');
const statusText = document.getElementById('statusText');

const presets = {
  'very low': { renderScale: 0.7, particles: 0, trails: false, glow: false },
  low: { renderScale: 0.82, particles: 12, trails: true, glow: false },
  medium: { renderScale: 1, particles: 28, trails: true, glow: true },
  high: { renderScale: 1.15, particles: 54, trails: true, glow: true }
};

const controls = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  boost: ['ShiftLeft', 'ShiftRight'],
  jump: ['Space'],
  airLeft: ['KeyQ'],
  airRight: ['KeyE'],
  slide: ['KeyC'],
  reset: ['KeyR']
};

const keys = {};

const state = {
  running: false,
  menuOpen: true,
  lastTime: 0,
  field: { w: 1600, h: 900 },
  ball: { x: 800, y: 450, z: 0, vx: 0, vy: 0, vz: 0, r: 28 },
  carBlue: createCar({ x: 560, y: 450, color: '#4c9dff' }),
  carOrange: createCar({ x: 1040, y: 450, color: '#ff9b45', invert: true }),
  score: { blue: 0, orange: 0 },
  goalCooldown: 0,
  particles: [],
  isDragging: false,
  lastTouch: null
};

let settings = { ...presets['very low'], preset: 'very low', particlesEnabled: true, trailEnabled: true };

function createCar({ x, y, color, invert = false }) {
  return {
    x,
    y,
    angle: invert ? Math.PI : 0,
    vx: 0,
    vy: 0,
    z: 0,
    vz: 0,
    boost: 100,
    airRoll: 0,
    slideTime: 0,
    flipResetCooldown: 0,
    color,
    lastGround: true,
    name: invert ? 'orange' : 'blue',
    input: { forward: 0, right: 0, boost: false, jump: false, rollLeft: false, rollRight: false, slide: false }
  };
}

function resizeCanvas() {
  const scale = settings.renderScale;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr * scale);
  canvas.height = Math.floor(window.innerHeight * dpr * scale);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setStatus(text) {
  statusText.textContent = text;
}

function resetMatch() {
  state.score.blue = 0;
  state.score.orange = 0;
  updateScoreboard();
  state.ball.x = state.field.w / 2;
  state.ball.y = state.field.h / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.vz = 0;
  state.ball.z = 0;
  state.carBlue.x = 560;
  state.carBlue.y = 450;
  state.carBlue.vx = 0;
  state.carBlue.vy = 0;
  state.carBlue.z = 0;
  state.carBlue.vz = 0;
  state.carBlue.angle = 0;
  state.carBlue.airRoll = 0;
  state.carBlue.slideTime = 0;
  state.carBlue.flipResetCooldown = 0;
  state.carOrange.x = 1040;
  state.carOrange.y = 450;
  state.carOrange.vx = 0;
  state.carOrange.vy = 0;
  state.carOrange.z = 0;
  state.carOrange.vz = 0;
  state.carOrange.angle = Math.PI;
  state.carOrange.airRoll = 0;
  state.carOrange.slideTime = 0;
  state.carOrange.flipResetCooldown = 0;
  state.goalCooldown = 0;
  state.particles = [];
  setStatus('Kickoff!');
}

function updateScoreboard() {
  scoreBlueEl.textContent = state.score.blue;
  scoreOrangeEl.textContent = state.score.orange;
}

function applyGraphicsPreset(name) {
  const preset = presets[name] || presets['very low'];
  settings = { ...preset, preset: name, particlesEnabled: particleToggle.checked, trailEnabled: trailToggle.checked };
  resizeCanvas();
}

function setMenuOpen(open, keepPlaying = true) {
  state.menuOpen = open;
  menu.classList.toggle('visible', open);
  resumeBtn.classList.toggle('hidden', !state.running || !open);
  startBtn.classList.toggle('hidden', state.running && open);
  if (open && state.running) {
    setStatus('Paused');
  }
}

function startGame() {
  state.running = true;
  state.menuOpen = false;
  menu.classList.remove('visible');
  setStatus('Kickoff!');
}

function toggleMenu() {
  if (!state.running) {
    return;
  }
  if (state.menuOpen) {
    state.menuOpen = false;
    menu.classList.remove('visible');
    setStatus('Back to play');
  } else {
    state.menuOpen = true;
    menu.classList.add('visible');
    setStatus('Paused');
  }
}

function handleGoal(team) {
  if (state.goalCooldown > 0) return;
  state.goalCooldown = 2.2;
  if (team === 'blue') {
    state.score.blue += 1;
    setStatus('Blue scores!');
  } else {
    state.score.orange += 1;
    setStatus('Orange scores!');
  }
  updateScoreboard();
  state.ball.x = state.field.w / 2;
  state.ball.y = state.field.h / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.vz = 0;
  state.ball.z = 0;
  state.carBlue.x = 560;
  state.carBlue.y = 450;
  state.carBlue.vx = 0;
  state.carBlue.vy = 0;
  state.carOrange.x = 1040;
  state.carOrange.y = 450;
  state.carOrange.vx = 0;
  state.carOrange.vy = 0;
}

function updateCarInput(car, dt) {
  const left = keys.KeyA || keys.ArrowLeft || keys.KeyQ;
  const right = keys.KeyD || keys.ArrowRight || keys.KeyE;
  const up = keys.KeyW || keys.ArrowUp;
  const down = keys.KeyS || keys.ArrowDown;
  const boost = keys.ShiftLeft || keys.ShiftRight;
  const slide = keys.KeyC;
  const jump = keys.Space;

  const forwardAxis = Number(up) - Number(down);
  const steerAxis = Number(right) - Number(left);

  car.input.forward = forwardAxis;
  car.input.right = steerAxis;
  car.input.boost = !!boost;
  car.input.jump = !!jump;
  car.input.slide = !!slide;

  const angleTarget = Math.atan2(car.vy, car.vx) || car.angle;
  const forwardX = Math.cos(car.angle);
  const forwardY = Math.sin(car.angle);
  const rightX = Math.cos(car.angle + Math.PI / 2);
  const rightY = Math.sin(car.angle + Math.PI / 2);

  const acceleration = 650;
  const maxSpeed = 620;
  const friction = car.lastGround ? 0.985 : 0.995;

  if (car.lastGround) {
    car.vx *= friction;
    car.vy *= friction;
    if (Math.abs(car.vx) < 1) car.vx = 0;
    if (Math.abs(car.vy) < 1) car.vy = 0;

    const desiredTurn = steerAxis * dt * 2.3;
    car.angle += desiredTurn + car.airRoll * 0.2;

    const driveForce = forwardAxis * acceleration;
    car.vx += forwardX * driveForce * dt;
    car.vy += forwardY * driveForce * dt;

    const slidePower = slide ? 12 : 0;
    if (slide && forwardAxis !== 0) {
      car.vx += rightX * steerAxis * slidePower * dt * 40;
      car.vy += rightY * steerAxis * slidePower * dt * 40;
      car.slideTime = 0.22;
    } else {
      car.slideTime = Math.max(0, car.slideTime - dt);
    }

    if (boost && car.boost > 0) {
      car.boost = Math.max(0, car.boost - 26 * dt);
      car.vx += forwardX * 520 * dt;
      car.vy += forwardY * 520 * dt;
      setStatus('Boosting!');
    } else {
      car.boost = Math.min(100, car.boost + 10 * dt);
    }

    if (car.input.jump && car.z <= 0.1) {
      car.z = 0.3;
      car.vz = 540;
      car.lastGround = false;
      setStatus('Airborne');
    }
  } else {
    const airRollDirection = (keys.KeyQ ? -1 : 0) + (keys.KeyE ? 1 : 0);
    car.airRoll = airRollDirection;
    car.angle += airRollDirection * 1.8 * dt;
    car.vx *= 0.999;
    car.vy *= 0.999;
    const airDrift = 220;
    car.vx += rightX * steerAxis * airDrift * dt * 0.8;
    car.vy += rightY * steerAxis * airDrift * dt * 0.8;

    if (keys.KeyR) {
      car.angle = 0;
      car.airRoll = 0;
      car.vz = clamp(car.vz, -10, 320);
      setStatus('Flip reset');
    }

    car.z += car.vz * dt;
    car.vz -= 920 * dt;
    if (car.z <= 0) {
      car.z = 0;
      car.vz = 0;
      car.lastGround = true;
      setStatus('Landed');
    }
  }

  const speed = Math.hypot(car.vx, car.vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    car.vx *= scale;
    car.vy *= scale;
  }

  car.x += car.vx * dt;
  car.y += car.vy * dt;

  if (car.x < 38) { car.x = 38; car.vx *= -0.45; }
  if (car.x > state.field.w - 38) { car.x = state.field.w - 38; car.vx *= -0.45; }
  if (car.y < 38) { car.y = 38; car.vy *= -0.45; }
  if (car.y > state.field.h - 38) { car.y = state.field.h - 38; car.vy *= -0.45; }

  if (car.x < 120 && car.y > state.field.h * 0.32 && car.y < state.field.h * 0.68 && car.z <= 20) {
    handleGoal('orange');
  }
  if (car.x > state.field.w - 120 && car.y > state.field.h * 0.32 && car.y < state.field.h * 0.68 && car.z <= 20) {
    handleGoal('blue');
  }
}

function updateBall(dt) {
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
  state.ball.z += state.ball.vz * dt;
  state.ball.vz -= 950 * dt;
  state.ball.vx *= 0.996;
  state.ball.vy *= 0.996;

  if (state.ball.z <= 0) {
    state.ball.z = 0;
    state.ball.vz *= -0.34;
    if (Math.abs(state.ball.vz) < 25) state.ball.vz = 0;
  }

  if (state.ball.x < state.ball.r) {
    state.ball.x = state.ball.r;
    state.ball.vx *= -0.85;
  }
  if (state.ball.x > state.field.w - state.ball.r) {
    state.ball.x = state.field.w - state.ball.r;
    state.ball.vx *= -0.85;
  }
  if (state.ball.y < state.ball.r) {
    state.ball.y = state.ball.r;
    state.ball.vy *= -0.85;
  }
  if (state.ball.y > state.field.h - state.ball.r) {
    state.ball.y = state.field.h - state.ball.r;
    state.ball.vy *= -0.85;
  }

  if (state.ball.x < 20 && state.ball.y > state.field.h * 0.32 && state.ball.y < state.field.h * 0.68) {
    handleGoal('orange');
  }
  if (state.ball.x > state.field.w - 20 && state.ball.y > state.field.h * 0.32 && state.ball.y < state.field.h * 0.68) {
    handleGoal('blue');
  }

  const cars = [state.carBlue, state.carOrange];
  for (const car of cars) {
    const dx = state.ball.x - car.x;
    const dy = state.ball.y - car.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = state.ball.r + 28;
    if (distance < minDistance) {
      const nx = dx / (distance || 1);
      const ny = dy / (distance || 1);
      const push = minDistance - distance;
      state.ball.x += nx * push;
      state.ball.y += ny * push;
      const impact = 180 + Math.hypot(car.vx, car.vy) * 0.8;
      state.ball.vx += nx * impact * 0.18 + car.vx * 0.14;
      state.ball.vy += ny * impact * 0.18 + car.vy * 0.14;
    }
  }
}

function spawnParticles(x, y, color, amount) {
  if (!settings.particlesEnabled || settings.preset === 'very low') return;
  const count = Math.min(amount, settings.particles || 8);
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 140,
      vy: (Math.random() - 0.5) * 140,
      life: 0.4 + Math.random() * 0.7,
      maxLife: 0.4 + Math.random() * 0.7,
      color
    });
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    return p.life > 0;
  });
}

function update(dt) {
  if (!state.running || state.menuOpen) {
    updateParticles(dt);
    return;
  }

  if (state.goalCooldown > 0) {
    state.goalCooldown -= dt;
  }

  updateCarInput(state.carBlue, dt);
  updateCarInput(state.carOrange, dt);
  updateBall(dt);
  updateParticles(dt);

  if (settings.trailEnabled && Math.random() < 0.9) {
    spawnParticles(state.ball.x, state.ball.y, '#d6f8ff', 2);
  }

  boostFill.style.width = `${state.carBlue.boost}%`;
}

function drawField() {
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / state.field.w;
  const scaleY = h / state.field.h;
  const sx = Math.min(scaleX, scaleY);
  const offsetX = (w - state.field.w * sx) / 2;
  const offsetY = (h - state.field.h * sx) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(sx, sx);

  ctx.fillStyle = '#1d7c52';
  ctx.fillRect(0, 0, state.field.w, state.field.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, state.field.w - 24, state.field.h - 24);

  ctx.beginPath();
  ctx.moveTo(state.field.w / 2, 0);
  ctx.lineTo(state.field.w / 2, state.field.h);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(state.field.w / 2, state.field.h / 2, 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(state.field.w / 2, state.field.h / 2, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 180, 80, state.field.h - 360);
  ctx.strokeRect(state.field.w - 80, 180, 80, state.field.h - 360);

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(100, 0, state.field.w - 200, state.field.h);

  ctx.restore();
}

function drawParticles() {
  if (!settings.particlesEnabled || !settings.trailEnabled) return;
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.fillRect(p.x, p.y, 3, 3);
  }
}

function drawBall() {
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / state.field.w;
  const scaleY = h / state.field.h;
  const sx = Math.min(scaleX, scaleY);
  const offsetX = (w - state.field.w * sx) / 2;
  const offsetY = (h - state.field.h * sx) / 2;

  const px = offsetX + state.ball.x * sx;
  const py = offsetY + state.ball.y * sx;
  const radius = state.ball.r * sx;
  const zScale = 1 + state.ball.z * 0.065;

  ctx.beginPath();
  ctx.fillStyle = '#f5f5f5';
  ctx.shadowColor = 'rgba(255,255,255,0.42)';
  ctx.shadowBlur = settings.glow ? 18 : 0;
  ctx.arc(px, py - state.ball.z * 0.7 * sx, radius * zScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawCar(car) {
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / state.field.w;
  const scaleY = h / state.field.h;
  const sx = Math.min(scaleX, scaleY);
  const offsetX = (w - state.field.w * sx) / 2;
  const offsetY = (h - state.field.h * sx) / 2;

  const px = offsetX + car.x * sx;
  const py = offsetY + car.y * sx;
  const angle = car.angle;
  const bodyLength = 46 * sx;
  const bodyWidth = 26 * sx;
  const zOffset = -car.z * 0.75 * sx;

  ctx.save();
  ctx.translate(px, py + zOffset);
  ctx.rotate(angle);

  ctx.fillStyle = car.color;
  ctx.shadowColor = car.color;
  ctx.shadowBlur = settings.glow ? 18 : 0;
  ctx.fillRect(-bodyLength / 2, -bodyWidth / 2, bodyLength, bodyWidth);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-bodyLength * 0.18, -bodyWidth * 0.53, bodyLength * 0.35, bodyWidth * 0.22);

  ctx.fillStyle = '#0d1720';
  ctx.fillRect(-bodyLength * 0.18, -bodyWidth * 0.9, bodyLength * 0.42, bodyWidth * 0.32);
  ctx.fillRect(-bodyLength * 0.18, bodyWidth * 0.58, bodyLength * 0.42, bodyWidth * 0.32);

  ctx.restore();
}

function drawGoalLights() {
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / state.field.w;
  const scaleY = h / state.field.h;
  const sx = Math.min(scaleX, scaleY);
  const offsetX = (w - state.field.w * sx) / 2;
  const offsetY = (h - state.field.h * sx) / 2;

  ctx.fillStyle = '#afd7ff';
  ctx.globalAlpha = 0.32;
  ctx.fillRect(offsetX + 0 * sx, offsetY + 180 * sx, 30 * sx, state.field.h * sx - 360 * sx);
  ctx.fillRect(offsetX + (state.field.w - 30) * sx, offsetY + 180 * sx, 30 * sx, state.field.h * sx - 360 * sx);
  ctx.globalAlpha = 1;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
  drawGoalLights();
  drawBall();
  drawCar(state.carBlue);
  drawCar(state.carOrange);
  drawParticles();
}

function loop(ts) {
  const dt = clamp((ts - state.lastTime) / 1000 || 0.016, 0.016, 0.033);
  state.lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    if (state.running) toggleMenu();
    return;
  }
  keys[event.code] = true;
  if (event.code === 'Space') event.preventDefault();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

window.addEventListener('resize', resizeCanvas);

graphicsSelect.addEventListener('change', (event) => {
  applyGraphicsPreset(event.target.value);
});

particleToggle.addEventListener('change', () => {
  settings.particlesEnabled = particleToggle.checked;
});

trailToggle.addEventListener('change', () => {
  settings.trailEnabled = trailToggle.checked;
});

startBtn.addEventListener('click', () => {
  resetMatch();
  startGame();
});

resumeBtn.addEventListener('click', () => {
  state.menuOpen = false;
  menu.classList.remove('visible');
  setStatus('Back to play');
});

resetBtn.addEventListener('click', () => {
  resetMatch();
  startGame();
});

window.addEventListener('pointerdown', (event) => {
  if (menu.classList.contains('visible')) return;
  state.isDragging = true;
  state.lastTouch = { x: event.clientX, y: event.clientY };
});

window.addEventListener('pointermove', (event) => {
  if (!state.isDragging || !state.lastTouch) return;
  const dx = event.clientX - state.lastTouch.x;
  const dy = event.clientY - state.lastTouch.y;
  const car = state.carBlue;
  car.angle += dx * 0.005;
  car.vx += dx * 0.06;
  car.vy += dy * 0.06;
  state.lastTouch = { x: event.clientX, y: event.clientY };
});

window.addEventListener('pointerup', () => {
  state.isDragging = false;
  state.lastTouch = null;
});

resetMatch();
applyGraphicsPreset('very low');
requestAnimationFrame(loop);
