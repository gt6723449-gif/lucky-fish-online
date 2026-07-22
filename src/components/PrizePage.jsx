import React, { useState } from 'react';
import { CONTACT_URL } from '../config.js';
import { COUNTRIES } from '../data/countries.js';

function getLocalizedCountryName(country, language) {
  if (typeof Intl === 'undefined' || !Intl.DisplayNames) {
    return country.name;
  }

  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(country.iso) || country.name;
  } catch {
    return country.name;
  }
}

function normalizePhoneNumber(phoneNumber, country) {
  const trimmedNumber = phoneNumber.trim();
  if (!trimmedNumber) return null;

  const digits = trimmedNumber.replace(/\D/g, '');
  const countryCode = country.dialCode;
  const nationalDigits = trimmedNumber.startsWith('+') && digits.startsWith(countryCode)
    ? digits.slice(countryCode.length)
    : digits;

  if (nationalDigits.length < 6 || nationalDigits.length > 14) return null;
  return `+${countryCode}${nationalDigits}`;
}

function isValidWhatsappNumber(phoneNumber, country) {
  return Boolean(normalizePhoneNumber(phoneNumber, country));
}

export function PrizePage({ t, lang, onPlayAgain }) {
  const [selectedCountryIso, setSelectedCountryIso] = useState('LB');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedCountry = COUNTRIES.find((country) => country.iso === selectedCountryIso) || COUNTRIES[0];
  const canSubmit = isValidWhatsappNumber(phoneNumber, selectedCountry);

  function getCountryName(country) {
    return getLocalizedCountryName(country, lang);
  }

  function handlePhoneChange(event) {
    setPhoneNumber(event.target.value.replace(/[^\d+\s()-]/g, ''));
    setFormError('');
  }

  function handleCountryChange(event) {
    setSelectedCountryIso(event.target.value);
    setFormError('');
  }

  async function handleCollectGift(event) {
    event.preventDefault();

    const normalizedPhone = normalizePhoneNumber(phoneNumber, selectedCountry);
    if (!normalizedPhone) {
      setFormError(t.invalidPhone);
      return;
    }

    setFormError('');
    setIsSaving(true);

    const data = {
      date: new Date().toISOString(),
      number: normalizedPhone,
      country: getCountryName(selectedCountry)
    };

    const body = new URLSearchParams({
      data: JSON.stringify(data)
    });

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        throw new Error('Missing VITE_GOOGLE_SCRIPT_URL');
      }

      await fetch(scriptUrl, {
        method: 'POST',
        body,
        mode: 'no-cors'
      });

      setSaved(true);
      window.open(CONTACT_URL, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.log('Sheet save failed:', error);
      setFormError(t.submitError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="winner-claim-page lucky-winner-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <section className="winner-claim-card ocean-card">
        <div className="game-logo lucky-logo">
          <span>LUCKY</span>
          <strong>FISH</strong>
        </div>

        <h1>{t.wonTitle}</h1>
        {t.wonSubtitle && <p>{t.wonSubtitle}</p>}
        <p className="open-account-text">{t.openAccountOnWebsite}</p>

        <form onSubmit={handleCollectGift}>
          <label>
            {t.whatsappPhone}
            <div className="phone-row phone-code-row">
              <select value={selectedCountryIso} onChange={handleCountryChange} aria-label={t.countryCode} dir="ltr">
                {COUNTRIES.map((country) => (
                  <option value={country.iso} key={country.iso}>
                    +{country.dialCode} {getCountryName(country)}`r`n                  </option>
                ))}
              </select>
              <input
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={t.phonePlaceholder}
                inputMode="tel"
                autoComplete="tel-national"
                dir="ltr"
              />
            </div>
          </label>

          {formError && <p className="claim-error">{formError}</p>}

          <button type="submit" disabled={!canSubmit || isSaving || saved}>
            {isSaving ? t.saving : t.claimNow}
          </button>

          <button type="button" onClick={onPlayAgain}>
            {t.playAgain}
          </button>
        </form>
      </section>

      {saved && (
        <div className="gift-confirmation-backdrop" role="presentation">
          <section
            className="gift-confirmation-modal ocean-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-confirmation-title"
          >
            <h2 id="gift-confirmation-title">{t.giftRequestRegistered}</h2>
            <p>{t.giftContactWithin24Hours}</p>
            <a href={CONTACT_URL} target="_blank" rel="noreferrer">
              {t.contactUsThroughWebsite}
            </a>
          </section>
        </div>
      )}
    </main>
  );
}