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

        <form onSubmit={handleStartGame}>
          <fieldset className="setup-choice-group lucky-setup-group">
            <div className="setup-choice-grid lucky-setup-grid">
              <div className="setup-choice-card selected-setup-choice">
                <strong>{t.target}</strong>
                <span>100</span>
              </div>
              <div className="setup-choice-card selected-setup-choice">
                <strong>{t.score}</strong>
                <span>+1</span>
              </div>
            </div>
          </fieldset>

          <button type="submit" className="start-button">
            {t.startGame}
          </button>
        </form>
      </section>
    </main>
  );
}

