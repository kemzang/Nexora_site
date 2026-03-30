export interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
  phoneLength: number
  hasMobileMoney: boolean
  momoChannels: { id: string; name: string; color: string }[]
}

export const countries: Country[] = [
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237', phoneLength: 9, hasMobileMoney: true, momoChannels: [
    { id: 'cm.mtn', name: 'MTN MoMo', color: '#FFC107' },
    { id: 'cm.orange', name: 'Orange Money', color: '#FF6600' },
  ]},
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225', phoneLength: 10, hasMobileMoney: true, momoChannels: [
    { id: 'ci.mtn', name: 'MTN MoMo', color: '#FFC107' },
    { id: 'ci.orange', name: 'Orange Money', color: '#FF6600' },
  ]},
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221', phoneLength: 9, hasMobileMoney: true, momoChannels: [
    { id: 'sn.orange', name: 'Orange Money', color: '#FF6600' },
  ]},
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226', phoneLength: 8, hasMobileMoney: true, momoChannels: [
    { id: 'bf.orange', name: 'Orange Money', color: '#FF6600' },
  ]},
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241', phoneLength: 8, hasMobileMoney: true, momoChannels: [
    { id: 'ga.airtel', name: 'Airtel Money', color: '#ED1C24' },
  ]},
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242', phoneLength: 9, hasMobileMoney: true, momoChannels: [
    { id: 'cg.mtn', name: 'MTN MoMo', color: '#FFC107' },
  ]},
  // Pays sans Mobile Money (carte uniquement)
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', phoneLength: 9, hasMobileMoney: false, momoChannels: [] },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', dialCode: '+32', phoneLength: 9, hasMobileMoney: false, momoChannels: [] },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', dialCode: '+41', phoneLength: 9, hasMobileMoney: false, momoChannels: [] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', phoneLength: 10, hasMobileMoney: false, momoChannels: [] },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1', phoneLength: 10, hasMobileMoney: false, momoChannels: [] },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44', phoneLength: 10, hasMobileMoney: false, momoChannels: [] },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', dialCode: '+49', phoneLength: 11, hasMobileMoney: false, momoChannels: [] },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212', phoneLength: 9, hasMobileMoney: false, momoChannels: [] },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216', phoneLength: 8, hasMobileMoney: false, momoChannels: [] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', phoneLength: 10, hasMobileMoney: false, momoChannels: [] },
  { code: 'CD', name: 'RD Congo', flag: '🇨🇩', dialCode: '+243', phoneLength: 9, hasMobileMoney: false, momoChannels: [] },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223', phoneLength: 8, hasMobileMoney: false, momoChannels: [] },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩', dialCode: '+235', phoneLength: 8, hasMobileMoney: false, momoChannels: [] },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳', dialCode: '+224', phoneLength: 9, hasMobileMoney: false, momoChannels: [] },
]

export function getCountryByCode(code: string) {
  return countries.find(c => c.code === code)
}

export function validatePhone(phone: string, country: Country): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === country.phoneLength
}
