import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ===== Cờ Tướng v3 — 100 cấp độ · Bộ đếm thời gian · Giải thưởng lũy thừa · localStorage =====

const COLS = 9;
const ROWS = 10;

// Phần thưởng: cấp n = 1.000.000 × 1,1^n
// → cấp 1 = 1.000.000 × 1,1¹ = 1.100.000₫ (đúng 1,1 triệu như đề bài)
// → cấp 2 = ×1,1² ; cấp 3 = ×1,1³ ; ... cấp 10 = ×1,1¹⁰ ; ... cấp 100 = ×1,1¹⁰⁰
// Đây chính là "tăng theo lũy thừa 1 2 3 4 5 6 7 8 9 10..." — số mũ = số cấp độ
const REWARD_UNIT = 1_000_000;
const REWARD_BASE = 1.1;
function getReward(level) {
  const lvl = Math.max(1, Math.min(100, level));
  return Math.round(REWARD_UNIT * Math.pow(REWARD_BASE, lvl));
}

function formatReward(vnd) {
  if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(2)} tỷ`;
  if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(1)} triệu`;
  return `${vnd.toLocaleString("vi-VN")} ₫`;
}

const initialBoard = () => {
  const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const back = ["r", "n", "b", "a", "k", "a", "b", "n", "r"];
  back.forEach((t, c) => (b[0][c] = { type: t, side: "b" }));
  b[2][1] = { type: "c", side: "b" };
  b[2][7] = { type: "c", side: "b" };
  [0, 2, 4, 6, 8].forEach((c) => (b[3][c] = { type: "p", side: "b" }));
  back.forEach((t, c) => (b[9][c] = { type: t, side: "r" }));
  b[7][1] = { type: "c", side: "r" };
  b[7][7] = { type: "c", side: "r" };
  [0, 2, 4, 6, 8].forEach((c) => (b[6][c] = { type: "p", side: "r" }));
  return b;
};

const PIECE_LABEL = {
  r: { r: "俥", b: "車" },
  n: { r: "傌", b: "馬" },
  b: { r: "相", b: "象" },
  a: { r: "仕", b: "士" },
  k: { r: "帥", b: "將" },
  c: { r: "炮", b: "砲" },
  p: { r: "兵", b: "卒" },
};

const VALUE = { k: 10000, r: 90, c: 45, n: 40, b: 20, a: 20, p: 10 };

function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }
function inPalace(r, c, side) {
  if (c < 3 || c > 5) return false;
  return side === "r" ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
}
function crossedRiver(r, side) { return side === "r" ? r <= 4 : r >= 5; }

function getMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const { type, side } = piece;
  const moves = [];
  const enemy = side === "r" ? "b" : "r";

  const push = (nr, nc) => {
    if (!inBounds(nr, nc)) return false;
    const target = board[nr][nc];
    if (!target) { moves.push([nr, nc]); return true; }
    else if (target.side === enemy) { moves.push([nr, nc]); return false; }
    return false;
  };

  if (type === "k") {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
      const nr = r+dr, nc = c+dc;
      if (inPalace(nr,nc,side)) { const t=board[nr][nc]; if(!t||t.side===enemy) moves.push([nr,nc]); }
    });
  } else if (type === "a") {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => {
      const nr=r+dr, nc=c+dc;
      if (inPalace(nr,nc,side)) { const t=board[nr][nc]; if(!t||t.side===enemy) moves.push([nr,nc]); }
    });
  } else if (type === "b") {
    [[-2,-2],[-2,2],[2,-2],[2,2]].forEach(([dr,dc]) => {
      const nr=r+dr, nc=c+dc;
      const mr=r+dr/2, mc=c+dc/2;
      if(!inBounds(nr,nc)) return;
      if(crossedRiver(nr,side)) return;
      if(board[mr][mc]) return;
      const t=board[nr][nc]; if(!t||t.side===enemy) moves.push([nr,nc]);
    });
  } else if (type === "n") {
    [[-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],[-1,-2,0,-1],[1,-2,0,-1],[-1,2,0,1],[1,2,0,1]].forEach(([dr,dc,br,bc]) => {
      const nr=r+dr, nc=c+dc;
      if(!inBounds(nr,nc)) return;
      if(board[r+br][c+bc]) return;
      const t=board[nr][nc]; if(!t||t.side===enemy) moves.push([nr,nc]);
    });
  } else if (type === "r") {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
      let nr=r+dr, nc=c+dc;
      while(inBounds(nr,nc)) { if(!push(nr,nc)) break; nr+=dr; nc+=dc; }
    });
  } else if (type === "c") {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
      let nr=r+dr, nc=c+dc, jumped=false;
      while(inBounds(nr,nc)) {
        const t=board[nr][nc];
        if(!jumped) { if(!t) moves.push([nr,nc]); else jumped=true; }
        else { if(t) { if(t.side===enemy) moves.push([nr,nc]); break; } }
        nr+=dr; nc+=dc;
      }
    });
  } else if (type === "p") {
    const fwd=side==="r"?-1:1;
    const nr=r+fwd;
    if(inBounds(nr,c)) { const t=board[nr][c]; if(!t||t.side===enemy) moves.push([nr,c]); }
    if(crossedRiver(r,side)) {
      [[r,c-1],[r,c+1]].forEach(([sr,sc]) => {
        if(inBounds(sr,sc)) { const t=board[sr][sc]; if(!t||t.side===enemy) moves.push([sr,sc]); }
      });
    }
  }
  return moves;
}

function getAllMoves(board, side) {
  const all = [];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    const p=board[r][c];
    if(p&&p.side===side) getMoves(board,r,c).forEach(([nr,nc]) => all.push({from:[r,c],to:[nr,nc]}));
  }
  return all;
}

function applyMove(board, move) {
  const nb=board.map(row=>row.slice());
  const [fr,fc]=move.from, [tr,tc]=move.to;
  const captured=nb[tr][tc];
  nb[tr][tc]=nb[fr][fc]; nb[fr][fc]=null;
  return {board:nb, captured};
}

function evaluate(board, side) {
  let score=0;
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    const p=board[r][c]; if(!p) continue;
    let v=VALUE[p.type];
    if(p.type==="p"&&crossedRiver(r,p.side)) v+=8;
    score+=p.side===side?v:-v;
  }
  return score;
}

function hasKing(board, side) {
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    if(board[r][c]&&board[r][c].type==="k"&&board[r][c].side===side) return true;
  return false;
}

function negamax(board, depth, side, alpha, beta) {
  const opp=side==="r"?"b":"r";
  if(!hasKing(board,opp)) return 100000;
  if(!hasKing(board,side)) return -100000;
  if(depth===0) return evaluate(board,side);
  const moves=getAllMoves(board,side);
  if(moves.length===0) return -50000;
  moves.sort((a,b)=>{ const ac=board[a.to[0]][a.to[1]]?1:0, bc=board[b.to[0]][b.to[1]]?1:0; return bc-ac; });
  let best=-Infinity;
  for(const move of moves) {
    const {board:nb}=applyMove(board,move);
    const score=-negamax(nb,depth-1,opp,-beta,-alpha);
    if(score>best) best=score;
    if(best>alpha) alpha=best;
    if(alpha>=beta) break;
  }
  return best;
}

function getLevelConfig(level) {
  const lvl=Math.max(1,Math.min(100,level));
  let depth;
  if(lvl<=20) depth=1;
  else if(lvl<=45) depth=2;
  else if(lvl<=75) depth=3;
  else depth=4;
  const noise=Math.max(0,(100-lvl))*1.1;
  const blunderChance=lvl<=25?Math.max(0,(26-lvl)/26)*0.35:0;
  return {depth,noise,blunderChance};
}

function levelLabel(level) {
  if(level<=10) return "Tập sự";
  if(level<=20) return "Mới học";
  if(level<=35) return "Nghiệp dư";
  if(level<=50) return "Khá";
  if(level<=65) return "Giỏi";
  if(level<=80) return "Cao thủ";
  if(level<=92) return "Đại sư";
  return "Kỳ vương";
}

// Mỗi cấp độ được tính/gán theo 1 màu riêng (8 bậc màu, khớp với BẢN ĐỒ CẤP ĐỘ bên dưới)
function levelColor(level) {
  if(level<=10) return "#6ab04c";  // Tập sự — xanh lá
  if(level<=20) return "#badc58";  // Mới học — xanh chanh
  if(level<=35) return "#f9ca24";  // Nghiệp dư — vàng
  if(level<=50) return "#f0932b";  // Khá — cam
  if(level<=65) return "#eb4d4b";  // Giỏi — đỏ cam
  if(level<=80) return "#be2edd";  // Cao thủ — tím
  if(level<=92) return "#e056fd";  // Đại sư — hồng tím
  return "#fdcb6e";                // Kỳ vương — vàng kim
}

function pickAiMove(board, side, level) {
  const opp=side==="r"?"b":"r";
  const {depth,noise,blunderChance}=getLevelConfig(level);
  const moves=getAllMoves(board,side);
  if(moves.length===0) return null;
  if(Math.random()<blunderChance) return moves[Math.floor(Math.random()*moves.length)];
  moves.sort((a,b)=>{ const ac=board[a.to[0]][a.to[1]]?1:0, bc=board[b.to[0]][b.to[1]]?1:0; return bc-ac; });
  let best=-Infinity, bestMove=moves[0], alpha=-Infinity;
  for(const move of moves) {
    const {board:nb}=applyMove(board,move);
    let score=-negamax(nb,depth-1,opp,-Infinity,-alpha);
    score+=(Math.random()*2-1)*noise;
    if(score>best) { best=score; bestMove=move; }
    if(best>alpha) alpha=best;
  }
  return bestMove;
}

// ===== Timer hook =====
function useTimer(active, onExpire) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if(active) {
      ref.current = setInterval(() => setSeconds(s => s+1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [active]);
  const reset = useCallback(() => setSeconds(0), []);
  return { seconds, reset };
}

function formatTime(s) {
  const m=Math.floor(s/60).toString().padStart(2,"0");
  const sec=(s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}

// ===== Main Component =====
export default function XiangqiV3() {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState("r");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [captured, setCaptured] = useState({ r: [], b: [] });
  const [winner, setWinner] = useState(null);
  const [mode, setMode] = useState("ai");
  const [level, setLevel] = useState(() => {
    try { const s = localStorage.getItem("ct_level"); return s ? Math.max(1, Math.min(100, Number(s))) : 1; }
    catch { return 1; }
  });
  const [aiThinking, setAiThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRewardPop, setShowRewardPop] = useState(false);
  const [completedLevels, setCompletedLevels] = useState(() => {
    try { const s = localStorage.getItem("ct_completed"); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [showLevelMap, setShowLevelMap] = useState(false);
  // Persist progress to localStorage
  useEffect(() => {
    try { localStorage.setItem("ct_completed", JSON.stringify(completedLevels)); } catch {}
  }, [completedLevels]);
  useEffect(() => {
    try { localStorage.setItem("ct_level", String(level)); } catch {}
  }, [level]);

  const aiSide = "b";
  const boardRef = useRef(board);
  boardRef.current = board;

  const cellSize = 52;
  const boardW = cellSize * (COLS-1);
  const boardH = cellSize * (ROWS-1);
  const pad = 30;

  const { seconds, reset: resetTimer } = useTimer(gameStarted && !winner, null);

  const legalMoves = useMemo(() => {
    if(!selected) return [];
    return getMoves(board, selected[0], selected[1]);
  }, [selected, board]);

  function doMove(fr, fc, tr, tc) {
    const currentTurn = turn;
    const newBoard = board.map(r => r.slice());
    const moved = newBoard[fr][fc];
    const cap = newBoard[tr][tc];
    newBoard[tr][tc] = moved;
    newBoard[fr][fc] = null;
    if(cap) {
      setCaptured(prev => ({ ...prev, [cap.side]: [...prev[cap.side], cap] }));
      if(cap.type === "k") {
        setWinner(currentTurn);
        setGameStarted(false);
        if(currentTurn === "r" && mode === "ai") {
          setCompletedLevels(prev => prev.includes(level) ? prev : [...prev, level]);
          setShowRewardPop(true);
        }
      }
    }
    setBoard(newBoard);
    setHistory(h => [...h, `${currentTurn==="r"?"Đỏ":"Đen"}: ${PIECE_LABEL[moved.type][moved.side]} (${fc},${fr})→(${tc},${tr})`]);
    setSelected(null);
    setTurn(currentTurn === "r" ? "b" : "r");
  }

  function handleClick(r, c) {
    if(winner || aiThinking) return;
    if(mode === "ai" && turn === aiSide) return;
    const piece = board[r][c];
    if(selected) {
      const [sr, sc] = selected;
      const isLegal = legalMoves.some(([mr,mc]) => mr===r && mc===c);
      if(isLegal) { doMove(sr,sc,r,c); return; }
      if(piece && piece.side === turn) { setSelected([r,c]); }
      else { setSelected(null); }
    } else if(piece && piece.side === turn) {
      setSelected([r,c]);
    }
  }

  useEffect(() => {
    if(mode !== "ai" || winner || turn !== aiSide) return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const move = pickAiMove(boardRef.current, aiSide, level);
      setAiThinking(false);
      if(!move) { setWinner("r"); return; }
      doMove(move.from[0], move.from[1], move.to[0], move.to[1]);
    }, 400);
    return () => clearTimeout(t);
  }, [turn, mode, winner, level]);

  function reset(newLevel) {
    setBoard(initialBoard());
    setTurn("r");
    setSelected(null);
    setHistory([]);
    setCaptured({ r:[], b:[] });
    setWinner(null);
    setAiThinking(false);
    setShowRewardPop(false);
    setGameStarted(true);
    resetTimer();
    if(newLevel !== undefined) setLevel(newLevel);
  }

  const reward = getReward(level);
  const lColor = levelColor(level);

  // Stars for completed levels
  const starsEarned = completedLevels.length;

  return (
    <div style={{
      minHeight:"100vh", width:"100%",
      maxWidth:"100vw",
      overflowX:"hidden",
      boxSizing:"border-box",
      background:"linear-gradient(160deg,#0d0a08 0%,#1a1108 50%,#0d0a08 100%)",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"20px 10px 40px",
      fontFamily:"'Noto Serif SC','Songti SC',serif",
      color:"#e8dcc4",
    }}>

      {/* Brand banner */}
      <div style={{ textAlign:"center", marginBottom:6 }}>
        <div style={{
          display:"inline-block", fontSize:13, letterSpacing:5, fontWeight:700,
          color:"#0d0a08", background:"linear-gradient(135deg,#f3d68a,#d8b872 55%,#b5883f)",
          padding:"4px 18px", borderRadius:3, boxShadow:"0 2px 10px rgba(216,184,114,0.35)",
        }}>
          ĐỨC LỢI
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <div style={{ fontSize:"clamp(9px,2.6vw,11px)", letterSpacing:"clamp(2px,1vw,6px)", color:"#7a6540", marginBottom:2 }}>VERSION 3.0</div>
        <h1 style={{ fontSize:"clamp(20px,7vw,28px)", letterSpacing:"clamp(1px,1vw,4px)", margin:0, color:"#d8b872", fontWeight:700, textShadow:"0 0 20px rgba(216,184,114,0.4)" }}>
          棋 CỜ TƯỚNG 局
        </h1>
        <div style={{ fontSize:"clamp(9px,2.4vw,11px)", letterSpacing:"clamp(1px,0.8vw,3px)", color:"#6a5530", marginTop:2 }}>100 CẤP ĐỘ · GIẢI THƯỞNG LŨY THỪA</div>
      </div>

      {/* Stats bar */}
      <div style={{
        display:"flex", gap:16, marginBottom:14, flexWrap:"wrap", justifyContent:"center",
        background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"10px 18px",
        border:"1px solid rgba(216,184,114,0.15)",
      }}>
        <StatBox label="Cấp độ" value={`${level}/100`} color={lColor} />
        <StatBox label="Danh hiệu" value={levelLabel(level)} color={lColor} />
        <StatBox label="Giải thưởng" value={formatReward(reward)} color="#f9ca24" note="Tượng trưng" />
        <StatBox label="Thời gian" value={formatTime(seconds)} color="#74b9ff" />
        <StatBox label="Cấp đã thắng" value={`${starsEarned}/100`} color="#6ab04c" />
      </div>

      {/* Mode switch */}
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", justifyContent:"center" }}>
        <div style={{ display:"flex", borderRadius:20, overflow:"hidden", border:"1px solid #5a4629" }}>
          {[{ key:"ai", label:"Đấu với máy" }, { key:"2p", label:"2 người chơi" }].map(m => (
            <button key={m.key} onClick={() => { setMode(m.key); reset(); }}
              style={{ padding:"6px 16px", fontSize:12, letterSpacing:1, border:"none", cursor:"pointer",
                fontFamily:"inherit",
                background:mode===m.key?"#d8b872":"transparent",
                color:mode===m.key?"#241a13":"#e8dcc4",
                fontWeight:mode===m.key?700:400 }}>
              {m.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowLevelMap(v => !v)}
          style={{ padding:"6px 16px", fontSize:12, letterSpacing:1, border:"1px solid #5a4629",
            borderRadius:20, cursor:"pointer", fontFamily:"inherit",
            background:showLevelMap?"#a3231f":"transparent", color:"#e8dcc4" }}>
          {showLevelMap ? "Ẩn bản đồ" : "🗺 Bản đồ cấp độ"}
        </button>
      </div>

      {/* Level map */}
      {showLevelMap && (
        <LevelMap currentLevel={level} completedLevels={completedLevels}
          onSelect={l => { setShowLevelMap(false); reset(l); }} />
      )}

      {/* Level slider (AI mode) */}
      {mode === "ai" && !showLevelMap && (
        <div style={{ width:"100%", maxWidth:440, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
            <span style={{ opacity:0.7 }}>Cấp độ máy</span>
            <span style={{ color:lColor, fontWeight:700, fontSize:13 }}>
              {level} · {levelLabel(level)} · {formatReward(reward)}
            </span>
          </div>
          {/* Reward progress bar */}
          <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${level}%`, background:`linear-gradient(90deg, #6ab04c, ${lColor})`, transition:"width 0.3s", borderRadius:2 }} />
          </div>
          <input type="range" min={1} max={100} value={level}
            onChange={e => setLevel(Number(e.target.value))}
            onMouseUp={() => reset()} onTouchEnd={() => reset()}
            style={{ width:"100%", accentColor:lColor }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, opacity:0.4, marginTop:2 }}>
            <span>1 · Tập sự</span><span>25 · Nghiệp dư</span><span>50 · Khá</span><span>75 · Cao thủ</span><span>100 · Kỳ vương</span>
          </div>
        </div>
      )}

      {/* Status line */}
      <div style={{ fontSize:13, marginBottom:14, minHeight:20, textAlign:"center" }}>
        {winner ? (
          <span style={{ color: winner==="r" ? "#eb4d4b" : "#d8b872", fontWeight:700 }}>
            {winner==="r" ? "🏆 ĐỎ THẮNG" : "⚫ ĐEN THẮNG"} — Tướng đã bị bắt · {formatTime(seconds)}
          </span>
        ) : aiThinking ? (
          <span style={{ color:"#74b9ff" }}>🤖 Máy đang suy nghĩ…</span>
        ) : (
          <span style={{ opacity:0.75 }}>
            Lượt đi: <strong style={{ color:turn==="r"?"#eb4d4b":"#d8b872" }}>{turn==="r"?"ĐỎ":mode==="ai"?"ĐEN (Máy)":"ĐEN"}</strong>
          </span>
        )}
      </div>

      {/* Board */}
      <div style={{
        position:"relative",
        width:"100%",
        maxWidth: boardW + pad*2,
        boxSizing:"border-box",
        margin:"0 auto",
        background:"radial-gradient(circle at 30% 20%,#e8c98a 0%,#d4ab5f 45%,#b5883f 100%)",
        borderRadius:6, padding:"clamp(10px, 4.5vw, 30px)",
        boxShadow:`0 18px 50px rgba(0,0,0,0.7), 0 0 0 2px ${lColor}55, inset 0 0 0 2px rgba(60,30,10,0.35), inset 0 0 30px rgba(80,40,10,0.25)`,
        opacity:aiThinking?0.88:1, transition:"opacity 0.2s, box-shadow 0.3s",
        userSelect:"none", WebkitUserSelect:"none", WebkitTouchCallout:"none",
      }}>
        <svg viewBox={`0 0 ${boardW} ${boardH}`} width="100%" height="auto"
          style={{ display:"block", maxWidth:"100%", overflow:"visible", touchAction:"manipulation" }}>
          {/* Grid lines */}
          {Array.from({length:ROWS}).map((_,r) => (
            <line key={"h"+r} x1={0} y1={r*cellSize} x2={boardW} y2={r*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
          ))}
          {Array.from({length:COLS}).map((_,c) => {
            if(c===0||c===COLS-1) return <line key={"v"+c} x1={c*cellSize} y1={0} x2={c*cellSize} y2={boardH} stroke="#5a3a1a" strokeWidth={1.4} />;
            return (
              <g key={"v"+c}>
                <line x1={c*cellSize} y1={0} x2={c*cellSize} y2={4*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
                <line x1={c*cellSize} y1={5*cellSize} x2={c*cellSize} y2={9*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
              </g>
            );
          })}
          {/* Palace diagonals */}
          <line x1={3*cellSize} y1={0} x2={5*cellSize} y2={2*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
          <line x1={5*cellSize} y1={0} x2={3*cellSize} y2={2*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
          <line x1={3*cellSize} y1={7*cellSize} x2={5*cellSize} y2={9*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
          <line x1={5*cellSize} y1={7*cellSize} x2={3*cellSize} y2={9*cellSize} stroke="#5a3a1a" strokeWidth={1.4} />
          {/* River text */}
          <text x={boardW/2-78} y={4.5*cellSize+6} fontSize={18} fill="#5a3a1a" fontWeight="600">楚河</text>
          <text x={boardW/2+20} y={4.5*cellSize+6} fontSize={18} fill="#5a3a1a" fontWeight="600">漢界</text>
          {/* Legal move highlights */}
          {legalMoves.map(([r,c],i) => (
            <circle key={i} cx={c*cellSize} cy={r*cellSize} r={8}
              fill={board[r][c]?"rgba(180,40,30,0.55)":"rgba(60,120,60,0.55)"} />
          ))}
          {/* Click zones */}
          {Array.from({length:ROWS}).map((_,r) =>
            Array.from({length:COLS}).map((_,c) => (
              <rect key={`cl-${r}-${c}`} x={c*cellSize-cellSize/2} y={r*cellSize-cellSize/2}
                width={cellSize} height={cellSize} fill="transparent"
                onClick={() => handleClick(r,c)} style={{ cursor:"pointer" }} />
            ))
          )}
          {/* Pieces */}
          {board.map((row,r) => row.map((piece,c) => {
            if(!piece) return null;
            const isSel = selected && selected[0]===r && selected[1]===c;
            return (
              <g key={`p-${r}-${c}`} transform={`translate(${c*cellSize},${r*cellSize})`}
                onClick={() => handleClick(r,c)} style={{ cursor:"pointer" }}>
                {isSel && <circle r={26} fill="rgba(63,174,92,0.25)" />}
                <circle r={21} fill={piece.side==="r"?"#fdf3df":"#2b241c"}
                  stroke={isSel?"#3fae5c":piece.side==="r"?"#a3231f":"#c9a24a"}
                  strokeWidth={isSel?3.5:2.5} />
                <circle r={17.5} fill="none" stroke={piece.side==="r"?"#a3231f":"#c9a24a"} strokeWidth={1} opacity={0.6} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight="700"
                  fill={piece.side==="r"?"#a3231f":"#d8b872"}>
                  {PIECE_LABEL[piece.type][piece.side]}
                </text>
              </g>
            );
          }))}
        </svg>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap", justifyContent:"center" }}>
        <Btn onClick={() => reset()} color="#d8b872" textColor="#241a13">VÁN MỚI</Btn>
        {mode==="ai" && level < 100 && (
          <Btn onClick={() => reset(level+1)} color="#a3231f" textColor="#fff">
            CẤP {level+1} →
          </Btn>
        )}
        {mode==="ai" && level > 1 && (
          <Btn onClick={() => reset(level-1)} color="#3d3020" textColor="#e8dcc4">
            ← CẤP {level-1}
          </Btn>
        )}
      </div>

      {/* Captured pieces */}
      <div style={{ display:"flex", gap:24, marginTop:20, maxWidth:500, width:"100%" }}>
        <CaptureBox label="QUÂN ĐỎ MẤT" pieces={captured.r} color="#a3231f" />
        <CaptureBox label="QUÂN ĐEN MẤT" pieces={captured.b} color="#d8b872" />
      </div>

      {/* Move history */}
      {history.length > 0 && (
        <div style={{ marginTop:20, maxWidth:480, width:"100%", maxHeight:120, overflowY:"auto",
          background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"10px 14px",
          border:"1px solid rgba(216,184,114,0.1)", fontSize:11, opacity:0.6, lineHeight:1.8 }}>
          {[...history].reverse().map((h,i) => <div key={i}>{h}</div>)}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:28, fontSize:10, letterSpacing:2, color:"#5a4629", textAlign:"center" }}>
        © {new Date().getFullYear()} ĐỨC LỢI · cotuong.678.vn
      </div>

      {/* Reward popup */}
      {showRewardPop && (
        <RewardPopup level={level} reward={reward}
          time={seconds}
          onNext={() => { if(level<100) reset(level+1); else { setShowRewardPop(false); } }}
          onClose={() => setShowRewardPop(false)} />
      )}
    </div>
  );
}

// ===== Sub-components =====

function StatBox({ label, value, color, note }) {
  return (
    <div style={{ textAlign:"center", minWidth:80 }}>
      <div style={{ fontSize:9, letterSpacing:2, opacity:0.5, marginBottom:2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:13, fontWeight:700, color: color || "#e8dcc4" }}>{value}</div>
      {note && <div style={{ fontSize:8, letterSpacing:1, opacity:0.45, marginTop:2, color: color || "#e8dcc4" }}>{note.toUpperCase()}</div>}
    </div>
  );
}

function Btn({ onClick, color, textColor, children }) {
  return (
    <button onClick={onClick} style={{
      background:color, color:textColor, border:"none",
      padding:"9px 20px", borderRadius:4, fontWeight:700,
      letterSpacing:1, cursor:"pointer", fontFamily:"'Noto Serif SC',serif",
      fontSize:12, transition:"opacity 0.15s",
    }}
    onMouseEnter={e => e.target.style.opacity="0.85"}
    onMouseLeave={e => e.target.style.opacity="1"}>
      {children}
    </button>
  );
}

function CaptureBox({ label, pieces, color }) {
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontSize:10, opacity:0.5, letterSpacing:2, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:17, minHeight:22, lineHeight:1.4 }}>
        {pieces.map((p,i) => (
          <span key={i} style={{ marginRight:5, color }}>{PIECE_LABEL[p.type][p.side]}</span>
        ))}
      </div>
    </div>
  );
}

function LevelMap({ currentLevel, completedLevels, onSelect }) {
  const TIERS = [
    { name:"Tập sự", range:[1,10], color:"#6ab04c" },
    { name:"Mới học", range:[11,20], color:"#badc58" },
    { name:"Nghiệp dư", range:[21,35], color:"#f9ca24" },
    { name:"Khá", range:[36,50], color:"#f0932b" },
    { name:"Giỏi", range:[51,65], color:"#eb4d4b" },
    { name:"Cao thủ", range:[66,80], color:"#be2edd" },
    { name:"Đại sư", range:[81,92], color:"#e056fd" },
    { name:"Kỳ vương", range:[93,100], color:"#fdcb6e" },
  ];

  return (
    <div style={{ width:"100%", maxWidth:500, marginBottom:16,
      background:"rgba(0,0,0,0.4)", borderRadius:10, padding:16,
      border:"1px solid rgba(216,184,114,0.15)" }}>
      <div style={{ fontSize:12, letterSpacing:3, color:"#d8b872", marginBottom:12, textAlign:"center" }}>
        BẢN ĐỒ CẤP ĐỘ
      </div>
      {TIERS.map(tier => (
        <div key={tier.name} style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, color:tier.color, letterSpacing:2, marginBottom:5, opacity:0.8 }}>
            {tier.name} · Cấp {tier.range[0]}–{tier.range[1]}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {Array.from({length:tier.range[1]-tier.range[0]+1},(_,i) => tier.range[0]+i).map(lvl => {
              const done = completedLevels.includes(lvl);
              const isCur = lvl === currentLevel;
              return (
                <button key={lvl} onClick={() => onSelect(lvl)} title={`Cấp ${lvl} · ${formatReward(getReward(lvl))}`}
                  style={{
                    width:28, height:28, borderRadius:4, border:isCur?`2px solid ${tier.color}`:"1px solid rgba(255,255,255,0.1)",
                    background: done?"rgba(106,176,76,0.3)":isCur?`rgba(${hexToRgb(tier.color)},0.2)`:"rgba(255,255,255,0.04)",
                    color: done?"#6ab04c":isCur?tier.color:"rgba(255,255,255,0.4)",
                    fontSize:9, fontWeight:isCur?700:400, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                  {done?"★":lvl}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function RewardPopup({ level, reward, time, onNext, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000, padding:16,
      boxSizing:"border-box",
    }} onClick={onClose}>
      <div style={{
        background:"linear-gradient(135deg,#1a1108,#241a13)",
        border:"2px solid #d8b872", borderRadius:16,
        padding:"clamp(22px,6vw,36px) clamp(18px,6vw,44px)",
        textAlign:"center", width:"100%", maxWidth:360, boxSizing:"border-box",
        boxShadow:"0 20px 60px rgba(0,0,0,0.8)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:48, marginBottom:8 }}>🏆</div>
        <div style={{ fontSize:22, color:"#d8b872", fontWeight:700, marginBottom:4 }}>
          Thắng Cấp {level}!
        </div>
        <div style={{ fontSize:12, color:"#6a5530", marginBottom:20, letterSpacing:2 }}>
          {levelLabel(level).toUpperCase()} · {formatTime(time)}
        </div>
        <div style={{ background:"rgba(216,184,114,0.08)", borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ fontSize:11, opacity:0.6, marginBottom:4 }}>PHẦN THƯỞNG</div>
          <div style={{ fontSize:30, color:"#f9ca24", fontWeight:700 }}>{formatReward(reward)}</div>
          <div style={{ fontSize:9, opacity:0.4, marginTop:6, letterSpacing:1 }}>
            GIẢI THƯỞNG TƯỢNG TRƯNG · KHÔNG PHẢI TIỀN THẬT
          </div>
        </div>
        {level < 100 && (
          <div style={{ fontSize:11, opacity:0.5, marginBottom:16 }}>
            Cấp tiếp theo: {formatReward(getReward(level+1))}
          </div>
        )}
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          {level < 100 && (
            <button onClick={onNext} style={{
              background:"#d8b872", color:"#241a13", border:"none",
              padding:"10px 22px", borderRadius:6, fontWeight:700, cursor:"pointer",
              fontFamily:"'Noto Serif SC',serif", fontSize:13,
            }}>
              Cấp {level+1} →
            </button>
          )}
          <button onClick={onClose} style={{
            background:"transparent", color:"#e8dcc4", border:"1px solid #5a4629",
            padding:"10px 22px", borderRadius:6, fontWeight:400, cursor:"pointer",
            fontFamily:"'Noto Serif SC',serif", fontSize:13,
          }}>
            Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
}
