const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const shootSound = document.getElementById("shootSound");
const explodeSound = document.getElementById("explodeSound");

let enemies = [], bullets = [], particles = [], clouds = [], perks = [];
let gameOver = false, score = 0, blastCooldown = 0;
let timer = 150; // 2 minutes 30 seconds
let shieldActive = false, boostActive = false;
let shieldTimer = 0, boostTimer = 0;
let noHitFrames = 0;
let message = "";
let buttons = [];

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
};


const controls = new Set();
const controlButtons = [
  { id: "left", text: "⬅️", x: 30, y: canvas.height - 100 },
  { id: "right", text: "➡️", x: 130, y: canvas.height - 100 },
  { id: "up", text: "⬆️", x: 80, y: canvas.height - 150 },
  { id: "down", text: "⬇️", x: 80, y: canvas.height - 50 },
  { id: "blast", text: "💣", x: canvas.width - 120, y: canvas.height - 100 },
  { id: "shoot", text: "🔫", x: canvas.width - 60, y: canvas.height - 100 },
];


canvas.addEventListener("mousedown", handleControl);
canvas.addEventListener("mouseup", () => controls.clear());
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  handleTouch(e.touches);
});
canvas.addEventListener("touchend", e => {
  e.preventDefault();
  controls.clear();
});
canvas.addEventListener("click", handleEndScreenClick);

function handleControl(e) {
  const { left, top } = canvas.getBoundingClientRect();
  const mx = e.clientX - left;
  const my = e.clientY - top;
  controlButtons.forEach(btn => {
    if (mx >= btn.x && mx <= btn.x + 50 && my >= btn.y && my <= btn.y + 50) {
      controls.add(btn.id);
    }
  });
}

function handleTouch(touches) {
  const rect = canvas.getBoundingClientRect();
  for (const t of touches) {
    const mx = t.clientX - rect.left;
    const my = t.clientY - rect.top;
    controlButtons.forEach(btn => {
      if (mx >= btn.x && mx <= btn.x + 50 && my >= btn.y && my <= btn.y + 50) {
        controls.add(btn.id);
      }
    });
  }
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
  enemies = enemies.filter(e => {
    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    if (dist < (boostActive ? 250 : 150)) {
      explodeSound.play();
      spawnExplosion(e.x, e.y);
      score += 100;
      return false;
    }
    return true;
  });
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    angle: Math.random() * Math.PI * 2,
    speed: 0.8 // slower than player speed
  });
}

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

function update() {
  if (gameOver) return;

  // Movement controls
  if (controls.has("left")) player.angle -= player.rotSpeed;
  if (controls.has("right")) player.angle += player.rotSpeed;
  if (controls.has("up")) {
    player.vx += Math.cos(player.angle) * player.acc;
    player.vy += Math.sin(player.angle) * player.acc;
  }
  if (controls.has("down")) {
    player.vx -= Math.cos(player.angle) * player.acc * 0.5;
    player.vy -= Math.sin(player.angle) * player.acc * 0.5;
  }
  if (controls.has("blast")) blastEnemies();
  if (controls.has("shoot")) shootBullet();

  player.vx *= player.drag;
  player.vy *= player.drag;
  player.x = (player.x + player.vx + canvas.width) % canvas.width;
  player.y = (player.y + player.vy + canvas.height) % canvas.height;

  if (blastCooldown > 0) blastCooldown--;

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
  });
  bullets = bullets.filter(b => b.life > 0);

  enemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    e.angle = Math.atan2(dy, dx);
    e.x += Math.cos(e.angle) * e.speed;
    e.y += Math.sin(e.angle) * e.speed;

    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < 25 && !shieldActive) {
      player.health -= 2;
      noHitFrames = 0;
      if (player.health <= 0) return endGame("💥 You crashed!");
    }
  });

  if (noHitFrames > 300 && player.health < 100) {
    player.health = Math.min(player.health + 4, 100);
    noHitFrames = 0;
  } else {
    noHitFrames++;
  }

  // Bullet collision with enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (Math.hypot(enemies[i].x - bullets[j].x, enemies[i].y - bullets[j].y) < 20) {
        score += 100;
        spawnExplosion(enemies[i].x, enemies[i].y);
        explodeSound.play();
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }

  // Perk pickup
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

  // Move clouds slowly to right and wrap
  clouds.forEach(c => {
    c.x += 0.3;
    if (c.x > canvas.width + 50) c.x = -50;
  });
}

function endGame(msg) {
  gameOver = true;
  message = msg + ` Your final score: ${score}`;
  localStorage.setItem("lastScore", score);
  const best = parseInt(localStorage.getItem("bestScore")) || 0;
  if (score > best) localStorage.setItem("bestScore", score);
  buttons = [
    { id: "playAgain", text: "Play Again", x: canvas.width/2 - 130, y: 280, width: 120, height: 40 },
    { id: "returnHome", text: "Return Home", x: canvas.width/2 + 10, y: 280, width: 120, height: 40 }
  ];
}

function drawPlane(obj, color) {
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -10);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-15, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawButton(btn) {
  ctx.fillStyle = "#3498db";
  ctx.strokeStyle = "#2980b9";
  ctx.lineWidth = 2;
  const r = 5; // radius 5px for corners
  ctx.beginPath();
  ctx.moveTo(btn.x + r, btn.y);
  ctx.lineTo(btn.x + btn.width - r, btn.y);
  ctx.quadraticCurveTo(btn.x + btn.width, btn.y, btn.x + btn.width, btn.y + r);
  ctx.lineTo(btn.x + btn.width, btn.y + btn.height - r);
  ctx.quadraticCurveTo(btn.x + btn.width, btn.y + btn.height, btn.x + btn.width - r, btn.y + btn.height);
  ctx.lineTo(btn.x + r, btn.y + btn.height);
  ctx.quadraticCurveTo(btn.x, btn.y + btn.height, btn.x, btn.y + btn.height - r);
  ctx.lineTo(btn.x, btn.y + r);
  ctx.quadraticCurveTo(btn.x, btn.y, btn.x + r, btn.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}

function handleEndScreenClick(e) {
  if (!gameOver) return;
  const { left, top } = canvas.getBoundingClientRect();
  const mx = e.clientX - left;
  const my = e.clientY - top;
  for (const btn of buttons) {
    if (mx >= btn.x && mx <= btn.x + btn.width && my >= btn.y && my <= btn.y + btn.height) {
      if (btn.id === "playAgain") location.reload();
      else if (btn.id === "returnHome") window.location.href = "match.html";
    }
  }
}

function draw() {
  // Sky background
  ctx.fillStyle = "#d0f0ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient sun
  const sunX = canvas.width - 100;
  const sunY = 100;
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 60);
  sunGradient.addColorStop(0, "#fffacd");
  sunGradient.addColorStop(1, "#f39c12");
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  clouds.forEach(cloud => {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 30, 0, Math.PI * 2);
    ctx.arc(cloud.x + 30, cloud.y + 10, 25, 0, Math.PI * 2);
    ctx.arc(cloud.x - 30, cloud.y + 10, 25, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player plane with shield color
  drawPlane(player, shieldActive ? "lime" : "blue");

  // Enemy planes
  enemies.forEach(e => drawPlane(e, "red"));

  // Bullets
  bullets.forEach(b => {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Explosion particles
  particles.forEach(p => {
    ctx.fillStyle = "orange";
    ctx.fillRect(p.x, p.y, 2, 2);
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  // Perks with emojis 🔰 and 💥
  perks.forEach(p => {
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const emoji = p.type === "shield" ? "🔰" : "💥";
    ctx.fillText(emoji, p.x, p.y);
  });

  // UI text
  ctx.fillStyle = "#000";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Health: ${Math.floor(player.health)}%`, 10, 45);

  // Timer mm:ss
  const min = Math.floor(timer / 60);
  const sec = timer % 60;
  ctx.fillText(`Time Left: ${min}:${sec.toString().padStart(2, '0')}`, 10, 70);

  if (shieldActive) ctx.fillText("🔰 Shield Active", 10, 95);
  if (boostActive) ctx.fillText("💥 Boost Active", 10, 120);

  ctx.textAlign = "right";
  ctx.fillText(blastCooldown > 0 ? `Blast Cooldown: ${(blastCooldown / 60).toFixed(1)}s` : "💣 Ready", canvas.width - 10, 20);

  // Control buttons UI
  ctx.textAlign = "left";
  controlButtons.forEach(btn => {
    ctx.fillStyle = "#eee";
    ctx.fillRect(btn.x, btn.y, 50, 50);
    ctx.fillStyle = "#000";
    ctx.font = "28px Arial";
    ctx.fillText(btn.text, btn.x + 10, btn.y + 35);
  });

  // End game overlay
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "32px Arial";
    ctx.fillText(message, canvas.width / 2, 200);

    buttons.forEach(drawButton);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Timer countdown every 1 second
setInterval(() => {
  if (!gameOver && timer > 0) {
    timer--;
    if (timer === 0) endGame("⏰ Time is over!");
  }
}, 1000);

function init() {
  for (let i = 0; i < 4; i++) spawnEnemy();
  for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * canvas.width, y: Math.random() * 150 });
  setInterval(() => { if (!gameOver) spawnEnemy(); }, 2000);
  setInterval(() => { if (!gameOver) spawnPerk(); }, 8000);
  loop();
}

init();
