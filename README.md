# Modo Foco

App desktop para **organizar o dia**, **Pomodoro**, **alertas de distração** (Windows, pelo título da janela ativa), **calculadora** e **pesquisa web rápida** (DuckDuckGo). Interface em português.

## Requisitos

- Node.js 20.19+ ou 22.12+ ([electron-vite](https://electron-vite.org/guide/))

## Instalar e rodar em desenvolvimento

```bash
npm install
npm run dev
```

## Gerar instalador e versão portátil (.exe) no Windows

```bash
npm run build:win
```

Arquivos gerados em `dist-electron/` (saída do electron-builder; evita conflito com `release/` preso no Windows):

- `*-setup.exe` — instalador (NSIS)
- `Modo Foco *.exe` — portátil (sem instalar)

Se o build falhar por **symlink / winCodeSign** no Windows, tente no PowerShell antes do comando:

```powershell
$env:CSC_IDENTITY_AUTO_DISCOVERY='false'
npm run build:win
```

O projeto já usa `signAndEditExecutable: false` no `electron-builder.yml` para reduzir esse tipo de erro.

**Dica:** builds antigos podem ter ficado em `release/`; os novos vão para `dist-electron/`. Se `release\win-unpacked` continuar preso, pode apagar depois de reiniciar — não atrapalha o próximo `build:win`. Para a limpeza falhar de propósito (CI), use `STRICT_RELEASE_CLEAN=1` ao rodar o script de limpar.

## Scripts úteis

| Comando           | Uso                |
| ----------------- | ------------------ |
| `npm run dev`     | App com hot reload |
| `npm run build`   | Só compilação      |
| `npm run build:win` | Empacota para Windows |
| `npm run publish:win` | Build + envia Release no GitHub (precisa `GH_TOKEN`) |
| `npm run lint`    | ESLint             |
| `npm run format`  | Prettier           |

## Atualização automática (GitHub Releases)

O app usa **`electron-updater`**: em builds **instalados pelo setup (NSIS)** ele consulta **Releases públicas** do repositório indicado no `package.json` (`repository.url`) e compara com a versão em `"version"`.

1. **Configure o repositório** — no `package.json`, troque `SEU_USUARIO` e `SEU_REPO` em `repository` e `homepage` pelo seu GitHub real (o `electron-builder` usa isso no `publish.provider: github`).
2. **Distribua o instalador** — envie o **`*-setup.exe`** para quem vai receber atualizações. O **.exe portátil** não participa do auto-update (variável `PORTABLE_EXECUTABLE_DIR`); nesse caso a pessoa baixa releases manualmente.
3. **Ao lançar versão nova** — suba o `"version"` no `package.json` (ex.: `1.0.1`) e publique no GitHub:
   - **Opção A (recomendada):** crie um [Personal Access Token](https://github.com/settings/tokens) com escopo `repo`, defina no PowerShell ` $env:GH_TOKEN="seu_token" ` e rode `npm run publish:win` (sobe os artefatos e cria/atualiza a Release).
   - **Opção B:** rode só `npm run build:win` e, no GitHub, crie uma **Release** nova anexando manualmente os arquivos de `dist-electron/` (incluindo `latest.yml` e o `.exe` do setup, gerados pelo build).

Depois do download, o app pergunta se quer **reiniciar para instalar**. Há verificação automática ~10 s após abrir (só no app empacotado) e o botão **Verificar atualização** na tela inicial.

## Personalizar

- **Rotina do dia:** lista salva no `localStorage` do app (`ModuloRotina.tsx`).
- **Lista de sites “suspeitos” no monitor:** `src/main/servicoMonitorFoco.ts`.
- **Nome do app / ícone:** `electron-builder.yml`, `package.json` e pasta `build/` (ícones do electron-builder).
