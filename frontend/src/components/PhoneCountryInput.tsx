import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, Country, DEFAULT_COUNTRY } from '../lib/countries';

interface PhoneCountryInputProps {
  phone: string;
  countryDialCode?: string;
  onChange: (phone: string, dialCode: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PhoneCountryInput({
  phone,
  countryDialCode = DEFAULT_COUNTRY.dialCode,
  onChange,
  error,
  disabled = false,
}: PhoneCountryInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find currently selected country
  const selectedCountry =
    COUNTRIES.find((c) => c.dialCode === countryDialCode) || DEFAULT_COUNTRY;

  // Filter countries based on search query
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      c.dialCode.includes(searchQuery.trim()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelectCountry = (country: Country) => {
    onChange(phone, country.dialCode);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCountries.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCountries.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries[highlightedIndex]) {
        handleSelectCountry(filteredCountries[highlightedIndex]);
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`flex items-center w-full rounded-2xl border bg-[#FFF8E8]/30 transition-all ${
          error
            ? 'border-rose-400 focus-within:ring-rose-200 focus-within:ring-4'
            : 'border-[#F7E4B6] focus-within:border-[#F28C28] focus-within:ring-4 focus-within:ring-[#FFD45A]/40'
        }`}
      >
        {/* Country Selector Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Select country code, currently ${selectedCountry.name} ${selectedCountry.dialCode}`}
          className="flex items-center gap-1.5 pl-3.5 pr-2 py-3 border-r border-[#F7E4B6] hover:bg-[#FFF0D2]/50 transition-colors rounded-l-2xl cursor-pointer shrink-0 outline-hidden"
        >
          <span className="text-xl leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-xs font-bold text-[#713B18]">{selectedCountry.dialCode}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#843B13] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* National Phone Input */}
        <input
          id="parentPhone"
          type="tel"
          disabled={disabled}
          value={phone}
          onChange={(e) => {
            const rawDigits = e.target.value.replace(/[^\d\s\-()]/g, '');
            onChange(rawDigits, selectedCountry.dialCode);
          }}
          placeholder="98765 43210"
          className="w-full px-3.5 py-3 bg-transparent text-sm text-[#713B18] font-semibold outline-hidden placeholder:text-[#713B18]/40"
        />
      </div>

      {error && <p className="text-xs text-rose-600 font-bold mt-1.5">{error}</p>}

      {/* Accessible Searchable Dropdown Popup */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Country dial code options"
          className="absolute z-50 left-0 top-full mt-2 w-72 sm:w-80 max-h-72 bg-white rounded-2xl border border-[#F7E4B6] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Search bar */}
          <div className="p-2.5 border-b border-[#F7E4B6] bg-[#FFF8E8]/60 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#F28C28] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-white rounded-xl border border-[#F7E4B6] text-[#713B18] focus:border-[#F28C28] focus:ring-2 focus:ring-[#FFD45A] outline-hidden placeholder:text-[#713B18]/50"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto max-h-56 p-1 space-y-0.5">
            {filteredCountries.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#713B18]/70 font-medium">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country, idx) => {
                const isSelected = country.dialCode === selectedCountry.dialCode && country.code === selectedCountry.code;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF0D2] font-extrabold text-[#713B18] border border-[#F7E4B6]'
                        : isHighlighted
                        ? 'bg-[#FFF8E8] text-[#713B18]'
                        : 'text-[#713B18] hover:bg-[#FFF8E8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <span className="text-lg leading-none" role="img" aria-label={country.name}>
                        {country.flag}
                      </span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#843B13] shrink-0 font-mono">
                      {country.dialCode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
