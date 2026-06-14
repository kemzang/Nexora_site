/**
 * Integration tests for payment routes (runs against live deployment).
 *
 * Usage:
 *   PROXY_URL=https://nexora-mu-henna.vercel.app npx tsx tests/integration/payments.test.ts
 */

const BASE = process.env.PROXY_URL || 'https://nexora-mu-henna.vercel.app'

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
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`)
    },
    toContain(sub: string) {
      if (!String(actual).includes(sub)) throw new Error(`Expected "${actual}" to contain "${sub}"`)
    },
  }
}

console.log(`\n🧪  Nexora Payment Routes Integration Tests`)
console.log(`    Target: ${BASE}\n`)

// ── /api/payments/initialize ──────────────────────────────────────────────────

await test('POST /api/payments/initialize → 400 (missing required fields)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toBeTruthy()
})

await test('POST /api/payments/initialize → 400 (missing email)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 3000, name: 'Test User' }),
  })
  expect(res.status).toBe(400)
})

await test('POST /api/payments/initialize → 400 (invalid email)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 3000, email: 'not-an-email', name: 'Test User' }),
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toContain('email')
})

await test('POST /api/payments/initialize → 400 (invalid plan)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 3000, email: 'test@example.com', name: 'Test', plan: 'mega_ultra_plan' }),
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toContain('Plan')
})

await test('POST /api/payments/initialize → 400 (invalid currency)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 3000, email: 'test@example.com', name: 'Test', currency: 'DOGECOIN' }),
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toContain('Devise')
})

await test('POST /api/payments/initialize → 400 (negative amount)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: -100, email: 'test@example.com', name: 'Test' }),
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toContain('Montant')
})

await test('POST /api/payments/initialize → 400 (zero amount)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 0, email: 'test@example.com', name: 'Test' }),
  })
  expect(res.status).toBe(400)
})

await test('POST /api/payments/initialize → 200 or 400 (valid XAF starter payload)', async () => {
  const res = await fetch(`${BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 3000,
      currency: 'XAF',
      email: 'testintegration@nexora.dev',
      name: 'Integration Test',
      plan: 'starter',
    }),
  })
  // 200 = Notchpay accepted | 400 = Notchpay rejected (test key / sandbox) — both mean route works
  expect(res.status === 200 || res.status === 400).toBeTruthy()
  const body = await res.json()
  // Should not be a 500 internal error
  expect(body.error !== 'Erreur serveur').toBeTruthy()
})

// ── /api/payments/verify ──────────────────────────────────────────────────────

await test('GET /api/payments/verify → 400 (no reference)', async () => {
  const res = await fetch(`${BASE}/api/payments/verify`)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toContain('Référence')
})

await test('GET /api/payments/verify?reference=fake_ref → not 500', async () => {
  const res = await fetch(`${BASE}/api/payments/verify?reference=fake_nexora_test_ref_000`)
  // Could be 200 (with failed/not-found status) or 400 from Notchpay — must not be 500
  expect(res.status !== 500).toBeTruthy()
})

// ── /api/payments/process ─────────────────────────────────────────────────────

await test('POST /api/payments/process → not 404', async () => {
  const res = await fetch(`${BASE}/api/payments/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  expect(res.status !== 404).toBeTruthy()
})

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  Total: ${results.length}  ✅ ${passed}  ❌ ${failed}`)
console.log(`${'─'.repeat(50)}\n`)

if (failed > 0) process.exit(1)
