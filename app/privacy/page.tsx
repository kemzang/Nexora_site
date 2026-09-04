import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'
import { LegalDisclaimer } from '@/components/patterns/legal-disclaimer'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Nexora',
  description: 'Comment Nexora collecte, utilise et protège vos données personnelles.',
}

const SECTIONS = [
  { id: 'donnees', label: '1. Données collectées' },
  { id: 'finalites', label: '2. Finalités' },
  { id: 'paiement', label: '3. Paiement' },
  { id: 'cookies', label: '4. Cookies & stockage local' },
  { id: 'tiers', label: '5. Prestataires tiers' },
  { id: 'conservation', label: '6. Conservation des données' },
  { id: 'securite', label: '7. Sécurité' },
  { id: 'droits', label: '8. Vos droits' },
  { id: 'mineurs', label: '9. Mineurs' },
  { id: 'modifications', label: '10. Modifications' },
  { id: 'contact', label: '11. Contact' },
]

const SUBPROCESSORS = [
  { name: 'Supabase', role: "Hébergement de la base de données, authentification et stockage du compte utilisateur." },
  { name: 'Paddle', role: "Revendeur officiel (Merchant of Record) : traite les paiements par carte bancaire, la TVA/taxes internationales et la facturation. Nexora ne stocke pas vos données de carte." },
  { name: 'Resend', role: "Envoi des emails transactionnels (confirmation de paiement, notifications de compte)." },
  { name: 'Upstash', role: "Cache technique utilisé pour la limitation de débit (anti-abus) et la cohérence des quotas." },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Politique de confidentialité</h1>
          <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 18 août 2026</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="space-y-1 sticky top-24">
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`} className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-colors">
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="flex-1 min-w-0 max-w-2xl">
            <LegalDisclaimer />

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Cette politique explique quelles données Nexora collecte lorsque vous utilisez notre extension IDE,
              notre CLI, notre site et notre tableau de bord (ensemble, le « Service »), pourquoi nous les
              collectons, et les choix dont vous disposez.
            </p>

            <section id="donnees" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">1. Données collectées</h2>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside">
                <li><strong className="text-foreground/80 font-medium">Compte</strong> : adresse email, nom affiché, langue préférée.</li>
                <li><strong className="text-foreground/80 font-medium">Abonnement & facturation</strong> : plan souscrit, historique de paiement (traité par Paddle, voir section 5).</li>
                <li><strong className="text-foreground/80 font-medium">Utilisation du Service</strong> : volume de tokens consommés par requête, modèle IA utilisé et horodatage — nécessaires au calcul de votre quota et à la facturation. Le contenu de vos conversations et de votre code est transmis aux modèles IA pour générer une réponse, mais n'est pas conservé par Nexora au-delà de ce qui est nécessaire au fonctionnement du Service.</li>
                <li><strong className="text-foreground/80 font-medium">Préférences d'extension</strong> : réglages enregistrés dans l'extension IDE (modèle préféré, etc.).</li>
                <li><strong className="text-foreground/80 font-medium">Clés API</strong> : si vous générez des clés API depuis le tableau de bord pour authentifier l'extension ou la CLI.</li>
              </ul>
            </section>

            <section id="finalites" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">2. Finalités</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nous utilisons ces données pour : fournir et maintenir le Service, authentifier votre compte,
                calculer votre consommation de crédits et appliquer les limites de votre plan, traiter les
                paiements, assurer la sécurité du Service (limitation de débit, détection d'abus), et répondre à
                vos demandes de support.
              </p>
            </section>

            <section id="paiement" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">3. Paiement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les paiements sont traités par notre prestataire Paddle, qui agit en tant que revendeur officiel
                (Merchant of Record) et gère directement vos informations de carte bancaire ainsi que la TVA/taxes
                applicables. Nexora n'a pas accès à votre numéro de carte complet et ne le stocke pas sur ses
                serveurs.
              </p>
            </section>

            <section id="cookies" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">4. Cookies & stockage local</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Le site utilise le stockage local de votre navigateur (localStorage) à des fins strictement
                fonctionnelles :
              </p>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside mb-3">
                <li>Maintenir votre session connectée ;</li>
                <li>Mémoriser votre langue d'affichage préférée ;</li>
                <li>Mémoriser votre préférence d'affichage clair / sombre.</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nous n'utilisons pas de cookies publicitaires ni de traceurs tiers à des fins commerciales ou de
                profilage.
              </p>
            </section>

            <section id="tiers" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">5. Prestataires tiers</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Nous faisons appel aux prestataires techniques suivants pour faire fonctionner le Service :
              </p>
              <div className="space-y-2.5">
                {SUBPROCESSORS.map(p => (
                  <div key={p.name} className="p-3.5 rounded-xl bg-white/[0.03] border border-border/50">
                    <p className="text-sm font-semibold mb-0.5">{p.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.role}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Selon le ou les modèles IA sollicités par votre requête (DeepSeek, Gemini ou Claude), le contenu
                nécessaire à la génération de la réponse est transmis au fournisseur du modèle correspondant.
              </p>
            </section>

            <section id="conservation" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">6. Conservation des données</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vos données de compte et d'utilisation sont conservées aussi longtemps que votre compte est
                actif. Si vous demandez la suppression de votre compte, nous supprimons ou anonymisons vos
                données personnelles dans un délai raisonnable, sous réserve des obligations légales de
                conservation (notamment comptables) qui pourraient s'appliquer à certaines données de
                facturation.
              </p>
            </section>

            <section id="securite" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">7. Sécurité</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les échanges avec le Service sont chiffrés en transit (TLS). L'accès à votre compte est protégé
                par les mécanismes d'authentification de Supabase, et l'accès à vos données par nos équipes est
                limité à ce qui est nécessaire pour exploiter et sécuriser le Service.
              </p>
            </section>

            <section id="droits" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">8. Vos droits</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quel que soit votre pays de résidence, vous pouvez nous contacter pour demander l'accès,
                la rectification ou la suppression de vos données personnelles, ou pour obtenir un export de vos
                données de compte. Pour exercer ces droits, écrivez-nous à{' '}
                <a href="mailto:contact@nexora.ai" className="text-foreground/80 hover:text-foreground underline underline-offset-4">contact@nexora.ai</a>.
              </p>
            </section>

            <section id="mineurs" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">9. Mineurs</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le Service ne s'adresse pas aux personnes de moins de 16 ans. Nous ne collectons pas
                sciemment de données concernant des mineurs de moins de 16 ans.
              </p>
            </section>

            <section id="modifications" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">10. Modifications</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cette politique peut être mise à jour pour refléter l'évolution du Service ou de la
                réglementation applicable. La date de dernière mise à jour en haut de cette page reflète la
                version en vigueur.
              </p>
            </section>

            <section id="contact" className="mb-2 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">11. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pour toute question relative à cette politique ou à vos données personnelles, contactez-nous à{' '}
                <a href="mailto:contact@nexora.ai" className="text-foreground/80 hover:text-foreground underline underline-offset-4">contact@nexora.ai</a>{' '}
                ou consultez notre page <Link href="/contact" className="text-foreground/80 hover:text-foreground underline underline-offset-4">Contact</Link>.
              </p>
            </section>
          </article>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
