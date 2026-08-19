import type { Metadata } from 'next'
import PricingPageClient from './pricing-client'

export const metadata: Metadata = {
  title: 'Tarifs — Nexora',
  description: 'Plans Nexora : Free, Starter, Pro, Business et Enterprise. Comparez les crédits, modèles IA et fonctionnalités inclus dans chaque plan.',
}

export default function PricingPage() {
  return <PricingPageClient />
}
