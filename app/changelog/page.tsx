import type { Metadata } from 'next'
import ChangelogPageClient from './changelog-client'

export const metadata: Metadata = {
  title: 'Changelog — Nexora',
  description: 'Les dernières améliorations apportées à Nexora.',
}

export default function ChangelogPage() {
  return <ChangelogPageClient />
}
