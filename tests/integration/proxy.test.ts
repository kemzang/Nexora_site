/**
 * Integration tests for the Nexora proxy (runs against live deployment).
 *
 * Usage:
 *   PROXY_URL=https://nexora-mu-henna.vercel.app TEST_TOKEN=nxr_... npx tsx tests/integration/proxy.test.ts
 *
 * In CI:
 *   npx tsx tests/integration/proxy.test.ts
 */

const BASE = process.env.PROXY_URL || 'https://nexora-mu-henna.vercel.app'
const TOKEN = process.env.TEST_TOKEN || ''

type TestResult = { name: string; passed: boolean; ms: number; info?: string }

const results: TestResult[] = []
let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const t0 = Date.now()
  try {
    await fn()
    results.push({ name, passed: true, ms: Date.now() - t0 })
    passed++
    console.log(`  ✅  ${name}  (${Date.now() - t0}ms)`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    results.push({ name, passed: false, ms: Date.now() - t0, info: msg })
    failed++
    console.log(`  ❌  ${name}  (${Date.now() - t0}ms)\n      ${msg}`)
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`)
    },
    toContain(sub: string) {
      if (!String(actual).includes(sub)) throw new Error(`Expected "${actual}" to contain "${sub}"`)
    },
    toBeGreaterThanOrEqual(n: number) {
      if ((actual as number) < n) throw new Error(`Expected ${actual} >= ${n}`)
    },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log(`\n🧪  Nexora Proxy Integration Tests`)
console.log(`    Target: ${BASE}\n`)

// 1. Health check
await test('GET /api/health → 200 with ok status', async () => {
  const res = await fetch(`${BASE}/api/health`)
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
  expect(body.proxy).toContain('vercel')
})

await test('HEAD /api/health → 200', async () => {
  const res = await fetch(`${BASE}/api/health`, { method: 'HEAD' })
  expect(res.status).toBe(200)
})

// 2. Auth gate on model-proxy routes
await test('POST /api/proxy/model-proxy/v1/chat/completions → 401 (no token)', async () => {
  const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }] }),
  })
  expect(res.status).toBe(401)
})

await test('POST /api/proxy/model-proxy/v1/completions → 401 (no token)', async () => {
  const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', prompt: 'def hello' }),
  })
  expect(res.status).toBe(401)
})

await test('POST /api/proxy/model-proxy/v1/embeddings → 401 (no token)', async () => {
  const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', input: 'hello world' }),
  })
  expect(res.status).toBe(401)
})

await test('GET /api/proxy/model-proxy/v1/models → 401 (no token)', async () => {
  const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/models`)
  expect(res.status).toBe(401)
})

// 3. Invalid token format
await test('POST /api/proxy/model-proxy/v1/chat/completions → 401 (invalid token)', async () => {
  const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer INVALID_TOKEN_FORMAT' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  })
  expect(res.status).toBe(401)
})

// 4. Auth routes exist
await test('POST /api/auth/generate-auth-code → not 404', async () => {
  const res = await fetch(`${BASE}/api/auth/generate-auth-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  expect(res.status !== 404).toBeTruthy()
})

await test('POST /api/auth/exchange-code → 400 (missing code)', async () => {
  const res = await fetch(`${BASE}/api/auth/exchange-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  expect(res.status).toBe(400)
})

// 5. Callback pages render
await test('GET /tokens/callback → not 404', async () => {
  const res = await fetch(`${BASE}/tokens/callback`)
  expect(res.status !== 404).toBeTruthy()
})

await test('GET /tokens/onboarding-callback → not 404', async () => {
  const res = await fetch(`${BASE}/tokens/onboarding-callback`)
  expect(res.status !== 404).toBeTruthy()
})

// 6. CORS headers on proxy routes
await test('OPTIONS /api/proxy/model-proxy/v1/chat/completions → CORS headers', async () => {
  const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/chat/completions`, {
    method: 'OPTIONS',
    headers: { Origin: 'vscode-webview://some-id', 'Access-Control-Request-Method': 'POST' },
  })
  expect(res.status).toBe(204)
  const acao = res.headers.get('access-control-allow-origin')
  expect(acao !== null).toBeTruthy()
})

// 7. Authenticated tests (only run if TEST_TOKEN is provided)
if (TOKEN) {
  await test('GET /api/proxy/model-proxy/v1/models → 200 with model list', async () => {
    const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/models`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.object).toBe('list')
    expect(Array.isArray(body.data)).toBeTruthy()
    expect(body.data.length).toBeGreaterThanOrEqual(1)
  })

  await test('POST /api/proxy/model-proxy/v1/chat/completions → 200 (stream=false)', async () => {
    const res = await fetch(`${BASE}/api/proxy/model-proxy/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Reply with exactly: NEXORA_TEST_OK' }],
        stream: false,
        max_tokens: 20,
      }),
    })
    // Accept 200 or 429 (limit reached) — both mean the route is working
    expect(res.status === 200 || res.status === 429).toBeTruthy()
  })
} else {
  console.log('\n  ⚠️  Skipping authenticated tests — set TEST_TOKEN env var to enable them.\n')
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  Total: ${results.length}  ✅ ${passed}  ❌ ${failed}`)
console.log(`${'─'.repeat(50)}\n`)

if (failed > 0) process.exit(1)
