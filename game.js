const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const lifeEl = document.querySelector("#life");
const progressEl = document.querySelector("#progress");
const distanceEl = document.querySelector("#distance");
const message = document.querySelector("#message");
const startButton = document.querySelector("#startButton");

const W = canvas.width, H = canvas.height;
ctx.imageSmoothingEnabled = false;
const worldWidth = 4200;
const keys = { left: false, right: false, attack: false };
let gameState = "ready", lastTime = 0, camera = 0, score = 0, lives = 3, stars = 0;
const player = { x: 100, y: 380, w: 30, h: 44, vx: 0, vy: 0, grounded: false, facing: 1, attackTime: 0, invincible: 0 };
const platforms = [
  { x: 0, y: 470, w: 690, h: 70 }, { x: 790, y: 430, w: 410, h: 110 },
  { x: 1300, y: 470, w: 620, h: 70 }, { x: 2020, y: 400, w: 330, h: 140 },
  { x: 2460, y: 470, w: 630, h: 70 }, { x: 3200, y: 420, w: 430, h: 120 },
  { x: 3750, y: 470, w: 450, h: 70 }
];
const enemies = [{ x: 500, y: 430, w: 28, h: 40, min: 400, max: 630, vx: 1.2, alive: true },
  { x: 970, y: 390, w: 28, h: 40, min: 820, max: 1160, vx: -1, alive: true },
  { x: 1510, y: 430, w: 28, h: 40, min: 1360, max: 1810, vx: 1.3, alive: true },
  { x: 2150, y: 360, w: 28, h: 40, min: 2050, max: 2300, vx: -1.1, alive: true },
  { x: 2750, y: 430, w: 28, h: 40, min: 2520, max: 3020, vx: 1.4, alive: true },
  { x: 3400, y: 380, w: 28, h: 40, min: 3240, max: 3580, vx: -1, alive: true }];
const collectibles = [260, 350, 590, 900, 1040, 1450, 1630, 2110, 2210, 2640, 2860, 3320, 3480, 3900]
  .map((x, i) => ({ x, y: i % 3 === 0 ? 370 : 420, taken: false }));
const starsBg = Array.from({ length: 100 }, (_, i) => ({ x: (i * 97) % W, y: (i * 47) % 330, r: i % 5 ? 1 : 2 }));

function reset() {
  player.x = 100; player.y = 380; player.vx = 0; player.vy = 0; player.invincible = 0;
  camera = 0; score = 0; lives = 3; stars = 0;
  enemies.forEach(e => { e.alive = true; }); collectibles.forEach(c => { c.taken = false; });
  updateHud();
}
function start() { reset(); gameState = "playing"; message.classList.add("hidden"); }
function updateHud() {
  scoreEl.textContent = String(score).padStart(6, "0");
  lifeEl.textContent = "♥".repeat(lives) + "♡".repeat(3 - lives);
  const pct = Math.min(100, Math.round(player.x / (worldWidth - 350) * 100));
  progressEl.style.width = `${pct}%`; distanceEl.textContent = `${pct}%`;
}
function touching(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function attackBox() { return { x: player.facing > 0 ? player.x + player.w : player.x - 32, y: player.y + 8, w: 32, h: 28 }; }
function update(dt) {
  const move = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  player.vx += (move * 0.75 - player.vx * 0.18) * dt;
  if (Math.abs(player.vx) > .1) player.facing = player.vx > 0 ? 1 : -1;
  player.vy += 0.7 * dt; player.x += player.vx * dt; player.y += player.vy * dt;
  player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));
  player.grounded = false;
  platforms.forEach(p => {
    if (player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h >= p.y &&
      player.y + player.h <= p.y + 22 && player.vy >= 0) {
      player.y = p.y - player.h; player.vy = 0; player.grounded = true;
    }
  });
  player.attackTime = Math.max(0, player.attackTime - dt); player.invincible = Math.max(0, player.invincible - dt);
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += e.vx * dt; if (e.x < e.min || e.x > e.max) e.vx *= -1;
    if (player.attackTime > 0 && touching(attackBox(), e)) { e.alive = false; score += 100; }
    else if (player.invincible <= 0 && touching(player, e)) { lives--; player.invincible = 90; player.vy = -8; player.x -= player.facing * 40; if (lives <= 0) end("GAME OVER", "もう一度、星の街へ挑戦しよう"); }
  });
  collectibles.forEach(c => { if (!c.taken && Math.abs(player.x + 15 - c.x) < 28 && Math.abs(player.y - c.y) < 45) { c.taken = true; stars++; score += 25; } });
  camera += ((player.x - W * .35) - camera) * .1; camera = Math.max(0, Math.min(worldWidth - W, camera));
  if (player.y > H + 50) { lives--; player.x = Math.max(60, player.x - 180); player.y = 300; player.vy = 0; if (lives <= 0) end("GAME OVER", "足場を見極めて、もう一度！"); }
  if (player.x > 4000) end("MISSION COMPLETE", `集めた星 ${stars} 個 / スコア ${score}`);
  updateHud();
}
function end(title, sub) {
  gameState = "ended"; message.classList.remove("hidden");
  message.querySelector(".message-kicker").textContent = title === "GAME OVER" ? "TRY AGAIN" : "CLEAR";
  message.querySelector("h2").innerHTML = title === "GAME OVER" ? "GAME OVER" : "MISSION<br>COMPLETE";
  message.querySelector("p:not(.message-kicker)").textContent = sub;
  startButton.textContent = title === "GAME OVER" ? "リトライ" : "もう一度遊ぶ";
}
function draw() {
  ctx.fillStyle = "#211542"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff4d6"; starsBg.forEach(s => { const x = (s.x - camera * .12 + W) % W; ctx.globalAlpha = .45 + (s.r / 5); ctx.fillRect(Math.floor(x), s.y, s.r + 1, s.r + 1); }); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(-camera, 0);
  ctx.fillStyle = "#38235d"; for (let x = 0; x < worldWidth; x += 150) { const h = 80 + (x * 17) % 110; ctx.fillRect(x, 470 - h, 100, h); ctx.fillStyle = "#ffd447"; for (let wy = 470 - h + 18; wy < 455; wy += 24) { ctx.fillRect(x + 14, wy, 9, 5); ctx.fillRect(x + 38, wy, 9, 5); ctx.fillRect(x + 70, wy, 9, 5); } ctx.fillStyle = "#38235d"; }
  platforms.forEach(p => { ctx.fillStyle = "#694675"; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = "#29d8d8"; ctx.fillRect(p.x, p.y, p.w, 6); ctx.fillStyle = "#211542"; for (let x = p.x + 12; x < p.x + p.w - 8; x += 28) ctx.fillRect(x, p.y + 17, 18, 7); });
  collectibles.forEach(c => { if (!c.taken) { const y = Math.round(c.y + Math.sin(Date.now() / 180 + c.x) * 2); ctx.fillStyle = "#ffd447"; ctx.fillRect(c.x - 8, y - 5, 16, 10); ctx.fillRect(c.x - 4, y - 9, 8, 18); ctx.fillStyle = "#fff4d6"; ctx.fillRect(c.x - 3, y - 4, 4, 4); } });
  enemies.forEach(e => { if (e.alive) { ctx.fillStyle = "#e83f8c"; ctx.fillRect(e.x, e.y + 6, e.w, e.h - 6); ctx.fillStyle = "#ffd447"; ctx.fillRect(e.x - 4, e.y, e.w + 8, 6); ctx.fillStyle = "#211542"; ctx.fillRect(e.x + 5, e.y + 15, 6, 6); ctx.fillRect(e.x + 17, e.y + 15, 6, 6); ctx.fillStyle = "#29d8d8"; ctx.fillRect(e.x + 4, e.y + e.h, 7, 4); ctx.fillRect(e.x + 17, e.y + e.h, 7, 4); } });
  ctx.fillStyle = "#29d8d8"; ctx.fillRect(4000, 310, 8, 160); ctx.fillStyle = "#e83f8c"; ctx.fillRect(4008, 315, 72, 40); ctx.fillStyle = "#fff4d6"; ctx.font = "10px monospace"; ctx.fillText("GO!", 4022, 340);
  if (!(player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0)) { ctx.fillStyle = "#29d8d8"; ctx.fillRect(player.x, player.y + 5, player.w, player.h - 5); ctx.fillStyle = "#ffd447"; ctx.fillRect(player.x + 5, player.y, 20, 8); ctx.fillStyle = "#211542"; ctx.fillRect(player.x + 7, player.y + 14, 5, 5); ctx.fillRect(player.x + 19, player.y + 14, 5, 5); ctx.fillStyle = "#e83f8c"; ctx.fillRect(player.x - 3, player.y + 32, player.w + 6, 7); }
  if (player.attackTime > 0) { ctx.strokeStyle = "#ffd447"; ctx.lineWidth = 5; ctx.beginPath(); const a = attackBox(); ctx.moveTo(a.x + 4, a.y + 24); ctx.lineTo(a.x + 28, a.y + 4); ctx.stroke(); }
  ctx.restore();
}
function loop(time) { const dt = Math.min(2, (time - lastTime) / 16.67 || 1); lastTime = time; if (gameState === "playing") update(dt); draw(); requestAnimationFrame(loop); }
function jump() { if (gameState === "playing" && player.grounded) { player.vy = -13; player.grounded = false; } }
function attack() { if (gameState === "playing") player.attackTime = 12; }
const keyMap = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
addEventListener("keydown", e => { if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w"].includes(e.key)) e.preventDefault(); if (keyMap[e.key]) keys[keyMap[e.key]] = true; if (e.key === "ArrowUp" || e.key === "w") jump(); if (e.key === " ") attack(); });
addEventListener("keyup", e => { if (keyMap[e.key]) keys[keyMap[e.key]] = false; });
document.querySelectorAll("[data-key]").forEach(button => {
  const key = button.dataset.key;
  button.addEventListener("pointerdown", e => { e.preventDefault(); if (key === "jump") jump(); else if (key === "attack") attack(); else keys[key] = true; });
  button.addEventListener("pointerup", () => { if (key === "left" || key === "right") keys[key] = false; });
  button.addEventListener("pointerleave", () => { if (key === "left" || key === "right") keys[key] = false; });
});
startButton.addEventListener("click", start);
updateHud(); requestAnimationFrame(loop);
