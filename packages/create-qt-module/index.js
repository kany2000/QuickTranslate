#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rl = createInterface({ input: process.stdin, output: process.stdout })

const TYPES = [
  { id: 'translator', label: 'Translation Engine', desc: 'Translate API' },
  { id: 'mode', label: 'Interaction Mode', desc: 'Selection hover screenshot' },
  { id: 'renderer', label: 'UI Renderer', desc: 'Display translation results' },
  { id: 'processor', label: 'Processor', desc: 'Text pre/post processing' },
  { id: 'service', label: 'Service', desc: 'Background data service' },
  { id: 'theme', label: 'Theme', desc: 'UI visual theme' }
]

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve))
}

function sanitizeId(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toClassName(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '').slice(0, 16) || 'my-module'
}

async function main() {
  console.log('\n🧩  QuickTranslate Module Scaffold\n')

  // 1. Select type
  console.log('Select module type:')
  TYPES.forEach((t, i) => console.log(`  ${i + 1}. ${t.label} — ${t.desc}`))
  const typeChoice = await ask(`\nNumber (1-${TYPES.length}): `)
  const typeIdx = parseInt(typeChoice) - 1
  const type = TYPES[typeIdx] || TYPES[0]

  // 2. Module name
  const name = await ask('Module name (e.g. DeepL Translate): ')
  if (!name.trim()) {
    console.log('❌ Name is required')
    rl.close()
    return
  }

  // 3. Author
  const author = await ask('Author (GitHub username): ') || 'developer'

  // 4. Description
  const desc = await ask('Short description: ') || 'A QuickTranslate module'

  // Generate IDs
  const id = slugify(name)
  const className = toClassName(id)
  const templateFile = path.join(__dirname, 'templates', `${type.id}.js`)
  const outputFile = path.join(process.cwd(), `${type.id}-${id}.qt-module`)

  if (!fs.existsSync(templateFile)) {
    console.log(`❌ Template not found: ${templateFile}`)
    rl.close()
    return
  }

  // Process template
  let content = fs.readFileSync(templateFile, 'utf8')
  content = content
    .replace(/\{\{NAME\}\}/g, name.trim())
    .replace(/\{\{ID\}\}/g, id)
    .replace(/\{\{CLASSNAME\}\}/g, className)
    .replace(/\{\{AUTHOR\}\}/g, author.trim())
    .replace(/\{\{DESCRIPTION\}\}/g, desc.trim())
    .replace(/\{\{DATE\}\}/g, new Date().toISOString().split('T')[0])

  fs.writeFileSync(outputFile, content, 'utf8')

  console.log(`\n✅  Module created: ${outputFile}`)
  console.log(`\nNext steps:`)
  console.log(`  1. Open the file and implement translate()`)
  console.log(`  2. Import into QuickTranslate: 🧩 Modules → Import Module`)
  console.log(`  3. If you need settings UI, add options to manifest`)

  rl.close()
}

main().catch(err => {
  console.error('Error:', err.message)
  rl.close()
})
