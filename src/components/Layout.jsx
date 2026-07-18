import React from 'react';
import { TARGET_SCORE } from '../config.js';

export function TopBar({ t, onLanguage }) {
  return (
    <header className="top-bar">
      <div className="brand-mark">LF</div>
      <button className="ghost-button" type="button" onClick={onLanguage}>
        {t.changeLanguage}
      </button>
    </header>
  );
}

export function StatsBar({ t, score, best }) {
  return (
    <div className="stats-bar">
      <Stat label={t.score} value={score} />
      <Stat label={t.target} value={TARGET_SCORE} />
      <Stat label={t.best} value={best} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
