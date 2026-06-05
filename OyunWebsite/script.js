const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const livesEl = document.querySelector("#lives");
const levelEl = document.querySelector("#level");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const fireButton = document.querySelector("#fireButton");
const pauseButton = document.querySelector("#pauseButton");

const keys = {
  left: false,
  right: false,
  fire: false
};

const game = {
  running: false,
  paused: false,
  over: false,
  score: 0,
  lives: 3,
  level: 1,
  lastTime: 0,
  spawnTimer: 0,
  starTimer: 0,
  objects: [],
  bullets: [],
  particles: [],
  backgroundStars: [],
  loopId: 0
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 72,
  width: 66,
  height: 66,
  speed: 450,
  invincible: 0,
  fireCooldown: 0,
  enginePulse: 0
};

function makeBackgroundStars() {
  game.backgroundStars = Array.from({ length: 135 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 0.7 + Math.random() * 2.1,
    speed: 16 + Math.random() * 52,
    alpha: 0.28 + Math.random() * 0.72
  }));
}

function resetGame() {
  cancelAnimationFrame(game.loopId);
  game.running = true;
  game.paused = false;
  game.over = false;
  game.score = 0;
  game.lives = 3;
  game.level = 1;
  game.lastTime = performance.now();
  game.spawnTimer = 0.35;
  game.starTimer = 1.1;
  game.objects = [];
  game.bullets = [];
  game.particles = [];
  player.x = canvas.width / 2;
  player.invincible = 0;
  player.fireCooldown = 0;
  updateStats();
  overlay.classList.add("hidden");
  pauseButton.textContent = "II";
  game.loopId = requestAnimationFrame(loop);
}

function updateStats() {
  scoreEl.textContent = game.score;
  livesEl.textContent = game.lives;
  levelEl.textContent = game.level;
}

function spawnMeteor() {
  const size = 27 + Math.random() * 38;
  game.objects.push({
    type: "meteor",
    x: size + Math.random() * (canvas.width - size * 2),
    y: -size,
    radius: size,
    hp: size > 48 ? 2 : 1,
    speed: 126 + game.level * 28 + Math.random() * 86,
    rotation: Math.random() * Math.PI,
    spin: -2.4 + Math.random() * 4.8
  });
}

function spawnStar() {
  const radius = 14 + Math.random() * 8;
  game.objects.push({
    type: "star",
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: -radius,
    radius,
    speed: 115 + Math.random() * 80,
    pulse: Math.random() * Math.PI
  });
}

function fireLaser() {
  if (!game.running || game.paused || player.fireCooldown > 0) {
    return;
  }

  player.fireCooldown = 0.18;
  game.bullets.push({
    x: player.x - 16,
    y: player.y - 28,
    width: 7,
    height: 28,
    speed: 760,
    color: "#38d5ff"
  });
  game.bullets.push({
    x: player.x + 16,
    y: player.y - 28,
    width: 7,
    height: 28,
    speed: 760,
    color: "#ffca5f"
  });
  addParticles(player.x, player.y - 34, "#bff3ff", 6);
}

function addParticles(x, y, color, amount) {
  for (let i = 0; i < amount; i += 1) {
    game.particles.push({
      x,
      y,
      vx: -170 + Math.random() * 340,
      vy: -190 + Math.random() * 260,
      life: 0.45 + Math.random() * 0.45,
      color,
      radius: 2 + Math.random() * 4.5
    });
  }
}

function loop(time) {
  if (!game.running) {
    return;
  }

  const dt = Math.min((time - game.lastTime) / 1000, 0.033);
  game.lastTime = time;

  if (!game.paused) {
    update(dt);
  }

  draw();
  game.loopId = requestAnimationFrame(loop);
}

function update(dt) {
  game.level = Math.floor(game.score / 160) + 1;
  player.invincible = Math.max(0, player.invincible - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.enginePulse += dt * 12;

  if (keys.left) {
    player.x -= player.speed * dt;
  }

  if (keys.right) {
    player.x += player.speed * dt;
  }

  if (keys.fire) {
    fireLaser();
  }

  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));

  game.spawnTimer -= dt;
  game.starTimer -= dt;

  if (game.spawnTimer <= 0) {
    spawnMeteor();
    game.spawnTimer = Math.max(0.24, 0.82 - game.level * 0.055);
  }

  if (game.starTimer <= 0) {
    spawnStar();
    game.starTimer = Math.max(0.8, 1.75 - game.level * 0.04);
  }

  updateBackground(dt);
  updateObjects(dt);
  updateBullets(dt);
  updateParticles(dt);
  handleBulletHits();
  handlePlayerCollisions();

  game.objects = game.objects.filter((object) => !object.remove && object.y < canvas.height + object.radius);
  game.bullets = game.bullets.filter((bullet) => !bullet.remove && bullet.y > -bullet.height);
  game.particles = game.particles.filter((particle) => particle.life > 0);
  updateStats();
}

function updateBackground(dt) {
  for (const star of game.backgroundStars) {
    star.y += star.speed * dt;
    if (star.y > canvas.height) {
      star.y = -4;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updateObjects(dt) {
  for (const object of game.objects) {
    object.y += object.speed * dt;
    if (object.type === "meteor") {
      object.rotation += object.spin * dt;
    } else {
      object.pulse += dt * 5;
    }
  }
}

function updateBullets(dt) {
  for (const bullet of game.bullets) {
    bullet.y -= bullet.speed * dt;
  }
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 310 * dt;
    particle.life -= dt;
  }
}

function handleBulletHits() {
  for (const bullet of game.bullets) {
    if (bullet.remove) {
      continue;
    }

    for (const object of game.objects) {
      if (object.remove || object.type !== "meteor") {
        continue;
      }

      const dx = object.x - bullet.x;
      const dy = object.y - bullet.y;
      const distance = Math.hypot(dx, dy);

      if (distance > object.radius + bullet.width) {
        continue;
      }

      bullet.remove = true;
      object.hp -= 1;
      addParticles(bullet.x, bullet.y, bullet.color, 10);

      if (object.hp <= 0) {
        object.remove = true;
        game.score += 35;
        addParticles(object.x, object.y, "#ffca5f", 22);
        addParticles(object.x, object.y, "#ff4f8b", 12);
      }

      break;
    }
  }
}

function handlePlayerCollisions() {
  const playerRadius = 30;

  for (const object of game.objects) {
    if (object.remove) {
      continue;
    }

    const dx = object.x - player.x;
    const dy = object.y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > object.radius + playerRadius) {
      continue;
    }

    object.remove = true;

    if (object.type === "star") {
      game.score += 25;
      addParticles(object.x, object.y, "#5cffb0", 18);
      continue;
    }

    if (player.invincible <= 0) {
      game.lives -= 1;
      player.invincible = 1.15;
      addParticles(player.x, player.y, "#ff4f8b", 30);

      if (game.lives <= 0) {
        endGame();
      }
    }
  }
}

function endGame() {
  game.running = false;
  game.over = true;
  cancelAnimationFrame(game.loopId);
  overlayTitle.textContent = "Oyun Bitti";
  overlayText.textContent = `Skorun: ${game.score}`;
  startButton.textContent = "Tekrar Oyna";
  overlay.classList.remove("hidden");
  updateStats();
}

function draw() {
  drawSpace();
  drawBackgroundStars();
  drawBullets();
  drawObjects();
  drawParticles();
  drawPlayer();
  drawCanvasHud();

  if (game.paused) {
    ctx.fillStyle = "rgba(3, 5, 10, 0.62)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f7fbff";
    ctx.font = "900 54px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Duraklatıldı", canvas.width / 2, canvas.height / 2);
  }
}

function drawSpace() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#050915");
  gradient.addColorStop(0.5, "#0b1630");
  gradient.addColorStop(1, "#03050a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(56, 213, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 40; y < canvas.height; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y + 18);
    ctx.stroke();
  }
}

function drawBackgroundStars() {
  for (const star of game.backgroundStars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBullets() {
  for (const bullet of game.bullets) {
    const glow = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(1, bullet.color);

    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = glow;
    ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
    ctx.shadowBlur = 0;
  }
}

function drawObjects() {
  for (const object of game.objects) {
    if (object.type === "meteor") {
      drawMeteor(object);
    } else {
      drawStar(object);
    }
  }
}

function drawMeteor(meteor) {
  ctx.save();
  ctx.translate(meteor.x, meteor.y);
  ctx.rotate(meteor.rotation);

  const body = ctx.createRadialGradient(-8, -10, 4, 0, 0, meteor.radius);
  body.addColorStop(0, "#f1b073");
  body.addColorStop(0.55, "#8b5543");
  body.addColorStop(1, "#362427");

  ctx.shadowColor = "rgba(255, 120, 74, 0.42)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = body;
  ctx.strokeStyle = "#ffd0a1";
  ctx.lineWidth = meteor.hp > 1 ? 4 : 3;
  ctx.beginPath();

  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10;
    const radius = meteor.radius * (0.76 + Math.sin(i * 2.1) * 0.16);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(35, 18, 18, 0.5)";
  ctx.beginPath();
  ctx.arc(-meteor.radius * 0.2, -meteor.radius * 0.14, meteor.radius * 0.18, 0, Math.PI * 2);
  ctx.arc(meteor.radius * 0.18, meteor.radius * 0.16, meteor.radius * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(star) {
  const outer = star.radius + Math.sin(star.pulse) * 2;
  const inner = outer * 0.45;

  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.shadowColor = "#5cffb0";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#5cffb0";
  ctx.strokeStyle = "#ddffec";
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  for (const particle of game.particles) {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const blink = player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0;
  if (blink) {
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.shadowColor = "rgba(56, 213, 255, 0.65)";
  ctx.shadowBlur = 24;

  const hull = ctx.createLinearGradient(0, -38, 0, 34);
  hull.addColorStop(0, "#f7fbff");
  hull.addColorStop(0.45, "#38d5ff");
  hull.addColorStop(1, "#1a5fbf");

  ctx.fillStyle = hull;
  ctx.strokeStyle = "#e8fbff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(33, 28);
  ctx.lineTo(10, 18);
  ctx.lineTo(0, 35);
  ctx.lineTo(-10, 18);
  ctx.lineTo(-33, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#101725";
  ctx.beginPath();
  ctx.ellipse(0, -10, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffca5f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.lineTo(-16, -34);
  ctx.moveTo(16, -6);
  ctx.lineTo(16, -34);
  ctx.stroke();

  const flame = 48 + Math.sin(player.enginePulse) * 9;
  ctx.fillStyle = "#ffca5f";
  ctx.beginPath();
  ctx.moveTo(-12, 33);
  ctx.lineTo(0, flame);
  ctx.lineTo(12, 33);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff4f8b";
  ctx.beginPath();
  ctx.moveTo(-6, 34);
  ctx.lineTo(0, flame - 12);
  ctx.lineTo(6, 34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCanvasHud() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(20, canvas.height - 24, canvas.width - 40, 2);
  ctx.fillStyle = "rgba(56, 213, 255, 0.72)";
  ctx.fillRect(20, canvas.height - 24, Math.min(canvas.width - 40, game.score % 160 * 5.75), 2);
}

function setMove(direction, active) {
  keys[direction] = active;
}

function setFire(active) {
  keys.fire = active;
  if (active) {
    fireLaser();
  }
}

function togglePause() {
  if (!game.running || game.over) {
    return;
  }

  game.paused = !game.paused;
  pauseButton.textContent = game.paused ? "▶" : "II";
}

startButton.addEventListener("click", resetGame);
pauseButton.addEventListener("click", togglePause);

leftButton.addEventListener("pointerdown", () => setMove("left", true));
leftButton.addEventListener("pointerup", () => setMove("left", false));
leftButton.addEventListener("pointerleave", () => setMove("left", false));
leftButton.addEventListener("pointercancel", () => setMove("left", false));

rightButton.addEventListener("pointerdown", () => setMove("right", true));
rightButton.addEventListener("pointerup", () => setMove("right", false));
rightButton.addEventListener("pointerleave", () => setMove("right", false));
rightButton.addEventListener("pointercancel", () => setMove("right", false));

fireButton.addEventListener("pointerdown", () => setFire(true));
fireButton.addEventListener("pointerup", () => setFire(false));
fireButton.addEventListener("pointerleave", () => setFire(false));
fireButton.addEventListener("pointercancel", () => setFire(false));

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (event.key === "ArrowLeft" || key === "a") {
    keys.left = true;
  }

  if (event.key === "ArrowRight" || key === "d") {
    keys.right = true;
  }

  if (event.key === " " || event.key === "ArrowUp" || key === "w") {
    event.preventDefault();
    setFire(true);
  }

  if (key === "p") {
    togglePause();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();

  if (event.key === "ArrowLeft" || key === "a") {
    keys.left = false;
  }

  if (event.key === "ArrowRight" || key === "d") {
    keys.right = false;
  }

  if (event.key === " " || event.key === "ArrowUp" || key === "w") {
    setFire(false);
  }
});

makeBackgroundStars();
draw();
