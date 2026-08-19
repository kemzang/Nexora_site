import { AlertTriangle } from 'lucide-react'

/**
 * Bandeau de mise en garde affiché sur les pages légales (CGU, confidentialité).
 * Ces pages sont un point de départ rédigé à partir du fonctionnement réel du
 * produit, PAS un avis juridique — elles doivent être relues par un
 * professionnel du droit avant d'être considérées comme définitives et
 * opposables.
 */
export function LegalDisclaimer() {
  return (
    <div className="flex gap-3 border rounded-xl px-4 py-3.5 mb-10 leading-relaxed bg-amber-500/10 border-amber-500/25 text-amber-200">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm">
        Ce document est un modèle de départ, rédigé à partir du fonctionnement réel du produit à ce jour.
        Il ne constitue pas un avis juridique et doit être relu par un professionnel du droit avant d'être
        considéré comme définitif et juridiquement opposable.
      </p>
    </div>
  )
}
