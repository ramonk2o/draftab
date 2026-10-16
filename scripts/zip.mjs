// Builds the package to upload to the Chrome Web Store: draftab-<version>.zip.
// Run with `npm run zip` (which builds first). Adds to dist/:
//   - LICENSE (Draftab's own license)
//   - THIRD_PARTY_NOTICES.txt (licenses of the dependencies bundled in the extension,
//     which their licenses (MIT, Apache 2.0) require to go along with copies)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'))

if (manifest.version !== pkg.version) {
  throw new Error(`Version mismatch: manifest ${manifest.version}, package.json ${pkg.version}`)
}

// Production dependencies only (devDependencies are build tools and don't ship)
const listing = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], { cwd: root, encoding: 'utf8' })
const folders = [...new Set(listing.trim().split('\n'))].filter((folder) => folder !== root).sort()

const notices = []
for (const folder of folders) {
  const info = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8'))
  const licenseFile = fs.readdirSync(folder).find((name) => /^(licen[sc]e|copying)(\.(md|txt))?$/i.test(name))
  const text = licenseFile ? fs.readFileSync(path.join(folder, licenseFile), 'utf8').trim() : `License: ${info.license}`
  notices.push(`${info.name}@${info.version} (${info.license})\n${'-'.repeat(60)}\n${text}`)
}

const header =
  'Draftab bundles the following open source packages. Their licenses are reproduced below.\n\n'
fs.writeFileSync(path.join(dist, 'THIRD_PARTY_NOTICES.txt'), header + notices.join('\n\n\n') + '\n')
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(dist, 'LICENSE'))

const zipName = `draftab-${manifest.version}.zip`
fs.rmSync(path.join(root, zipName), { force: true })
execFileSync('zip', ['-r', '-X', '-q', path.join(root, zipName), '.'], { cwd: dist })

const size = (fs.statSync(path.join(root, zipName)).size / 1024).toFixed(0)
console.log(`${zipName} created (${size} KB, ${folders.length} bundled packages listed in THIRD_PARTY_NOTICES.txt)`)
