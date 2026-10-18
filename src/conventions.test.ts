import { describe, expect, test } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// Project rules from CLAUDE.md → Conventions that a test can check.

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('manifest permissions', () => {
  const manifest = JSON.parse(read('public/manifest.json')).permissions.slice().sort()

  test('SPEC.md lists the same permissions as the manifest', () => {
    const line = read('SPEC.md').split('\n').find((l) => l.startsWith('- Permissions:'))
    expect(line).toBeDefined()
    // Only the list before the "—" counts; the rest of the line explains it.
    const list = line!.split('—')[0]
    const inSpec = [...list.matchAll(/`([a-zA-Z]+)`/g)].map((m) => m[1]).sort()
    expect(inSpec).toEqual(manifest)
  })

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
