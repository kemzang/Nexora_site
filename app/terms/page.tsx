import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'
import { LegalDisclaimer } from '@/components/patterns/legal-disclaimer'

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Nexora",
  description: "Conditions générales d'utilisation du service Nexora.",
}

const SECTIONS = [
  { id: 'objet', label: '1. Objet' },
  { id: 'compte', label: '2. Compte utilisateur' },
  { id: 'abonnements', label: '3. Abonnements & paiement' },
  { id: 'usage', label: '4. Usage autorisé' },
  { id: 'ia', label: '5. Suggestions générées par IA' },
  { id: 'propriete', label: '6. Propriété intellectuelle' },
  { id: 'responsabilite', label: '7. Limitation de responsabilité' },
  { id: 'resiliation', label: '8. Résiliation' },
  { id: 'modifications', label: '9. Modification des présentes conditions' },
  { id: 'droit', label: '10. Droit applicable' },
  { id: 'contact', label: '11. Contact' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Conditions d'utilisation</h1>
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
              Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'utilisation du
              service Nexora — l'extension d'intelligence artificielle pour éditeurs de code (VS Code, IDE
              JetBrains) et son interface en ligne de commande, ainsi que le site et le tableau de bord associés
              (ensemble, le « Service »). En créant un compte ou en utilisant le Service, vous acceptez les
              présentes conditions.
            </p>

            <section id="objet" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">1. Objet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nexora fournit un accès à des modèles d'intelligence artificielle tiers (DeepSeek, Gemini, Claude
                selon votre plan) au travers d'un chat intégré, d'une autocomplétion de code, d'un mode Agent et
                d'une édition inline, accessibles depuis une extension IDE ou une interface en ligne de commande.
                L'accès aux fonctionnalités et aux modèles dépend du plan souscrit — voir la page{' '}
                <Link href="/pricing" className="text-foreground/80 hover:text-foreground underline underline-offset-4">Tarifs</Link>.
              </p>
            </section>

            <section id="compte" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">2. Compte utilisateur</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                L'utilisation du Service nécessite la création d'un compte. Vous êtes responsable de
                l'exactitude des informations fournies et de la confidentialité de vos identifiants. Toute
                activité effectuée depuis votre compte est réputée effectuée par vous.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vous devez nous informer sans délai de toute utilisation non autorisée de votre compte, en nous
                contactant (voir section 11).
              </p>
            </section>

            <section id="abonnements" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">3. Abonnements & paiement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Nexora propose un plan gratuit ainsi que plusieurs plans payants avec facturation mensuelle,
                détaillés sur la page <Link href="/pricing" className="text-foreground/80 hover:text-foreground underline underline-offset-4">Tarifs</Link>.
                Chaque plan donne accès à un quota de crédits mensuel, un nombre de requêtes par jour et un
                nombre de collaborateurs maximal. Les crédits non consommés ne sont pas reportés d'un mois sur
                l'autre.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Les paiements sont traités par notre prestataire tiers NotchPay (carte bancaire et Mobile
                Money). Nexora ne stocke pas vos données de carte bancaire.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Une fois votre quota mensuel de crédits atteint, l'accès aux fonctionnalités IA est suspendu
                jusqu'au renouvellement de votre période ou jusqu'à une mise à niveau vers un plan supérieur,
                que vous pouvez effectuer à tout moment depuis votre tableau de bord. Pour toute question relative
                à la facturation, à l'annulation ou à un remboursement, contactez notre support (section 11) :
                ces situations sont traitées au cas par cas.
              </p>
            </section>

            <section id="usage" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">4. Usage autorisé</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">Vous vous engagez à ne pas :</p>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside mb-3">
                <li>Revendre, sous-licencier ou redistribuer l'accès au Service sans autorisation ;</li>
                <li>Contourner ou tenter de contourner les quotas, limites de débit ou mesures de sécurité du Service ;</li>
                <li>Utiliser le Service à des fins illégales ou pour produire du contenu illicite, malveillant ou nuisible ;</li>
                <li>Perturber le fonctionnement du Service ou en extraire les données de façon automatisée en dehors de l'usage prévu.</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le Service inclut des mesures automatiques de détection visant à limiter l'exécution de commandes
                dangereuses proposées par l'IA (suppression de fichiers, exfiltration de données, etc.). Ces
                mesures réduisent les risques mais ne les éliminent pas : vous restez responsable de la revue de
                toute action ou commande avant de l'exécuter.
              </p>
            </section>

            <section id="ia" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">5. Suggestions générées par IA</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le code, les explications et les suggestions produits par les modèles d'IA accessibles via
                Nexora sont fournis à titre indicatif et peuvent contenir des erreurs, des approximations ou du
                contenu inapproprié. Vous êtes seul responsable de la relecture, du test et de la validation de
                tout code ou contenu généré avant de l'utiliser, notamment en environnement de production.
              </p>
            </section>

            <section id="propriete" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">6. Propriété intellectuelle</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vous conservez l'intégralité des droits sur votre code source et vos données. Nexora ne
                revendique aucun droit de propriété sur le contenu que vous créez ou traitez via le Service. Le
                Service lui-même (marque, interface, logiciel) reste la propriété de Nexora et de ses concédants.
              </p>
            </section>

            <section id="responsabilite" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">7. Limitation de responsabilité</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le Service est fourni « en l'état », sans garantie de disponibilité continue, d'exactitude des
                réponses de l'IA ou d'absence d'erreur, hormis les engagements spécifiques éventuellement
                convenus contractuellement avec les clients du plan Enterprise. Dans les limites permises par la
                loi applicable, Nexora ne pourra être tenu responsable des dommages indirects résultant de
                l'utilisation du Service ou du code généré par l'IA.
              </p>
            </section>

            <section id="resiliation" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">8. Résiliation</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vous pouvez cesser d'utiliser le Service et demander la clôture de votre compte à tout moment en
                nous contactant. Nexora se réserve le droit de suspendre ou de résilier l'accès d'un compte en
                cas de violation manifeste des présentes conditions.
              </p>
            </section>

            <section id="modifications" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">9. Modification des présentes conditions</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ces conditions peuvent évoluer pour refléter les changements apportés au Service. La date de
                dernière mise à jour en haut de cette page permet de suivre les révisions. Nous vous invitons à
                la consulter périodiquement.
              </p>
            </section>

            <section id="droit" className="mb-9 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">10. Droit applicable</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le droit applicable et la juridiction compétente seront précisés lors de la revue juridique de ce
                document (voir l'avertissement en haut de page).
              </p>
            </section>

            <section id="contact" className="mb-2 scroll-mt-24">
              <h2 className="text-lg font-bold mb-3">11. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pour toute question relative à ces conditions, contactez-nous à{' '}
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
