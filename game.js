const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const introCard = document.querySelector("#intro-card");
const resultCard = document.querySelector("#result-card");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const toast = document.querySelector("#toast");

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 522;
const WORLD_WIDTH = 2700;
const FLOOR_Y = 438;
const GRAVITY = 1900;
const MOVE_SPEED = 310;
const JUMP_SPEED = 690;
const platforms = [
  { x: 0, y: FLOOR_Y, width: 590 },
  { x: 700, y: FLOOR_Y, width: 580 },
  { x: 1390, y: FLOOR_Y, width: 560 },
  { x: 2070, y: FLOOR_Y, width: 630 },
  { x: 270, y: 350, width: 150 },
  { x: 820, y: 345, width: 170 },
  { x: 1080, y: 285, width: 140 },
  { x: 1510, y: 350, width: 170 },
  { x: 1770, y: 300, width: 150 },
  { x: 2210, y: 350, width: 170 },
  { x: 2460, y: 290, width: 140 },
];
const coins = [
  { x: 340, y: 310 }, { x: 875, y: 305 }, { x: 1148, y: 245 },
  { x: 1580, y: 310 }, { x: 2515, y: 250 },
];
const clouds = [
  { x: 110, y: 100, size: 0.8 }, { x: 410, y: 155, size: 0.55 },
  { x: 740, y: 86, size: 0.9 }, { x: 1050, y: 145, size: 0.65 },
  { x: 1420, y: 94, size: 0.8 }, { x: 1790, y: 150, size: 0.7 },
  { x: 2160, y: 90, size: 0.9 }, { x: 2500, y: 145, size: 0.7 },
];
const keys = new Set();
const touchControls = new Set();
const player = { x: 72, y: FLOOR_Y - 48, width: 40, height: 48, vx: 0, vy: 0, grounded: true };

let cameraX = 0;
let collected = new Set();
let started = false;
let finished = false;
let lastTime = 0;
let toastTimer = 0;
let jumpQueued = false;

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  context.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
}

function resetGame() {
  player.x = 72;
  player.y = FLOOR_Y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  cameraX = 0;
  collected = new Set();
  started = true;
  finished = false;
  jumpQueued = false;
  coinCount.textContent = "0";
  introCard.hidden = true;
  resultCard.hidden = true;
  toast.classList.remove("visible");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = 1.5;
}

function update(delta) {
  if (!started || finished) return;

  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA") || touchControls.has("left");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD") || touchControls.has("right");
  player.vx = (Number(movingRight) - Number(movingLeft)) * MOVE_SPEED;

  if (jumpQueued && player.grounded) {
    player.vy = -JUMP_SPEED;
    player.grounded = false;
  }
  jumpQueued = false;

  const previousBottom = player.y + player.height;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x + player.vx * delta));
  player.y += player.vy * delta;
  player.vy += GRAVITY * delta;
  player.grounded = false;

  for (const platform of platforms) {
    const horizontalOverlap = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossedTop = previousBottom <= platform.y && player.y + player.height >= platform.y && player.vy >= 0;
    if (horizontalOverlap && crossedTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }
  }

  if (player.y > VIEW_HEIGHT + 100) {
    player.x = 72;
    player.y = FLOOR_Y - player.height;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    cameraX = 0;
    showToast("もう一度チャレンジ！");
  }

  coins.forEach((coin, index) => {
    if (collected.has(index)) return;
    const dx = player.x + player.width / 2 - coin.x;
    const dy = player.y + player.height / 2 - coin.y;
    if (Math.hypot(dx, dy) < 32) {
      collected.add(index);
      coinCount.textContent = String(collected.size);
      showToast(collected.size === coins.length ? "全部のコインを集めた！" : "コインをゲット！");
    }
  });

  cameraX += (player.x - VIEW_WIDTH * 0.35 - cameraX) * Math.min(1, delta * 5);
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, cameraX));

  if (player.x + player.width >= WORLD_WIDTH - 90) {
    finished = true;
    resultEyebrow.textContent = "STAGE CLEAR";
    resultTitle.textContent = "やったね！";
    resultMessage.textContent = `コインを ${collected.size} / ${coins.length} 枚集めてゴールしました。`;
    resultCard.hidden = false;
  }

  if (toastTimer > 0) {
    toastTimer -= delta;
    if (toastTimer <= 0) toast.classList.remove("visible");
  }
}

function drawCloud(x, y, size) {
  context.save();
  context.translate(x - cameraX * 0.22, y);
  context.scale(size, size);
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.beginPath();
  context.arc(0, 12, 20, Math.PI, 0);
  context.arc(22, 3, 26, Math.PI, 0);
  context.arc(50, 13, 18, Math.PI, 0);
  context.lineTo(68, 22);
  context.lineTo(-20, 22);
  context.closePath();
  context.fill();
  context.restore();
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  gradient.addColorStop(0, "#b8d8d0");
  gradient.addColorStop(0.67, "#e8e5c8");
  gradient.addColorStop(1, "#f3e6bd");
  context.fillStyle = gradient;
  context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  context.fillStyle = "rgba(247, 218, 145, 0.86)";
  context.beginPath();
  context.arc(790, 113, 39, 0, Math.PI * 2);
  context.fill();

  clouds.forEach((cloud) => drawCloud(cloud.x, cloud.y, cloud.size));

  for (let layer = 0; layer < 2; layer += 1) {
    const parallax = layer === 0 ? 0.12 : 0.24;
    const baseY = layer === 0 ? 353 : 390;
    const color = layer === 0 ? "#b0c79a" : "#8eaa75";
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, VIEW_HEIGHT);
    for (let x = -80; x <= VIEW_WIDTH + 80; x += 80) {
      const worldX = x + cameraX * parallax;
      const y = baseY + Math.sin(worldX * 0.004) * 24 + Math.sin(worldX * 0.009) * 11;
      context.lineTo(x, y);
    }
    context.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
    context.closePath();
    context.fill();
  }
}

function drawWorld() {
  context.save();
  context.translate(-cameraX, 0);

  platforms.forEach((platform) => {
    context.fillStyle = "#9b7957";
    context.fillRect(platform.x, platform.y + 8, platform.width, VIEW_HEIGHT - platform.y + 22);
    context.fillStyle = "#829765";
    context.beginPath();
    context.moveTo(platform.x, platform.y + 10);
    context.quadraticCurveTo(platform.x, platform.y, platform.x + 12, platform.y);
    context.lineTo(platform.x + platform.width - 12, platform.y);
    context.quadraticCurveTo(platform.x + platform.width, platform.y, platform.x + platform.width, platform.y + 10);
    context.closePath();
    context.fill();
    context.fillStyle = "#a8b57b";
    for (let x = platform.x + 14; x < platform.x + platform.width - 8; x += 38) {
      context.beginPath();
      context.ellipse(x, platform.y + 14, 3, 1.5, -0.4, 0, Math.PI * 2);
      context.fill();
    }
  });

  coins.forEach((coin, index) => {
    if (collected.has(index)) return;
    const bob = Math.sin(performance.now() / 250 + index) * 4;
    context.fillStyle = "#d6a84f";
    context.beginPath();
    context.ellipse(coin.x, coin.y + bob, 10, 13, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#f6e5a9";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#fff4ce";
    context.fillRect(coin.x - 1, coin.y - 7 + bob, 2, 7);
  });

  const flagX = WORLD_WIDTH - 90;
  context.fillStyle = "#faf3d9";
  context.fillRect(flagX, FLOOR_Y - 94, 5, 94);
  context.fillStyle = "#c77b62";
  context.beginPath();
  context.moveTo(flagX + 5, FLOOR_Y - 92);
  context.lineTo(flagX + 53, FLOOR_Y - 77);
  context.lineTo(flagX + 5, FLOOR_Y - 62);
  context.closePath();
  context.fill();

  drawPlayer();
  context.restore();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const running = Math.abs(player.vx) > 0;
  const step = running ? Math.sin(performance.now() / 65) * 3 : 0;
  const bounce = running ? Math.abs(Math.sin(performance.now() / 65)) * 2 : 0;

  context.fillStyle = "rgba(78, 82, 54, 0.18)";
  context.beginPath();
  context.ellipse(x + 20, y + 47, 17, 4, 0, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(0, -bounce);
  context.fillStyle = "#e9d7b6";
  context.beginPath();
  context.ellipse(x + 12, y + 10, 6, 14, -0.18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d9a99a";
  context.beginPath();
  context.ellipse(x + 12, y + 10, 2.5, 8, -0.18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e9d7b6";
  context.beginPath();
  context.ellipse(x + 28, y + 10, 6, 14, 0.18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d9a99a";
  context.beginPath();
  context.ellipse(x + 28, y + 10, 2.5, 8, 0.18, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#e9d7b6";
  context.beginPath();
  context.ellipse(x + 20, y + 31, 19, 16, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d6a790";
  context.beginPath();
  context.ellipse(x + 20, y + 19, 15, 14, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f0dfc2";
  context.beginPath();
  context.ellipse(x + 20, y + 20, 13, 12, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#594c43";
  context.beginPath();
  context.arc(x + 15, y + 19, 1.5, 0, Math.PI * 2);
  context.arc(x + 25, y + 19, 1.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d78d83";
  context.beginPath();
  context.ellipse(x + 10, y + 23, 3, 1.8, 0, 0, Math.PI * 2);
  context.ellipse(x + 30, y + 23, 3, 1.8, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#aa6e61";
  context.beginPath();
  context.moveTo(x + 18, y + 23);
  context.quadraticCurveTo(x + 20, y + 21, x + 22, y + 23);
  context.quadraticCurveTo(x + 20, y + 26, x + 18, y + 23);
  context.fill();

  context.fillStyle = "#829267";
  context.beginPath();
  context.ellipse(x + 20, y + 29, 15, 4, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.moveTo(x + 23, y + 30);
  context.lineTo(x + 29, y + 39);
  context.lineTo(x + 22, y + 36);
  context.closePath();
  context.fill();
  context.fillStyle = "#c98e72";
  context.beginPath();
  context.ellipse(x + 10, y + 43 + Math.max(0, step), 7, 4, 0, 0, Math.PI * 2);
  context.ellipse(x + 29, y + 43 + Math.max(0, -step), 7, 4, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function draw() {
  drawBackground();
  drawWorld();
}

function frame(timestamp) {
  const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.04) : 0;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

function handleKeyDown(event) {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if ((event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") && !event.repeat) {
    jumpQueued = true;
  }
}

function handleKeyUp(event) {
  keys.delete(event.code);
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", () => {
  keys.clear();
  touchControls.clear();
});
window.addEventListener("resize", resizeCanvas);

document.querySelector("#start-button").addEventListener("click", resetGame);
document.querySelector("#play-again-button").addEventListener("click", resetGame);
document.querySelector("#restart-button").addEventListener("click", resetGame);

document.querySelectorAll(".touch-button").forEach((button) => {
  const control = button.dataset.control;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touchControls.add(control);
    if (control === "jump") jumpQueued = true;
  });
  const release = () => touchControls.delete(control);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

resizeCanvas();
requestAnimationFrame(frame);
