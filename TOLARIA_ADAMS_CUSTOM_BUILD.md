# Tolaria Adams: как повторить кастомную сборку

Этот файл — самодостаточная инструкция для агента или разработчика, которому нужно взять актуальную Tolaria, сделать кастомную визуальную сборку в стиле Adams/Love Theme и собрать отдельное macOS-приложение **Tolaria Adams**, не конфликтующее с официальной Tolaria.

## Цель

Нужно получить отдельный `.app`:

- видимое имя: `Tolaria Adams`;
- отдельный macOS bundle id: `club.refactoring.tolaria-adams`;
- отдельная папка пользовательских настроек: `~/Library/Application Support/com.tolaria-adams.app`;
- официальный updater отключен, чтобы кастомная сборка не пыталась обновиться как обычная Tolaria;
- тема по умолчанию темная;
- оформление похоже на Adams/Love Theme: темный Perplexity-подобный интерфейс, PPLX-шрифты, синие заголовки, мягкие границы, увеличенный ритм текста.

## Перед началом

Рабочая папка в этом запуске была:

```bash
/Users/igor.adams/ClaudeCode/TolariaFork
```

Перед изменениями полезно синхронизировать форк с оригинальным upstream:

```bash
git remote -v
git fetch upstream
git fetch origin
git merge --ff-only upstream/main
git push origin main
```

Ожидаемая схема remote:

```bash
origin   https://github.com/abstramagic27/tolaria.git
upstream https://github.com/refactoringhq/tolaria.git
```

Если локальная ветка уже содержит кастомные изменения, сначала реши, нужно ли их сохранять, потому что `--ff-only` пройдет только без расхождения истории.

## Файлы, которые нужно поменять

Минимальный набор файлов для повторения этой сборки:

```text
index.html
src-tauri/tauri.conf.json
src-tauri/src/commands/system.rs
src-tauri/src/settings.rs
src-tauri/src/vault_list.rs
src/lib/themeMode.ts
src/index.css
src/theme.json
src/components/EditorTheme.css
public/fonts/PPLX-Sans-Beta-v1-VF.woff2
public/fonts/PPLX-Mono-Beta-v0-VF.woff2
```

## Переименование приложения

В `src-tauri/tauri.conf.json` поменять:

```json
{
  "productName": "Tolaria Adams",
  "identifier": "club.refactoring.tolaria-adams"
}
```

Внутри `app.windows[0]`:

```json
{
  "title": "Tolaria Adams",
  "backgroundColor": "#171615"
}
```

Внутри `bundle`:

```json
{
  "createUpdaterArtifacts": false
}
```

Почему это важно:

- `productName` меняет видимое имя `.app`;
- `identifier` отделяет приложение на уровне macOS;
- `backgroundColor` убирает светлую вспышку при старте;
- `createUpdaterArtifacts: false` нужен, потому что сборка updater artifacts требует signing private key. Без ключа `tauri build` может собрать `.app`, но упасть на этапе updater-подписи.

В `index.html` поменять title:

```html
<title>Tolaria Adams</title>
```

## Отдельные настройки, чтобы не конфликтовать с обычной Tolaria

Одного bundle id недостаточно. В исходниках Tolaria есть ручные имена папок настроек. Их тоже нужно поменять.

В `src-tauri/src/settings.rs`:

```rust
const APP_CONFIG_DIR: &str = "com.tolaria-adams.app";
```

В `src-tauri/src/vault_list.rs`:

```rust
const APP_CONFIG_DIR: &str = "com.tolaria-adams.app";
```

Иначе официальная Tolaria и Tolaria Adams будут выглядеть как разные приложения, но могут читать один и тот же список vault-ов/настроек из `com.tolaria.app`.

После этой правки:

- официальная Tolaria использует `~/Library/Application Support/com.tolaria.app`;
- Tolaria Adams использует `~/Library/Application Support/com.tolaria-adams.app`;
- при первом запуске Tolaria Adams, возможно, придется заново открыть нужный vault, потому что список vault-ов теперь отдельный.

## Отключение официального updater

В `src-tauri/src/commands/system.rs` desktop-команды updater лучше обезвредить.

Нужно сделать так, чтобы проверка обновлений ничего не находила:

```rust
#[cfg(desktop)]
#[tauri::command]
pub async fn check_for_app_update(
    _app_handle: tauri::AppHandle,
    _release_channel: Option<String>,
) -> Result<Option<crate::app_updater::AppUpdateMetadata>, String> {
    Ok(None)
}
```

А установка обновлений возвращала понятную ошибку:

```rust
#[cfg(desktop)]
#[tauri::command]
pub async fn download_and_install_app_update(
    _app_handle: tauri::AppHandle,
    _release_channel: Option<String>,
    _expected_version: String,
    _on_event: Channel<crate::app_updater::AppUpdateDownloadEvent>,
) -> Result<(), String> {
    Err("Tolaria Adams uses a custom local build, so official Tolaria updates are disabled.".into())
}
```

Почему это важно: если оставить официальный updater, кастомная сборка может начать предлагать обновление от оригинальной Tolaria, и это сломает идею отдельной Adams-сборки.

## Темная тема по умолчанию

В `src/lib/themeMode.ts`:

```ts
export const DEFAULT_THEME_MODE = 'dark'
```

Это не запрещает переключение темы в интерфейсе, но новый профиль стартует в темном режиме.

## Шрифты

В этой сборке использовались локальные WOFF2:

```text
public/fonts/PPLX-Sans-Beta-v1-VF.woff2
public/fonts/PPLX-Mono-Beta-v0-VF.woff2
```

Если шрифты лежат в другом месте, скопируй их в `public/fonts/` с этими именами или обнови пути в CSS.

В начало `src/index.css` добавить:

```css
@font-face {
  font-family: "pplxSans";
  src: url("/fonts/PPLX-Sans-Beta-v1-VF.woff2") format("woff2");
  font-display: swap;
  font-weight: 100 900;
}

@font-face {
  font-family: "pplxSansMono";
  src: url("/fonts/PPLX-Mono-Beta-v0-VF.woff2") format("woff2");
  font-display: swap;
  font-weight: 100 900;
}
```

Затем в `:root`:

```css
font-family: "pplxSans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
font-variation-settings: "DRKM" 1, "slnt" 0;
line-height: 1.68;
font-weight: 400;
font-size: 15.5px;
letter-spacing: -0.01em;
```

Для `body` тоже полезно добавить:

```css
font-variation-settings: "DRKM" 1, "slnt" 0;
```

## Палитра Adams/Love Theme

Основные цвета:

```css
#171615 /* app/editor background */
#1b1a19 /* sidebar/panel/input */
#1e1d1c /* card/popover/dialog */
#242322 /* hover/button/code inline */
#2d2c2b /* subtle border/code border */
#333231 /* default border */
#343332 /* strong border */

#d6d5d4 /* primary text */
#b8b7b6 /* secondary text */
#8a8988 /* muted/tertiary text */
#636261 /* faint text */

#72aefd /* main blue accent */
#8dbdff /* soft blue accent */
#90baf1 /* hover link/accent */
#2e3c4f /* selected background */
```

В `src/index.css` в блоке `@layer theme .dark` заменить темные semantic variables примерно на:

```css
--surface-app: #171615;
--surface-sidebar: #1b1a19;
--surface-panel: #1b1a19;
--surface-card: #1e1d1c;
--surface-popover: #1e1d1c;
--surface-input: #1b1a19;
--surface-button: #242322;
--surface-dialog: #1e1d1c;
--surface-editor: #171615;
--surface-overlay: rgba(10, 10, 9, 0.62);

--text-primary: #d6d5d4;
--text-secondary: #b8b7b6;
--text-tertiary: #8a8988;
--text-muted: #8a8988;
--text-faint: #636261;
--text-heading: #72aefd;
--text-inverse: #151411;

--border-default: #333231;
--border-subtle: #2d2c2b;
--border-strong: #343332;
--border-input: #333231;
--border-dialog: #333231;
--border-focus: #72aefd;

--state-hover: #242322;
--state-hover-subtle: #1e1d1c;
--state-selected: #2e3c4f;
--state-selected-strong: #324760;
--state-active: #2e3c4f;
--state-focus-ring: #72aefd;
--state-drag-target: rgba(114, 174, 253, 0.18);
--state-disabled: #242322;

--accent-blue: #72aefd;
--accent-blue-bg: rgba(114, 174, 253, 0.17);
--accent-blue-hover: #90baf1;
--accent-blue-light: rgba(141, 189, 255, 0.15);
```

Для code/syntax ролей:

```css
--syntax-heading: #72aefd;
--syntax-link: #72aefd;
--syntax-monospace: #8dbdff;
--syntax-monospace-bg: #242322;
--syntax-muted: #8a8988;
--syntax-frontmatter-key: #ff7a70;
--syntax-frontmatter-value: #05a905;
--syntax-highlight-comment: #05a905;
--syntax-highlight-keyword: #ff7a70;
--syntax-highlight-string: #0b8bdc;
--syntax-highlight-number: #d6a2ff;
--syntax-highlight-title: #ff9f43;
--syntax-highlight-type: #72aefd;
--syntax-highlight-deletion: #ff7a70;
--editor-code-block-background: #1e1d1c;
--editor-code-block-border: #2d2c2b;
--editor-code-block-text: #d6d5d4;
--editor-code-block-language: #8dbdff;
```

## Markdown/AI chat оформление

В `src/index.css` блок `.ai-markdown` привести к такому смыслу:

```css
.ai-markdown {
  font-size: 15.5px;
  line-height: 1.68;
  color: var(--foreground);
  letter-spacing: -0.01em;
}

.ai-markdown strong,
.ai-markdown b {
  color: var(--text-primary);
  font-weight: 700;
  font-variation-settings: "DRKM" 1, "slnt" 0;
}

.ai-markdown p > strong:first-child,
.ai-markdown li > strong:first-child,
.ai-markdown li > p:first-child > strong:first-child,
.ai-markdown li > p > strong:first-child {
  color: #8dbdff;
}

.ai-markdown em,
.ai-markdown i:not([class*="icon"]) {
  font-style: normal;
  font-variation-settings: "DRKM" 1, "slnt" 90;
}

.ai-markdown h1,
.ai-markdown h2,
.ai-markdown h3,
.ai-markdown h4 {
  color: var(--accent-blue);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.ai-markdown h1,
.ai-markdown h2 {
  border-bottom: 1px solid var(--state-hover);
}

.ai-markdown ul > li::marker,
.ai-markdown ol > li::marker {
  color: #8dbdff;
}

.ai-markdown code {
  background: #242322;
  border: 1px solid #2d2c2b;
  border-radius: 0.25rem;
  color: #8dbdff;
  font-family: "pplxSansMono", "SF Mono", "Fira Code", Menlo, Consolas, monospace;
}

.ai-markdown pre {
  border: 1px solid #2d2c2b;
  border-radius: 0.75rem;
  background: #1e1d1c;
}

.ai-markdown blockquote {
  border-left: 3px solid var(--accent-blue);
}
```

Отдельная важная защита:

```css
.ai-markdown button h3,
.ai-markdown [role="button"] h3 {
  color: var(--text-primary);
}
```

Она нужна, чтобы синие `h3` не ломали заголовки внутри кликабельных UI-элементов.

## Редактор

В `src/theme.json` задать параметры редактора:

```json
{
  "editor": {
    "fontFamily": "\"pplxSans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
    "fontSize": 15.5,
    "lineHeight": 1.68,
    "maxWidth": 960,
    "paddingHorizontal": 32,
    "paddingVertical": 24,
    "paragraphSpacing": 10
  }
}
```

Заголовки:

```json
{
  "headings": {
    "h1": {
      "fontSize": 25,
      "fontWeight": 700,
      "lineHeight": 1.25,
      "color": "var(--accent-blue)",
      "letterSpacing": "-0.02em"
    },
    "h2": {
      "fontSize": 19.5,
      "fontWeight": 700,
      "lineHeight": 1.3,
      "color": "var(--accent-blue)",
      "letterSpacing": "-0.02em"
    },
    "h3": {
      "fontSize": 17,
      "fontWeight": 700,
      "lineHeight": 1.35,
      "color": "var(--accent-blue)",
      "letterSpacing": "-0.02em"
    },
    "h4": {
      "fontSize": 15.5,
      "fontWeight": 700,
      "lineHeight": 1.4,
      "color": "var(--accent-blue)",
      "letterSpacing": 0
    }
  }
}
```

Inline code:

```json
{
  "inlineStyles": {
    "code": {
      "fontFamily": "\"pplxSansMono\", \"SF Mono\", \"Fira Code\", Menlo, Consolas, monospace",
      "fontSize": 14,
      "backgroundColor": "#242322",
      "paddingHorizontal": 5,
      "paddingVertical": 2,
      "borderRadius": 4,
      "color": "#8dbdff"
    }
  }
}
```

В `src/components/EditorTheme.css`:

```css
.editor__blocknote-container .bn-editor {
  margin: 0 auto 0 0;
  font-variation-settings: "DRKM" 1, "slnt" 0;
  letter-spacing: -0.01em;
}

.editor__blocknote-container strong,
.editor__blocknote-container b {
  color: var(--text-primary);
  font-weight: 700 !important;
  font-variation-settings: "DRKM" 1, "slnt" 0;
}

.editor__blocknote-container em,
.editor__blocknote-container i:not([class*="icon"]) {
  font-style: normal !important;
  font-variation-settings: "DRKM" 1, "slnt" 90 !important;
}

.editor__blocknote-container .bn-inline-content > strong:first-child,
.editor__blocknote-container .bn-inline-content > b:first-child {
  color: #8dbdff;
}

.editor__blocknote-container .bn-block-outer:has(h1) {
  padding-bottom: 0.3em !important;
  border-bottom: 1px solid var(--state-hover);
}

.editor__blocknote-container .bn-block-outer:has(> .bn-block > [data-content-type="heading"][data-level="2"]) {
  padding-bottom: 0.25em !important;
  border-bottom: 1px solid var(--state-hover);
}
```

`margin: 0 auto 0 0` делает документ не центрированным строго по экрану, а левее, с сохранением max-width. Это ближе к нужному ощущению “рабочего markdown-документа”.

## Команды сборки

На этой машине рабочим оказался Node из nvm:

```bash
$HOME/.nvm/versions/node/v20.19.5/bin/node
```

Если `pnpm` не находится в PATH, можно использовать Corepack. В этом запуске был создан временный wrapper:

```bash
mkdir -p /private/tmp
cat > /private/tmp/pnpm <<'SH'
#!/bin/sh
exec "$HOME/.nvm/versions/node/v20.19.5/bin/node" "$HOME/.cache/node/corepack/v1/pnpm/10.23.0/bin/pnpm.cjs" "$@"
SH
chmod +x /private/tmp/pnpm
```

Важно: в этом репозитории lockfile был совместим с pnpm 10.23.0. pnpm 11 пытался менять lock/workspace-конфигурацию и создавал лишний шум.

Перед сборкой:

```bash
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm install
```

Frontend-only проверка:

```bash
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm build
```

Сборка macOS `.app`:

```bash
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm tauri build --bundles app
```

Ожидаемый результат:

```text
src-tauri/target/release/bundle/macos/Tolaria Adams.app
```

## Проверка результата

Проверить Info.plist:

```bash
plutil -p "src-tauri/target/release/bundle/macos/Tolaria Adams.app/Contents/Info.plist"
```

Ключевые строки должны быть:

```text
"CFBundleDisplayName" => "Tolaria Adams"
"CFBundleIdentifier" => "club.refactoring.tolaria-adams"
"CFBundleName" => "Tolaria Adams"
```

Проверить размер:

```bash
du -sh "src-tauri/target/release/bundle/macos/Tolaria Adams.app"
```

В текущей сборке размер был около:

```text
27M
```

Проверить, что в git остались только осмысленные изменения:

```bash
git status --short
```

Ожидаемо изменены:

```text
index.html
src-tauri/src/commands/system.rs
src-tauri/src/settings.rs
src-tauri/src/vault_list.rs
src-tauri/tauri.conf.json
src/components/EditorTheme.css
src/index.css
src/lib/themeMode.ts
src/theme.json
public/fonts/
```

## Известные ловушки

### 1. Официальная Tolaria и Tolaria Adams

Если поменять только имя приложения, конфликт возможен. Нужно обязательно поменять:

- `identifier` в `src-tauri/tauri.conf.json`;
- `APP_CONFIG_DIR` в `src-tauri/src/settings.rs`;
- `APP_CONFIG_DIR` в `src-tauri/src/vault_list.rs`;
- updater-команды в `src-tauri/src/commands/system.rs`.

После этого приложения могут жить рядом. Но если открыть один и тот же vault одновременно в обеих программах, они все равно будут редактировать одни и те же markdown/git-файлы. Это уже не конфликт приложений, а обычный риск одновременного редактирования одной рабочей папки.

### 2. DMG

`pnpm tauri build --bundles app` собрал `.app` успешно.

Полная сборка всех bundle targets может падать на `bundle_dmg.sh`. Для локального использования `.app` достаточно. Если нужен DMG, его нужно чинить отдельно, уже как packaging-задачу.

### 3. Updater artifacts

Если оставить:

```json
"createUpdaterArtifacts": true
```

сборка может упасть из-за отсутствующего `TAURI_SIGNING_PRIVATE_KEY`. Для кастомной локальной сборки поставить:

```json
"createUpdaterArtifacts": false
```

### 4. Node 24 и Rollup

В Codex desktop окружении Node 24 приводил к ошибке native Rollup-модуля на macOS из-за code signature / Team ID. Обход: запускать pnpm через nvm Node 20.19.5.

Команды выше специально добавляют:

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH"
```

### 5. pnpm 11

pnpm 11 может попытаться переписать lockfile/workspace-настройки. В этом репозитории лучше использовать pnpm 10.23.0, если lockfile еще в формате `lockfileVersion: '9.0'`.

### 6. Сгенерированная `.pnpm-store`

Если после install появилась `.pnpm-store/` в корне репозитория и она не нужна, удалить:

```bash
rm -rf .pnpm-store
```

Не коммитить ее.

## Короткий чеклист для следующего агента

1. Обновить форк от `upstream/main`.
2. Переименовать `productName`, `title`, HTML title.
3. Поменять bundle id на `club.refactoring.tolaria-adams`.
4. Поменять оба `APP_CONFIG_DIR` на `com.tolaria-adams.app`.
5. Отключить updater-команды и updater artifacts.
6. Добавить PPLX WOFF2 в `public/fonts/`.
7. Добавить `@font-face` в `src/index.css`.
8. Заменить dark theme variables на Adams-палитру.
9. Поменять `DEFAULT_THEME_MODE` на `dark`.
10. Настроить `src/theme.json` для редактора.
11. Настроить `src/components/EditorTheme.css` для BlockNote.
12. Собрать:

```bash
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm install
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm tauri build --bundles app
```

13. Проверить Info.plist:

```bash
plutil -p "src-tauri/target/release/bundle/macos/Tolaria Adams.app/Contents/Info.plist"
```

14. Убедиться, что:

```text
CFBundleDisplayName = Tolaria Adams
CFBundleIdentifier = club.refactoring.tolaria-adams
```

## Что получилось в текущем запуске

Финальный app bundle:

```text
/Users/igor.adams/ClaudeCode/TolariaFork/src-tauri/target/release/bundle/macos/Tolaria Adams.app
```

Проверенные метаданные:

```text
CFBundleDisplayName = Tolaria Adams
CFBundleIdentifier = club.refactoring.tolaria-adams
CFBundleName = Tolaria Adams
```

Сборка:

```text
pnpm tauri build --bundles app
```

завершилась успешно.

## Как обновляться, когда upstream выпустил новую версию

Правильная стратегия: держать кастомизацию Adams как отдельный понятный слой поверх актуальной Tolaria.

То есть история должна выглядеть примерно так:

```text
upstream/main:  A---B---C---D
                         \
fork/main:                adams-theme-commit
```

Когда разработчик Tolaria завтра выпустит новую версию:

```text
upstream/main:  A---B---C---D---E---F
                         \
fork/main:                adams-theme-commit
```

Нужно подтянуть `E---F` в свой `main`, сохранить Adams-правки, пересобрать `.app` и запушить результат в свой fork.

### Важно перед первым обновлением

Текущие Adams-изменения лучше закоммитить отдельным коммитом, например:

```bash
git status --short
git add index.html \
  src-tauri/tauri.conf.json \
  src-tauri/src/commands/system.rs \
  src-tauri/src/settings.rs \
  src-tauri/src/vault_list.rs \
  src/lib/themeMode.ts \
  src/index.css \
  src/theme.json \
  src/components/EditorTheme.css \
  public/fonts \
  TOLARIA_ADAMS_CUSTOM_BUILD.md
git commit -m "feat: add Tolaria Adams custom build"
git push origin main
```

Без отдельного коммита обновляться неудобно: Git не сможет четко отличить “мои кастомные правки” от “нового upstream”.

### Быстрый стандартный путь обновления

Использовать merge. Это самый спокойный вариант для fork-а, где важнее не красивая линейная история, а не потерять свою кастомизацию.

```bash
git status --short
git fetch upstream
git fetch origin
git merge upstream/main
```

Если конфликтов нет:

```bash
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm install
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm tauri build --bundles app
```

Проверить:

```bash
plutil -p "src-tauri/target/release/bundle/macos/Tolaria Adams.app/Contents/Info.plist"
```

Убедиться, что осталось:

```text
CFBundleDisplayName = Tolaria Adams
CFBundleIdentifier = club.refactoring.tolaria-adams
```

Затем:

```bash
git status --short
git push origin main
```

### Если появились конфликты

Скорее всего они будут в тех же файлах, где живет Adams-слой:

```text
src-tauri/tauri.conf.json
src-tauri/src/commands/system.rs
src-tauri/src/settings.rs
src-tauri/src/vault_list.rs
src/index.css
src/theme.json
src/components/EditorTheme.css
src/lib/themeMode.ts
index.html
```

Правило разрешения конфликтов:

- новую логику upstream сохранять;
- Adams-идентичность сохранять;
- Adams-тему сохранять;
- updater оставлять выключенным;
- `APP_CONFIG_DIR` оставлять `com.tolaria-adams.app`;
- bundle identifier оставлять `club.refactoring.tolaria-adams`;
- product/window/html title оставлять `Tolaria Adams`.

После ручного разрешения конфликтов:

```bash
git add <resolved-files>
git commit
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm tauri build --bundles app
git push origin main
```

### Альтернатива: rebase

Можно делать:

```bash
git fetch upstream
git rebase upstream/main
```

Но для этого fork-а merge обычно безопаснее. Rebase переписывает историю и часто требует `git push --force-with-lease`. Для ручной локальной кастомной сборки это лишний риск.

Rebase имеет смысл только если принципиально нужна чистая линейная история.

### Как быстро проверить, что Adams-слой не потерялся

После каждого upstream update проверить:

```bash
rg "Tolaria Adams|tolaria-adams|com.tolaria-adams.app|createUpdaterArtifacts|DEFAULT_THEME_MODE" \
  index.html \
  src-tauri/tauri.conf.json \
  src-tauri/src/commands/system.rs \
  src-tauri/src/settings.rs \
  src-tauri/src/vault_list.rs \
  src/lib/themeMode.ts
```

В выводе должны быть видны:

```text
Tolaria Adams
club.refactoring.tolaria-adams
com.tolaria-adams.app
createUpdaterArtifacts": false
DEFAULT_THEME_MODE = 'dark'
```

Также проверить, что шрифты на месте:

```bash
find public/fonts -maxdepth 1 -type f -name 'PPLX-*.woff2' -print
```

### Практический итог

Самый быстрый повторяемый цикл:

```bash
git status --short
git fetch upstream
git merge upstream/main
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm install
CI=true PATH="$HOME/.nvm/versions/node/v20.19.5/bin:/private/tmp:$PATH" pnpm tauri build --bundles app
plutil -p "src-tauri/target/release/bundle/macos/Tolaria Adams.app/Contents/Info.plist"
git push origin main
```

Если конфликтов нет, это обычно весь процесс.

Если конфликты есть, сначала разрешить их по правилу: upstream logic плюс Adams identity/theme.
