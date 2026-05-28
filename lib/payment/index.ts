import type { PaymentProvider } from './types'
import { notchpayProvider } from './providers/notchpay'

// Pour ajouter un nouveau provider :
// 1. Crée lib/payment/providers/stripe.ts qui implémente PaymentProvider
// 2. Importe-le ici et ajoute-le dans PROVIDERS
// 3. Change PAYMENT_PROVIDER=stripe dans .env.local — c'est tout

const PROVIDERS: Record<string, PaymentProvider> = {
  notchpay: notchpayProvider,
}

function getProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? 'notchpay'
  const provider = PROVIDERS[name]
  if (!provider) throw new Error(`Provider de paiement inconnu: "${name}". Disponibles: ${Object.keys(PROVIDERS).join(', ')}`)
  return provider
}

const payment = getProvider()

export const { initializePayment, processPayment, verifyPayment, mobileMoneyCountries } = payment
export type { PaymentProvider, InitPaymentParams, InitPaymentResult, ProcessPaymentResult, VerifyPaymentResult, MobileMoneyCountry } from './types'
