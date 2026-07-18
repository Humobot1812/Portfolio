// ===== PARTICLE SYSTEM =====
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    this.init();
    this.animate();
  }
  resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  init() {
    this.particles = [];
    const count = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 15000));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1, color: Math.random() > 0.5 ? '0,240,255' : '191,90,242'
      });
    }
  }
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
      const dx = this.mouse.x - p.x, dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) { p.x -= dx * 0.02; p.y -= dy * 0.02; }
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color},${0.6})`;
      this.ctx.fill();
    });
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(0,240,255,${0.15 * (1 - dist / 140)})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
    requestAnimationFrame(() => this.animate());
  }
}

// ===== 3D ROBOT (Three.js) =====
function initRobot() {
  const container = document.getElementById('robot-canvas');
  if (!container) return;
  const scene = new THREE.Scene();
  const getW = () => container.clientWidth || 400;
  const getH = () => container.clientHeight || 480;
  const camera = new THREE.PerspectiveCamera(50, getW() / getH(), 0.1, 1000);
  camera.position.set(0, 1, 6);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(getW(), getH());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.7 });
  const matP = new THREE.MeshBasicMaterial({ color: 0xbf5af2, wireframe: true, transparent: true, opacity: 0.5 });
  const matG = new THREE.MeshBasicMaterial({ color: 0x32d74b, wireframe: true, transparent: true, opacity: 0.4 });
  const robot = new THREE.Group();

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), mat);
  robot.add(torso);
  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat);
  head.position.y = 1.4;
  robot.add(head);
  // Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2d55, wireframe: true }));
  eyeL.position.set(-0.15, 1.45, 0.36);
  robot.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.15; robot.add(eyeR);
  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), matP);
  neck.position.y = 0.95; robot.add(neck);
  // Shoulders
  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), matP);
  shoulderL.position.set(-0.8, 0.6, 0); robot.add(shoulderL);
  const shoulderR = shoulderL.clone(); shoulderR.position.x = 0.8; robot.add(shoulderR);
  // Arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), mat);
  armL.position.set(-0.85, -0.2, 0); robot.add(armL);
  const armR = armL.clone(); armR.position.x = 0.85; robot.add(armR);
  // Hands
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.15), matG);
  handL.position.set(-0.85, -0.9, 0); robot.add(handL);
  const handR = handL.clone(); handR.position.x = 0.85; robot.add(handR);
  // Waist
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.3, 8), matP);
  waist.position.y = -0.95; robot.add(waist);
  // Legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 0.3), mat);
  legL.position.set(-0.3, -1.9, 0); robot.add(legL);
  const legR = legL.clone(); legR.position.x = 0.3; robot.add(legR);
  // Feet
  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), matG);
  footL.position.set(-0.3, -2.6, 0.1); robot.add(footL);
  const footR = footL.clone(); footR.position.x = 0.3; robot.add(footR);
  // Chest detail
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), new THREE.MeshBasicMaterial({ color: 0xff2d55, wireframe: true, transparent: true, opacity: 0.8 }));
  core.position.y = 0.2; robot.add(core);
  // Antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), matP);
  ant.position.set(0.2, 1.95, 0); robot.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
  antTip.position.set(0.2, 2.2, 0); robot.add(antTip);
  // Orbit rings
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.015, 8, 60), matP);
  ring1.rotation.x = Math.PI / 3; robot.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.01, 8, 60), matG);
  ring2.rotation.x = -Math.PI / 4; ring2.rotation.z = 0.5; robot.add(ring2);

  scene.add(robot);
  robot.position.y = -0.3;

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animateRobot() {
    requestAnimationFrame(animateRobot);
    robot.rotation.y += 0.005;
    robot.rotation.y += (mouseX * 0.3 - robot.rotation.y) * 0.02;
    robot.rotation.x += (-mouseY * 0.15 - robot.rotation.x) * 0.02;
    core.rotation.y += 0.03;
    core.rotation.x += 0.02;
    ring1.rotation.z += 0.008;
    ring2.rotation.z -= 0.005;
    antTip.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
    renderer.render(scene, camera);
  }
  animateRobot();

  function onResize() {
    const w = getW(), h = getH();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);
}

// ===== CUSTOM CURSOR =====
function initCursor() {
  const cursor = document.createElement('div'); cursor.className = 'cursor';
  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  document.body.appendChild(cursor); document.body.appendChild(dot);
  let cx = 0, cy = 0, dx = 0, dy = 0;
  document.addEventListener('mousemove', e => { dx = e.clientX; dy = e.clientY; });
  (function moveCursor() {
    cx += (dx - cx) * 0.15; cy += (dy - cy) * 0.15;
    cursor.style.left = cx - 10 + 'px'; cursor.style.top = cy - 10 + 'px';
    dot.style.left = dx - 3 + 'px'; dot.style.top = dy - 3 + 'px';
    requestAnimationFrame(moveCursor);
  })();
  document.querySelectorAll('a,button,.pcard,.pill,.stab,.filt-btn,.cert-link,.plink,.btn-p,.btn-o').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ===== LOADER =====
function initLoader() {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loader-fill');
  const log = document.getElementById('loader-log');
  const logs = [
    'Initializing neural interface...',
    'Loading sensor arrays...',
    'Calibrating servo motors...',
    'Establishing MAVLink connection...',
    'Compiling ROS2 nodes...',
    'Mapping environment...',
    'System ready.'
  ];
  let progress = 0;
  let logIdx = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 5;
    if (progress > 100) progress = 100;
    fill.style.width = progress + '%';
    if (logIdx < logs.length && progress > (logIdx + 1) * 14) {
      log.textContent = logs[logIdx]; logIdx++;
    }
    if (progress >= 100) {
      clearInterval(interval);
      log.textContent = 'System ready.';
      setTimeout(() => {
        loader.classList.add('hidden');
        navigateTo('home');
      }, 400);
    }
  }, 200);
}

// ===== PAGE NAVIGATION =====
let currentPage = null;
function navigateTo(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = pageId === 'home' ? 'block' : 'block';
    // Force reflow before adding class for animation
    void target.offsetHeight;
    target.classList.add('active');
    window.scrollTo(0, 0);
    if (pageId === 'home') {
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
    }
    // Re-observe fade-ups
    target.querySelectorAll('.fade-up').forEach(el => {
      el.classList.remove('vis');
      obs.observe(el);
    });
    // Trigger skill bars if on about page
    if (pageId === 'about') {
      setTimeout(() => {
        document.querySelectorAll('.skills-panel.active .sbar-fill').forEach(bar => {
          bar.style.transform = `scaleX(${bar.dataset.w})`;
        });
      }, 300);
    }
    currentPage = pageId;
    // Update nav active state
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === pageId);
    });
    // Game: unlock badge
    if (typeof unlockSectionBadge === 'function' && pageId !== 'home') {
      unlockSectionBadge(pageId);
    }
  }
}

// ===== SCROLL OBSERVER =====
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => { if (e.isIntersecting) setTimeout(() => e.target.classList.add('vis'), i * 90); });
}, { threshold: .08 });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Particles
  const pCanvas = document.getElementById('particles');
  if (pCanvas) new ParticleSystem(pCanvas);

  // Loader
  initLoader();

  // 3D Robot
  if (typeof THREE !== 'undefined') initRobot();

  // Cursor (only desktop)
  if (window.innerWidth > 900) initCursor();

  // Nav clicks
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
      if (typeof awardPoints === 'function') awardPoints(20, `Navigated to ${link.dataset.page}`);
    });
  });

  // Logo click -> home
  document.querySelector('.nav-logo').addEventListener('click', e => {
    e.preventDefault();
    navigateTo('home');
  });

  // Hero CTA buttons that navigate
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(btn.dataset.nav);
    });
  });

  // Skills tabs
  const skillTabs = document.getElementById('skillTabs');
  if (skillTabs) {
    skillTabs.addEventListener('click', e => {
      const btn = e.target.closest('.stab');
      if (!btn) return;
      document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.skills-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(btn.dataset.panel);
      panel.classList.add('active');
      panel.querySelectorAll('.sbar-fill').forEach(bar => {
        bar.style.transform = 'scaleX(0)';
        setTimeout(() => { bar.style.transform = `scaleX(${bar.dataset.w})`; }, 50);
      });
    });
  }

  // Project filter
  document.querySelectorAll('.filt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.pcard').forEach(card => {
        if (f === 'all' || card.dataset.cats.includes(f)) {
          card.style.display = '';
          setTimeout(() => card.style.opacity = '1', 10);
        } else {
          card.style.opacity = '0';
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
      if (typeof awardPoints === 'function') awardPoints(5, 'Filter used');
    });
  });

  // 3D tilt on project cards
  document.querySelectorAll('.pcard').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
    });
  });

  // Project links XP
  document.querySelectorAll('.plink').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof awardPoints === 'function') awardPoints(10, 'Project exploration');
    });
  });
});

// ===== GAMIFICATION =====
const gameState = { score: 0, completed: new Set(), bonusUnlocked: false, steps: ['about', 'projects', 'experience', 'achievements', 'contact'] };

function saveGameState() {
  localStorage.setItem('portfolioGameState', JSON.stringify({ score: gameState.score, completed: [...gameState.completed], bonusUnlocked: gameState.bonusUnlocked }));
}
function loadGameState() {
  try {
    const saved = JSON.parse(localStorage.getItem('portfolioGameState'));
    if (!saved) return;
    if (typeof saved.score === 'number') gameState.score = saved.score;
    if (Array.isArray(saved.completed)) saved.completed.forEach(id => gameState.completed.add(id));
    if (saved.bonusUnlocked) gameState.bonusUnlocked = true;
    gameState.completed.forEach(id => {
      const el = document.querySelector(`.badge-pill[data-badge="${id}"]`);
      if (el) { el.classList.replace('locked', 'unlocked'); el.textContent = `${el.textContent.split(' ')[0]} ✓`; }
    });
    if (gameState.bonusUnlocked) {
      const bonus = document.querySelector('.badge-pill[data-badge="bonus"]');
      if (bonus) { bonus.classList.replace('locked', 'unlocked'); bonus.textContent = 'Bonus ✓'; }
    }
  } catch (err) { console.warn('Game load fail', err); }
}
function getLevel() {
  if (gameState.score >= 180) return 'Level 3 — Elite Pilot';
  if (gameState.score >= 90) return 'Level 2 — Navigator';
  return 'Level 1 — Explorer';
}
function updateGameUI() {
  const s = document.getElementById('gameScore'), x = document.getElementById('gameXP'), l = document.querySelector('.game-level'), p = document.getElementById('gameProgress');
  if (s) s.textContent = gameState.score;
  if (x) x.textContent = `${gameState.score} XP`;
  if (l) l.textContent = getLevel();
  if (p) p.style.width = `${Math.min(100, Math.round((gameState.completed.size / gameState.steps.length) * 100))}%`;
  saveGameState();
}
function showToast(message) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<strong>Mission</strong> ${message}`;
  c.appendChild(t);
  setTimeout(() => t.style.opacity = '0', 3500);
  setTimeout(() => t.remove(), 4000);
}
function awardPoints(value, event) { gameState.score += value; updateGameUI(); if (event) showToast(`+${value} XP — ${event}`); }
function unlockSectionBadge(id) {
  if (gameState.completed.has(id)) return;
  gameState.completed.add(id);
  const badge = document.querySelector(`.badge-pill[data-badge="${id}"]`);
  if (badge) { badge.classList.replace('locked', 'unlocked'); badge.textContent = `${badge.textContent.split(' ')[0]} ✓`; }
  awardPoints(25, `Badge unlocked: ${id}`);
  if (gameState.completed.size === gameState.steps.length && !gameState.bonusUnlocked) {
    gameState.bonusUnlocked = true;
    const bonus = document.querySelector('.badge-pill[data-badge="bonus"]');
    if (bonus) { bonus.classList.replace('locked', 'unlocked'); bonus.textContent = 'Bonus ✓'; }
    awardPoints(50, 'Secret bonus unlocked');
  }
}
loadGameState();
setTimeout(updateGameUI, 500);
