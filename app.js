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
  if (!pageId) return;
  const target = document.getElementById(pageId);
  if (!target) return;
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  target.style.display = 'block';
  void target.offsetHeight;
  target.classList.add('active');
  window.scrollTo(0, 0);
  if (pageId === 'home') {
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
  }
  target.querySelectorAll('.fade-up').forEach(el => {
    el.classList.remove('vis');
    obs.observe(el);
  });
  if (pageId === 'about') {
    setTimeout(() => {
      document.querySelectorAll('.skills-panel.active .sbar-fill').forEach(bar => {
        bar.style.transform = `scaleX(${bar.dataset.w})`;
      });
    }, 300);
  }
  currentPage = pageId;
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  if (typeof unlockSectionBadge === 'function' && pageId !== 'home') {
    unlockSectionBadge(pageId);
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

  // Skills Knowledge Graph
  initSkillsGraph();

  // Nav clicks
  document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
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

// ===== INTERACTIVE SKILLS KNOWLEDGE GRAPH =====
function initSkillsGraph() {
  const canvas = document.getElementById('skillsGraphCanvas');
  const container = document.getElementById('skillsGraphBox');
  const tooltip = document.getElementById('graphTooltip');
  if (!canvas || !container) return;

  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let width = 0, height = 0;

  function resize() {
    width = container.clientWidth;
    height = container.clientHeight || 480;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  // Categories & Config
  const categories = {
    prog: { label: 'LANGUAGES', color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.4)' },
    ros: { label: 'FRAMEWORKS', color: '#bf5af2', glow: 'rgba(191, 90, 242, 0.4)' },
    uav: { label: 'UAV / DRONE', color: '#0a84ff', glow: 'rgba(10, 132, 255, 0.4)' },
    vision: { label: 'VISION', color: '#ff2d55', glow: 'rgba(255, 45, 85, 0.4)' },
    hw: { label: 'HARDWARE', color: '#32d74b', glow: 'rgba(50, 215, 75, 0.4)' },
    tools: { label: 'TOOLS', color: '#ffd166', glow: 'rgba(255, 209, 102, 0.4)' }
  };

  const rawSkills = [
    // LANGUAGES
    { label: 'C++', cat: 'prog', level: 'Core Architecture & Robotics' },
    { label: 'Python', cat: 'prog', level: 'AI, ROS2 & Scripting' },
    { label: 'Matlab', cat: 'prog', level: 'Simulation & Analysis' },
    { label: 'Embedded C', cat: 'prog', level: 'Firmware & Microcontrollers' },

    // FRAMEWORKS
    { label: 'ROS2 Humble', cat: 'ros', level: 'Robotics Middleware' },
    { label: 'ROS2 Control', cat: 'ros', level: 'Hardware Interfaces' },
    { label: 'Nav2', cat: 'ros', level: 'Autonomous Navigation' },
    { label: 'SLAM Toolbox', cat: 'ros', level: '2D Mapping' },
    { label: 'ORB-SLAM3', cat: 'ros', level: 'Visual Feature SLAM' },
    { label: 'MoveIt2', cat: 'ros', level: 'Arm Manipulation' },
    { label: 'AMCL', cat: 'ros', level: 'Adaptive Monte Carlo' },
    { label: 'TF2', cat: 'ros', level: 'Transform Tree' },
    { label: 'URDF/xacro', cat: 'ros', level: 'Robot Kinematic Model' },
    { label: 'EKF', cat: 'ros', level: 'Extended Kalman Filter' },
    { label: 'PID Control', cat: 'ros', level: 'Feedback Control' },
    { label: 'RANSAC', cat: 'ros', level: 'Outlier Rejection' },
    { label: 'Sensor Fusion', cat: 'ros', level: 'IMU + Odometry + LiDAR' },

    // UAV / DRONE
    { label: 'MultiRotor UAVs', cat: 'uav', level: 'Drone Airframe & Flight' },
    { label: 'Pixhawk', cat: 'uav', level: 'Flight Controller HW' },
    { label: 'ArduPilot', cat: 'uav', level: 'Autopilot Firmware' },
    { label: 'PX4', cat: 'uav', level: 'Autopilot Flight Stack' },
    { label: 'QGroundControl', cat: 'uav', level: 'GCS Telemetry' },
    { label: 'Mission Planner', cat: 'uav', level: 'Autonomous Waypoints' },
    { label: 'MAVLink', cat: 'uav', level: 'Telemetry Protocol' },
    { label: 'DroneKit', cat: 'uav', level: 'Python UAV Control' },
    { label: 'ArduPilot SITL', cat: 'uav', level: 'Simulation-in-the-Loop' },
    { label: 'Visual Servoing', cat: 'uav', level: 'Target Tracking' },
    { label: 'LoRa Module', cat: 'uav', level: 'Long-Range RF Telemetry' },

    // VISION
    { label: 'OpenCV', cat: 'vision', level: 'Computer Vision Pipeline' },
    { label: 'YOLOv8', cat: 'vision', level: 'Object Detection AI' },
    { label: 'RPi Cam v3 NoIR', cat: 'vision', level: 'Night Vision Optics' },
    { label: 'ESP-CAM', cat: 'vision', level: 'Embedded Camera Stream' },
    { label: 'ArUco Markers', cat: 'vision', level: 'Visual Target Geolocation' },
    { label: 'Pixel-to-GPS', cat: 'vision', level: 'Geospatial Projection' },

    // HARDWARE
    { label: 'Jetson AGX Xavier', cat: 'hw', level: 'Edge Supercomputer' },
    { label: 'Jetson Nano', cat: 'hw', level: 'Edge Compute Node' },
    { label: 'Raspberry Pi 4/5', cat: 'hw', level: 'SBC Processor' },
    { label: 'ESP32-S3', cat: 'hw', level: 'Dual-Core Microcontroller' },
    { label: 'Microprocessors', cat: 'hw', level: 'Digital Logic & Architecture' },
    { label: 'Arduino', cat: 'hw', level: 'MCU Prototyping' },
    { label: 'LiDAR', cat: 'hw', level: 'Laser Distance Sensing' },
    { label: 'MPU9250 IMU', cat: 'hw', level: '9-DOF Inertial Sensor' },
    { label: 'Encoder Motors', cat: 'hw', level: 'Wheel Odometry' },
    { label: 'ST7920 Display', cat: 'hw', level: 'SPI Graphics Display' },
    { label: '3D Printing', cat: 'hw', level: 'Rapid Structural Fabrication' },

    // TOOLS
    { label: 'Gazebo', cat: 'tools', level: '3D Robotics Simulator' },
    { label: 'MuJoCo', cat: 'tools', level: 'Contact Physics Sim' },
    { label: 'RViz2', cat: 'tools', level: 'ROS2 Data Visualization' },
    { label: 'Fusion 360', cat: 'tools', level: 'CAD Mechanical Design' },
    { label: 'TinkerCad', cat: 'tools', level: 'Schematic Prototyping' },
    { label: 'Git / GitHub', cat: 'tools', level: 'Version Control' },
    { label: 'Ubuntu Linux', cat: 'tools', level: 'OS Target' }
  ];

  // Build Graph Nodes & Links
  const nodes = [];
  const links = [];
  const nodeMap = {};

  const catKeys = Object.keys(categories);
  const totalCat = catKeys.length;
  const centerX = width / 2;
  const centerY = height / 2;
  const ringRadius = 140;

  catKeys.forEach((key, idx) => {
    const angle = (idx / totalCat) * Math.PI * 2 - Math.PI / 2;
    const cat = categories[key];
    const hubNode = {
      id: `hub_${key}`,
      label: cat.label,
      cat: key,
      isHub: true,
      r: 34,
      x: centerX + Math.cos(angle) * ringRadius + (Math.random() - 0.5) * 10,
      y: centerY + Math.sin(angle) * ringRadius + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: cat.color,
      glow: cat.glow,
      subCount: 0
    };
    nodes.push(hubNode);
    nodeMap[hubNode.id] = hubNode;
  });

  rawSkills.forEach((skill, idx) => {
    const hub = nodeMap[`hub_${skill.cat}`];
    const cat = categories[skill.cat];
    const offsetAngle = Math.random() * Math.PI * 2;
    const dist = 65 + Math.random() * 55;

    const childNode = {
      id: `leaf_${idx}`,
      label: skill.label,
      cat: skill.cat,
      level: skill.level,
      isHub: false,
      r: 18 + Math.min(skill.label.length * 0.35, 7),
      x: hub.x + Math.cos(offsetAngle) * dist,
      y: hub.y + Math.sin(offsetAngle) * dist,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: cat.color,
      glow: cat.glow,
      parentHub: hub
    };

    nodes.push(childNode);
    nodeMap[childNode.id] = childNode;
    hub.subCount++;

    // Spring Link to Hub
    links.push({
      source: hub,
      target: childNode,
      length: 80 + Math.random() * 30,
      pulsePos: Math.random(),
      pulseSpeed: 0.003 + Math.random() * 0.004
    });
  });

  // Cross-link Ring between Category Hubs
  for (let i = 0; i < totalCat; i++) {
    const hubA = nodeMap[`hub_${catKeys[i]}`];
    const hubB = nodeMap[`hub_${catKeys[(i + 1) % totalCat]}`];
    links.push({
      source: hubA,
      target: hubB,
      length: ringRadius * 1.05,
      isRing: true,
      pulsePos: Math.random(),
      pulseSpeed: 0.002
    });
  }

  // Viewport & Interaction
  let camera = {
    x: width / 2,
    y: height / 2,
    zoom: 1.0,
    targetX: width / 2,
    targetY: height / 2,
    targetZoom: 1.0
  };

  let activeCategory = 'all';
  let hoveredNode = null;
  let focusedNode = null;
  let draggedNode = null;
  let mouse = { x: 0, y: 0, canvasX: 0, canvasY: 0 };
  let pulseRings = [];

  function addShockwave(x, y, color) {
    pulseRings.push({ x, y, r: 10, opacity: 1, color });
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - width / 2) / camera.zoom + camera.x,
      y: (sy - height / 2) / camera.zoom + camera.y
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const c = getCanvasCoords(e);
    mouse.canvasX = c.x;
    mouse.canvasY = c.y;
    const w = screenToWorld(c.x, c.y);
    mouse.x = w.x;
    mouse.y = w.y;

    if (draggedNode) {
      draggedNode.x = mouse.x;
      draggedNode.y = mouse.y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      return;
    }

    let found = null;
    for (let n of nodes) {
      if (activeCategory !== 'all' && n.cat !== activeCategory && n.id !== `hub_${activeCategory}`) continue;
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      if (dx * dx + dy * dy <= (n.r + 6) * (n.r + 6)) {
        found = n;
        break;
      }
    }
    hoveredNode = found;

    if (hoveredNode) {
      tooltip.classList.add('visible');
      tooltip.style.left = mouse.canvasX + 'px';
      tooltip.style.top = mouse.canvasY + 'px';
      if (hoveredNode.isHub) {
        tooltip.innerHTML = `<strong>${hoveredNode.label}</strong><br/><span style="color:var(--text3);font-size:10px;">Category Hub · ${hoveredNode.subCount} Nodes</span>`;
      } else {
        tooltip.innerHTML = `<strong>${hoveredNode.label}</strong><br/><span style="color:${hoveredNode.color}">${hoveredNode.level}</span>`;
      }
    } else {
      tooltip.classList.remove('visible');
    }
  });

  canvas.addEventListener('mousedown', () => {
    if (hoveredNode) draggedNode = hoveredNode;
  });

  window.addEventListener('mouseup', () => {
    draggedNode = null;
  });

  canvas.addEventListener('click', () => {
    if (hoveredNode) {
      focusedNode = hoveredNode;
      camera.targetX = hoveredNode.x;
      camera.targetY = hoveredNode.y;
      camera.targetZoom = hoveredNode.isHub ? 1.6 : 2.1;
      addShockwave(hoveredNode.x, hoveredNode.y, hoveredNode.color);
      if (typeof awardPoints === 'function') awardPoints(10, `Inspected skill: ${hoveredNode.label}`);
    } else {
      resetZoom();
    }
  });

  function resetZoom() {
    focusedNode = null;
    camera.targetX = width / 2;
    camera.targetY = height / 2;
    camera.targetZoom = 1.0;
  }

  const resetBtn = document.getElementById('resetSkillZoom');
  if (resetBtn) resetBtn.addEventListener('click', resetZoom);

  const filterPills = document.querySelectorAll('#graphFilterPills .gpill[data-cat]');
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      if (activeCategory === 'all') {
        resetZoom();
      } else {
        const hub = nodeMap[`hub_${activeCategory}`];
        if (hub) {
          focusedNode = hub;
          camera.targetX = hub.x;
          camera.targetY = hub.y;
          camera.targetZoom = 1.55;
          addShockwave(hub.x, hub.y, hub.color);
        }
      }
    });
  });

  let time = 0;
  function updatePhysics() {
    time += 0.015;

    camera.x += (camera.targetX - camera.x) * 0.08;
    camera.y += (camera.targetY - camera.y) * 0.08;
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.08;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      a.vx += Math.cos(time + i * 1.3) * 0.035;
      a.vy += Math.sin(time + i * 1.7) * 0.035;

      a.vx += (width / 2 - a.x) * 0.00012;
      a.vy += (height / 2 - a.y) * 0.00012;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let distSq = dx * dx + dy * dy || 1;
        let minDist = a.r + b.r + 18;

        if (distSq < minDist * minDist * 4) {
          let dist = Math.sqrt(distSq);
          let force = (minDist - dist) / dist;
          if (force > 0) {
            let fx = dx * force * 0.07;
            let fy = dy * force * 0.07;
            if (a !== draggedNode) { a.vx -= fx; a.vy -= fy; }
            if (b !== draggedNode) { b.vx += fx; b.vy += fy; }
          }
        }
      }
    }

    links.forEach(link => {
      const a = link.source;
      const b = link.target;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - link.length;
      const k = link.isRing ? 0.002 : 0.01;

      const fx = (dx / dist) * delta * k;
      const fy = (dy / dist) * delta * k;

      if (a !== draggedNode) { a.vx += fx; a.vy += fy; }
      if (b !== draggedNode) { b.vx -= fx; b.vy -= fy; }

      link.pulsePos = (link.pulsePos + link.pulseSpeed) % 1;
    });

    nodes.forEach(n => {
      if (n === draggedNode) return;
      n.vx *= 0.89;
      n.vy *= 0.89;
      n.x += n.vx;
      n.y += n.vy;

      const m = 35;
      if (n.x < m) { n.x = m; n.vx *= -0.5; }
      if (n.x > width - m) { n.x = width - m; n.vx *= -0.5; }
      if (n.y < m) { n.y = m; n.vy *= -0.5; }
      if (n.y > height - m) { n.y = height - m; n.vy *= -0.5; }
    });

    for (let i = pulseRings.length - 1; i >= 0; i--) {
      const ring = pulseRings[i];
      ring.r += 2.4;
      ring.opacity -= 0.025;
      if (ring.opacity <= 0) pulseRings.splice(i, 1);
    }
  }

  function draw() {
    updatePhysics();

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    pulseRings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = Math.max(0, ring.opacity);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    links.forEach(link => {
      const a = link.source;
      const b = link.target;

      if (activeCategory !== 'all') {
        if (a.cat !== activeCategory && b.cat !== activeCategory) return;
      }

      const isFocused = focusedNode && (a === focusedNode || b === focusedNode);
      const isHovered = hoveredNode && (a === hoveredNode || b === hoveredNode);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      if (link.isRing) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
        if (isFocused || isHovered) {
          ctx.strokeStyle = a.color;
          ctx.lineWidth = 2.4;
          ctx.shadowColor = a.color;
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      const px = a.x + (b.x - a.x) * link.pulsePos;
      const py = a.y + (b.y - a.y) * link.pulsePos;
      ctx.beginPath();
      ctx.arc(px, py, link.isRing ? 2 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = (isFocused || isHovered) ? a.color : '#ffffff';
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    nodes.forEach(n => {
      const isFilteredOut = activeCategory !== 'all' && n.cat !== activeCategory && n.id !== `hub_${activeCategory}`;
      const alpha = isFilteredOut ? 0.2 : 1.0;

      ctx.save();
      ctx.globalAlpha = alpha;

      const isHovered = hoveredNode === n;
      const isFocused = focusedNode === n;
      const scale = isHovered ? 1.15 : (isFocused ? 1.2 : 1.0);
      const r = n.r * scale;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r + (isFocused ? 8 : (isHovered ? 6 : 2)), 0, Math.PI * 2);
      ctx.fillStyle = n.glow;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = isFocused ? 25 : (isHovered ? 18 : 8);
      ctx.fill();

      const grad = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, r * 0.1, n.x, n.y, r);
      if (n.isHub) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, n.color);
        grad.addColorStop(1, '#050015');
      } else {
        grad.addColorStop(0, n.color);
        grad.addColorStop(0.7, '#0a0520');
        grad.addColorStop(1, '#030014');
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.strokeStyle = n.color;
      ctx.lineWidth = n.isHub ? 3 : (isFocused ? 2.5 : 1.5);
      ctx.fill();
      ctx.stroke();

      if (isFocused) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.font = n.isHub ? 'bold 11px "Space Mono", monospace' : '10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (n.isHub) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(n.label, n.x, n.y);
      } else {
        if (n.label.length <= 10) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(n.label, n.x, n.y);
        } else {
          const words = n.label.split(' ');
          if (words.length > 1) {
            const mid = Math.ceil(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.slice(mid).join(' ');
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(line1, n.x, n.y - 5);
            ctx.fillText(line2, n.x, n.y + 7);
          } else {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(n.label, n.x, n.y);
          }
        }
      }

      ctx.restore();
    });

    ctx.restore();
    requestAnimationFrame(draw);
  }

  draw();
}
