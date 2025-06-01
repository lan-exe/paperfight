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

document.addEventListener("DOMContentLoaded", () => {
  setupHoverEffect('summer', setupSummerEffect);
  setupHoverEffect('winter', setupWinterEffect);
  setupHoverEffect('rain', setupRainEffect);
  setupHoverEffect('windy', setupWindyEffect);
});

function createParticle(container, className, styles = {}) {
  const el = document.createElement('div');
  el.className = className;
  Object.assign(el.style, {
    position: 'absolute',
    pointerEvents: 'none',
    ...styles
  });
  container.appendChild(el);
  return el;
}

function setupHoverEffect(className, effectSetupFunc) {
  const card = document.querySelector(`.${className}`);
  if (!card) return;

  let intervalId, animationId;
  let running = false;

  function startEffect() {
    if (running) return;
    running = true;
    effectSetupFunc(card, () => {
      running = false;
    });
  }

  function stopEffect() {
    // Remove all particles inside card except the card's main content text
    [...card.querySelectorAll('.snowflake, .raindrop, .wind-line, .sun-ray')].forEach(el => el.remove());
    running = false;
  }

  card.addEventListener('mouseenter', startEffect);
  card.addEventListener('mouseleave', stopEffect);
}

// ☀️ Summer - Sun glow center with pulse
function setupSummerEffect(card, done) {
  // Create sun glow circle in center
  ;

  // Append keyframes only once
  if (!document.getElementById('pulse-keyframes')) {
    const style = document.createElement('style');
    style.id = 'pulse-keyframes';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ❄️ Winter - Falling snow on hover
function setupWinterEffect(card, done) {
  let active = true;

  function spawnSnowflake() {
    if (!active) return;
    const flake = createParticle(card, 'snowflake', {
      left: `${Math.random() * 100}%`,
      top: '-10px',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'white',
      opacity: Math.random() * 0.8 + 0.2
    });

    let y = -10;
    const speed = 0.5 + Math.random();

    function fall() {
      if (!active) {
        flake.remove();
        return;
      }
      y += speed;
      flake.style.top = `${y}px`;
      if (y < card.offsetHeight) requestAnimationFrame(fall);
      else flake.remove();
    }
    fall();
  }

  const interval = setInterval(() => {
    if (!active) {
      clearInterval(interval);
      if (done) done();
      return;
    }
    spawnSnowflake();
  }, 200);

  // When mouse leaves, stop
  card.addEventListener('mouseleave', () => {
    active = false;
    clearInterval(interval);
    if (done) done();
  }, { once: true });
}

// 🌧️ Rain - Falling raindrops on hover
function setupRainEffect(card, done) {
  let active = true;

  function spawnRaindrop() {
    if (!active) return;
    const drop = createParticle(card, 'raindrop', {
      left: `${Math.random() * 100}%`,
      top: '-20px',
      width: '2px',
      height: '15px',
      background: 'rgba(0, 0, 255, 0.5)',
      borderRadius: '1px'
    });

    let y = -20;
    const speed = 4 + Math.random() * 2;

    function fall() {
      if (!active) {
        drop.remove();
        return;
      }
      y += speed;
      drop.style.top = `${y}px`;
      if (y < card.offsetHeight) requestAnimationFrame(fall);
      else drop.remove();
    }
    fall();
  }

  const interval = setInterval(() => {
    if (!active) {
      clearInterval(interval);
      if (done) done();
      return;
    }
    spawnRaindrop();
  }, 100);

  card.addEventListener('mouseleave', () => {
    active = false;
    clearInterval(interval);
    if (done) done();
  }, { once: true });
}

// 💨 Windy - Moving lines on hover
function setupWindyEffect(card, done) {
  let active = true;

  function spawnWindLine() {
    if (!active) return;
    const line = createParticle(card, 'wind-line', {
      top: `${Math.random() * 100}%`,
      left: '-40px',
      width: '30px',
      height: '2px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '1px'
    });

    let x = -40;
    const speed = 2 + Math.random() * 2;

    function move() {
      if (!active) {
        line.remove();
        return;
      }
      x += speed;
      line.style.left = `${x}px`;
      if (x < card.offsetWidth) requestAnimationFrame(move);
      else line.remove();
    }
    move();
  }

  const interval = setInterval(() => {
    if (!active) {
      clearInterval(interval);
      if (done) done();
      return;
    }
    spawnWindLine();
  }, 200);

  card.addEventListener('mouseleave', () => {
    active = false;
    clearInterval(interval);
    if (done) done();
  }, { once: true });
}
