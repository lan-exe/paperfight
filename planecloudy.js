// ==================== Anti-Inspection / DevTools Protection ====================
document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', function(e) {
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
  }
  if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U')) {
    e.preventDefault();
  }
});

let devtoolsOpen = false;
const element = new Image();
Object.defineProperty(element, 'id', {
  get: function () {
    devtoolsOpen = true;
    throw new Error("DevTools detected");
  }
});
setInterval(() => {
  devtoolsOpen = false;
  console.log(element);
  if (devtoolsOpen) {
    document.body.innerHTML = "<h1 style='color:red;text-align:center;'>Cheating Detected. Page Locked.</h1>";
  }
}, 1000);

// DOM references
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const shootSound = document.getElementById("shootSound");
const explodeSound = document.getElementById("explodeSound");

// Game state
let keys = {}, enemies = [], bullets = [], particles = [], clouds = [], perks = [], winds = [];
let gameOver = false, timer = 150, blastCooldown = 0, underAttack = false;
let score = 0, shieldActive = false, boostActive = false, shieldTimer = 0, boostTimer = 0;
let noDamageFrames = 0;
let endMessage = "";
let buttons = [];

// Player definition
const player = {
  x: 400,
  y: 300,
  angle: 0,
  vx: 0,
  vy: 0,
  acc: 0.15,
  drag: 0.98,
  rotSpeed: 0.04,
  health: 100,
  shootDelay: 0
};

// Event listeners
canvas.addEventListener("mousedown", onCanvasClick);
canvas.addEventListener("mousemove", onCanvasMouseMove);

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function onCanvasClick(e) {
  if (!gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (const btn of buttons) {
    if (mx >= btn.x && mx <= btn.x + btn.width && my >= btn.y && my <= btn.y + btn.height) {
      if (btn.id === "playAgain") location.reload();
      else if (btn.id === "returnHome") window.location.href = "match.html";
    }
  }
}

function onCanvasMouseMove(e) {
  if (!gameOver) {
    canvas.style.cursor = "default";
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  let hovering = false;
  for (const btn of buttons) {
    if (mx >= btn.x && mx <= btn.x + btn.width && my >= btn.y && my <= btn.y + btn.height) {
      hovering = true;
      break;
    }
  }
  canvas.style.cursor = hovering ? "pointer" : "default";
}

function shootBullet() {
  bullets.push({
    x: player.x + Math.cos(player.angle) * 20,
    y: player.y + Math.sin(player.angle) * 20,
    vx: Math.cos(player.angle) * 6 + player.vx,
    vy: Math.sin(player.angle) * 6 + player.vy,
    life: 80
  });
  shootSound.currentTime = 0;
  shootSound.play();
}

function blastEnemies() {
  if (blastCooldown > 0) return;
  blastCooldown = 300;
  const maxRadius = boostActive ? 250 : 150;
  const sorted = enemies
    .map(e => ({ e, d: Math.hypot(player.x - e.x, player.y - e.y) }))
    .filter(obj => obj.d <= maxRadius)
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);

  for (const { e } of sorted) {
    explodeSound.play();
    spawnExplosion(e.x, e.y);
    enemies.splice(enemies.indexOf(e), 1);
    score += 100;
  }
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    angle: Math.random() * Math.PI * 2,
    speed: 1.5,
    health: 3
  });
}
setInterval(spawnEnemy, 2000);

setInterval(() => {
  if (!gameOver && timer > 0) {
    timer--;
    if (timer === 0) endGame("⏰ Time’s up! You survived!");
  }
}, 1000);

function spawnExplosion(x, y) {
  for (let i = 0; i < 30; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 40
    });
  }
}

function spawnPerk() {
  const type = Math.random() > 0.5 ? "shield" : "boost";
  perks.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    type
  });
}
setInterval(spawnPerk, 8000);

function endGame(msg) {
  gameOver = true;
  endMessage = msg + ` Your final score: ${score}`;
  shootSound.pause();
  shootingSoundPlaying = false;

  // 👉 Save last score
  localStorage.setItem("lastScore", score);

  // 👉 Update best score if current score is higher
  const best = parseInt(localStorage.getItem("bestScore")) || 0;
  if (score > best) {
    localStorage.setItem("bestScore", score);
  }

  buttons = [
    { id: "playAgain", text: "Play Again", x: 300, y: 250, width: 100, height: 40 },
    { id: "returnHome", text: "Return Home", x: 420, y: 250, width: 120, height: 40 }
  ];
}


function update() {
  if (gameOver) return;
  if ((keys[' '] || keys['space']) && player.shootDelay <= 0) {
    shootBullet();
    player.shootDelay = 5;
  }
  if (keys['x']) blastEnemies();

  if (keys['a'] || keys['arrowleft']) player.angle -= player.rotSpeed;
  if (keys['d'] || keys['arrowright']) player.angle += player.rotSpeed;
  if (keys['w'] || keys['arrowup']) {
    player.vx += Math.cos(player.angle) * player.acc;
    player.vy += Math.sin(player.angle) * player.acc;
  }
  if (keys['s'] || keys['arrowdown']) {
    player.vx -= Math.cos(player.angle) * player.acc * 0.5;
    player.vy -= Math.sin(player.angle) * player.acc * 0.5;
  }

  player.vx *= player.drag;
  player.vy *= player.drag;
  player.x = (player.x + player.vx + canvas.width) % canvas.width;
  player.y = (player.y + player.vy + canvas.height) % canvas.height;

  if (player.shootDelay > 0) player.shootDelay--;
  if (blastCooldown > 0) blastCooldown--;

  bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; });
  bullets = bullets.filter(b => b.life > 0);

  underAttack = false;
  let damaged = false;
  enemies.forEach(e => {
    const dx = player.x - e.x, dy = player.y - e.y;
    const angleToPlayer = Math.atan2(dy, dx);
    let da = angleToPlayer - e.angle;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    e.angle += da * 0.05;
    e.x += Math.cos(e.angle) * e.speed;
    e.y += Math.sin(e.angle) * e.speed;
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < 50) underAttack = true;
    if (dist < 25 && !shieldActive) {
      player.health -= 2;
      damaged = true;
      if (player.health <= 0) endGame("💥 You crashed!");
    }
  });

  if (damaged) noDamageFrames = 0;
  else {
    noDamageFrames++;
    if (noDamageFrames > 300 && player.health < 100) player.health = Math.min(player.health + 4 / 60, 100);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (Math.hypot(enemies[i].x - bullets[j].x, enemies[i].y - bullets[j].y) < 20) {
        enemies[i].health--;
        bullets.splice(j, 1);
        if (enemies[i].health <= 0) {
          score += 100;
          spawnExplosion(enemies[i].x, enemies[i].y);
          explodeSound.play();
          enemies.splice(i, 1);
        }
        break;
      }
    }
  }

  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
  particles = particles.filter(p => p.life > 0);

  perks.forEach((p, i) => {
    if (Math.hypot(p.x - player.x, p.y - player.y) < 25) {
      if (p.type === "shield") {
        shieldActive = true;
        shieldTimer = 480;
      } else if (p.type === "boost") {
        boostActive = true;
        boostTimer = 480;
      }
      perks.splice(i, 1);
    }
  });

  if (shieldActive && --shieldTimer <= 0) shieldActive = false;
  if (boostActive && --boostTimer <= 0) boostActive = false;
}

function drawButton(btn) {
  ctx.fillStyle = "#3498db";
  ctx.strokeStyle = "#2980b9";
  ctx.lineWidth = 2;
  ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
  ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}

function draw() {
let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#8ec5fc");
  skyGradient.addColorStop(1, "#e0c3fc");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  clouds.forEach(c => {
    c.x -= 0.3;
    if (c.x < -100) c.x = canvas.width + Math.random() * 100;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 20, 0, Math.PI * 2);
    ctx.arc(c.x + 25, c.y + 5, 15, 0, Math.PI * 2);
    ctx.arc(c.x - 25, c.y + 5, 15, 0, Math.PI * 2);
    ctx.fill();
  });

  

  // Draw rest of game objects
  const drawPlane = (obj, color) => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.angle);
    ctx.shadowColor = obj === player && underAttack ? "red" : color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -10);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawPlane(player, shieldActive ? "lime" : "blue");
  enemies.forEach(e => drawPlane(e, "red"));

  bullets.forEach(b => {
    let grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 6);
    grd.addColorStop(0, "rgba(255,255,0,1)");
    grd.addColorStop(1, "rgba(255,255,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "orange";
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 40;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  perks.forEach(p => {
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.type === "shield" ? "🔰" : "💥", p.x, p.y);
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 10);
  ctx.fillText(`Time: ${timer}s`, 10, 35);
  ctx.fillText(`Health: ${Math.floor(player.health)}`, 10, 60);

  ctx.textAlign = "right";
  if (blastCooldown > 0) ctx.fillText(`Blast Cooldown: ${(blastCooldown / 60).toFixed(1)}s`, canvas.width - 10, 10);
  else ctx.fillText(`Blast Ready!`, canvas.width - 10, 10);

  ctx.fillStyle = "gray";
  ctx.fillRect(10, 85, 200, 20);
  ctx.fillStyle = shieldActive ? "lime" : "red";
  ctx.fillRect(10, 85, 2 * player.health, 20);
  ctx.strokeStyle = "white";
  ctx.strokeRect(10, 85, 200, 20);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(endMessage, canvas.width / 2, 180);
    buttons.forEach(drawButton);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Initialize clouds and wind
for (let i = 0; i < 6; i++) clouds.push({ x: Math.random() * canvas.width, y: 50 + Math.random() * 80 });
for (let i = 0; i < 20; i++) winds.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, length: 30 + Math.random() * 20, speed: 1 + Math.random() * 1.5 });

loop();
