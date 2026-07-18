import React from 'react';

export function RulesModal({ language, t, onClose }) {
  return (
    <div className="rules-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="rules-modal lucky-rules-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rules-modal-header">
          <div>
            <h2 id="rules-title">{t.rulesTitle}</h2>
            <p>{t.rulesIntro}</p>
          </div>
          <button type="button" onClick={onClose}>
            {t.close}
          </button>
        </header>

        <div className="rules-content">
          <article className="rules-section">
            <ul>
              {t.rulesItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
