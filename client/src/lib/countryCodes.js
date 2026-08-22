// client/src/lib/countryCodes.js
// Standard International Country Dial Codes, Flag Emojis, and Phone Max Digits

export const COUNTRY_CODES = [
  { code: '+91',  iso: 'IN', name: 'India', flag: '🇮🇳', maxDigits: 10, placeholder: '98765 43210' },
  { code: '+1',   iso: 'US', name: 'United States', flag: '🇺🇸', maxDigits: 10, placeholder: '202 555 0123' },
  { code: '+44',  iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', maxDigits: 10, placeholder: '7911 123456' },
  { code: '+971', iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', maxDigits: 9, placeholder: '50 123 4567' },
  { code: '+65',  iso: 'SG', name: 'Singapore', flag: '🇸🇬', maxDigits: 8, placeholder: '8123 4567' },
  { code: '+61',  iso: 'AU', name: 'Australia', flag: '🇦🇺', maxDigits: 9, placeholder: '412 345 678' },
  { code: '+1',   iso: 'CA', name: 'Canada', flag: '🇨🇦', maxDigits: 10, placeholder: '416 555 0123' },
  { code: '+49',  iso: 'DE', name: 'Germany', flag: '🇩🇪', maxDigits: 11, placeholder: '151 12345678' },
  { code: '+33',  iso: 'FR', name: 'France', flag: '🇫🇷', maxDigits: 9, placeholder: '6 12 34 56 78' },
  { code: '+81',  iso: 'JP', name: 'Japan', flag: '🇯🇵', maxDigits: 10, placeholder: '90 1234 5678' },
  { code: '+60',  iso: 'MY', name: 'Malaysia', flag: '🇲🇾', maxDigits: 10, placeholder: '12 345 6789' },
  { code: '+66',  iso: 'TH', name: 'Thailand', flag: '🇹🇭', maxDigits: 9, placeholder: '81 234 5678' },
  { code: '+62',  iso: 'ID', name: 'Indonesia', flag: '🇮🇩', maxDigits: 11, placeholder: '812 3456 7890' },
  { code: '+94',  iso: 'LK', name: 'Sri Lanka', flag: '🇱🇰', maxDigits: 9, placeholder: '71 234 5678' },
  { code: '+977', iso: 'NP', name: 'Nepal', flag: '🇳🇵', maxDigits: 10, placeholder: '984 1234567' },
  { code: '+880', iso: 'BD', name: 'Bangladesh', flag: '🇧🇩', maxDigits: 10, placeholder: '1712 345678' },
  { code: '+966', iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', maxDigits: 9, placeholder: '50 123 4567' },
  { code: '+974', iso: 'QA', name: 'Qatar', flag: '🇶🇦', maxDigits: 8, placeholder: '3312 3456' },
  { code: '+968', iso: 'OM', name: 'Oman', flag: '🇴🇲', maxDigits: 8, placeholder: '9123 4567' },
  { code: '+965', iso: 'KW', name: 'Kuwait', flag: '🇰🇼', maxDigits: 8, placeholder: '9123 4567' },
  { code: '+973', iso: 'BH', name: 'Bahrain', flag: '🇧🇭', maxDigits: 8, placeholder: '3612 3456' },
  { code: '+64',  iso: 'NZ', name: 'New Zealand', flag: '🇳🇿', maxDigits: 9, placeholder: '21 123 4567' },
  { code: '+27',  iso: 'ZA', name: 'South Africa', flag: '🇿🇦', maxDigits: 9, placeholder: '71 123 4567' },
  { code: '+39',  iso: 'IT', name: 'Italy', flag: '🇮🇹', maxDigits: 10, placeholder: '312 345 6789' },
  { code: '+34',  iso: 'ES', name: 'Spain', flag: '🇪🇸', maxDigits: 9, placeholder: '612 34 56 78' },
  { code: '+41',  iso: 'CH', name: 'Switzerland', flag: '🇨🇭', maxDigits: 9, placeholder: '78 123 45 67' },
  { code: '+31',  iso: 'NL', name: 'Netherlands', flag: '🇳🇱', maxDigits: 9, placeholder: '6 12345678' },
  { code: '+46',  iso: 'SE', name: 'Sweden', flag: '🇸🇪', maxDigits: 9, placeholder: '70 123 45 67' },
  { code: '+47',  iso: 'NO', name: 'Norway', flag: '🇳🇴', maxDigits: 8, placeholder: '412 34 567' },
  { code: '+45',  iso: 'DK', name: 'Denmark', flag: '🇩🇰', maxDigits: 8, placeholder: '21 23 45 67' },
  { code: '+358', iso: 'FI', name: 'Finland', flag: '🇫🇮', maxDigits: 10, placeholder: '40 123 4567' },
  { code: '+353', iso: 'IE', name: 'Ireland', flag: '🇮🇪', maxDigits: 9, placeholder: '85 123 4567' },
  { code: '+351', iso: 'PT', name: 'Portugal', flag: '🇵🇹', maxDigits: 9, placeholder: '912 345 678' },
  { code: '+30',  iso: 'GR', name: 'Greece', flag: '🇬🇷', maxDigits: 10, placeholder: '69 1234 5678' },
  { code: '+90',  iso: 'TR', name: 'Turkey', flag: '🇹🇷', maxDigits: 10, placeholder: '532 123 4567' },
  { code: '+82',  iso: 'KR', name: 'South Korea', flag: '🇰🇷', maxDigits: 10, placeholder: '10 1234 5678' },
  { code: '+86',  iso: 'CN', name: 'China', flag: '🇨🇳', maxDigits: 11, placeholder: '138 1234 5678' },
  { code: '+852', iso: 'HK', name: 'Hong Kong', flag: '🇭🇰', maxDigits: 8, placeholder: '9123 4567' },
  { code: '+886', iso: 'TW', name: 'Taiwan', flag: '🇹🇼', maxDigits: 9, placeholder: '912 345 678' },
  { code: '+84',  iso: 'VN', name: 'Vietnam', flag: '🇻🇳', maxDigits: 10, placeholder: '91 234 5678' },
  { code: '+63',  iso: 'PH', name: 'Philippines', flag: '🇵🇭', maxDigits: 10, placeholder: '917 123 4567' },
  { code: '+20',  iso: 'EG', name: 'Egypt', flag: '🇪🇬', maxDigits: 10, placeholder: '10 1234 5678' },
  { code: '+234', iso: 'NG', name: 'Nigeria', flag: '🇳🇬', maxDigits: 10, placeholder: '802 123 4567' },
  { code: '+254', iso: 'KE', name: 'Kenya', flag: '🇰🇪', maxDigits: 9, placeholder: '712 345678' },
  { code: '+55',  iso: 'BR', name: 'Brazil', flag: '🇧🇷', maxDigits: 11, placeholder: '11 91234 5678' },
  { code: '+52',  iso: 'MX', name: 'Mexico', flag: '🇲🇽', maxDigits: 10, placeholder: '55 1234 5678' },
  { code: '+54',  iso: 'AR', name: 'Argentina', flag: '🇦🇷', maxDigits: 10, placeholder: '9 11 1234 5678' },
  { code: '+7',   iso: 'RU', name: 'Russia', flag: '🇷🇺', maxDigits: 10, placeholder: '912 345 67 89' },
  { code: '+48',  iso: 'PL', name: 'Poland', flag: '🇵🇱', maxDigits: 9, placeholder: '512 345 678' },
  { code: '+43',  iso: 'AT', name: 'Austria', flag: '🇦🇹', maxDigits: 10, placeholder: '664 1234567' },
  { code: '+32',  iso: 'BE', name: 'Belgium', flag: '🇧🇪', maxDigits: 9, placeholder: '470 12 34 56' },
  { code: '+960', iso: 'MV', name: 'Maldives', flag: '🇲🇻', maxDigits: 7, placeholder: '771 2345' },
  { code: '+975', iso: 'BT', name: 'Bhutan', flag: '🇧🇹', maxDigits: 8, placeholder: '17 12 34 56' },
  { code: '+230', iso: 'MU', name: 'Mauritius', flag: '🇲🇺', maxDigits: 8, placeholder: '5123 4567' },
  { code: '+248', iso: 'SC', name: 'Seychelles', flag: '🇸🇨', maxDigits: 7, placeholder: '2 51 23 45' },
  { code: '+972', iso: 'IL', name: 'Israel', flag: '🇮🇱', maxDigits: 9, placeholder: '50 123 4567' },
  { code: '+962', iso: 'JO', name: 'Jordan', flag: '🇯🇴', maxDigits: 9, placeholder: '7 9123 4567' },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // India (+91)

export function parsePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { country: DEFAULT_COUNTRY, digits: '', fullFormatted: '' };
  }

  const clean = rawPhone.trim();
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

  for (const c of sorted) {
    if (clean.startsWith(c.code)) {
      const rest = clean.slice(c.code.length).replace(/\D/g, '');
      return {
        country: c,
        digits: rest,
        fullFormatted: `${c.code} ${rest}`,
      };
    }
  }

  if (clean.startsWith('+')) {
    const digitsOnly = clean.replace(/\D/g, '');
    return {
      country: DEFAULT_COUNTRY,
      digits: digitsOnly,
      fullFormatted: clean,
    };
  }

  const digitsOnly = clean.replace(/\D/g, '');
  return {
    country: DEFAULT_COUNTRY,
    digits: digitsOnly,
    fullFormatted: digitsOnly ? `${DEFAULT_COUNTRY.code} ${digitsOnly}` : '',
  };
}
