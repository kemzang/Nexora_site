const NOTCHPAY_API_URL = 'https://api.notchpay.co'

function getApiKey() {
  const key = process.env.NOTCHPAY_PUBLIC_KEY
  if (!key) throw new Error('NOTCHPAY_PUBLIC_KEY manquante')
  return key
}

export async function initializePayment({
  amount,
  currency = 'XAF',
  email,
  name,
  phone,
  description,
  reference,
  callbackUrl,
  metadata,
}: {
  amount: number
  currency?: string
  email: string
  name: string
  phone?: string
  description: string
  reference: string
  callbackUrl: string
  metadata?: Record<string, string>
}) {
  const res = await fetch(`${NOTCHPAY_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      customer: { name, email, phone },
      description,
      reference,
      callback: callbackUrl,
      metadata,
    }),
  })
  return res.json()
}

export async function processPayment(reference: string, channel: string, data: Record<string, string>) {
  const res = await fetch(`${NOTCHPAY_API_URL}/payments/${reference}`, {
    method: 'POST',
    headers: {
      'Authorization': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, data }),
  })
  return res.json()
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${NOTCHPAY_API_URL}/payments/${reference}`, {
    headers: { 'Authorization': getApiKey() },
  })
  return res.json()
}

// Pays supportés par Mobile Money
export const MOBILE_MONEY_COUNTRIES: Record<string, {
  name: string
  flag: string
  code: string
  dialCode: string
  phoneLength: number
  channels: { id: string; name: string; icon: string }[]
}> = {
  CM: {
    name: 'Cameroun',
    flag: '🇨🇲',
    code: 'CM',
    dialCode: '+237',
    phoneLength: 9,
    channels: [
      { id: 'cm.mtn', name: 'MTN Mobile Money', icon: '📱' },
      { id: 'cm.orange', name: 'Orange Money', icon: '📱' },
    ],
  },
  CI: {
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    code: 'CI',
    dialCode: '+225',
    phoneLength: 10,
    channels: [
      { id: 'ci.mtn', name: 'MTN Mobile Money', icon: '📱' },
      { id: 'ci.orange', name: 'Orange Money', icon: '📱' },
    ],
  },
  SN: {
    name: 'Sénégal',
    flag: '🇸🇳',
    code: 'SN',
    dialCode: '+221',
    phoneLength: 9,
    channels: [
      { id: 'sn.orange', name: 'Orange Money', icon: '📱' },
    ],
  },
  BF: {
    name: 'Burkina Faso',
    flag: '🇧🇫',
    code: 'BF',
    dialCode: '+226',
    phoneLength: 8,
    channels: [
      { id: 'bf.orange', name: 'Orange Money', icon: '📱' },
    ],
  },
}
