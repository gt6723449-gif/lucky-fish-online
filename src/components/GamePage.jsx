import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TARGET_SCORE } from '../config.js';
import {
  clamp,
  collectCoins,
  createBubbles,
  createCoinSequence,
  createObstacle,
  drawOverlay,
  drawScene,
  hasCollision,
  updateCoins
} from '../game/gameEngine.js';

export function GamePage({
  t,
  score,
  phase,
  lang,
  onScore,
  onGameOver,
  onPause,
  onResume,
  onRestart
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const phaseRef = useRef(phase);
  const overlayTextRef = useRef({ paused: t.paused, gameOver: t.gameOver });
  const callbacksRef = useRef({ onScore, onGameOver });
  const pauseRef = useRef(onPause);
  const [coinEffects, setCoinEffects] = useState([]);
  useEffect(() => {
    callbacksRef.current = { onScore, onGameOver };
    pauseRef.current = onPause;
  }, [onGameOver, onPause, onScore]);

  useEffect(() => {
    phaseRef.current = phase;
    overlayTextRef.current = { paused: t.paused, gameOver: t.gameOver };
  }, [phase, t.gameOver, t.paused]);

  const jump = useCallback(() => {
    const state = stateRef.current;
    if (!state || phase !== 'playing') return;
    state.velocity = -state.jumpPower;
  }, [phase]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const state = {
      width: 0,
      height: 0,
      fishX: 0,
      fishY: 0,
      fishRadius: 18,
      velocity: 0,
      gravity: 0.42,
      jumpPower: 7.8,
      speed: 3.6,
      gap: 160,
      obstacleWidth: 70,
      obstacles: [],
      coins: [],
      bubbles: [],
      bubbleImage: null,
      backgroundImage: null,
      backgroundOffset: 0,
      coinImage: null,
      fishImage: null,
      collectedEffects: [],
      score: 0,
      frame: 0,      ended: false
    };
    stateRef.current = state;


    const loadGameImage = (src, assign) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        assign(image);
        resolve();
      };
      image.onerror = () => resolve();
      image.src = src;
    });
    const bubbleImage = new Image();
    bubbleImage.onload = () => {
      state.bubbleImage = bubbleImage;
    };
    bubbleImage.src = '/bubble-small.png';

    const backgroundImage = new Image();
    backgroundImage.onload = () => {
      state.backgroundImage = backgroundImage;
    };
    backgroundImage.src = '/background-game.png';

    const coinImage = new Image();
    coinImage.onload = () => {
      state.coinImage = coinImage;
    };
    coinImage.src = '/coin-game.png';

    const fishImage = new Image();
    fishImage.onload = () => {
      state.fishImage = fishImage;
    };
    fishImage.src = '/fish-game.png';

    const obstacleTopImage = new Image();
    obstacleTopImage.onload = () => {
      state.obstacleTopImage = obstacleTopImage;
    };
    obstacleTopImage.src = '/obstacle-stack-top.png';

    const obstacleBottomImage = new Image();
    obstacleBottomImage.onload = () => {
      state.obstacleBottomImage = obstacleBottomImage;
    };
    obstacleBottomImage.src = '/obstacle-stack-bottom.png';


    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      state.width = Math.max(300, Math.floor(rect.width));
      state.height = Math.max(240, Math.floor(rect.height));      canvas.width = Math.floor(state.width * ratio);
      canvas.height = Math.floor(state.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      state.fishX = Math.max(76, state.width * 0.22);
      state.fishY = state.fishY || state.height * 0.45;
      const phoneSized = Math.min(window.innerWidth, window.innerHeight) <= 520;
      state.fishRadius = phoneSized ? clamp(Math.min(state.width, state.height) * 0.05, 16, 21) : clamp(state.width * 0.028, 14, 23);
      state.gravity = clamp(state.height * 0.00072, 0.34, 0.58);
      state.jumpPower = clamp(state.height * 0.014, 6.4, 9);
      state.speed = clamp(state.width * 0.0065, 3.2, 7.2);
      state.gap = clamp(state.height * 0.3, 108, 174);
      state.obstacleWidth = clamp(state.width * 0.048, 34, 46);
      state.bubbles = createBubbles(state);
    };

    const getObstacleSpacing = () => clamp(state.width * (0.26 + Math.random() * 0.34), 150, 430);

    const resetObstacles = () => {
      const firstObstacle = createObstacle(state.width + clamp(state.width * (0.06 + Math.random() * 0.22), 28, 190), state);
      const secondObstacle = createObstacle(firstObstacle.x + getObstacleSpacing(), state);
      state.obstacles = [firstObstacle, secondObstacle];
      state.coins = state.obstacles.flatMap((obstacle) =>
        createCoinSequence(obstacle.x + obstacle.width / 2, state, obstacle)
      );
    };

    const draw = () => {
      drawScene(context, state, lang);
      if (phaseRef.current === 'paused') drawOverlay(context, state, overlayTextRef.current.paused);
      if (phaseRef.current === 'gameOver') drawOverlay(context, state, overlayTextRef.current.gameOver);
    };

    const addCoinEffects = () => {
      const effects = state.collectedEffects.splice(0).map((effect) => ({
        id: effect.id,
        fromX: `${(effect.x / state.width) * 100}%`,
        fromY: `${(effect.y / state.height) * 100}%`
      }));

      if (!effects.length) return;

      setCoinEffects((current) => [...current, ...effects]);
      window.setTimeout(() => {
        setCoinEffects((current) => current.filter((effect) => !effects.some((item) => item.id === effect.id)));
      }, 850);
    };

    const tick = () => {
      if (phaseRef.current === 'playing' && !state.ended) {
        state.frame += 1;
        state.backgroundOffset += state.speed * 0.5;
        state.velocity += state.gravity;
        state.fishY += state.velocity;

        for (const obstacle of state.obstacles) {
          obstacle.x -= state.speed;
          if (!obstacle.scored && obstacle.x + obstacle.width < state.fishX - state.fishRadius) {
            obstacle.scored = true;
          }
        }

        updateCoins(state);
        const collectedCoins = collectCoins(state);
        if (collectedCoins > 0) {
          addCoinEffects();
          state.score += collectedCoins;
          callbacksRef.current.onScore(state.score);
        }

        const first = state.obstacles[0];
        if (first && first.x + first.width < -10) {
          state.obstacles.shift();
          const last = state.obstacles[state.obstacles.length - 1];
          const nextX = Math.max(last.x + getObstacleSpacing(), state.width + clamp(state.width * (0.06 + Math.random() * 0.22), 28, 190));
          const nextObstacle = createObstacle(nextX, state);
          state.obstacles.push(nextObstacle);
          state.coins.push(
            ...createCoinSequence(nextObstacle.x + nextObstacle.width / 2, state, nextObstacle)
          );
        }

        if (hasCollision(state)) {
          state.ended = true;
          callbacksRef.current.onGameOver(state.score);
        }
      }

      draw();
      state.animation = requestAnimationFrame(tick);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    resetObstacles();

    state.animation = requestAnimationFrame(tick);

    return () => {
      state.cancelled = true;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(state.animation);
    };
  }, [lang]);

  const isPaused = phase === 'paused';
  const isGameOver = phase === 'gameOver';
  const progress = Math.min(100, Math.max(0, (score / TARGET_SCORE) * 100));

  return (
    <section className="screen game-screen">
      <div className="game-stage" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="game-hud" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="amount-readout">
            <span>{t.score}</span>
            <strong>{score}$</strong>
          </div>
          <div className="amount-progress" aria-label={`${t.score} ${score} / ${TARGET_SCORE}`}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        {coinEffects.map((effect) => (
          <span
            className="coin-fly-effect"
            key={effect.id}
            style={{ '--from-x': effect.fromX, '--from-y': effect.fromY }}
          >
            +1
          </span>
        ))}
        <canvas
          ref={canvasRef}
          className="game-canvas"
          aria-label={t.startTitle}
          onPointerDown={jump}
        />
        <div className="game-controls">
          {!isGameOver && (
            <button className="secondary-button" type="button" onClick={isPaused ? onResume : onPause}>
              {isPaused ? t.resume : t.pause}
            </button>
          )}
          {isGameOver && (
            <button className="primary-button" type="button" onClick={onRestart}>
              {t.playAgain}
            </button>
          )}
          <button className="ghost-button on-dark" type="button" onClick={onRestart}>
            {t.restart}
          </button>
        </div>
        <p className="jump-hint">{t.jumpHint}</p>
      </div>
    </section>
  );
}














