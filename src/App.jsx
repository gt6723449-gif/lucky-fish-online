import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { TARGET_SCORE } from './config.js';
import { GamePage } from './components/GamePage.jsx';
import { InfoPage } from './components/InfoPage.jsx';
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
  const [prizeMode, setPrizeMode] = useState('win');
  const [playerInfo, setPlayerInfo] = useState(() => {
    try {
      const savedInfo = window.localStorage.getItem('luckyFishPlayerInfo');
      return savedInfo ? JSON.parse(savedInfo) : null;
    } catch {
      return null;
    }
  });
  const resultSubmittedRef = useRef(false);
  const t = COPY[lang || 'en'];
  const direction = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang || 'en';
    document.documentElement.dir = direction;
  }, [direction, lang]);

  const chooseLanguage = (nextLang) => {
    setLang(nextLang);
    setPhase('info');
  };

  const handleInfoSubmit = (info) => {
    setPlayerInfo(info);
    window.localStorage.setItem('luckyFishPlayerInfo', JSON.stringify(info));
    setPhase('start');
  };

  const startGame = () => {
    if (!playerInfo) {
      setPhase('info');
      return;
    }

    resultSubmittedRef.current = false;
    setPrizeMode('win');
    setScore(0);
    setPhase('playing');
    setRunId((value) => value + 1);
  };

  const submitResult = async (amount, status) => {
    if (!playerInfo || resultSubmittedRef.current) return;
    resultSubmittedRef.current = true;

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      console.log('Missing VITE_GOOGLE_SCRIPT_URL');
      return;
    }

    const body = new URLSearchParams({
      data: JSON.stringify({
        date: new Date().toISOString(),
        number: playerInfo.number,
        country: playerInfo.country,
        age: playerInfo.age,
        amount,
        status,
        resultStatus: status
      })
    });

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        body,
        mode: 'no-cors'
      });
    } catch (error) {
      console.log('Sheet save failed:', error);
    }
  };

  const handleScore = (nextScore) => {
    setScore(nextScore);
    setBest((value) => Math.max(value, nextScore));
    if (nextScore >= TARGET_SCORE) {
      submitResult('100$', 'Won');
      setPrizeMode('win');
      setPhase('prize');
    }
  };

  const handleGameOver = (finalScore) => {
    setScore(finalScore);
    setBest((value) => Math.max(value, finalScore));
    submitResult(`${finalScore}$`, 'Lost');
    setPhase('gameOver');
  };

  const handleCashOut = () => {
    submitResult(`${score}$`, 'Cash Out');
    setPrizeMode('cashOut');
    setPhase('prize');
  };

  return (
    <main className="app-shell" dir={direction}>
      {phase === 'language' && <LanguagePage t={t} onChoose={chooseLanguage} />}

      {phase === 'info' && <InfoPage t={t} lang={lang} onSubmit={handleInfoSubmit} />}

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
          onCashOut={handleCashOut}
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
          isCashOut={prizeMode === 'cashOut'}
          onPlayAgain={startGame}
          onLanguage={() => setPhase('language')}
        />
      )}
    </main>
  );
}