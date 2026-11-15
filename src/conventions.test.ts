import { describe, expect, test } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// Project rules from CLAUDE.md → Conventions that a test can check.

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('manifest permissions', () => {
  const manifest = JSON.parse(read('public/manifest.json')).permissions.slice().sort()

  test('STORE.md has a justification for each permission, and only those', () => {
    const inStore = [...read('STORE.md').matchAll(/^\| `([a-zA-Z]+)` \|/gm)].map((m) => m[1]).sort()
    expect(inStore).toEqual(manifest)
  })
})

test('only storage.ts uses chrome.storage', () => {
  const allowed = ['storage.ts', 'fake-chrome.ts']
  const offenders = readdirSync('src')
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !allowed.includes(f))
    .filter((f) => /chrome\.storage\.(local|sync|session|onChanged)/.test(read(`src/${f}`)))
  expect(offenders).toEqual([])
})
