// =====================================================
// SCIENCE LAB EXPLORER — CLASSROOM PRESENTATION EDITION
// =====================================================

const DPR = Math.min(window.devicePixelRatio || 1, 2);

function setupCanvas(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  canvas.width = w * DPR;
  canvas.height = h * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);
  return { ctx, w, h };
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(c1, c2, t) {
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(lerp(c1[0], c2[0], k));
  const g = Math.round(lerp(c1[1], c2[1], k));
  const b = Math.round(lerp(c1[2], c2[2], k));
  return `rgb(${r}, ${g}, ${b})`;
}

// =====================================================
// PRESENTER FULLSCREEN & KEYBOARD SHORTCUTS
// =====================================================
const fullscreenBtn = document.getElementById("fullscreen-btn");
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement ? "✕ Exit Full" : "⛶ Fullscreen";
});

// =====================================================
// EXPERIMENT 1: COKE & MENTOS (PHYSICAL NUCLEATION)
// =====================================================
const e1Macro = setupCanvas(document.getElementById("exp1-macro"));
const e1Micro = setupCanvas(document.getElementById("exp1-micro"));

const mentosSlider = document.getElementById("mentos-count");
const mentosLabel = document.getElementById("mentos-count-label");
const tempButtons = document.querySelectorAll(".seg-btn");
const dropBtn = document.getElementById("exp1-drop-btn");
const resetBtn1 = document.getElementById("exp1-reset-btn");
const exp1Status = document.getElementById("exp1-status");
const exp1Height = document.getElementById("exp1-height");
const exp1MicroState = document.getElementById("exp1-micro-state");
const e1Steps = [
  document.getElementById("e1-step-1"),
  document.getElementById("e1-step-2"),
  document.getElementById("e1-step-3"),
];

const tempConfig = {
  cold: { mult: 0.65, speed: 0.6 },
  room: { mult: 1.0, speed: 1.0 },
  warm: { mult: 1.48, speed: 1.65 },
};

const exp1 = {
  temp: "room",
  mentosCount: 3,
  phase: "idle", // idle | dropping | erupting | done
  t: 0,
  liquidLevel: 0.78,
  targetLevel: 0.78,
  geyserPower: 0,
  candies: [],
  sodaBubbles: [],
  foamDrops: [],
  microCO2: [],
};

function initExp1Particles() {
  const cx = e1Macro.w / 2;
  const benchY = e1Macro.h - 28;
  exp1.sodaBubbles = Array.from({ length: 26 }, () => ({
    x: cx - 38 + Math.random() * 76,
    y: benchY - 140 + Math.random() * 135,
    r: 1.6 + Math.random() * 2.6,
    vy: 0.65 + Math.random() * 1.15,
  }));

  exp1.microCO2 = Array.from({ length: 26 }, () => ({
    x: 45 + Math.random() * (e1Micro.w - 90),
    y: 55 + Math.random() * 240,
    vx: (Math.random() - 0.5) * 1.1,
    vy: (Math.random() - 0.5) * 1.1,
    r: 5 + Math.random() * 2,
    escaping: false,
  }));
}

function setE1StepHighlight(idx) {
  e1Steps.forEach((el, i) => el.classList.toggle("active", i === idx));
}

function resetExp1() {
  exp1.phase = "idle";
  exp1.t = 0;
  exp1.liquidLevel = 0.78;
  exp1.targetLevel = 0.78;
  exp1.geyserPower = 0;
  exp1.candies = [];
  exp1.foamDrops = [];
  exp1Status.textContent = "Ready";
  exp1Height.textContent = "0.0 m";
  exp1MicroState.textContent = "H₂O Net Traps CO₂";
  setE1StepHighlight(-1);
  initExp1Particles();
}

function triggerExp1() {
  resetExp1();
  const cx = e1Macro.w / 2;
  exp1.phase = "dropping";
  exp1.mentosCount = Number(mentosSlider.value);
  exp1Status.textContent = "Sinking...";
  exp1MicroState.textContent = "Pits Enter Soda";
  setE1StepHighlight(0);

  for (let i = 0; i < exp1.mentosCount; i++) {
    exp1.candies.push({
      x: cx + (Math.random() - 0.5) * 8,
      y: 48 - i * 26,
      vy: 0,
      landed: false,
      delay: i * 5,
    });
  }
}

mentosSlider.addEventListener("input", () => {
  mentosLabel.textContent = mentosSlider.value;
  exp1.mentosCount = Number(mentosSlider.value);
});

tempButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tempButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    exp1.temp = btn.dataset.temp;
  });
});

dropBtn.addEventListener("click", triggerExp1);
resetBtn1.addEventListener("click", resetExp1);

function drawBottlePath(ctx, cx, benchY) {
  ctx.beginPath();
  ctx.moveTo(cx - 14, benchY - 212);
  ctx.lineTo(cx + 14, benchY - 212);
  ctx.lineTo(cx + 14, benchY - 190);
  ctx.quadraticCurveTo(cx + 50, benchY - 170, cx + 50, benchY - 142);
  ctx.lineTo(cx + 50, benchY - 10);
  ctx.quadraticCurveTo(cx + 50, benchY, cx + 38, benchY);
  ctx.lineTo(cx - 38, benchY);
  ctx.quadraticCurveTo(cx - 50, benchY, cx - 50, benchY - 10);
  ctx.lineTo(cx - 50, benchY - 142);
  ctx.quadraticCurveTo(cx - 50, benchY - 170, cx - 14, benchY - 190);
  ctx.closePath();
}

function drawExp1Macro(dt) {
  const { ctx, w, h } = e1Macro;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const benchY = h - 28;
  const neckTopY = benchY - 212;
  const cfg = tempConfig[exp1.temp];

  // Lab bench
  ctx.fillStyle = "#111c33";
  ctx.fillRect(0, benchY, w, h - benchY);
  ctx.strokeStyle = "rgba(148,163,184,0.22)";
  ctx.beginPath();
  ctx.moveTo(0, benchY);
  ctx.lineTo(w, benchY);
  ctx.stroke();

  if (exp1.phase === "dropping") {
    exp1.t += dt;
    let allLanded = true;
    exp1.candies.forEach((c, idx) => {
      if (exp1.t * 60 < c.delay) {
        allLanded = false;
        return;
      }
      if (!c.landed) {
        c.vy += 0.36;
        c.y += c.vy;
        const bottomTarget = benchY - 10 - idx * 6;
        if (c.y >= bottomTarget) {
          c.y = bottomTarget;
          c.landed = true;
        } else {
          allLanded = false;
        }
      }
    });

    if (exp1.t > 0.55) {
      exp1Status.textContent = "Nucleating!";
      exp1MicroState.textContent = "Pits Break Net → CO₂ Escapes";
      setE1StepHighlight(1);
    }

    if (allLanded || exp1.t > 1.15) {
      exp1.phase = "erupting";
      exp1.t = 0;
      const peakMeters = Math.min(7.8, 0.9 * exp1.mentosCount * cfg.mult);
      exp1Height.textContent = `${peakMeters.toFixed(1)} m`;
      exp1.targetLevel = Math.max(0.22, 0.78 - exp1.mentosCount * 0.08 * cfg.mult);
      exp1Status.textContent = "Geyser!";
      setE1StepHighlight(2);
    }
  } else if (exp1.phase === "erupting") {
    exp1.t += dt;
    const strength = Math.min(1.4, (0.35 + exp1.mentosCount * 0.14) * cfg.mult);
    const envelope = exp1.t < 2.2 ? Math.min(1, exp1.t * 4) : Math.max(0, 1 - (exp1.t - 2.2) / 1.0);
    exp1.geyserPower = strength * envelope;
    exp1.liquidLevel = lerp(exp1.liquidLevel, exp1.targetLevel, dt * 1.4);

    if (envelope > 0.15) {
      for (let i = 0; i < 4; i++) {
        exp1.foamDrops.push({
          x: cx + (Math.random() - 0.5) * 14,
          y: neckTopY - exp1.geyserPower * 115,
          vx: (Math.random() - 0.5) * (2.6 + exp1.geyserPower * 2),
          vy: -(2.2 + Math.random() * 3.5) * exp1.geyserPower,
          r: 2 + Math.random() * 3.5,
          life: 1,
        });
      }
    }

    if (exp1.t >= 3.2) {
      exp1.phase = "done";
      exp1.geyserPower = 0;
      exp1Status.textContent = "Done (Same CO₂)";
      exp1MicroState.textContent = "Physical: No New Molecules";
    }
  }

  // Geyser stream
  if (exp1.geyserPower > 0.02) {
    const streamH = exp1.geyserPower * 138;
    const streamW = 16 + exp1.geyserPower * 13;
    const grad = ctx.createLinearGradient(cx, neckTopY - streamH, cx, neckTopY);
    grad.addColorStop(0, "rgba(255, 250, 240, 0.96)");
    grad.addColorStop(0.55, "rgba(217, 119, 6, 0.92)");
    grad.addColorStop(1, "rgba(92, 36, 16, 0.96)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - streamW * 0.38, neckTopY + 4);
    ctx.quadraticCurveTo(cx - streamW * 0.72, neckTopY - streamH * 0.6, cx, neckTopY - streamH);
    ctx.quadraticCurveTo(cx + streamW * 0.72, neckTopY - streamH * 0.6, cx + streamW * 0.38, neckTopY + 4);
    ctx.fill();
  }

  // Foam drops
  exp1.foamDrops = exp1.foamDrops.filter((d) => d.life > 0.03 && d.y < benchY);
  exp1.foamDrops.forEach((d) => {
    d.vy += 0.16;
    d.x += d.vx;
    d.y += d.vy;
    d.life -= 0.016;
    ctx.fillStyle = `rgba(255, 244, 230, ${d.life})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Falling candies above neck
  exp1.candies.forEach((c) => {
    if (c.y < neckTopY + 4) {
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 10, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  // Bottle interior
  ctx.save();
  drawBottlePath(ctx, cx, benchY);
  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  ctx.fill();
  ctx.clip();

  const topY = benchY - exp1.liquidLevel * 172;
  const sodaGrad = ctx.createLinearGradient(0, topY, 0, benchY);
  sodaGrad.addColorStop(0, "#7c2d12");
  sodaGrad.addColorStop(1, "#2a0d05");
  ctx.fillStyle = sodaGrad;
  ctx.fillRect(cx - 52, topY, 104, benchY - topY + 2);

  if (exp1.phase === "erupting" || exp1.phase === "dropping") {
    ctx.fillStyle = "rgba(254, 243, 199, 0.75)";
    ctx.fillRect(cx - 52, topY - 8, 104, 12);
  }

  const bubbleBoost = exp1.phase === "erupting" ? 3.8 : exp1.phase === "dropping" ? 2.2 : 1;
  exp1.sodaBubbles.forEach((b) => {
    b.y -= b.vy * cfg.speed * bubbleBoost;
    if (b.y < topY) {
      b.y = benchY - 4;
      b.x = cx - 40 + Math.random() * 80;
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  exp1.candies.forEach((c) => {
    if (c.y >= neckTopY + 4) {
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 10, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  // COLA label
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(cx - 50, benchY - 102, 100, 32);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("COLA", cx, benchY - 81);
  ctx.restore();

  // Bottle outline
  ctx.strokeStyle = "rgba(203, 213, 225, 0.7)";
  ctx.lineWidth = 2.4;
  drawBottlePath(ctx, cx, benchY);
  ctx.stroke();

  // Height scale
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("7m", 32, 58);
  ctx.fillText("4m", 32, 140);
  ctx.fillText("1m", 32, 224);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.setLineDash([4, 4]);
  [54, 136, 220].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(cx - 70, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

function drawExp1Micro() {
  const { ctx, w, h } = e1Micro;
  ctx.clearRect(0, 0, w, h);

  const cfg = tempConfig[exp1.temp];
  const isActive = exp1.phase === "dropping" || exp1.phase === "erupting";
  const isDone = exp1.phase === "done";

  ctx.strokeStyle = isActive ? "rgba(56, 189, 248, 0.14)" : "rgba(56, 189, 248, 0.42)";
  ctx.lineWidth = 1.6;

  const pts = exp1.microCO2;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (isActive && !p.escaping && Math.random() < 0.085) {
      p.escaping = true;
    }

    if (p.escaping) {
      p.y -= (2.5 + Math.random() * 1.4) * cfg.speed;
      p.x += Math.sin(p.y * 0.06) * 1.2;
      if (p.y < -15) {
        p.y = h - 95;
        p.x = 60 + Math.random() * (w - 120);
        if (!isActive) p.escaping = false;
      }
    } else {
      p.x += p.vx * cfg.speed;
      p.y += p.vy * cfg.speed;
      if (p.x < 35 || p.x > w - 35) p.vx *= -1;
      if (p.y < 55 || p.y > h - 125) p.vy *= -1;
    }

    if (!p.escaping) {
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        if (!q.escaping) {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 66) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    }

    ctx.fillStyle = p.escaping ? "#fde047" : "#38bdf8";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.escaping ? p.r + 2.5 : p.r, 0, Math.PI * 2);
    ctx.fill();

    if (i < 4) {
      ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CO₂", p.x, p.y - 10);
    }
  }

  if (isActive || isDone) {
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - 95);
    const pits = [45, 105, 165, 220, 275, 335, 395];
    pits.forEach((px) => {
      ctx.lineTo(px - 18, h - 95);
      ctx.quadraticCurveTo(px, h - 64, px + 18, h - 95);
    });
    ctx.lineTo(w, h - 95);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MENTOS MICROSCOPIC PITS", w / 2, h - 32);

    if (isActive) {
      pits.forEach((px, idx) => {
        const pulse = (Math.sin(performance.now() * 0.01 + idx) + 1) * 0.5;
        ctx.fillStyle = "rgba(253, 224, 71, 0.92)";
        ctx.beginPath();
        ctx.arc(px, h - 82 - pulse * 16, 5 + pulse * 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  } else {
    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.fillRect(w / 2 - 130, h - 75, 260, 32);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    ctx.strokeRect(w / 2 - 130, h - 75, 260, 32);
    ctx.fillStyle = "#7dd3fc";
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("H₂O Net Traps CO₂ Inside", w / 2, h - 54);
  }
}

// =====================================================
// EXPERIMENT 2: CuSO4 + HCl (~25%) + Al + LIGHTER
// =====================================================
const e2Macro = setupCanvas(document.getElementById("exp2-macro"));
const e2Micro = setupCanvas(document.getElementById("exp2-micro"));

const exp2Status = document.getElementById("exp2-status");
const exp2Solution = document.getElementById("exp2-solution");
const exp2Temp = document.getElementById("exp2-temp");
const exp2MicroState = document.getElementById("exp2-micro-state");
const stepButtons = document.querySelectorAll(".t-step");
const eqPills = document.querySelectorAll(".eq-pill");
const exp2AutoBtn = document.getElementById("exp2-auto-btn");
const exp2NextBtn = document.getElementById("exp2-next-btn");
const exp2ResetBtn = document.getElementById("exp2-reset-btn");

const exp2 = {
  step: 1,
  stepTime: 0,
  colorBlend: 0,
  tempC: 22,
  copperDeposit: 0,
  foilDissolve: 0,
  flamePower: 0,
  popRing: 0,
  autoTimer: null,
  hclDrops: [],
  h2Bubbles: [],
  cuFlakes: [],
  plumeParticles: [],
  microIons: [],
  microElectrons: [],
  microH2: [],
  microFlashes: [],
};

function initExp2Particles() {
  const cx = e2Macro.w / 2;
  const benchY = e2Macro.h - 28;
  exp2.h2Bubbles = Array.from({ length: 34 }, () => ({
    x: cx - 55 + Math.random() * 110,
    y: benchY - 110 + Math.random() * 100,
    r: 2 + Math.random() * 2.8,
    vy: 1.2 + Math.random() * 1.8,
  }));

  exp2.cuFlakes = Array.from({ length: 24 }, () => ({
    x: cx - 55 + Math.random() * 110,
    y: benchY - 125 + Math.random() * 95,
    vy: 0.45 + Math.random() * 0.75,
    r: 2.2 + Math.random() * 2.2,
  }));

  exp2.plumeParticles = Array.from({ length: 18 }, () => ({
    x: cx - 8 + Math.random() * 16,
    y: benchY - 235 - Math.random() * 75,
    vy: 0.95 + Math.random() * 1.1,
    r: 4 + Math.random() * 6,
  }));

  exp2.microIons = Array.from({ length: 14 }, (_, i) => ({
    x: 50 + (i % 5) * 82 + Math.random() * 22,
    y: 72 + Math.floor(i / 5) * 68 + Math.random() * 24,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9,
    converted: false,
  }));

  exp2.microElectrons = [];
  exp2.microH2 = [];
  exp2.microFlashes = [];
}

const exp2Meta = {
  1: { status: "Step 1 / 4", sol: "Blue Cu²⁺", temp: "22°C", micro: "Blue Cu²⁺ Ions", hot: false },
  2: { status: "Step 2 / 4", sol: "Green [CuCl₄]²⁻", temp: "25°C", micro: "Cl⁻ Binds + Strips Al₂O₃", hot: false },
  3: { status: "Step 3 / 4", sol: "Cu↓ + H₂↑ Gas", temp: "72°C 🔥", micro: "Al Gives e⁻ → Cu + H₂", hot: true },
  4: { status: "Step 4 / 4", sol: "H₂ POP! + Cu Flame", temp: "85°C 💥", micro: "2H₂ + O₂ → 2H₂O + 💥", hot: true },
};

function setExp2Step(step) {
  exp2.step = step;
  exp2.stepTime = 0;

  const m = exp2Meta[step];
  exp2Status.textContent = m.status;
  exp2Solution.textContent = m.sol;
  exp2Temp.textContent = m.temp;
  exp2Temp.classList.toggle("hot", m.hot);
  exp2MicroState.textContent = m.micro;

  stepButtons.forEach((b) => b.classList.toggle("active", Number(b.dataset.step) === step));
  eqPills.forEach((p) => p.classList.toggle("active", Number(p.dataset.eq) === step));

  if (step === 1) {
    exp2.colorBlend = 0;
    exp2.tempC = 22;
    exp2.copperDeposit = 0;
    exp2.foilDissolve = 0;
    exp2.flamePower = 0;
    exp2.popRing = 0;
    exp2.hclDrops = [];
    initExp2Particles();
  }

  if (step === 2) {
    const cx = e2Macro.w / 2;
    exp2.hclDrops = [
      { x: cx, y: 112, vy: 1.5 },
      { x: cx - 4, y: 88, vy: 1.2 },
      { x: cx + 4, y: 66, vy: 1.0 },
    ];
    exp2.flamePower = 0;
    exp2.popRing = 0;
  }

  if (step === 3) {
    exp2.colorBlend = 1;
    exp2.flamePower = 0;
    exp2.popRing = 0;
  }

  if (step === 4) {
    exp2.colorBlend = 1;
    exp2.copperDeposit = Math.max(0.75, exp2.copperDeposit);
    exp2.flamePower = 1;
    exp2.popRing = 0.01;
  }

  exp2NextBtn.textContent = step < 4 ? "Next →" : "Replay ↺";
}

function stopAutoExp2() {
  if (exp2.autoTimer) {
    clearInterval(exp2.autoTimer);
    exp2.autoTimer = null;
    exp2AutoBtn.textContent = "▶ Play All";
  }
}

stepButtons.forEach((b) =>
  b.addEventListener("click", () => {
    stopAutoExp2();
    setExp2Step(Number(b.dataset.step));
  })
);

exp2NextBtn.addEventListener("click", () => {
  stopAutoExp2();
  setExp2Step(exp2.step < 4 ? exp2.step + 1 : 1);
});

exp2ResetBtn.addEventListener("click", () => {
  stopAutoExp2();
  setExp2Step(1);
});

exp2AutoBtn.addEventListener("click", () => {
  if (exp2.autoTimer) {
    stopAutoExp2();
    return;
  }
  setExp2Step(1);
  exp2AutoBtn.textContent = "❚❚ Pause";
  exp2.autoTimer = setInterval(() => {
    if (exp2.step < 4) {
      setExp2Step(exp2.step + 1);
    } else {
      stopAutoExp2();
    }
  }, 2400);
});

function drawFlaskPath(ctx, cx, benchY) {
  ctx.beginPath();
  ctx.moveTo(cx - 22, benchY - 235);
  ctx.lineTo(cx + 22, benchY - 235);
  ctx.lineTo(cx + 22, benchY - 185);
  ctx.lineTo(cx + 84, benchY - 28);
  ctx.quadraticCurveTo(cx + 92, benchY, cx + 62, benchY);
  ctx.lineTo(cx - 62, benchY);
  ctx.quadraticCurveTo(cx - 92, benchY, cx - 84, benchY - 28);
  ctx.lineTo(cx - 22, benchY - 185);
  ctx.closePath();
}

function drawExp2Macro(dt) {
  const { ctx, w, h } = e2Macro;
  ctx.clearRect(0, 0, w, h);
  exp2.stepTime += dt;

  const cx = w / 2;
  const benchY = h - 28;
  const neckTopY = benchY - 235;
  const liqTopY = benchY - 130;

  // Lab bench
  ctx.fillStyle = "#111c33";
  ctx.fillRect(0, benchY, w, h - benchY);
  ctx.strokeStyle = "rgba(148,163,184,0.22)";
  ctx.beginPath();
  ctx.moveTo(0, benchY);
  ctx.lineTo(w, benchY);
  ctx.stroke();

  if (exp2.step >= 2) {
    exp2.colorBlend = Math.min(1, exp2.colorBlend + dt * 0.9);
  }
  if (exp2.step >= 3) {
    exp2.tempC = lerp(exp2.tempC, exp2.step === 4 ? 85 : 72, dt * 1.4);
    exp2.copperDeposit = Math.min(1, exp2.copperDeposit + dt * 0.35);
    exp2.foilDissolve = Math.min(0.75, exp2.foilDissolve + dt * 0.16);
  } else {
    exp2.tempC = lerp(exp2.tempC, exp2.step === 2 ? 25 : 22, dt * 2);
  }

  if (exp2.step === 4) {
    if (exp2.popRing > 0 && exp2.popRing < 1.2) {
      exp2.popRing += dt * 1.5;
    }
    exp2.flamePower = Math.max(0.45, 1 - exp2.stepTime * 0.15);
  }

  // Dropper in Step 2
  if (exp2.step === 2 && exp2.stepTime < 1.8) {
    const enter = Math.min(1, exp2.stepTime * 2.5);
    const dy = lerp(-30, 60, enter);
    ctx.save();
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cx - 7, dy, 14, 36);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cx, dy, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(110, 231, 183, 0.9)";
    ctx.beginPath();
    ctx.moveTo(cx - 4, dy + 36);
    ctx.lineTo(cx + 4, dy + 36);
    ctx.lineTo(cx, dy + 52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    exp2.hclDrops.forEach((d) => {
      d.vy += 0.2;
      d.y += d.vy;
      if (d.y > liqTopY) d.y = dy + 54;
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(d.x, d.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Rising H2 gas plume
  if (exp2.step >= 3) {
    exp2.plumeParticles.forEach((p) => {
      p.y -= p.vy;
      if (p.y < 36) {
        p.y = neckTopY;
        p.x = cx - 10 + Math.random() * 20;
      }
      const alpha = Math.max(0, (p.y - 36) / 120) * 0.38;
      ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Flask interior
  ctx.save();
  drawFlaskPath(ctx, cx, benchY);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.clip();

  const topColor = lerpColor([56, 189, 248], [20, 184, 166], exp2.colorBlend);
  const botColor = lerpColor([2, 132, 199], [15, 118, 110], exp2.colorBlend);
  const liqGrad = ctx.createLinearGradient(0, liqTopY, 0, benchY);
  liqGrad.addColorStop(0, topColor);
  liqGrad.addColorStop(1, botColor);
  ctx.fillStyle = liqGrad;
  ctx.fillRect(cx - 100, liqTopY, 200, benchY - liqTopY + 2);

  // Copper precipitate
  if (exp2.copperDeposit > 0.02) {
    const depH = exp2.copperDeposit * 18;
    ctx.fillStyle = "#b45309";
    ctx.fillRect(cx - 95, benchY - depH, 190, depH);

    exp2.cuFlakes.forEach((f) => {
      f.y += f.vy;
      if (f.y > benchY - 2) {
        f.y = liqTopY + Math.random() * 35;
        f.x = cx - 60 + Math.random() * 120;
      }
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Aluminum foil
  if (exp2.step >= 3) {
    const dropY = Math.min(1, exp2.stepTime * 2.2);
    const wobble = Math.sin(performance.now() * 0.03) * 2.5;
    const foilY = lerp(neckTopY + 30, benchY - 46, dropY) + wobble;
    const foilScale = 1 - exp2.foilDissolve * 0.45;
    ctx.save();
    ctx.translate(cx, foilY);
    ctx.scale(foilScale, foilScale);
    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-28, -10, 56, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Al", 0, 4);
    ctx.restore();

    exp2.h2Bubbles.forEach((b) => {
      b.y -= b.vy;
      b.x += Math.sin(b.y * 0.1) * 0.6;
      if (b.y < liqTopY) {
        b.y = benchY - 20;
        b.x = cx - 58 + Math.random() * 116;
      }
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();

  // Flask outline
  ctx.strokeStyle = "rgba(203, 213, 225, 0.72)";
  ctx.lineWidth = 2.4;
  drawFlaskPath(ctx, cx, benchY);
  ctx.stroke();

  // Thermometer
  const tx = w - 98;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(tx, benchY - 190, 14, 150, 7);
  ctx.fill();
  ctx.stroke();

  const tempFrac = (exp2.tempC - 15) / 78;
  const barH = Math.max(18, tempFrac * 136);
  ctx.fillStyle = exp2.tempC > 45 ? "#ef4444" : "#38bdf8";
  ctx.beginPath();
  ctx.roundRect(tx + 3, benchY - 44 - barH, 8, barH, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tx + 7, benchY - 34, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(exp2.tempC)}°C`, tx + 7, benchY - 200);

  // Lighter + POP + Copper-green flame
  if (exp2.step === 4) {
    ctx.save();
    ctx.translate(cx + 58, neckTopY - 18);
    ctx.rotate(-0.35);
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.roundRect(0, 0, 44, 22, 5);
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-10, 3, 12, 16);
    ctx.restore();

    if (exp2.popRing > 0 && exp2.popRing < 1.15) {
      ctx.strokeStyle = `rgba(253, 224, 71, ${1 - exp2.popRing / 1.15})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, neckTopY - 24, 16 + exp2.popRing * 78, 0, Math.PI * 2);
      ctx.stroke();
    }

    const flicker = Math.sin(performance.now() * 0.03) * 6;
    const fSize = 48 * exp2.flamePower + flicker;
    const flameGrad = ctx.createRadialGradient(cx, neckTopY - 22, 4, cx, neckTopY - 36, Math.max(12, fSize));
    flameGrad.addColorStop(0, "#fef08a");
    flameGrad.addColorStop(0.45, "#f97316");
    flameGrad.addColorStop(0.75, "rgba(16, 185, 129, 0.88)");
    flameGrad.addColorStop(1, "rgba(16, 185, 129, 0)");

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(cx, neckTopY - 34, Math.max(14, fSize), 0, Math.PI * 2);
    ctx.fill();

    if (exp2.stepTime < 1.5) {
      ctx.fillStyle = "#fef08a";
      ctx.font = "900 22px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("POP! 💥", cx, neckTopY - 82);
    }
  }
}

function drawExp2Micro(dt) {
  const { ctx, w, h } = e2Micro;
  ctx.clearRect(0, 0, w, h);

  const step = exp2.step;
  const now = performance.now();

  if (step >= 2) {
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(20, h - 72, w - 40, 44);
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ALUMINUM (Al) ATOMS", w / 2, h - 45);

    if (step === 2) {
      const shieldAlpha = Math.max(0.18, 1 - exp2.stepTime * 0.45);
      ctx.fillStyle = `rgba(100, 116, 139, ${shieldAlpha})`;
      ctx.fillRect(20, h - 88, w - 40, 16);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText("HCl dissolves Al₂O₃ shield", w / 2, h - 76);
    }
  }

  exp2.microIons.forEach((ion) => {
    ion.x += ion.vx;
    ion.y += ion.vy;
    if (ion.x < 35 || ion.x > w - 35) ion.vx *= -1;
    if (ion.y < 58 || ion.y > h - 125) ion.vy *= -1;

    if (step >= 3 && !ion.converted && Math.random() < 0.015) {
      ion.converted = true;
      exp2.microElectrons.push({ x: ion.x, y: h - 76, tx: ion.x, ty: ion.y, p: 0 });
    }

    const isCopperMetal = step >= 3 && ion.converted;
    ctx.fillStyle = isCopperMetal ? "#d97706" : step >= 2 ? "#2dd4bf" : "#38bdf8";
    ctx.beginPath();
    ctx.arc(ion.x, ion.y, isCopperMetal ? 12 : 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#04121d";
    ctx.font = "bold 9.5px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isCopperMetal ? "Cu" : step >= 2 ? "CuCl₄" : "Cu²⁺", ion.x, ion.y + 3);
  });

  if (step >= 3) {
    if (Math.random() < 0.16) {
      exp2.microH2.push({
        x: 50 + Math.random() * (w - 100),
        y: h - 92,
        vy: 1.55 + Math.random() * 1.2,
      });
    }

    exp2.microElectrons = exp2.microElectrons.filter((e) => e.p < 1);
    exp2.microElectrons.forEach((e) => {
      e.p += dt * 1.8;
      const ex = lerp(e.x, e.tx, e.p);
      const ey = lerp(e.y, e.ty, e.p);
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(ex, ey, 4.8, 0, Math.PI * 2);
      ctx.fill();
    });

    exp2.microH2 = exp2.microH2.filter((m) => m.y > -20);
    exp2.microH2.forEach((m, idx) => {
      m.y -= m.vy;
      if (step === 4 && m.y < 120) {
        exp2.microFlashes.push({ x: m.x, y: m.y, life: 1 });
        m.y = -30;
      }
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(m.x - 5.5, m.y, 5.8, 0, Math.PI * 2);
      ctx.arc(m.x + 5.5, m.y, 5.8, 0, Math.PI * 2);
      ctx.fill();
      if (idx % 4 === 0) {
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("H₂", m.x, m.y - 10);
      }
    });
  }

  if (step === 4) {
    exp2.microFlashes = exp2.microFlashes.filter((f) => f.life > 0.05);
    exp2.microFlashes.forEach((f) => {
      f.life -= 0.04;
      ctx.fillStyle = `rgba(251, 146, 60, ${f.life})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, (1 - f.life) * 26 + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(125, 211, 252, ${f.life})`;
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("H₂O", f.x, f.y + 4);
    });

    [95, w / 2, w - 95].forEach((ox, i) => {
      const oy = 78 + Math.sin(now * 0.004 + i) * 8;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(ox - 6.5, oy, 6.2, 0, Math.PI * 2);
      ctx.arc(ox + 6.5, oy, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("O₂", ox, oy - 11);
    });
  }
}

// =====================================================
// KEYBOARD SHORTCUTS FOR LIVE PRESENTER
// =====================================================
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;

  if (e.code === "Space") {
    e.preventDefault();
    const exp2Rect = document.getElementById("exp2").getBoundingClientRect();
    if (exp2Rect.top < window.innerHeight * 0.55 && exp2Rect.bottom > 120) {
      exp2AutoBtn.click();
    } else {
      triggerExp1();
    }
  } else if (e.code === "ArrowRight") {
    stopAutoExp2();
    setExp2Step(exp2.step < 4 ? exp2.step + 1 : 1);
  } else if (e.code === "ArrowLeft") {
    stopAutoExp2();
    setExp2Step(exp2.step > 1 ? exp2.step - 1 : 4);
  }
});

// =====================================================
// MAIN ANIMATION LOOP
// =====================================================
let lastTs = performance.now();
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  drawExp1Macro(dt);
  drawExp1Micro();
  drawExp2Macro(dt);
  drawExp2Micro(dt);
  requestAnimationFrame(loop);
}

initExp1Particles();
initExp2Particles();
setExp2Step(1);
requestAnimationFrame(loop);
