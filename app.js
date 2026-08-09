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
  
  // Adjusted camera to see the wider fleet, slightly lower and further back
  const camera = new THREE.PerspectiveCamera(45, getW() / getH(), 0.1, 1000);
  camera.position.set(0, 0.5, 11);
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(getW(), getH());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const cyanLight = new THREE.PointLight(0x00f0ff, 3, 15);
  cyanLight.position.set(-4, 2, 2);
  scene.add(cyanLight);

  const magLight = new THREE.PointLight(0xbf5af2, 3, 15);
  magLight.position.set(4, -1, 3);
  scene.add(magLight);

  // Materials
  const matDark = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.8, roughness: 0.2 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.4 });
  const matCyan = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.5 });
  const matMag = new THREE.MeshStandardMaterial({ color: 0xbf5af2, emissive: 0xbf5af2, emissiveIntensity: 0.5 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.2, metalness: 0.1, roughness: 0.1 });
  const matSelect = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });

  const fleet = new THREE.Group();
  scene.add(fleet);
  
  const interactableBots = [];

  // --- 1. DRONE (Quadrotor) ---
  const drone = new THREE.Group();
  drone.position.set(0, 2, -1);
  drone.userData = { targetX: 0, targetY: 2, isSelected: false };
  interactableBots.push(drone);
  
  // Wrap drone body elements in a sub-group so we can apply the hover sine wave to the sub-group, leaving the root group free for lerping Y.
  const droneVisuals = new THREE.Group();
  drone.add(droneVisuals);
  
  const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), matDark);
  droneVisuals.add(dBody);
  
  const dCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matCyan);
  dCore.position.y = 0.2;
  droneVisuals.add(dCore);
  drone.userData.coreMat = dCore;

  const props = [];
  const armOffsets = [
    { x: 0.6, z: 0.6 }, { x: -0.6, z: 0.6 },
    { x: 0.6, z: -0.6 }, { x: -0.6, z: -0.6 }
  ];
  
  armOffsets.forEach(pos => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), matMetal);
    arm.rotation.x = Math.PI / 2;
    arm.rotation.z = Math.atan2(pos.x, pos.z);
    arm.position.set(pos.x / 2, 0, pos.z / 2);
    droneVisuals.add(arm);
    
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16), matDark);
    motor.position.set(pos.x, 0.1, pos.z);
    droneVisuals.add(motor);
    
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.02, 16), matGlass);
    prop.position.set(pos.x, 0.2, pos.z);
    droneVisuals.add(prop);
    props.push(prop);
  });
  fleet.add(drone);

  // --- 2. ROBOTIC ARM ---
  const armBot = new THREE.Group();
  armBot.position.set(-2.8, -1.2, 0);
  armBot.userData = { targetX: -2.8, targetY: -1.2, isSelected: false };
  interactableBots.push(armBot);
  
  const aBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 16), matDark);
  aBase.position.y = 0.2;
  armBot.add(aBase);
  
  const shoulder = new THREE.Group();
  shoulder.position.y = 0.4;
  armBot.add(shoulder);
  
  const sJoint = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), matMetal);
  shoulder.add(sJoint);
  
  const upperArm = new THREE.Group();
  upperArm.position.y = 0;
  shoulder.add(upperArm);
  
  const uBone = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), matDark);
  uBone.position.y = 0.6;
  upperArm.add(uBone);
  
  const elbow = new THREE.Group();
  elbow.position.y = 1.3;
  upperArm.add(elbow);
  
  const eJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16), matMetal);
  eJoint.rotation.z = Math.PI / 2;
  elbow.add(eJoint);
  
  const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 0.25), matDark);
  forearm.position.y = 0.5;
  elbow.add(forearm);
  
  // Gripper with fingers
  const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matCyan);
  gripperBase.position.y = 1.05;
  elbow.add(gripperBase);
  
  const fingerL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.1), matCyan);
  fingerL.position.set(-0.15, 0.15, 0);
  gripperBase.add(fingerL);
  
  const fingerR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.1), matCyan);
  fingerR.position.set(0.15, 0.15, 0);
  gripperBase.add(fingerR);
  
  armBot.userData.fingerL = fingerL;
  armBot.userData.fingerR = fingerR;
  armBot.userData.coreMat = gripperBase;

  fleet.add(armBot);

  // --- 3. ROBOTIC DOG (Quadruped) ---
  const dog = new THREE.Group();
  dog.position.set(2.8, -1.5, 0.5);
  dog.rotation.y = -Math.PI / 6;
  dog.userData = { targetX: 2.8, targetZ: 0.5, isSelected: false };
  interactableBots.push(dog);
  
  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.6), matDark);
  dogBody.position.y = 0.8;
  dog.add(dogBody);
  
  const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), matMetal);
  dogHead.position.set(0, 1.1, 0.9);
  dog.add(dogHead);
  
  const dogEye = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), matMag);
  dogEye.position.set(0, 1.1, 1.16);
  dog.add(dogEye);
  dog.userData.coreMat = dogEye;
  
  const dogLegs = [];
  const legPos = [
    { x: 0.45, z: 0.6 }, { x: -0.45, z: 0.6 },
    { x: 0.45, z: -0.6 }, { x: -0.45, z: -0.6 }
  ];
  
  legPos.forEach(pos => {
    const hip = new THREE.Group();
    hip.position.set(pos.x, 0.8, pos.z);
    
    const hipJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), matMetal);
    hipJoint.rotation.z = Math.PI / 2;
    hip.add(hipJoint);
    
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.15), matDark);
    thigh.position.y = -0.3;
    hip.add(thigh);
    
    const knee = new THREE.Group();
    knee.position.y = -0.6;
    hip.add(knee);
    
    const calf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.1), matMetal);
    calf.position.y = -0.3;
    knee.add(calf);
    
    dog.add(hip);
    dogLegs.push({ hip, knee, offset: pos.z > 0 ? 0 : Math.PI });
  });
  fleet.add(dog);

  // --- 4. WHEELED ROVER ---
  const rover = new THREE.Group();
  rover.position.set(0, -1.8, 2.5);
  rover.userData = { targetX: 0, targetZ: 2.5, isSelected: false };
  interactableBots.push(rover);
  
  const rChassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.4), matDark);
  rChassis.position.y = 0.4;
  rover.add(rChassis);
  
  const rLidar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), matCyan);
  rLidar.position.set(0, 0.7, 0);
  rover.add(rLidar);
  rover.userData.coreMat = rLidar;
  
  const wheelOffsets = [
    { x: 0.7, z: 0.5 }, { x: -0.7, z: 0.5 },
    { x: 0.7, z: -0.5 }, { x: -0.7, z: -0.5 }
  ];
  
  const rWheels = [];
  wheelOffsets.forEach(pos => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), matMetal);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.25, pos.z);
    rover.add(wheel);
    rWheels.push(wheel);
  });
  fleet.add(rover);

  // --- Invisible Wall Plane for 2D Screen Raycasting ---
  const wallGeo = new THREE.PlaneGeometry(200, 200);
  const wallMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.z = 0; // Vertical wall facing camera
  scene.add(wall);

  // --- Invisible Ground Plane for X-Z Raycasting ---
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.8;
  scene.add(ground);

  // --- Interaction & Raycasting ---
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedRobot = null;
  
  container.addEventListener('click', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check if we clicked a robot
    const intersectsBots = raycaster.intersectObjects(interactableBots, true);
    
    if (intersectsBots.length > 0) {
      let obj = intersectsBots[0].object;
      while (obj && !interactableBots.includes(obj)) {
        obj = obj.parent;
      }
      if (obj) {
        if (selectedRobot && selectedRobot.userData.coreMat) {
          selectedRobot.userData.coreMat.material = (selectedRobot === dog) ? matMag : matCyan;
        }
        selectedRobot = obj;
        if (selectedRobot.userData.coreMat) {
          selectedRobot.userData.coreMat.material = matSelect;
        }
        return;
      }
    }
    
    // Move selected robot
    if (selectedRobot) {
      if (selectedRobot === dog || selectedRobot === rover) {
        const intersectsGround = raycaster.intersectObject(ground);
        if (intersectsGround.length > 0) {
          const point = intersectsGround[0].point;
          selectedRobot.userData.targetX = point.x;
          selectedRobot.userData.targetZ = point.z;
        }
      } else {
        const intersectsWall = raycaster.intersectObject(wall);
        if (intersectsWall.length > 0) {
          const point = intersectsWall[0].point;
          selectedRobot.userData.targetX = point.x;
          selectedRobot.userData.targetY = point.y;
        }
      }
    }
  });

  // --- Animation ---
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animateFleet() {
    requestAnimationFrame(animateFleet);
    const time = Date.now() * 0.001;

    // Mouse Parallax (subtle)
    fleet.rotation.y += (mouseX * 0.2 - fleet.rotation.y) * 0.05;
    fleet.rotation.x += (-mouseY * 0.1 - fleet.rotation.x) * 0.05;

    // Interpolate robot positions
    interactableBots.forEach(bot => {
      bot.position.x += (bot.userData.targetX - bot.position.x) * 0.03;
      if (bot === dog || bot === rover) {
        bot.position.z += (bot.userData.targetZ - bot.position.z) * 0.03;
        
        // Face direction of movement (3D angle)
        const dx = bot.userData.targetX - bot.position.x;
        const dz = bot.userData.targetZ - bot.position.z;
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
          const targetAngle = Math.atan2(dx, dz);
          let diff = targetAngle - bot.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          bot.rotation.y += diff * 0.05;
        }
      } else {
        bot.position.y += (bot.userData.targetY - bot.position.y) * 0.03;
        
        // Face direction of movement (Left/Right)
        const dx = bot.userData.targetX - bot.position.x;
        if (Math.abs(dx) > 0.1) {
          const targetAngle = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
          let diff = targetAngle - bot.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          bot.rotation.y += diff * 0.05;
        } else {
          // Return to front-facing if idle
          let diff = 0 - bot.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          bot.rotation.y += diff * 0.05;
        }
      }
    });

    // Drone Animation
    droneVisuals.position.y = Math.sin(time * 2) * 0.2; // Hover effect on visuals only
    droneVisuals.rotation.z = Math.sin(time * 1.5) * 0.05;
    droneVisuals.rotation.x = Math.cos(time * 1.2) * 0.05;
    props.forEach((prop, i) => {
      prop.rotation.y += (i % 2 === 0 ? 0.3 : -0.3);
    });

    // Robotic Arm Animation
    shoulder.rotation.y = Math.sin(time * 0.8) * 1.5;
    upperArm.rotation.x = Math.sin(time * 1.2) * 0.5 + 0.5;
    elbow.rotation.x = Math.cos(time * 1.2) * 0.8 - 0.5;
    
    // Gripper fingers open and close
    const fingerOffset = 0.15 + Math.sin(time * 2) * 0.05;
    armBot.userData.fingerL.position.x = -fingerOffset;
    armBot.userData.fingerR.position.x = fingerOffset;

    // Robotic Dog Walk Animation
    const isDogMoving = Math.abs(dog.userData.targetX - dog.position.x) > 0.1 || Math.abs(dog.userData.targetZ - dog.position.z) > 0.1;
    dogLegs.forEach(leg => {
      if (isDogMoving) {
        leg.hip.rotation.x = Math.sin(time * 12 + leg.offset) * 0.5;
        leg.knee.rotation.x = Math.sin(time * 12 + leg.offset) * 0.5 + 0.2;
      } else {
        leg.hip.rotation.x = Math.sin(time * 2 + leg.offset) * 0.1;
        leg.knee.rotation.x = Math.sin(time * 2 + leg.offset) * 0.1 + 0.2;
      }
    });

    // Rover Animation
    rLidar.rotation.y -= 0.1;
    const isRoverMoving = Math.abs(rover.userData.targetX - rover.position.x) > 0.1 || Math.abs(rover.userData.targetZ - rover.position.z) > 0.1;
    if (isRoverMoving) {
      rWheels.forEach(w => w.rotation.x += 0.25);
    }

    renderer.render(scene, camera);
  }
  animateFleet();

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

  // Close mobile navigation drawer if active
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) navToggle.classList.remove('active');
  if (navLinks) navLinks.classList.remove('open');

  // Always dispatch resize event after showing a new section so canvases initialize their buffers correctly
  setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);

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

  // Mobile Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      }
    });
  }

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
  let width = container.clientWidth || 800;
  let height = container.clientHeight || 480;

  function resize() {
    let newWidth = container.clientWidth;
    if (newWidth === 0) return; // Ignore resize if hidden

    // Auto-center camera if it was initialized at a different width and no node is focused
    if (width !== newWidth && !focusedNode && typeof camera !== 'undefined') {
      camera.targetX = newWidth / 2;
      camera.targetY = height / 2;
    }

    width = newWidth;
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
    { label: 'Multithreading & Async', cat: 'prog', level: 'High-Performance Concurrency' },
    { label: 'MATLAB / Simulink', cat: 'prog', level: 'Simulation & Analysis' },

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
    { label: 'Pixel-to-GPS Calculator', cat: 'vision', level: 'Geospatial Projection' },
    { label: 'Pin-Hole Camera-Model', cat: 'vision', level: 'Geospatial Projection' },

    // HARDWARE
    { label: 'Jetson AGX Xavier', cat: 'hw', level: 'Edge Supercomputer' },
    { label: 'Jetson Nano', cat: 'hw', level: 'Edge Compute Node' },
    { label: 'Raspberry Pi 4/5', cat: 'hw', level: 'SBC Processor' },
    { label: 'ESP32-S3', cat: 'hw', level: 'Dual-Core Microcontroller' },
    { label: 'Microprocessors', cat: 'hw', level: 'Digital Logic & Architecture' },
    { label: 'Arduino', cat: 'hw', level: 'MCU Prototyping' },
    { label: 'RPLidar A1M8', cat: 'hw', level: 'Laser Scanner & 2D SLAM' },
    { label: 'LiDAR', cat: 'hw', level: 'Laser Distance Sensing' },
    { label: 'MPU9250 IMU', cat: 'hw', level: '9-DOF Inertial Sensor' },
    { label: 'Barometer', cat: 'hw', level: 'Altitude Sensing' },
    { label: 'Encoder Motors', cat: 'hw', level: 'Wheel Odometry' },
    { label: 'Coreless DC Motors', cat: 'hw', level: 'Micro UAV Actuators' },
    { label: 'Custom MOSFET ESC', cat: 'hw', level: 'Motor Speed Control' },
    { label: 'ST7920 Display', cat: 'hw', level: 'SPI Graphics Display' },
    { label: 'NRF24L01', cat: 'hw', level: 'RF Transceiver' },
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

  const centerX = width / 2;
  const centerY = height / 2;

  // Central Node
  const centralNode = {
    id: 'central_node',
    label: 'Robotics Skills',
    cat: 'all',
    isCentral: true,
    r: 45,
    x: centerX,
    y: centerY,
    vx: 0,
    vy: 0,
    color: '#0077B6',
    subCount: 0
  };
  nodes.push(centralNode);
  nodeMap[centralNode.id] = centralNode;

  const catKeys = Object.keys(categories);
  const totalCat = catKeys.length;
  const hubRadius = 160;

  catKeys.forEach((key, idx) => {
    const angle = (idx / totalCat) * Math.PI * 2 - Math.PI / 2;
    const cat = categories[key];
    const hubNode = {
      id: `hub_${key}`,
      label: cat.label,
      cat: key,
      isHub: true,
      r: 35,
      x: centerX + Math.cos(angle) * hubRadius + (Math.random() - 0.5) * 20,
      y: centerY + Math.sin(angle) * hubRadius + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: cat.color,
      subCount: 0
    };
    nodes.push(hubNode);
    nodeMap[hubNode.id] = hubNode;

    // Link Central to Hub
    links.push({
      source: centralNode,
      target: hubNode,
      length: 160 + Math.random() * 20,
      label: 'HAS CATEGORY',
      k: 0.02
    });
  });

  rawSkills.forEach((skill, idx) => {
    const hub = nodeMap[`hub_${skill.cat}`];
    const cat = categories[skill.cat];
    const offsetAngle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 40;

    const childNode = {
      id: `leaf_${idx}`,
      label: skill.label,
      cat: skill.cat,
      level: skill.level,
      isHub: false,
      r: 22 + Math.min(skill.label.length * 0.5, 10),
      x: hub.x + Math.cos(offsetAngle) * dist,
      y: hub.y + Math.sin(offsetAngle) * dist,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      color: cat.color,
      parentHub: hub
    };

    nodes.push(childNode);
    nodeMap[childNode.id] = childNode;
    hub.subCount++;

    // Link Hub to Skill
    links.push({
      source: hub,
      target: childNode,
      length: 80 + Math.random() * 40,
      label: 'INCLUDES',
      k: 0.04
    });
  });

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
      if (activeCategory !== 'all' && !n.isCentral && n.cat !== activeCategory && n.id !== `hub_${activeCategory}`) continue;
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      if (dx * dx + dy * dy <= (n.r + 5) * (n.r + 5)) {
        found = n;
        break;
      }
    }
    hoveredNode = found;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';

    if (hoveredNode && tooltip) {
      const screenX = (hoveredNode.x - camera.x) * camera.zoom + width / 2;
      const screenY = (hoveredNode.y - camera.y) * camera.zoom + height / 2;
      tooltip.innerHTML = `<strong>${hoveredNode.label}</strong>${hoveredNode.level ? `<br><span style="color:var(--accent2);">${hoveredNode.level}</span>` : ''}`;
      tooltip.style.left = `${screenX}px`;
      tooltip.style.top = `${screenY}px`;
      tooltip.classList.add('visible');
    } else if (tooltip) {
      tooltip.classList.remove('visible');
    }
  });

  canvas.addEventListener('mousedown', () => {
    if (hoveredNode) draggedNode = hoveredNode;
  });

  window.addEventListener('mouseup', () => {
    draggedNode = null;
  });

  // Touch event support for mobile devices
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const c = getCanvasCoords(touch);
      const w = screenToWorld(c.x, c.y);
      mouse.x = w.x;
      mouse.y = w.y;
      let found = null;
      for (let n of nodes) {
        if (activeCategory !== 'all' && !n.isCentral && n.cat !== activeCategory && n.id !== `hub_${activeCategory}`) continue;
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        if (dx * dx + dy * dy <= (n.r + 15) * (n.r + 15)) {
          found = n;
          break;
        }
      }
      if (found) {
        hoveredNode = found;
        draggedNode = found;
        focusedNode = found;
        camera.targetX = found.x;
        camera.targetY = found.y;
        camera.targetZoom = found.isHub ? 1.5 : (found.isCentral ? 1.2 : 1.8);
        addShockwave(found.x, found.y, found.color);
        if (tooltip) {
          const screenX = (found.x - camera.x) * camera.zoom + width / 2;
          const screenY = (found.y - camera.y) * camera.zoom + height / 2;
          tooltip.innerHTML = `<strong>${found.label}</strong>${found.level ? `<br><span style="color:var(--accent2);">${found.level}</span>` : ''}`;
          tooltip.style.left = `${screenX}px`;
          tooltip.style.top = `${screenY}px`;
          tooltip.classList.add('visible');
        }
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (draggedNode && e.touches.length === 1) {
      const touch = e.touches[0];
      const c = getCanvasCoords(touch);
      const w = screenToWorld(c.x, c.y);
      draggedNode.x = w.x;
      draggedNode.y = w.y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      if (tooltip) {
        const screenX = (draggedNode.x - camera.x) * camera.zoom + width / 2;
        const screenY = (draggedNode.y - camera.y) * camera.zoom + height / 2;
        tooltip.style.left = `${screenX}px`;
        tooltip.style.top = `${screenY}px`;
      }
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    draggedNode = null;
  });

  canvas.addEventListener('click', () => {
    if (hoveredNode) {
      focusedNode = hoveredNode;
      camera.targetX = hoveredNode.x;
      camera.targetY = hoveredNode.y;
      camera.targetZoom = hoveredNode.isHub ? 1.5 : (hoveredNode.isCentral ? 1.2 : 1.8);
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
          camera.targetZoom = 1.4;
          addShockwave(hub.x, hub.y, hub.color);
        }
      }
    });
  });

  let time = 0;
  // Initialize pulsePos for links
  links.forEach(l => l.pulsePos = Math.random());

  function updatePhysics() {
    time += 0.015;

    camera.x += (camera.targetX - camera.x) * 0.1;
    camera.y += (camera.targetY - camera.y) * 0.1;
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.1;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      // Highly active Neural Network organic brownian drift
      a.vx += Math.cos(time * 1.5 + i * 1.3) * 0.09;
      a.vy += Math.sin(time * 1.5 + i * 1.7) * 0.09;

      // Soft centroid gravity
      a.vx += (width / 2 - a.x) * 0.0001;
      a.vy += (height / 2 - a.y) * 0.0001;

      // Repulsion between all nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let distSq = dx * dx + dy * dy || 1;
        let minDist = a.r + b.r + 35; // increased space between nodes

        if (distSq < minDist * minDist * 2) {
          let dist = Math.sqrt(distSq);
          let force = (minDist - dist) / dist;
          if (force > 0) {
            let fx = dx * force * 0.08;
            let fy = dy * force * 0.08;
            if (a !== draggedNode) { a.vx -= fx; a.vy -= fy; }
            if (b !== draggedNode) { b.vx += fx; b.vy += fy; }
          }
        }
      }
    }

    // Spring links
    links.forEach(link => {
      const a = link.source;
      const b = link.target;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - link.length;
      const k = link.k;

      const fx = (dx / dist) * delta * k;
      const fy = (dy / dist) * delta * k;

      if (a !== draggedNode) { a.vx += fx; a.vy += fy; }
      if (b !== draggedNode) { b.vx -= fx; b.vy -= fy; }

      // Advance light pulse along link
      link.pulsePos = (link.pulsePos + 0.005) % 1;
    });

    // Update positions
    nodes.forEach(n => {
      if (n === draggedNode) return;
      n.vx *= 0.88; // damping
      n.vy *= 0.88;
      n.x += n.vx;
      n.y += n.vy;

      // Boundaries
      const m = 40;
      if (n.x < m) { n.x = m; n.vx *= -0.5; }
      if (n.x > width - m) { n.x = width - m; n.vx *= -0.5; }
      if (n.y < m) { n.y = m; n.vy *= -0.5; }
      if (n.y > height - m) { n.y = height - m; n.vy *= -0.5; }
    });

    // Update shockwaves
    for (let i = pulseRings.length - 1; i >= 0; i--) {
      const ring = pulseRings[i];
      ring.r += 3;
      ring.opacity -= 0.03;
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

    // Draw Shockwaves
    pulseRings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = Math.max(0, ring.opacity);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw Links
    links.forEach(link => {
      const a = link.source;
      const b = link.target;

      if (activeCategory !== 'all') {
        if (!a.isCentral && !b.isCentral && a.cat !== activeCategory && b.cat !== activeCategory) return;
      }

      const isFocused = focusedNode && (a === focusedNode || b === focusedNode);
      const isHovered = hoveredNode && (a === hoveredNode || b === hoveredNode);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      // Cyberpunk glowing grey lines
      ctx.strokeStyle = (isFocused || isHovered) ? a.color : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = (isFocused || isHovered) ? 2 : 1;
      if (isFocused || isHovered) {
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw light pulse moving across line
      const px = a.x + (b.x - a.x) * link.pulsePos;
      const py = a.y + (b.y - a.y) * link.pulsePos;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = (isFocused || isHovered) ? a.color : '#ffffff';
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw arrow head & text label
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > (a.r + b.r)) {
        const midX = a.x + dx * 0.5;
        const midY = a.y + dy * 0.5;
        const angle = Math.atan2(dy, dx);

        // Arrow head near target
        const targetBorderX = b.x - Math.cos(angle) * (b.r + 2);
        const targetBorderY = b.y - Math.sin(angle) * (b.r + 2);

        ctx.save();
        ctx.translate(targetBorderX, targetBorderY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();

        // Label text on line
        ctx.save();
        ctx.translate(midX, midY);
        if (Math.abs(angle) > Math.PI / 2) {
          ctx.rotate(angle + Math.PI);
        } else {
          ctx.rotate(angle);
        }
        // White text for dark background
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '8px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(link.label, 0, -2);
        ctx.restore();
      }
    });

    // Draw Nodes
    nodes.forEach(n => {
      if (activeCategory !== 'all' && !n.isCentral && n.cat !== activeCategory && n.id !== `hub_${activeCategory}`) return;

      const isHovered = hoveredNode === n;
      const isFocused = focusedNode === n;
      const scale = isHovered ? 1.08 : (isFocused ? 1.15 : 1.0);
      const r = n.r * scale;

      ctx.save();

      // Neon glow aura for hovered/focused nodes in dark cyberpunk mode
      if (isHovered || isFocused) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + (isFocused ? 8 : 6), 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // Node Circle - Solid Color Fill
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Thick white border
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Soft drop shadow
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.shadowOffsetX = 0;
      ctx.stroke(); // stroke again to apply shadow cleanly around edge

      // Clear shadow for text
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Node Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (n.isCentral) {
        ctx.font = 'bold 12px "Inter", sans-serif';
      } else if (n.isHub) {
        ctx.font = 'bold 10px "Inter", sans-serif';
      } else {
        ctx.font = '9px "Inter", sans-serif';
      }

      // Wrap text
      const words = n.label.split(' ');
      if (words.length > 1 && !n.isCentral) {
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        ctx.fillText(line1, n.x, n.y - 6);
        ctx.fillText(line2, n.x, n.y + 6);
      } else {
        ctx.fillText(n.label, n.x, n.y);
      }

      ctx.restore();
    });

    ctx.restore();
    requestAnimationFrame(draw);
  }

  draw();
}
