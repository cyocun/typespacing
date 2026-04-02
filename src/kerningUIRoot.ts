type ButtonRefs = {
  compareBtn: HTMLButtonElement
  gapsBtn: HTMLButtonElement
  exportBtn: HTMLButtonElement
  resetBtn: HTMLButtonElement
}

export interface KerningUIRootElements extends ButtonRefs {
  root: HTMLDivElement
  cursorEl: HTMLDivElement
  valueEl: HTMLDivElement
  selectionContainer: HTMLDivElement
  areaGuidesContainer: HTMLDivElement
  markersContainer: HTMLDivElement
  panelEl: HTMLDivElement
  panelBodyEl: HTMLDivElement
  dragHandleEl: HTMLDivElement
  collapseBtn: HTMLButtonElement
  toastEl: HTMLSpanElement
  warnEl: HTMLDivElement
}

interface KerningUIRootOptions {
  overlayClass: string
  rootClass: string
  cursorClass: string
  valueClass: string
  selectionClass: string
  selectionHighlightClass: string
  areaGuidesClass: string
  areaGuideClass: string
  markersClass: string
  gapMarkerClass: string
  panelClass: string
  headerClass: string
  headingClass: string
  bodyClass: string
  rowClass: string
  actionsClass: string
  buttonClass: string
  iconButtonClass: string
  helpClass: string
  toastClass: string
  warnClass: string
  charClass: string
  activeClass: string
  pluginName: string
  collapseLabel: string
  compareLabel: string
  guidesLabel: string
  exportLabel: string
  resetLabel: string
  helpText: string
  copiedLabel: string
}

function createDiv(className?: string): HTMLDivElement {
  const el = document.createElement('div')
  if (className) el.className = className
  return el
}

function createButton(className: string, label: string, type: 'button' | 'submit' | 'reset' = 'button') {
  const el = document.createElement('button')
  el.className = className
  el.type = type
  el.textContent = label
  return el
}

function createStyleText(options: KerningUIRootOptions): string {
  const {
    rootClass,
    cursorClass,
    valueClass,
    selectionHighlightClass,
    areaGuideClass,
    gapMarkerClass,
    panelClass,
    headerClass,
    headingClass,
    bodyClass,
    rowClass,
    actionsClass,
    buttonClass,
    iconButtonClass,
    helpClass,
    toastClass,
    warnClass,
    charClass,
    activeClass,
  } = options

  return `
      .${rootClass} { position: fixed; inset: 0; pointer-events: none; z-index: 100000; }
      .${cursorClass} {
        position: fixed;
        width: 2px;
        background: rgba(15,15,15,.95);
        box-shadow: 0 0 0 1px rgba(255,255,255,.85);
        pointer-events: none;
        display: none;
      }
      .${valueClass} {
        position: fixed; transform: translate(-50%, -100%); margin-top: -8px;
        background: #000; color: #fff; border-radius: 4px; padding: 4px 7px;
        font: 500 12px/1 sans-serif; pointer-events: none; white-space: nowrap; display: none;
      }
      .${selectionHighlightClass} {
        position: fixed;
        background: rgba(38, 118, 230, .35);
        pointer-events: none;
      }
      .${areaGuideClass} {
        position: fixed;
        border: 1px solid rgba(255,214,102,.45);
        background: rgba(255,214,102,.08);
        border-radius: 8px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
        pointer-events: none;
      }
      .${gapMarkerClass} {
        position: fixed;
        width: 3px;
        border-radius: 1px;
        pointer-events: none;
        opacity: .7;
        transform: translateX(-1px);
      }
      .${gapMarkerClass}.is-positive { background: #2676e6; }
      .${gapMarkerClass}.is-negative { background: #e05050; }
      .${panelClass} {
        position: fixed;
        min-width: 312px;
        max-width: min(360px, calc(100vw - 24px));
        pointer-events: auto;
        background: rgba(28,28,30,.96);
        color: rgba(255,255,255,.82);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        box-shadow: 0 18px 56px rgba(0,0,0,.34);
        font: 500 12px/1.4 sans-serif;
        overflow: hidden;
        user-select: none;
        backdrop-filter: blur(14px);
      }
      .${panelClass}.is-dragging { box-shadow: 0 22px 68px rgba(0,0,0,.4); }
      .${headerClass} {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px 12px;
        background: none;
        cursor: grab;
      }
      .${panelClass}.is-dragging .${headerClass} { cursor: grabbing; }
      .${headingClass} {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1;
      }
      .${headingClass} strong {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .01em;
        color: #fff;
      }
      .${bodyClass} {
        padding: 4px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .${bodyClass}[hidden] { display: none; }
      .${rowClass} { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
      .${rowClass} + .${rowClass} { margin-top: 0; }
      .${actionsClass} {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
      }
      .${buttonClass} {
        min-height: 34px;
        width: 100%;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 9px;
        background: rgba(255,255,255,.03);
        color: rgba(255,255,255,.84);
        padding: 8px 10px;
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        text-align: center;
      }
      .${iconButtonClass} {
        width: 24px; height: 24px; padding: 0; border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
        background: rgba(255,255,255,.03); color: rgba(255,255,255,.76); cursor: pointer; font: inherit; line-height: 1;
        flex: none;
      }
      .${iconButtonClass}:hover,
      .${buttonClass}:hover:not(:disabled) {
        color: #fff;
        border-color: rgba(255,255,255,.3);
        background: rgba(255,255,255,.08);
      }
      .${buttonClass}:disabled { opacity: .2; cursor: default; }
      .${helpClass} {
        display: block;
        font-size: 11px;
        line-height: 1.55;
        color: rgba(255,255,255,.6);
        white-space: pre-wrap;
        word-spacing: 0.15em;
      }
      .${toastClass} {
        display: none;
        font-size: 11px;
        color: rgba(255,255,255,.72);
        padding-top: 2px;
      }
      .${warnClass} {
        display: none;
        font-size: 11px;
        line-height: 1.45;
        color: #f5a623;
        padding: 8px 16px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }
      .${charClass} { display: inline; }
      .${activeClass} { outline: 1px dashed rgba(255,255,255,.72); outline-offset: 4px; user-select: none; }
      .${activeClass} ::selection { background: transparent; }
      .${activeClass} *::selection { background: transparent; }
    `
}

export function createKerningUIRoot(options: KerningUIRootOptions): KerningUIRootElements {
  const root = createDiv(options.overlayClass)
  root.setAttribute('data-visual-kerning-ignore', 'true')

  const styleEl = document.createElement('style')
  styleEl.textContent = createStyleText(options)
  root.appendChild(styleEl)

  const overlayRoot = createDiv(options.rootClass)
  root.appendChild(overlayRoot)

  const cursorEl = createDiv(options.cursorClass)
  const valueEl = createDiv(options.valueClass)
  const selectionContainer = createDiv(options.selectionClass)
  const areaGuidesContainer = createDiv(options.areaGuidesClass)
  const markersContainer = createDiv(options.markersClass)
  overlayRoot.append(cursorEl, valueEl, selectionContainer, areaGuidesContainer, markersContainer)

  const panelEl = createDiv(`${options.panelClass} js-panel`)
  overlayRoot.appendChild(panelEl)

  const dragHandleEl = createDiv(`${options.headerClass} js-drag-handle`)
  panelEl.appendChild(dragHandleEl)

  const headingEl = createDiv(options.headingClass)
  const titleEl = document.createElement('strong')
  titleEl.textContent = options.pluginName
  headingEl.appendChild(titleEl)
  dragHandleEl.appendChild(headingEl)

  const collapseBtn = createButton(`${options.iconButtonClass} js-collapse`, '−')
  collapseBtn.setAttribute('aria-label', options.collapseLabel)
  collapseBtn.title = options.collapseLabel
  dragHandleEl.appendChild(collapseBtn)

  const warnEl = createDiv(`${options.warnClass} js-warn`)
  panelEl.appendChild(warnEl)

  const panelBodyEl = createDiv(`${options.bodyClass} js-panel-body`)
  panelEl.appendChild(panelBodyEl)

  const actionsRow = createDiv(`${options.rowClass} ${options.actionsClass}`)
  panelBodyEl.appendChild(actionsRow)

  const compareBtn = createButton(`${options.buttonClass} js-compare`, options.compareLabel)
  const gapsBtn = createButton(`${options.buttonClass} js-gaps`, options.guidesLabel)
  const exportBtn = createButton(`${options.buttonClass} js-export`, options.exportLabel)
  const resetBtn = createButton(`${options.buttonClass} js-reset`, options.resetLabel)
  actionsRow.append(compareBtn, gapsBtn, exportBtn, resetBtn)

  const helpRow = createDiv(options.rowClass)
  panelBodyEl.appendChild(helpRow)

  const helpEl = document.createElement('span')
  helpEl.className = options.helpClass
  helpEl.textContent = options.helpText
  helpRow.appendChild(helpEl)

  const toastEl = document.createElement('span')
  toastEl.className = options.toastClass
  toastEl.textContent = options.copiedLabel
  panelBodyEl.appendChild(toastEl)

  return {
    root,
    cursorEl,
    valueEl,
    selectionContainer,
    areaGuidesContainer,
    markersContainer,
    panelEl,
    panelBodyEl,
    dragHandleEl,
    collapseBtn,
    compareBtn,
    gapsBtn,
    exportBtn,
    resetBtn,
    toastEl,
    warnEl,
  }
}
