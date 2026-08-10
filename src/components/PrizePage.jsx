import React from 'react';
import { CONTACT_URL } from '../config.js';

export function PrizePage({ t, score, isCashOut = false, onPlayAgain }) {
  const amount = isCashOut ? `${score}$` : '100$';
  const pageTitle = t.claimPageTitle.replace('{amount}', amount);

  function handleClaimNow() {
    window.open(CONTACT_URL, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="winner-claim-page lucky-winner-page">
      <section className="winner-claim-card ocean-card">
        <div className="game-logo lucky-logo">
          <span>LUCKY</span>
          <strong>FISH</strong>
        </div>

        <h1>{pageTitle}</h1>
        <p className="open-account-text">{t.claimPageSubtitle}</p>

        <form>
          <button type="button" onClick={handleClaimNow}>
            {t.claimNow}
          </button>

          <button type="button" onClick={onPlayAgain}>
            {t.playAgain}
          </button>
        </form>
      </section>
    </main>
  );
}