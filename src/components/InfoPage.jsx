import React, { useState } from 'react';
import { COUNTRIES } from '../data/countries.js';
import { CountryCodePicker, getLocalizedCountryName } from './CountryCodePicker.jsx';

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

function isValidPhoneNumber(phoneNumber, country) {
  return Boolean(normalizePhoneNumber(phoneNumber, country));
}

function normalizeTelegramUsername(value) {
  const username = value.trim().replace(/^@/, '');
  if (!username) return '';
  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  return `@${username}`;
}

export function InfoPage({ t, lang, onSubmit }) {
  const [selectedCountryIso, setSelectedCountryIso] = useState('SA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [age, setAge] = useState('');
  const [formError, setFormError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const selectedCountry = COUNTRIES.find((country) => country.iso === selectedCountryIso) || COUNTRIES[0];
  const canSubmit = isValidPhoneNumber(phoneNumber, selectedCountry) && age.length > 0;

  function getCountryName(country) {
    return getLocalizedCountryName(country, lang);
  }

  function handlePhoneChange(event) {
    setPhoneNumber(event.target.value.replace(/[^\d+\s()-]/g, ''));
    setFormError('');
  }

  function handleCountryChange(countryIso) {
    setSelectedCountryIso(countryIso);
    setFormError('');
  }

  function handleTelegramChange(event) {
    setTelegramUsername(event.target.value);
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

    const normalizedTelegram = normalizeTelegramUsername(telegramUsername);
    if (normalizedTelegram === null) {
      setFormError(t.invalidTelegram);
      return;
    }

    setIsChecking(true);
    try {
      const result = await onSubmit({
        number: normalizedPhone,
        country: getCountryName(selectedCountry),
        age,
        telegram: normalizedTelegram
      });

      if (result && result.ok === false) {
        setFormError(result.error || t.submitError);
      }
    } catch {
      setFormError(t.submitError);
    } finally {
      setIsChecking(false);
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
          <div className="registration-field">
            <label htmlFor="phone-number">{t.phoneNumber}</label>
            <div className="phone-row phone-code-row">
              <CountryCodePicker
                selectedIso={selectedCountryIso}
                language={lang}
                t={t}
                onChange={handleCountryChange}
              />
              <input
                id="phone-number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={t.phonePlaceholder}
                inputMode="tel"
                autoComplete="tel-national"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="registration-field">
            <label htmlFor="telegram-username">{t.telegramUsername}</label>
            <input
              id="telegram-username"
              type="text"
              value={telegramUsername}
              onChange={handleTelegramChange}
              placeholder={t.telegramPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={33}
              dir="ltr"
            />
          </div>

          <div className="registration-field">
            <label htmlFor="player-age">{t.age}</label>
            <input
              id="player-age"
              type="text"
              value={age}
              onChange={handleAgeChange}
              placeholder={t.agePlaceholder}
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              required
            />
          </div>

          {formError && <p className="claim-error" role="alert">{formError}</p>}

          <button type="submit" disabled={!canSubmit || isChecking}>
            {isChecking ? t.checkingPhone : t.continueToStart}
          </button>
        </form>
      </section>
    </main>
  );
}
