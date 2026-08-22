import React from 'react';

export function ReferralPopup({ t, lang, onContinue }) {
  return (
    <div className="referral-backdrop" role="presentation">
      <section
        className="referral-popup ocean-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="referral-popup-title"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="referral-gift" aria-hidden="true">🎁</div>
        <h2 id="referral-popup-title">{t.referralTitle}</h2>
        <p>{t.referralText}</p>
        <button className="primary-button" type="button" onClick={onContinue} autoFocus>
          {t.referralContinue}
        </button>
      </section>
    </div>
  );
}