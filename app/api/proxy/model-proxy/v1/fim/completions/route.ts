/**
 * FIM (Fill-In-Middle) completions endpoint.
 * Alias of /api/proxy/model-proxy/v1/completions for clients that call the
 * dedicated /fim/completions path (Nexora IDE, some autocomplete clients).
 * Behaviour is identical — DeepSeek beta URL is used automatically.
 */
export { POST } from '../../completions/route'
export const runtime = 'nodejs'
