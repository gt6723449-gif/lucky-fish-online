import React from 'react';

export function StartPage({ t, lang, onStart }) {
  function handleStartGame(event) {
    event.preventDefault();
    onStart();
  }

  return (
    <main className="start-page lucky-start-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <section className="start-card ocean-card">
        <div className="game-logo lucky-logo">
          <span>LUCKY</span>
          <strong>FISH</strong>
        </div>

        <p className="start-subtitle">{t.onlineCardGame}</p>
        <p className="start-experience-tip">{t.startExperienceTip}</p>

        <form onSubmit={handleStartGame}>
          <button type="submit" className="start-button">
            {t.startGame}
          </button>
        </form>
      </section>
    </main>
  );
}