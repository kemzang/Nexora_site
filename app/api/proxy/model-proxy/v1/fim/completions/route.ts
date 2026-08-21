/**
 * FIM (Fill-In-Middle) completions endpoint.
 * Alias of /api/proxy/model-proxy/v1/completions for clients that call the
 * dedicated /fim/completions path (Nexora IDE, some autocomplete clients).
 * Behaviour is identical — DeepSeek beta URL is used automatically.
 */
export { POST } from '../../completions/route'
export const runtime = 'nodejs'

// Duree max de la fonction. 60 s est le plafond du plan Vercel Hobby, donc
// cette valeur se deploie sur tous les plans. Sur un plan Pro, elle peut etre
// montee jusqu'a 300 pour les generations tres longues.
// Autocompletion : normalement rapide, mais une borne haute evite
// qu'un provider lent fasse echouer la requete sur le defaut Vercel.
export const maxDuration = 60
