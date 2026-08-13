import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COUNTRIES } from '../data/countries.js';

export function getLocalizedCountryName(country, language) {
  if (typeof Intl === 'undefined' || !Intl.DisplayNames) {
    return country.name;
  }

  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(country.iso) || country.name;
  } catch {
    return country.name;
  }
}

function normalizeSearch(value, language) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase(language)
    .replace(/[^\p{L}\p{N}+]+/gu, ' ')
    .trim();
}

export function CountryCodePicker({ selectedIso, language, t, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const popoverRef = useRef(null);
  const listRef = useRef(null);
  const optionRefs = useRef([]);
  const idPrefix = useId().replace(/:/g, '');
  const listboxId = `${idPrefix}-country-listbox`;
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  const countryOptions = useMemo(
    () => COUNTRIES.map((country) => {
      const localizedName = getLocalizedCountryName(country, language);
      const searchText = normalizeSearch(
        `${localizedName} ${country.name} ${country.iso} +${country.dialCode} ${country.dialCode}`,
        language
      );

      return { ...country, localizedName, searchText };
    }),
    [language]
  );

  const selectedCountry = countryOptions.find((country) => country.iso === selectedIso) || countryOptions[0];
  const queryTokens = normalizeSearch(query, language).split(/\s+/).filter(Boolean);
  const filteredCountries = queryTokens.length
    ? countryOptions.filter((country) => queryTokens.every((token) => country.searchText.includes(token)))
    : countryOptions;
  const activeCountry = filteredCountries[activeIndex] || null;
  const activeOptionId = activeCountry ? `${idPrefix}-country-${activeCountry.iso}` : undefined;

  function updatePopoverPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportLeft = visualViewport?.offsetLeft || 0;
    const viewportTop = visualViewport?.offsetTop || 0;
    const viewportWidth = visualViewport?.width || document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = visualViewport?.height || window.innerHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const margin = 8;

    if (viewportWidth <= 640) {
      const height = Math.min(
        520,
        Math.max(140, Math.floor(viewportHeight * 0.7)),
        Math.max(1, viewportHeight - margin * 2)
      );

      setPopoverStyle({
        top: Math.round(viewportBottom - height - margin),
        right: 'auto',
        bottom: 'auto',
        left: Math.round(viewportLeft + margin),
        width: Math.max(1, Math.round(viewportWidth - margin * 2)),
        height: Math.round(height),
        maxHeight: 'none'
      });
      return;
    }

    const width = Math.min(360, viewportWidth - margin * 2);
    const maximumHeight = Math.min(420, Math.max(160, viewportHeight - margin * 2));
    const spaceBelow = Math.max(0, viewportBottom - rect.bottom - margin);
    const spaceAbove = Math.max(0, rect.top - viewportTop - margin);
    const placeAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
    const availableSpace = placeAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(maximumHeight, Math.max(160, availableSpace));
    const preferredLeft = direction === 'rtl' ? rect.right - width : rect.left;
    const left = Math.max(viewportLeft + margin, Math.min(preferredLeft, viewportRight - width - margin));
    const top = placeAbove
      ? Math.max(viewportTop + margin, rect.top - maxHeight - 4)
      : Math.min(rect.bottom + 4, viewportBottom - maxHeight - margin);

    setPopoverStyle({ top, right: 'auto', bottom: 'auto', left, width, height: 'auto', maxHeight });
  }

  function openPicker() {
    const selectedIndex = countryOptions.findIndex((country) => country.iso === selectedIso);
    setQuery('');
    setActiveIndex(Math.max(0, selectedIndex));
    setIsOpen(true);
  }

  function closePicker({ restoreFocus = false } = {}) {
    setIsOpen(false);
    setQuery('');
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }

  function selectCountry(country) {
    if (!country) return;
    onChange(country.iso);
    closePicker({ restoreFocus: true });
  }

  function handleTriggerKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openPicker();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openPicker();
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closePicker();
    }
  }

  function handleSearchChange(event) {
    const nextQuery = event.target.value;
    const selectedIndex = countryOptions.findIndex((country) => country.iso === selectedIso);
    setQuery(nextQuery);
    setActiveIndex(normalizeSearch(nextQuery, language) ? 0 : Math.max(0, selectedIndex));
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!filteredCountries.length) return;
      setActiveIndex((current) => Math.min(current + 1, filteredCountries.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!filteredCountries.length) return;
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      if (filteredCountries.length) setActiveIndex(filteredCountries.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectCountry(activeCountry);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closePicker({ restoreFocus: true });
    } else if (event.key === 'Tab') {
      closePicker();
    }
  }

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    let animationFrame = 0;
    const visualViewport = window.visualViewport;
    const schedulePositionUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updatePopoverPosition);
    };
    const handleWindowScroll = (event) => {
      if (popoverRef.current?.contains(event.target)) return;
      schedulePositionUpdate();
    };

    updatePopoverPosition();
    window.addEventListener('resize', schedulePositionUpdate);
    window.addEventListener('scroll', handleWindowScroll, true);
    visualViewport?.addEventListener('resize', schedulePositionUpdate);
    visualViewport?.addEventListener('scroll', schedulePositionUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', schedulePositionUpdate);
      window.removeEventListener('scroll', handleWindowScroll, true);
      visualViewport?.removeEventListener('resize', schedulePositionUpdate);
      visualViewport?.removeEventListener('scroll', schedulePositionUpdate);
    };
  }, [direction, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const animationFrame = window.requestAnimationFrame(() => {
      const search = searchRef.current;
      if (!search) return;

      try {
        search.focus({ preventScroll: true });
      } catch {
        search.focus();
      }
    });
    const handleOutsidePointer = (event) => {
      if (triggerRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      closePicker();
    };

    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('pointerdown', handleOutsidePointer);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const option = optionRefs.current[activeIndex];
    if (!isOpen || !popoverStyle || !activeCountry || !list || !option) return;

    const listRect = list.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();

    if (!normalizeSearch(query, language) && activeCountry.iso === selectedIso) {
      const optionTop = optionRect.top - listRect.top + list.scrollTop;
      list.scrollTop = Math.max(0, optionTop - (list.clientHeight - optionRect.height) / 2);
    } else if (optionRect.top < listRect.top) {
      list.scrollTop += optionRect.top - listRect.top;
    } else if (optionRect.bottom > listRect.bottom) {
      list.scrollTop += optionRect.bottom - listRect.bottom;
    }
  }, [activeCountry, activeIndex, isOpen, language, popoverStyle, query, selectedIso]);

  const popover = isOpen && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={popoverRef}
        className="country-picker-popover"
        dir={direction}
        style={{ ...popoverStyle, visibility: popoverStyle ? 'visible' : 'hidden' }}
      >
        <input
          ref={searchRef}
          className="country-picker-search"
          type="search"
          role="combobox"
          value={query}
          placeholder={t.searchCountry}
          aria-label={t.searchCountry}
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          dir="auto"
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />

        {filteredCountries.length > 0 ? (
          <ul ref={listRef} className="country-picker-list" id={listboxId} role="listbox">
            {filteredCountries.map((country, index) => (
              <li
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                className={`country-picker-option${index === activeIndex ? ' is-active' : ''}`}
                id={`${idPrefix}-country-${country.iso}`}
                key={country.iso}
                role="option"
                aria-selected={country.iso === selectedIso}
                onPointerMove={() => setActiveIndex(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => selectCountry(country)}
              >
                <span>{country.localizedName}</span>
                <strong className="country-picker-code">+{country.dialCode}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="country-picker-empty" role="status">{t.noCountriesFound}</p>
        )}
      </div>,
      document.body
    )
    : null;

  return (
    <div className="country-picker-control">
      <button
        ref={triggerRef}
        className="country-picker-trigger"
        type="button"
        aria-label={`${t.countryCode}: ${selectedCountry.localizedName}, +${selectedCountry.dialCode}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => (isOpen ? closePicker() : openPicker())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="country-picker-code">+{selectedCountry.dialCode}</span>
        <span className="country-picker-chevron" aria-hidden="true">▾</span>
      </button>
      {popover}
    </div>
  );
}
