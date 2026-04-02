interface PanelControllerOptions {
  panelEl: HTMLDivElement
  panelBodyEl: HTMLDivElement
  collapseBtn: HTMLButtonElement
  getCollapseLabel(): string
  getExpandLabel(): string
}

export interface KerningUIPanelController {
  setCollapsed(next: boolean): void
  toggleCollapsed(): void
  positionDefault(): void
  onResize(): void
  startDrag(event: PointerEvent): void
  dispose(): void
}

export function createKerningUIPanelController(options: PanelControllerOptions): KerningUIPanelController {
  const { panelEl, panelBodyEl, collapseBtn, getCollapseLabel, getExpandLabel } = options

  let collapsed = false
  let panelPositioned = false
  /** 右端からのオフセット */
  let panelRight = 0
  /** 下端からのオフセット */
  let panelBottom = 0
  let dragPointerId: number | null = null
  let dragOffsetX = 0
  let dragOffsetY = 0

  function getPanelSize() {
    return {
      width: panelEl.offsetWidth || 280,
      height: panelEl.offsetHeight || 120,
    }
  }

  function clampOffsets(right: number, bottom: number) {
    const margin = 12
    const { width, height } = getPanelSize()
    return {
      right: Math.min(Math.max(margin, right), Math.max(margin, window.innerWidth - width - margin)),
      bottom: Math.min(Math.max(margin, bottom), Math.max(margin, window.innerHeight - height - margin)),
    }
  }

  function syncPanelPosition() {
    const clamped = clampOffsets(panelRight, panelBottom)
    panelRight = clamped.right
    panelBottom = clamped.bottom
    const { width, height } = getPanelSize()
    panelEl.style.left = `${window.innerWidth - panelRight - width}px`
    panelEl.style.top = `${window.innerHeight - panelBottom - height}px`
  }

  function onPointerMove(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) return
    const { width, height } = getPanelSize()
    panelRight = window.innerWidth - (event.clientX - dragOffsetX) - width
    panelBottom = window.innerHeight - (event.clientY - dragOffsetY) - height
    syncPanelPosition()
  }

  function onPointerEnd(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) return
    dragPointerId = null
    panelEl.classList.remove('is-dragging')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerEnd)
    window.removeEventListener('pointercancel', onPointerEnd)
  }

  function setCollapsed(next: boolean) {
    collapsed = next
    panelEl.classList.toggle('is-collapsed', collapsed)
    panelBodyEl.hidden = collapsed
    const label = collapsed ? getExpandLabel() : getCollapseLabel()
    collapseBtn.textContent = collapsed ? '+' : '−'
    collapseBtn.setAttribute('aria-label', label)
    collapseBtn.title = label
    window.requestAnimationFrame(syncPanelPosition)
  }

  return {
    setCollapsed,
    toggleCollapsed() {
      setCollapsed(!collapsed)
    },
    positionDefault() {
      if (!panelPositioned) {
        panelRight = 16
        panelBottom = 16
        panelPositioned = true
      }
      syncPanelPosition()
    },
    onResize() {
      if (panelPositioned) syncPanelPosition()
    },
    startDrag(event: PointerEvent) {
      const target = event.target as HTMLElement
      if (target.closest('button')) return
      const { width, height } = getPanelSize()
      const left = window.innerWidth - panelRight - width
      const top = window.innerHeight - panelBottom - height
      dragPointerId = event.pointerId
      dragOffsetX = event.clientX - left
      dragOffsetY = event.clientY - top
      panelEl.classList.add('is-dragging')
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerEnd)
      window.addEventListener('pointercancel', onPointerEnd)
    },
    dispose() {
      dragPointerId = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
    },
  }
}
