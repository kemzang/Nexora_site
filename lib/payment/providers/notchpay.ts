import type { PaymentProvider, InitPaymentParams, InitPaymentResult, ProcessPaymentResult, VerifyPaymentResult, MobileMoneyCountry } from '../types'

const API_URL = 'https://api.notchpay.co'

function getKey() {
  const key = process.env.NOTCHPAY_PUBLIC_KEY
  if (!key) throw new Error('NOTCHPAY_PUBLIC_KEY manquante')
  return key
}

const mobileMoneyCountries: Record<string, MobileMoneyCountry> = {
  CM: {
    name: 'Cameroun', flag: '🇨🇲', code: 'CM', dialCode: '+237', phoneLength: 9,
    channels: [
      { id: 'cm.mtn', name: 'MTN Mobile Money', icon: '📱' },
      { id: 'cm.orange', name: 'Orange Money', icon: '📱' },
    ],
  },
  CI: {
    name: "Côte d'Ivoire", flag: '🇨🇮', code: 'CI', dialCode: '+225', phoneLength: 10,
    channels: [
      { id: 'ci.mtn', name: 'MTN Mobile Money', icon: '📱' },
      { id: 'ci.orange', name: 'Orange Money', icon: '📱' },
    ],
  },
  SN: {
    name: 'Sénégal', flag: '🇸🇳', code: 'SN', dialCode: '+221', phoneLength: 9,
    channels: [{ id: 'sn.orange', name: 'Orange Money', icon: '📱' }],
  },
  BF: {
    name: 'Burkina Faso', flag: '🇧🇫', code: 'BF', dialCode: '+226', phoneLength: 8,
    channels: [{ id: 'bf.orange', name: 'Orange Money', icon: '📱' }],
  },
}

async function initializePayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const { amount, currency = 'XAF', email, name, phone, description, reference, callbackUrl, metadata } = params
  const res = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Authorization': getKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount, currency,
      customer: { name, email, phone },
      description, reference,
      callback: callbackUrl,
      metadata,
    }),
  })
  const data = await res.json()
  if (data.code === 201 || data.status === 'Accepted') {
    return { success: true, reference: data.transaction?.reference, authorizationUrl: data.authorization_url, raw: data }
  }
  return { success: false, error: data.message || 'Erreur initialisation', raw: data }
}

async function processPayment(reference: string, channel: string, data: Record<string, string>): Promise<ProcessPaymentResult> {
  const res = await fetch(`${API_URL}/payments/${reference}`, {
    method: 'POST',
    headers: { 'Authorization': getKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, data }),
  })
  const result = await res.json()
  return {
    success: result.code === 202 || result.status === 'Accepted',
    status: result.transaction?.status,
    message: result.message,
    raw: result,
  }
}

async function verifyPayment(reference: string): Promise<VerifyPaymentResult> {
  const res = await fetch(`${API_URL}/payments/${reference}`, {
    headers: { 'Authorization': getKey() },
  })
  const data = await res.json()
  return { success: true, status: data.transaction?.status, transaction: data.transaction, raw: data }
}

export const notchpayProvider: PaymentProvider = {
  initializePayment,
  processPayment,
  verifyPayment,
  mobileMoneyCountries,
}
