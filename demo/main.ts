import { createKerningEditor } from '../src/kerningUI'
import { ACTIVE_CLASS, CHAR_CLASS, MODIFIED_CLASS, STORAGE_KEY } from '../src/kerningEditor'
import kerningData from './kerning-export.json'
import { createTour } from './tour'
import { buildTutorialSteps, simulateCmdK, TUTORIAL_DONE_KEY } from './tutorial'

type PersistedArea = { text: string; kerning: number[]; indent: number; font: { family: string; weight: string; size: string } }
type SelectOption = { value: string; text: string }
type ChoicesOption = { value: string; label: string; selected?: boolean; disabled?: boolean }
type ChoicesSettings = {
  searchEnabled?: boolean
  shouldSort?: boolean
  shouldSortItems?: boolean
  searchFields?: string[]
  itemSelectText?: string
  allowHTML?: boolean
  searchResultLimit?: number
  renderChoiceLimit?: number
}
type ChoicesInstance = {
  setChoices: (choices: ChoicesOption[], value?: string, label?: string, replaceChoices?: boolean) => void
  setChoiceByValue: (value: string) => void
  clearStore: () => void
}
type ChoicesConstructor = new (el: HTMLSelectElement, settings: ChoicesSettings) => ChoicesInstance

const IMPORTED_KEY = 'visual-kerning-editor-imported'
const Choices = (window as unknown as { Choices?: ChoicesConstructor }).Choices
if (!Choices) {
  throw new Error('Choices.js is not loaded')
}

function areasToPersistedMap(areas: typeof kerningData.areas): Record<string, PersistedArea> {
  const persisted: Record<string, PersistedArea> = {}
  for (const area of areas) {
    persisted[area.selector] = {
      text: area.text,
      kerning: [...area.kerning],
      indent: area.indent ?? 0,
      font: area.font,
    }
  }
  return persisted
}

// ドロップインポート時: インポートデータを維持、フラグ消化
// 通常時: localStorageクリア → バンドルJSONを書き込み
if (localStorage.getItem(IMPORTED_KEY)) {
  localStorage.removeItem(IMPORTED_KEY)
} else {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(TUTORIAL_DONE_KEY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(areasToPersistedMap(kerningData.areas)))
}

const editor = createKerningEditor({ locale: 'en' })
editor.mount()

// チュートリアル済みならエディタONで開始、初回はOFFでチュートリアルから
if (localStorage.getItem(TUTORIAL_DONE_KEY)) {
  editor.plugin.enabled.value = true
}

const tour = createTour({
  doneKey: TUTORIAL_DONE_KEY,
  steps: buildTutorialSteps((handler) => editor.plugin.on('enable', handler)),
  onBeforeReplay: () => simulateCmdK(),
  ignoreAttr: 'data-visual-kerning-ignore',
})
tour.start()

// ロード完了後のlocalStorage状態を記録し、変更があれば離脱時に警告
let initialState = ''
setTimeout(() => {
  initialState = localStorage.getItem(STORAGE_KEY) ?? ''
}, 0)
window.addEventListener('beforeunload', (e) => {
  if (tour.active) return
  const current = localStorage.getItem(STORAGE_KEY) ?? ''
  if (current !== initialState) {
    e.preventDefault()
  }
})

function exportAndReset() {
  const json = JSON.stringify(editor.plugin.exportJSON(), null, 2)
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(IMPORTED_KEY)
  return json
}

const globals = window as unknown as { __kerningDemo?: typeof editor; exportKerning?: typeof exportAndReset }
globals.__kerningDemo = editor
globals.exportKerning = exportAndReset

// --- Card size sliders ---
document.querySelectorAll('.card-size-slider').forEach(slider => {
  const input = slider.querySelector('input[type="range"]') as HTMLInputElement
  const output = slider.querySelector('output') as HTMLOutputElement
  const target = slider.closest('.card')?.querySelector('[data-sizable]') as HTMLElement | null
  if (!input || !output || !target) return

  input.addEventListener('input', () => {
    output.textContent = `${input.value}px`
    target.style.setProperty('--size', input.value)
  })
})

// --- Sandbox ---

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Oswald', 'Raleway',
  'Poppins', 'Playfair Display', 'Merriweather', 'Bebas Neue', 'Space Grotesk',
  'DM Sans', 'DM Serif Display', 'Libre Baskerville', 'Cormorant Garamond',
  'Noto Sans JP', 'Noto Serif JP', 'M PLUS 1p', 'Zen Kaku Gothic New',
  'Zen Old Mincho', 'BIZ UDPGothic', 'BIZ UDPMincho', 'DotGothic16',
  'Source Code Pro', 'JetBrains Mono', 'IBM Plex Sans', 'IBM Plex Serif',
  'Archivo', 'Sora', 'Outfit', 'Barlow', 'Barlow Condensed',
  'Crimson Text', 'Fraunces', 'Bricolage Grotesque',
]
const GOOGLE_FONTS_URL = new URL('./google-fonts.json', import.meta.url).toString()

const DEFAULT_LOCAL_FONTS = [
  'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
  'Helvetica', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Noto Sans JP',
  'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Hiragino Mincho ProN',
  'Yu Gothic', 'YuGothic', 'Meiryo', 'MS PGothic', 'MS Mincho',
  'Avenir', 'Avenir Next', 'Avenir Next Condensed', 'Futura', 'Gill Sans',
  'Optima', 'Palatino', 'Hoefler Text', 'Baskerville', 'Didot', 'Georgia',
  'Times', 'Times New Roman', 'American Typewriter', 'Copperplate',
  'Chalkboard', 'Chalkboard SE', 'Chalkduster', 'Marker Felt', 'Noteworthy',
  'Apple SD Gothic Neo', 'AppleGothic', 'Apple Color Emoji',
  'SF Pro Text', 'SF Pro Display', 'SF Pro Rounded', 'SF Mono',
  'Courier', 'Courier New', 'Menlo', 'Monaco', 'Consolas',
]

const loadedFonts = new Set<string>()

function loadGoogleFont(family: string, weight: string) {
  const key = `${family}:${weight}`
  if (loadedFonts.has(key)) return
  loadedFonts.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

type QueryLocalFonts = () => Promise<Array<{ family: string; fullName?: string }>>
type FontSource = 'google' | 'local'

function uniqueSorted(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function uniqueOptions(options: SelectOption[]): SelectOption[] {
  const map = new Map<string, string>()
  for (const option of options) {
    if (!option.value) continue
    if (!map.has(option.value)) map.set(option.value, option.text || option.value)
  }
  return Array.from(map.entries())
    .map(([value, text]) => ({ value, text }))
    .sort((a, b) => a.text.localeCompare(b.text))
}

const fontGoogleSelect = document.getElementById('sb-font-google') as HTMLSelectElement
const fontLocalSelect = document.getElementById('sb-font-local') as HTMLSelectElement
const googleFontStatus = document.getElementById('sb-font-google-status') as HTMLSpanElement
const googleFontLoadBtn = document.getElementById('sb-font-google-load') as HTMLButtonElement
const localFontStatus = document.getElementById('sb-font-local-status') as HTMLSpanElement
const localFontLoadBtn = document.getElementById('sb-font-local-load') as HTMLButtonElement
const luckyBtn = document.getElementById('sb-lucky') as HTMLButtonElement
const messyBtn = document.getElementById('sb-messy') as HTMLButtonElement
const luckyStatus = document.getElementById('sb-lucky-status') as HTMLSpanElement
const sizeInput = document.getElementById('sb-size') as HTMLInputElement
const weightSelect = document.getElementById('sb-weight') as HTMLSelectElement
const weightRange = document.getElementById('sb-weight-range') as HTMLInputElement
const weightRangeWrap = document.getElementById('sb-weight-range-wrap') as HTMLDivElement
const weightOutput = document.getElementById('sb-weight-output') as HTMLOutputElement
const textInput = document.getElementById('sb-input') as HTMLTextAreaElement
const preview = document.getElementById('sb-preview') as HTMLParagraphElement
const exportBtn = document.getElementById('sb-export') as HTMLButtonElement
const resizeHandle = document.getElementById('sb-resize') as HTMLDivElement
const sandboxBody = document.getElementById('sb-body') as HTMLDivElement

// Font selector
const baseGoogleOptions = GOOGLE_FONTS.map(font => ({ value: font, text: font }))
fontGoogleSelect.append(...baseGoogleOptions.map(option => new Option(option.text, option.value)))
fontGoogleSelect.value = 'Inter'

const baseLocalFonts = uniqueSorted(DEFAULT_LOCAL_FONTS)
const baseLocalOptions = baseLocalFonts.map(font => ({ value: font, text: font }))
fontLocalSelect.append(...baseLocalOptions.map(option => new Option(option.text, option.value)))
const defaultLocalFont = baseLocalFonts.includes('system-ui') ? 'system-ui' : baseLocalFonts[0] ?? ''
if (defaultLocalFont) fontLocalSelect.value = defaultLocalFont

const queryLocalFonts = (window as unknown as { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts
if (!queryLocalFonts) {
  localFontStatus.textContent = 'Local font list is available in Chrome/Edge.'
  if (localFontLoadBtn) {
    localFontLoadBtn.disabled = true
    localFontLoadBtn.textContent = 'Unavailable'
  }
}

let googleSelect: ChoicesInstance | null = null
let googleFontsLoaded = false
let googleFontsLoading = false

function syncChoices(instance: ChoicesInstance | null, options: SelectOption[], nextValue: string) {
  if (!instance) return
  const choices = options.map(option => ({
    value: option.value,
    label: option.text,
    selected: option.value === nextValue,
  }))
  instance.setChoices(choices, 'value', 'label', true)
}

function syncGoogleFontOptions(options: SelectOption[]) {
  const nextOptions = uniqueOptions(options)
  const nextValues = nextOptions.map(option => option.value)
  const current = fontGoogleSelect.value
  fontGoogleSelect.replaceChildren(...nextOptions.map(option => new Option(option.text, option.value)))
  const nextValue = nextValues.includes(current) ? current : nextValues[0] ?? ''
  if (nextValue) fontGoogleSelect.value = nextValue
  syncChoices(googleSelect, nextOptions, nextValue)
}

async function ensureGoogleFonts() {
  if (googleFontsLoaded || googleFontsLoading) return
  googleFontsLoading = true
  if (googleFontLoadBtn) {
    googleFontLoadBtn.disabled = true
    googleFontLoadBtn.textContent = 'Loading...'
  }
  if (googleFontStatus) {
    googleFontStatus.classList.remove('is-error')
    googleFontStatus.textContent = 'Loading Google Fonts...'
  }
  try {
    const response = await fetch(GOOGLE_FONTS_URL)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    const data = await response.json() as string[] | { familyMetadataList?: Array<{ family: string }> }
    const families = Array.isArray(data)
      ? data.filter(Boolean)
      : data.familyMetadataList?.map(item => item.family).filter(Boolean) ?? []
    if (families.length === 0) return
    const googleOptions = families.map(font => ({ value: font, text: font }))
    syncGoogleFontOptions(googleOptions)
    googleFontsLoaded = true
    if (googleFontStatus) {
      googleFontStatus.textContent = `Google fonts loaded (${fontGoogleSelect.options.length})`
    }
    if (googleFontLoadBtn) {
      googleFontLoadBtn.textContent = 'Loaded'
    }
  } catch (error) {
    console.warn('[visual-kerning] Failed to load Google Fonts list', error)
    if (googleFontStatus) {
      googleFontStatus.textContent = 'Google font list failed to load.'
      googleFontStatus.classList.add('is-error')
    }
    if (googleFontLoadBtn) {
      googleFontLoadBtn.disabled = false
      googleFontLoadBtn.textContent = 'Load'
    }
  } finally {
    googleFontsLoading = false
  }
}

googleSelect = new Choices(fontGoogleSelect, {
  searchEnabled: true,
  shouldSort: false,
  shouldSortItems: false,
  searchFields: ['label', 'value'],
  itemSelectText: '',
  allowHTML: false,
  searchResultLimit: 500,
  renderChoiceLimit: -1,
})
if (googleFontLoadBtn) {
  googleFontLoadBtn.addEventListener('click', () => {
    void ensureGoogleFonts()
  })
}

let localSelect: ChoicesInstance | null = null
let localFontsLoaded = false
let localFontsLoading = false

function syncLocalFontOptions(options: SelectOption[]) {
  const nextOptions = uniqueOptions(options)
  const nextValues = nextOptions.map(option => option.value)
  const current = fontLocalSelect.value
  fontLocalSelect.replaceChildren(...nextOptions.map(option => new Option(option.text, option.value)))
  const nextValue = nextValues.includes(current) ? current : nextValues[0] ?? ''
  if (nextValue) fontLocalSelect.value = nextValue
  syncChoices(localSelect, nextOptions, nextValue)
}

async function ensureLocalFonts() {
  if (localFontsLoaded || localFontsLoading || !queryLocalFonts) return
  localFontsLoading = true
  localFontStatus.textContent = 'Loading local fonts...'
  if (localFontLoadBtn) {
    localFontLoadBtn.disabled = true
    localFontLoadBtn.textContent = 'Loading...'
  }
  try {
    const fonts = await queryLocalFonts()
    const localOptions = fonts.map(font => ({
      value: font.family,
      text: font.fullName || font.family,
    }))
    syncLocalFontOptions([...baseLocalOptions, ...localOptions])
    localFontStatus.textContent = `Local fonts loaded (${fontLocalSelect.options.length})`
    localFontsLoaded = true
    if (localFontLoadBtn) {
      localFontLoadBtn.textContent = 'Loaded'
    }
  } catch {
    localFontStatus.textContent = 'Local font access was blocked.'
    localFontStatus.classList.add('is-error')
    if (localFontLoadBtn) {
      localFontLoadBtn.disabled = false
      localFontLoadBtn.textContent = 'Load'
    }
  } finally {
    localFontsLoading = false
  }
}

localSelect = new Choices(fontLocalSelect, {
  searchEnabled: true,
  shouldSort: false,
  shouldSortItems: false,
  searchFields: ['label', 'value'],
  itemSelectText: '',
  allowHTML: false,
  searchResultLimit: 500,
  renderChoiceLimit: -1,
})
if (localFontLoadBtn) {
  localFontLoadBtn.addEventListener('click', () => {
    void ensureLocalFonts()
  })
}

function preventScrollJump(root: HTMLElement) {
  let lastScrollX = 0
  let lastScrollY = 0
  root.addEventListener('pointerdown', () => {
    lastScrollX = window.scrollX
    lastScrollY = window.scrollY
  })
  root.addEventListener('focusin', () => {
    requestAnimationFrame(() => {
      if (window.scrollX !== lastScrollX || window.scrollY !== lastScrollY) {
        window.scrollTo(lastScrollX, lastScrollY)
      }
    })
  })
}

document.querySelectorAll('.sandbox-header .choices').forEach(el => {
  preventScrollJump(el as HTMLElement)
})

let activeFontSource: FontSource = 'google'
const VARIABLE_FONTS = new Set([
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Oswald',
  'Raleway',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Space Grotesk',
  'DM Sans',
  'Noto Sans JP',
  'Noto Serif JP',
  'Source Code Pro',
  'JetBrains Mono',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Archivo',
  'Sora',
  'Outfit',
])

function getSelectedFont(): { family: string; source: FontSource } {
  if (activeFontSource === 'local' && fontLocalSelect.value) {
    return { family: fontLocalSelect.value, source: 'local' }
  }
  return { family: fontGoogleSelect.value, source: 'google' }
}


function isVariableFont(family: string, source: FontSource): boolean {
  return source === 'google' && VARIABLE_FONTS.has(family)
}

function getWeightValue(): string {
  if (weightRangeWrap && !weightRangeWrap.hidden) return weightRange.value
  return weightSelect.value
}

function syncWeightControls(value: string) {
  weightSelect.value = value
  if (weightRange) weightRange.value = value
  if (weightOutput) weightOutput.textContent = value
}

function updateWeightUI() {
  const { family, source } = getSelectedFont()
  const useRange = isVariableFont(family, source)
  if (weightRangeWrap) weightRangeWrap.hidden = !useRange
  weightSelect.hidden = useRange
  syncWeightControls(getWeightValue())
}

function updatePreviewStyle() {
  const { family, source } = getSelectedFont()
  const size = sizeInput.value
  const weight = getWeightValue()
  if (source === 'google') loadGoogleFont(family, weight)
  preview.style.fontFamily = `'${family}', ${source === 'google' ? 'sans-serif' : 'system-ui, sans-serif'}`
  preview.style.fontSize = `${size}px`
  preview.style.fontWeight = weight
  const sourceLabel = source === 'google' ? 'Google Fonts' : 'Local Fonts'
  setLuckyStatus(`${sourceLabel}: ${family}.`)
}

function resetPreviewArea() {
  // 既存のカーニング状態をリセットするため、エディタのareaを削除
  const areas = editor.plugin.areas.value
  for (const [selector, area] of areas) {
    if (area.el === preview) {
      area.el.classList.remove(ACTIVE_CLASS, MODIFIED_CLASS)
      areas.delete(selector)
      break
    }
  }
}

function updatePreviewText() {
  const text = textInput.value
  resetPreviewArea()
  preview.textContent = text
}

function normalizeFontFamily(name: string): string {
  const safe = name.replace(/"/g, '\\"')
  const needsQuote = /[\s,]/.test(safe)
  return needsQuote ? `"${safe}"` : safe
}

function setLuckyStatus(message: string, isError = false) {
  if (!luckyStatus) return
  luckyStatus.textContent = message
  luckyStatus.classList.toggle('is-error', isError)
  luckyStatus.style.display = message ? 'inline' : 'none'
}

function getLuckyContext(): { fonts: string[]; text: string } | null {
  if (localFontsLoading) {
    setLuckyStatus('Local fonts are loading...')
    return null
  }
  if (!localFontsLoaded) {
    setLuckyStatus(
      queryLocalFonts
        ? 'Load local fonts first (click Load).'
        : 'Local font access is available in Chrome/Edge.',
      true,
    )
    return null
  }
  const fonts = Array.from(fontLocalSelect.options).map(option => option.value).filter(Boolean)
  if (fonts.length === 0) {
    setLuckyStatus('No local fonts available.', true)
    return null
  }
  const text = textInput.value
  if (!text) {
    setLuckyStatus('Type some text first.', true)
    return null
  }
  return { fonts, text }
}

function applyLucky() {
  const context = getLuckyContext()
  if (!context) return
  const font = context.fonts[Math.floor(Math.random() * context.fonts.length)]
  activeFontSource = 'local'
  fontLocalSelect.value = font
  localSelect?.setChoiceByValue(font)
  updateWeightUI()
  updatePreviewStyle()
  updatePreviewText()
  setLuckyStatus(`Lucky font: ${font}.`)
}

function applyMessy() {
  const context = getLuckyContext()
  if (!context) return
  activeFontSource = 'local'
  updateWeightUI()
  updatePreviewStyle()
  resetPreviewArea()
  const fragment = document.createDocumentFragment()
  for (const char of context.text) {
    const span = document.createElement('span')
    span.textContent = char
    const font = context.fonts[Math.floor(Math.random() * context.fonts.length)]
    span.style.fontFamily = `${normalizeFontFamily(font)}, system-ui, sans-serif`
    fragment.append(span)
  }
  preview.replaceChildren(fragment)
  setLuckyStatus('Messy feel applied.')
}

textInput.addEventListener('input', updatePreviewText)
updateWeightUI()
updatePreviewStyle()
fontGoogleSelect.addEventListener('change', () => {
  activeFontSource = 'google'
  updateWeightUI()
  updatePreviewStyle()
})
fontLocalSelect.addEventListener('change', () => {
  activeFontSource = 'local'
  updateWeightUI()
  updatePreviewStyle()
})
sizeInput.addEventListener('input', updatePreviewStyle)
weightSelect.addEventListener('change', () => {
  syncWeightControls(weightSelect.value)
  updatePreviewStyle()
})
if (weightRange) {
  weightRange.addEventListener('input', () => {
    syncWeightControls(weightRange.value)
    updatePreviewStyle()
  })
}
if (luckyBtn) {
  luckyBtn.addEventListener('click', applyLucky)
}
if (messyBtn) {
  messyBtn.addEventListener('click', applyMessy)
}

// Resize handle
let resizing = false
let resizeStartX = 0
let resizeStartW = 0

if (resizeHandle) {
  resizeHandle.addEventListener('pointerdown', (e: PointerEvent) => {
    e.preventDefault()
    resizing = true
    resizeStartX = e.clientX
    resizeStartW = sandboxBody.offsetWidth
    resizeHandle.classList.add('is-dragging')
    resizeHandle.setPointerCapture(e.pointerId)
  })

  resizeHandle.addEventListener('pointermove', (e: PointerEvent) => {
    if (!resizing) return
    const delta = e.clientX - resizeStartX
    const newW = Math.max(200, resizeStartW + delta)
    sandboxBody.style.maxWidth = `${newW}px`
  })

  function stopResize() {
    resizing = false
    resizeHandle.classList.remove('is-dragging')
  }
  resizeHandle.addEventListener('pointerup', stopResize)
  resizeHandle.addEventListener('pointercancel', stopResize)
}

// --- Import JSON via drag & drop on editor panel ---
const panel = document.querySelector('.visual-kerning-panel') as HTMLElement | null
if (panel) {
  const dropOverlay = document.createElement('div')
  dropOverlay.textContent = 'Drop JSON to import'
  Object.assign(dropOverlay.style, {
    display: 'none',
    position: 'absolute',
    inset: '0',
    background: 'rgba(26, 26, 26, 0.85)',
    color: '#fff',
    font: '600 13px/1 "Space Grotesk", sans-serif',
    letterSpacing: '0.06em',
    borderRadius: 'inherit',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: '1',
  })
  panel.style.position = 'relative'
  panel.appendChild(dropOverlay)

  let dragCount = 0

  panel.addEventListener('dragenter', (e) => {
    e.preventDefault()
    dragCount++
    dropOverlay.style.display = 'flex'
  })

  panel.addEventListener('dragleave', () => {
    dragCount--
    if (dragCount <= 0) {
      dragCount = 0
      dropOverlay.style.display = 'none'
    }
  })

  panel.addEventListener('dragover', (e) => {
    e.preventDefault()
    ;(e as DragEvent).dataTransfer!.dropEffect = 'copy'
  })

  panel.addEventListener('drop', (e) => {
    e.preventDefault()
    dragCount = 0
    dropOverlay.style.display = 'none'
    const file = (e as DragEvent).dataTransfer?.files[0]
    if (!file || !file.name.endsWith('.json')) return

    file.text().then((text) => {
      try {
        const data = JSON.parse(text)
        if (!data.areas || !Array.isArray(data.areas)) {
          console.warn('[visual-kerning] Invalid kerning JSON')
          return
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(areasToPersistedMap(data.areas)))
        localStorage.setItem(IMPORTED_KEY, '1')
        location.reload()
      } catch {
        console.warn('[visual-kerning] Failed to parse dropped JSON')
      }
    })
  })
}

// Export HTML
exportBtn.addEventListener('click', () => {
  const clone = preview.cloneNode(true) as HTMLElement
  // visual-kerning の編集用クラスを除去
  clone.classList.remove(ACTIVE_CLASS, MODIFIED_CLASS, 'sandbox-preview')
  clone.querySelectorAll('[class]').forEach(el => {
    const classes = Array.from(el.classList).filter(c => !c.startsWith('visual-kerning-'))
    if (classes.length === 0) {
      el.removeAttribute('class')
    } else {
      el.className = classes.join(' ')
    }
  })

  const { family, source } = getSelectedFont()
  const size = sizeInput.value
  const weight = weightSelect.value
  const fallback = source === 'google' ? 'sans-serif' : 'system-ui, sans-serif'
  const style = `font-family:'${family}',${fallback}; font-size:${size}px; font-weight:${weight}; line-height:1.1;`
  clone.setAttribute('style', style + ' ' + (clone.getAttribute('style') || ''))

  // span のインラインスタイルから letter-spacing:0em を除去（不要）
  clone.querySelectorAll(`span.${CHAR_CLASS}`).forEach(span => {
    span.style.removeProperty('letter-spacing')
    if (!span.getAttribute('style')?.trim()) span.removeAttribute('style')
  })

  const html = clone.outerHTML
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'visual-kerning-export.html'
  a.click()
  URL.revokeObjectURL(a.href)
})
