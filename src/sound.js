// ===== Âm thanh trong game — tổng hợp bằng Web Audio API =====
// Không dùng file mp3/wav ngoài (nhẹ, không lỗi bản quyền, chạy tốt offline khi là PWA).
// "Nhiều cấp độ âm thanh": mỗi loại hành động (chọn quân / đi quân / ăn quân / chiếu tướng /
// thắng / thua / lên cấp) có một "giai điệu" riêng, và cao độ còn được co giãn nhẹ theo
// cấp độ máy đang chơi (1–100) để cảm giác "nặng/nhẹ" tay đổi theo cấp.

let ctx = null;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

let muted = false;
try {
  muted = localStorage.getItem("ct_muted") === "1";
} catch {
  /* ignore */
}

export function isMuted() {
  return muted;
}
export function setMuted(v) {
  muted = v;
  try {
    localStorage.setItem("ct_muted", v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function tone(freq, start, dur, type = "sine", peak = 0.16) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(peak, c.currentTime + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.03);
  } catch {
    /* ignore */
  }
}

// Cấp càng cao → cao độ nhích lên tối đa ~35%, tạo cảm giác "gấp gáp" hơn ở cấp khó
function pitchForLevel(level, base) {
  const t = Math.max(0, Math.min(1, (Number(level) - 1) / 99));
  return base * (1 + t * 0.35);
}

export function playSelect(level = 1) {
  tone(pitchForLevel(level, 560), 0, 0.055, "triangle", 0.09);
}

export function playMove(level = 1) {
  const f = pitchForLevel(level, 300);
  tone(f, 0, 0.09, "sine", 0.15);
  tone(f * 1.5, 0.035, 0.07, "sine", 0.08);
}

export function playCapture(level = 1) {
  const f = pitchForLevel(level, 640);
  tone(f, 0, 0.05, "sawtooth", 0.14);
  tone(pitchForLevel(level, 260), 0.035, 0.15, "square", 0.12);
}

export function playCheck(level = 1) {
  const f = pitchForLevel(level, 880);
  tone(f, 0, 0.09, "square", 0.13);
  tone(f, 0.15, 0.09, "square", 0.13);
}

export function playWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.22, "triangle", 0.15));
}

export function playLose() {
  [392, 349.23, 293.66, 261.63].forEach((f, i) => tone(f, i * 0.13, 0.24, "sine", 0.13));
}

export function playLevelUp() {
  [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, i * 0.08, 0.16, "triangle", 0.14));
}
