#!/usr/bin/env node

/**
 * setup.js — Script de inicializao do template
 *
 * Uso:
 *   node scripts/setup.js
 *
 * Pergunta nome, ttulo, autor e substitui placeholders nos arquivos.
 * Cria .env a partir de .env.example, instala dependncias.
 */

import { createInterface } from 'readline'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function main() {
  console.log('\n=== Monitoramento de Servios — Template Setup ===\n')

  const projectName = await ask('Nome do projeto (ex: meu-monitoramento): ') || 'meu-monitoramento'
  const appTitle = await ask('Ttulo do app (ex: Monitoramento - Meu Setor): ') || 'Monitoramento de Servios'
  const author = await ask('Autor (para o footer): ') || ''
  const repoUrl = await ask('URL do repositrio GitHub (opcional): ') || ''

  const filesToUpdate = [
    'index.html',
    'src/components/AppHeader.vue',
    'src/App.vue',
    'README.md',
  ]

  for (const file of filesToUpdate) {
    const filePath = join(root, file)
    if (!existsSync(filePath)) {
      console.warn(`  [AVISO] ${file} no encontrado — pulando`)
      continue
    }
    let content = readFileSync(filePath, 'utf-8')
    content = content
      .replace(/Monitoramento - APP Mobby/g, appTitle)
      .replace(/Monitoramento de Servios — Template/g, appTitle)
      .replace(/Monitoramento de Servios/g, appTitle)
      .replace(/Yuri Dimitri - SEMPLA - 2026/g, author)
      .replace(/Feito com Vue 3 \+ Google Sheets/g, `Feito com Vue 3 + Google Sheets ${author ? '- ' + author : ''}`)
      .replace(/\/monitoramento-servicos-app-mobby\//g, repoUrl ? repoUrl.replace(/^https?:\/\/[^\/]+/, '') + '/' : '/')
    writeFileSync(filePath, content, 'utf-8')
    console.log(`  [OK] ${file} atualizado`)
  }

  // Cria .env a partir do .env.example se ainda no existir
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) {
    const envExample = readFileSync(join(root, '.env.example'), 'utf-8')
    writeFileSync(envPath, envExample, 'utf-8')
    console.log('  [OK] .env criado a partir de .env.example')
  } else {
    console.log('  [OK] .env j existe — mantido')
  }

  // package.json: atualiza name
  const pkgPath = join(root, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.name = projectName
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    console.log(`  [OK] package.json name → ${projectName}`)
  }

  // Instalar dependncias
  console.log('\nInstalando dependncias...')
  try {
    execSync('npm install', { cwd: root, stdio: 'inherit' })
    console.log('  [OK] npm install concluído')
  } catch {
    console.warn('  [AVISO] npm install falhou — execute manualmente')
  }

  console.log('\n=== Próximos passos ===')
  console.log('1. Preencha o arquivo .env com suas credenciais')
  console.log('2. npm run dev              # Iniciar servidor local')
  console.log('3. npm run build            # Produzir dist/ para deploy')
  console.log('4. Crie os secrets no GitHub e faça push para main\n')

  rl.close()
}

main()