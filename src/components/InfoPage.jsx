import React, { useState } from 'react';
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

export function InfoPage({ t, lang, onSubmit }) {
  const [selectedCountryIso, setSelectedCountryIso] = useState('SA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [formError, setFormError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const selectedCountry = COUNTRIES.find((country) => country.iso === selectedCountryIso) || COUNTRIES[0];
  const canSubmit = isValidWhatsappNumber(phoneNumber, selectedCountry) && age.length > 0;

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

  function handleAgeChange(event) {
    setAge(event.target.value.replace(/\D/g, ''));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedPhone = normalizePhoneNumber(phoneNumber, selectedCountry);
    if (!normalizedPhone) {
      setFormError(t.invalidPhone);
      return;
    }

    if (!age) {
      setFormError(t.enterAge);
      return;
    }

    setIsChecking(true);
    const result = await onSubmit({
      number: normalizedPhone,
      country: getCountryName(selectedCountry),
      age
    });
    setIsChecking(false);

    if (result && result.ok === false) {
      setFormError(result.error || t.submitError);
    }
  }

  return (
    <main className="winner-claim-page lucky-winner-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <section className="winner-claim-card ocean-card">
        <div className="game-logo lucky-logo">
          <span>LUCKY</span>
          <strong>FISH</strong>
        </div>

        <h1>{t.infoTitle}</h1>
        <p>{t.infoSubtitle}</p>

        <form onSubmit={handleSubmit}>
          <label>
            {t.whatsappPhone}
            <div className="phone-row phone-code-row">
              <select value={selectedCountryIso} onChange={handleCountryChange} aria-label={t.countryCode} dir="ltr">
                {COUNTRIES.map((country) => (
                  <option value={country.iso} key={country.iso}>
                    +{country.dialCode} {getCountryName(country)}
                  </option>
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

          <label>
            {t.age}
            <input
              type="text"
              value={age}
              onChange={handleAgeChange}
              placeholder={t.agePlaceholder}
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              required
            />
          </label>

          {formError && <p className="claim-error">{formError}</p>}

          <button type="submit" disabled={!canSubmit || isChecking}>
            {isChecking ? t.checkingPhone : t.continueToStart}
          </button>
        </form>
      </section>
    </main>
  );
}