// 语法基线校验：遍历仓库内所有 .js（排除 node_modules / *.min.js / releases），
// 用 `node --check` 做纯语法校验，不执行代码。零依赖。
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
// 仅按目录 basename 跳过（模板含 {{占位符}}，非真实语法错误）
const SKIP = new Set([
  'node_modules',
  'releases',
  '.git',
  'templates',
  'QuickTranslate-assets',
  'quicktranslate-promotion'
])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (!SKIP.has(name)) walk(full, out)
    } else if (extname(name) === '.js' && !name.endsWith('.min.js')) {
      out.push(full)
    }
  }
  return out
}

const files = walk(ROOT)
let failed = 0
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
  } catch (e) {
    failed++
    console.error('❌ SYNTAX ERROR:', f.replace(ROOT, '.'))
    console.error(String(e.stderr || e.message).split('\n').slice(0, 3).join('\n'))
  }
}

console.log(
  failed === 0
    ? `✅ 语法校验通过：${files.length} 个 JS 文件无语法错误`
    : `⚠️ ${failed}/${files.length} 个文件存在语法错误`
)
process.exit(failed === 0 ? 0 : 1)
