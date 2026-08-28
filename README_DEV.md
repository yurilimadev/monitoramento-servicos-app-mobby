# README_DEV.md — Diretrizes para manter o template e o repo privado

Este documento é para **você, mantenedor**. Ele explica como gerenciar a branch `template/public` em paralelo com o repositório privado (`main`) e como manter ambos sincronizados.

---

## Estrutura de branches

```
main (privada)
  └── template/public (pública, deriva da main)
```

- `main` — código real do app da prefeitura, com dados, logos, chaves
- `template/public` — versão sanitizada, pronta para ser publicada como open source

---

## Fluxo de atualização

Quando você fizer melhorias na `main` (novas features, correções, refactors) e quiser que o template também receba essas mudanças:

```bash
git checkout template/public
git merge main
```

### O que esperar

A maior parte do código (`src/services/`, `src/stores/`, `src/components/*.vue`, `src/views/*.vue`, `package.json`, etc.) é **idêntica** entre as branches. O merge trará tudo automaticamente.

### Conflitos esperados (e como resolver)

Os únicos arquivos que **divergem** entre as branches são:

| Arquivo | Na `main` | No `template/public` |
|---|---|---|
| `README.md` | README interno (links, dados reais) | README-guia onboarding |
| `index.html` | Título "Monitoramento - APP Mobby" | Título genérico |
| `src/App.vue` | Footer "Yuri Dimitri - SEMPLA" | Footer genérico |
| `src/components/AppHeader.vue` | Título específico | Título genérico |
| `src/views/UpdatePage.vue` | Logo fixo | Logo condicional |
| `src/views/OverviewPage.vue` | Logo fixo | Logo condicional |
| `vite.config.js` | Base URL fixa | Base URL via env |
| `.github/workflows/deploy.yml` | Pode ter secrets diferentes | Pode ter secrets diferentes |
| `.env.example` | Só existe no template | Só existe no template |
| `APPS_SCRIPT.gs` | Só existe no template | Só existe no template |
| `scripts/setup.js` | Só existe no template | Só existe no template |
| `README_DEV.md` | Só existe no template | Só existe no template |

**Ao resolver conflitos, a regra é:** manter a versão do `template/public` para os arquivos de superfície (README, HTML, Vue components de topo) e aceitar a versão de `main` para tudo que for código-fonte (`src/services/`, `src/stores/`, etc.).

### Comando prático para merge

```bash
git checkout template/public
git merge main

# Se houver conflitos no README.md, resolva mantendo a versão DO TEMPLATE
git checkout --ours README.md
git add README.md

# Idem para os outros arquivos de superfície
git checkout --ours index.html
git add index.html
git checkout --ours src/App.vue src/components/AppHeader.vue
git add src/App.vue src/components/AppHeader.vue
git checkout --ours src/views/UpdatePage.vue src/views/OverviewPage.vue
git add src/views/UpdatePage.vue src/views/OverviewPage.vue
git checkout --ours vite.config.js .github/workflows/deploy.yml
git add vite.config.js .github/workflows/deploy.yml

# Para código-fonte, aceite a versão da main (--theirs)
git checkout --theirs src/services/sheetApi.js
git add src/services/sheetApi.js
# ... repita para cada arquivo de código que conflitou

git commit
```

---

## Publicando no GitHub

### Se for manter em branch separada (neste repo)

Faça push da branch e crie um PR de `template/public` → `main` **apenas se quiser revisar**. O ideal é **não mergear** — mantenha `template/public` como branch viva.

Para expor ao público, você pode:

1. Configurar o GitHub Pages da branch `template/public` (Settings → Pages → Branch: `template/public`)
2. Ou criar um **novo repositório** e fazer push seletivo:

```bash
git subtree push --prefix=. origin template/public
# ou use git push com refspec específico
```

### Se for criar repositório separado (recomendado para visibilidade)

```bash
git remote add public https://github.com/seu-usuario/monitoramento-servicos-template.git
git push public template/public:main
```

Isso cria um repositório público limpo. Para atualizá-lo depois:

```bash
git checkout template/public
git merge main
# resolve conflitos (ver seção acima)
git push public template/public:main
```

---

## Boas práticas

### Nunca versionar secrets

- `.env`, `.env.production`, `*.local` estão no `.gitignore`
- A branch `template/public` nunca deve conter chaves reais
- Se acidentalmente um secret for commitado, **rotacione a chave imediatamente**

### Mantenha o `.env.example` atualizado

Sempre que adicionar uma nova `VITE_*` variável no `config.js` ou no `deploy.yml`, atualize também o `.env.example`.

### Teste o template antes de publicar

```bash
git checkout template/public
npm run build
npm run preview
```

Verifique se:
- Não há referências a dados reais
- O título e footer estão genéricos
- O logo não quebra a página (use `v-if` como implementado)

### Script de inicialização

O `scripts/setup.js` deve ser testado sempre que a estrutura de arquivos mudar. Rode:

```bash
node scripts/setup.js
```

em uma cópia limpa do template para garantir que funciona.

---

## Checklist para nova release do template

- [ ] `git checkout main && git pull`
- [ ] `git checkout template/public && git merge main`
- [ ] Resolver conflitos (manter versão do template nos arquivos de superfície)
- [ ] Verificar se `index.html`, `App.vue`, `AppHeader.vue` estão genéricos
- [ ] Verificar se `README.md` é o guia onboarding (não o interno)
- [ ] Verificar se `README_DEV.md` está presente (não subir para o repositório público se for separado)
- [ ] Verificar se `logo-pmn.png`, CSV, banner não estão presentes
- [ ] Verificar se `public/` tem `.gitkeep` (não pode conter arquivos privados)
- [ ] Rodar `npm run build` — não deve ter erros
- [ ] Fazer commit: `git commit -m "chore(template): sync with main @ <hash>"`
- [ ] Fazer push: `git push origin template/public` e/ou `git push public template/public:main`