import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { TARGET_SCORE } from './config.js';
import { GamePage } from './components/GamePage.jsx';
import { InfoPage } from './components/InfoPage.jsx';
import { LanguagePage } from './components/LanguagePage.jsx';
import { PrizePage } from './components/PrizePage.jsx';
import { ReferralPopup } from './components/ReferralPopup.jsx';
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
    setPhase('referral');
  };

  const continueFromReferral = () => {
    setPhase('info');
  };

  const checkPhoneExists = async (number) => {
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      return { ok: false, error: t.scriptMissing };
    }

    const checkUrl = new URL(scriptUrl);
    checkUrl.searchParams.set('action', 'checkPhone');
    checkUrl.searchParams.set('number', number);

    try {
      const response = await fetch(checkUrl.toString(), { method: 'GET' });
      const result = await response.json();
      return { ok: true, exists: Boolean(result && result.exists) };
    } catch (fetchError) {
      console.log('Phone check fetch failed, trying script fallback:', fetchError);
    }

    return new Promise((resolve) => {
      const callbackName = `luckyFishPhoneCheck_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const cleanup = () => {
        if (window[callbackName]) delete window[callbackName];
        if (script.parentNode) script.remove();
      };

      const timeout = window.setTimeout(() => {
        cleanup();
        resolve({ ok: false, error: t.submitError });
      }, 10000);

      window[callbackName] = (result) => {
        window.clearTimeout(timeout);
        cleanup();
        resolve({ ok: true, exists: Boolean(result && result.exists) });
      };

      const fallbackUrl = new URL(scriptUrl);
      fallbackUrl.searchParams.set('action', 'checkPhone');
      fallbackUrl.searchParams.set('number', number);
      fallbackUrl.searchParams.set('callback', callbackName);
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        cleanup();
        resolve({ ok: false, error: t.submitError });
      };
      script.src = fallbackUrl.toString();
      document.body.appendChild(script);
    });
  };

  const submitRegistration = async (info) => {
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      console.log('Missing VITE_GOOGLE_SCRIPT_URL');
      return false;
    }

    const body = new URLSearchParams({
      data: JSON.stringify({
        date: new Date().toISOString(),
        number: info.number,
        country: info.country,
        age: info.age,
        telegram: info.telegram || '',
        amount: '',
        status: 'Registered',
        resultStatus: 'Registered'
      })
    });

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        body,
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.log('Registration save failed:', error);
      return false;
    }
  };

  const handleInfoSubmit = async (info) => {
    const checkResult = await checkPhoneExists(info.number);

    if (!checkResult.ok) {
      return { ok: false, error: checkResult.error };
    }

    if (checkResult.exists) {
      return { ok: false, error: t.phoneAlreadyUsed };
    }

    const registrationSaved = await submitRegistration(info);
    if (!registrationSaved) {
      return { ok: false, error: t.submitError };
    }

    setPlayerInfo(info);
    window.localStorage.setItem('luckyFishPlayerInfo', JSON.stringify(info));
    setPhase('start');
    return { ok: true };
  };

  const returnToInfoPage = () => {
    resultSubmittedRef.current = false;
    setPlayerInfo(null);
    window.localStorage.removeItem('luckyFishPlayerInfo');
    setScore(0);
    setPhase('info');
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
      return false;
    }

    const body = new URLSearchParams({
      data: JSON.stringify({
        date: new Date().toISOString(),
        number: playerInfo.number,
        country: playerInfo.country,
        age: playerInfo.age,
        telegram: playerInfo.telegram || '',
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

      {phase === 'referral' && <ReferralPopup t={t} lang={lang} onContinue={continueFromReferral} />}

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
          onRestart={returnToInfoPage}
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
          onPlayAgain={returnToInfoPage}
          onLanguage={() => setPhase('language')}
        />
      )}
    </main>
  );
}
