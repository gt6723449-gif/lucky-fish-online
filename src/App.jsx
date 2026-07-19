import React from 'react';
import { useEffect, useState } from 'react';
import { TARGET_SCORE } from './config.js';
import { GamePage } from './components/GamePage.jsx';
import { LanguagePage } from './components/LanguagePage.jsx';
import { PrizePage } from './components/PrizePage.jsx';
import { StartPage } from './components/StartPage.jsx';
import { COPY } from './data/translations.js';

export default function App() {
  const [lang, setLang] = useState(null);
  const [phase, setPhase] = useState('language');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [runId, setRunId] = useState(0);
  const t = COPY[lang || 'en'];
  const direction = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang || 'en';
    document.documentElement.dir = direction;
  }, [direction, lang]);

  const chooseLanguage = (nextLang) => {
    setLang(nextLang);
    setPhase('start');
  };

  const startGame = () => {
    setScore(0);
    setPhase('playing');
    setRunId((value) => value + 1);
  };

  const handleScore = (nextScore) => {
    setScore(nextScore);
    setBest((value) => Math.max(value, nextScore));
    if (nextScore >= TARGET_SCORE) {
      setPhase('prize');
    }
  };

  const handleGameOver = (finalScore) => {
    setScore(finalScore);
    setBest((value) => Math.max(value, finalScore));
    setPhase('gameOver');
  };

  return (
    <main className="app-shell" dir={direction}>
      {phase === 'language' && <LanguagePage t={t} onChoose={chooseLanguage} />}

      {phase === 'start' && (
        <StartPage
          t={t}
          score={score}
          best={best}
          onStart={startGame}
          onLanguage={() => setPhase('language')}
        />
      )}

      {(phase === 'playing' || phase === 'paused' || phase === 'gameOver') && (
        <GamePage
          key={runId}
          t={t}
          score={score}
          best={best}
          phase={phase}
          lang={lang}
          onScore={handleScore}
          onGameOver={handleGameOver}
          onRestart={startGame}
          onLanguage={() => setPhase('language')}
        />
      )}

      {phase === 'prize' && (
        <PrizePage
          t={t}
          lang={lang}
          score={score}
          best={best}
          onPlayAgain={startGame}
          onLanguage={() => setPhase('language')}
        />
      )}
    </main>
  );
}

