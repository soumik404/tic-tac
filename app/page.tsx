'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import { sdk } from '@farcaster/miniapp-sdk'

type Cell = null | 'X' | 'O';
type Difficulty = 'easy' | 'medium' | 'hard';
type Score = { X: number; O: number; draw: number; };

interface WindowWithWebkit {
  webkitAudioContext?: typeof AudioContext;
}

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export default function Page() {
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        console.log("Mini app is ready ✅");
      } catch (err) {
        console.error("Error initializing SDK:", err);
      }
    };
    init();
  }, []);
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <Game />
      </div>
    </main>
  );
}

function Game() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X'|'O'>('X');
  const [status, setStatus] = useState('Your turn — you are X');
  const [stopped, setStopped] = useState(false);
  const [score, setScore] = useState<Score>({ X: 0, O: 0, draw: 0 });
  const [winningIndexes, setWinningIndexes] = useState<number[] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // sound / audio (same as before)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const userInteractedRef = useRef(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const w = checkWinner(board);
    if (w) {
      setStopped(true);
      if (w === 'draw') {
        setStatus('Draw');
        setScore(s => ({ ...s, draw: s.draw + 1 }));
        playDraw();
      } else {
        setStatus(`${w} wins`);
        // w is keyof Score so we can index safely
        setScore(s => ({ ...s, [w]: (s[w] as number) + 1 } as Score));
        const winLine = findWinningLine(board, w);
        setWinningIndexes(winLine ?? null);
        playWin();
      }
    } else {
      setStatus(turn === 'X' ? 'Your turn — X' : 'Bot thinking — O');
      setWinningIndexes(null);
    }
  }, [board, turn]);

  useEffect(() => {
    if (stopped) return;
    if (turn === 'O') {
      const t = setTimeout(() => {
        const move = botMove(board, difficulty);
        if (move !== -1) {
          const next = [...board];
          next[move] = 'O';
          setBoard(next);
          setTurn('X');
          playBotMove();
        }
      }, difficulty === 'easy' ? 300 : 420);
      return () => clearTimeout(t);
    }
  }, [turn, board, stopped, difficulty]);

  // initialize AudioContext lazily after user interaction
  function ensureAudio() {
    if (muted) return;
    if (audioCtxRef.current) return;
    try {
      const w = window as unknown as WindowWithWebkit;
      const Ctx = (window.AudioContext || w.webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctx) return;
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0.18;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    } catch {
      audioCtxRef.current = null;
      masterGainRef.current = null;
    }
  }

  function resumeIfNeeded() {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }

  function playTone(frequency: number, duration = 0.12, type: OscillatorType = 'sine', when = 0) {
    if (muted) return;
    const ctx = audioCtxRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.value = 0;
    o.connect(g);
    g.connect(gain);
    const now = ctx.currentTime + when;
    g.gain.linearRampToValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(1, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.start(now);
    o.stop(now + duration + 0.02);
  }

  // lightweight effect wrappers
  function playClick() { ensureAudio(); resumeIfNeeded(); playTone(880, 0.08, 'square'); }
  function playBotMove() { ensureAudio(); resumeIfNeeded(); playTone(520, 0.09, 'sawtooth'); }
  function playWin() { ensureAudio(); resumeIfNeeded(); playTone(660, 0.12, 'sine'); playTone(880, 0.14, 'sine', 0.12); }
  function playDraw() { ensureAudio(); resumeIfNeeded(); playTone(220, 0.18, 'triangle'); playTone(260, 0.12, 'triangle', 0.14); }
  function playReset() { ensureAudio(); resumeIfNeeded(); playTone(440, 0.08, 'sine'); }

  function handleToggleMute() {
    setMuted(m => {
      const next = !m;
      if (masterGainRef.current) masterGainRef.current.gain.value = next ? 0 : 0.18;
      return next;
    });
  }

  // difficulty change resets board for consistency
  function setLevel(level: Difficulty) {
    setDifficulty(level);
    resetBoard();
  }

  function clickCell(i: number) {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      ensureAudio();
      resumeIfNeeded();
    }

    if (stopped) return;
    if (turn !== 'X') return;
    if (board[i]) return;
    const next = [...board];
    next[i] = 'X';
    setBoard(next);
    setTurn('O');
    playClick();
  }

  function resetBoard() {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setStopped(false);
    setStatus('Your turn — X');
    setWinningIndexes(null);
    playReset();
  }

  function resetAll() {
    resetBoard();
    setScore({ X: 0, O: 0, draw: 0 });
  }

  return (
    <>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Tic Tac Toe</h2><br />
          <p className={styles.sub}>Play vs a bot — choose difficulty</p><br />
        </div>
</div>
<div className={styles.headerRow}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{display:'flex', gap:8}}>
            <button className={`btn ${difficulty==='easy'?'ghost':''}`} onClick={() => setLevel('easy')}>Easy</button>
            <button className={`btn ${difficulty==='medium'?'ghost':''}`} onClick={() => setLevel('medium')}>Medium</button>
            <button className={`btn ${difficulty==='hard'?'ghost':''}`} onClick={() => setLevel('hard')}>Hard</button>
          </div>

          <div className={styles.score}>
            <div className={styles.scoreItem}><strong>{score.X}</strong><span>Player</span></div>
            <div className={styles.scoreItem}><strong>{score.draw}</strong><span>Draws</span></div>
            <div className={styles.scoreItem}><strong>{score.O}</strong><span>Bot</span></div>
          </div>

          <button
            aria-pressed={muted}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className={`btn ${muted ? 'ghost' : ''}`}
            onClick={() => { handleToggleMute(); }}
            style={{padding:'6px 10px', fontSize:13}}
          >
            {muted ? 'Muted' : 'Sound'}
          </button>
        </div>
      </div>

      <div className={styles.board} role="grid" aria-label="tic tac toe board">
        {board.map((c, i) => {
          const isWin = winningIndexes?.includes(i);
          const classNames = [
            styles.cell,
            c ? (c === 'X' ? styles.markX : styles.markO) : '',
            isWin ? styles.win : ''
          ].join(' ');
          return (
            <button
              key={i}
              className={classNames}
              onClick={() => clickCell(i)}
              aria-label={`cell-${i}`}
            >
              <span className={styles.cellMark}>{c}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <div className={styles.status}>{status}</div>
        <div className={styles.actions}>
          <button className="btn" onClick={resetBoard}>Reset</button>
          <button className="btn ghost" onClick={resetAll}>Reset Score</button>
        </div>
      </div>
    </>
  );
}

/* helpers */
function checkWinner(b: Cell[]): 'X'|'O'|'draw'|null {
  for (const [a,b1,c] of LINES) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a] as 'X'|'O';
  }
  if (b.every(Boolean)) return 'draw';
  return null;
}

function findWinningLine(board: Cell[], player: 'X'|'O') {
  for (const line of LINES) {
    const [a,b,c] = line;
    if (board[a] === player && board[b] === player && board[c] === player) return line;
  }
  return null;
}

/* bot strategies */

function botMove(board: Cell[], difficulty: Difficulty): number {
  const empties = board.map((v, i) => v ? -1 : i).filter(i => i !== -1);
  if (empties.length === 0) return -1;

  if (difficulty === 'easy') return botMoveEasy(board);
  if (difficulty === 'medium') return botMoveMedium(board);
  return botMoveHard(board);
}

// easy: random available
function botMoveEasy(board: Cell[]): number {
  const avail = board.map((v,i) => v ? -1 : i).filter(i => i !== -1);
  return avail[Math.floor(Math.random()*avail.length)];
}

// medium: mostly smart (win/block/center/corner) but sometimes random
function botMoveMedium(board: Cell[]): number {
  // small chance to play random to be beatable
  if (Math.random() < 0.28) return botMoveEasy(board);

  // try win
  for (let i=0;i<9;i++) if (!board[i]) {
    const t = [...board]; t[i]='O'; if (checkWinner(t) === 'O') return i;
  }
  // block X
  for (let i=0;i<9;i++) if (!board[i]) {
    const t = [...board]; t[i]='X'; if (checkWinner(t) === 'X') return i;
  }
  // prefer center
  if (!board[4]) return 4;
  // prefer corners
  const corners = [0,2,6,8].filter(i => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  // fallback sides
  const sides = [1,3,5,7].filter(i => !board[i]);
  return sides.length ? sides[Math.floor(Math.random()*sides.length)] : -1;
}

// hard: optimal via minimax (O maximizes)
function botMoveHard(board: Cell[]): number {
  // quick checks to reduce recursion
  for (let i=0;i<9;i++) if (!board[i]) {
    const t = [...board]; t[i]='O'; if (checkWinner(t) === 'O') return i;
  }
  for (let i=0;i<9;i++) if (!board[i]) {
    const t = [...board]; t[i]='X'; if (checkWinner(t) === 'X') return i;
  }
  // use minimax
  const best = minimax(board, 'O');
  return best.index;
}

function minimax(board: Cell[], player: 'X'|'O'): { score: number, index: number } {
  const winner = checkWinner(board);
  if (winner === 'O') return { score: 1, index: -1 };
  if (winner === 'X') return { score: -1, index: -1 };
  if (winner === 'draw') return { score: 0, index: -1 };

  const avail = board.map((v,i) => v ? -1 : i).filter(i => i !== -1);
  const moves: { index: number, score: number }[] = [];

  for (const i of avail) {
    const b = [...board];
    b[i] = player;
    const result = minimax(b, player === 'O' ? 'X' : 'O');
    moves.push({ index: i, score: result.score });
  }

  if (player === 'O') {
    // maximize
    let best = moves[0];
    for (const m of moves) if (m.score > best.score) best = m;
    return { score: best.score, index: best.index };
  } else {
    // minimize
    let best = moves[0];
    for (const m of moves) if (m.score < best.score) best = m;
    return { score: best.score, index: best.index };
  }
}
