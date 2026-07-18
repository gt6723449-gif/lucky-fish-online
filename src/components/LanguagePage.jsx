import React from 'react';

export function LanguagePage({ t, onChoose }) {
  return (
    <main className="language-page">
      <section className="language-card ocean-card">
        <div className="game-logo lucky-logo">
          <span>LUCKY</span>
          <strong>FISH</strong>
        </div>

        <h1>
          {t.languageTitle}
          <span lang="ar" dir="rtl">{t.languageTitleArabic}</span>
        </h1>
        <p>{t.languageSubtitle}</p>

        <div className="language-buttons">
          <button type="button" onClick={() => onChoose('en')}>
            {t.english}
          </button>
          <button type="button" lang="ar" dir="rtl" onClick={() => onChoose('ar')}>
            {t.arabic}
          </button>
        </div>
      </section>
    </main>
  );
}
