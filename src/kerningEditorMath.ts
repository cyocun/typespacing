export interface CursorRect {
  x: number
  y: number
  h: number
}

export interface GapPosition {
  gapIndex: number
  x: number
  y: number
}

function isLineBreakBetween(left: DOMRect, right: DOMRect): boolean {
  const verticalOverlap = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top)
  return verticalOverlap < Math.min(left.height, right.height) * 0.5
}

function getSpanRect(spans: HTMLElement[], index: number): DOMRect | null {
  const span = spans[index]
  if (!span) return null
  return span.getBoundingClientRect()
}

export function findGapIndex(spans: HTMLElement[], clientX: number, clientY: number, stickyLineY?: number): number {
  if (spans.length < 1) return -1

  const rects = spans.map(span => span.getBoundingClientRect())
  if (rects.length === 0) return -1

  const lineHeight = rects[0]?.height ?? 0
  const hysteresis = lineHeight * 0.15

  let bestLineY = Infinity
  let bestLineDist = Infinity
  for (const rect of rects) {
    const midY = (rect.top + rect.bottom) / 2
    let dist = Math.abs(clientY - midY)
    if (stickyLineY !== undefined && Math.abs(midY - stickyLineY) > lineHeight * 0.5) {
      dist += hysteresis
    }
    if (dist < bestLineDist) {
      bestLineDist = dist
      bestLineY = midY
    }
  }

  const lineThreshold = (rects[0]?.height ?? 0) * 0.5
  const onLine = (rect: DOMRect) => Math.abs((rect.top + rect.bottom) / 2 - bestLineY) < lineThreshold

  let closest = -1
  let minDist = Infinity

  for (let i = 0; i < spans.length; i++) {
    const rect = rects[i]
    if (!rect) continue
    if (onLine(rect)) {
      const dist = Math.abs(clientX - rect.left)
      if (dist < minDist) {
        minDist = dist
        closest = i - 1
      }
      break
    }
  }

  for (let i = 0; i < spans.length - 1; i++) {
    const currentRect = rects[i]
    const nextRect = rects[i + 1]
    if (!currentRect || !nextRect || !onLine(currentRect)) continue

    if (!onLine(nextRect)) {
      const dist = Math.abs(clientX - currentRect.right)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
      continue
    }

    const gapX = (currentRect.right + nextRect.left) / 2
    const dist = Math.abs(clientX - gapX)
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  }

  const lastIdx = spans.length - 1
  const lastRect = rects[lastIdx]
  if (lastRect && onLine(lastRect)) {
    const dist = Math.abs(clientX - lastRect.right)
    if (dist < minDist) closest = lastIdx
  }

  return closest
}

export function getGapRect(spans: HTMLElement[], gapIndex: number): CursorRect | null {
  if (spans.length === 0) return null
  if (gapIndex === -1) {
    const rect = getSpanRect(spans, 0)
    if (!rect) return null
    return { x: rect.left, y: rect.top, h: rect.height }
  }

  if (gapIndex === spans.length - 1) {
    const rect = getSpanRect(spans, spans.length - 1)
    if (!rect) return null
    return { x: rect.right, y: rect.top, h: rect.height }
  }

  const left = getSpanRect(spans, gapIndex)
  const right = getSpanRect(spans, gapIndex + 1)
  if (!left || !right) return null

  if (isLineBreakBetween(left, right)) {
    return { x: right.left, y: right.top, h: right.height }
  }

  return {
    x: (left.right + right.left) / 2,
    y: Math.min(left.top, right.top),
    h: Math.max(left.bottom, right.bottom) - Math.min(left.top, right.top),
  }
}

/** 指定ギャップが改行をまたぐかどうか */
export function isLineBreakGap(spans: HTMLElement[], gapIndex: number): boolean {
  const left = getSpanRect(spans, gapIndex)
  const right = getSpanRect(spans, gapIndex + 1)
  return !!left && !!right && isLineBreakBetween(left, right)
}

/** 選択範囲描画用: 改行ギャップでは前行末と次行頭の2つのレクトを返す */
export function getSelectionGapRects(spans: HTMLElement[], gapIndex: number): CursorRect[] {
  if (spans.length === 0) return []

  const left = getSpanRect(spans, gapIndex)
  const right = getSpanRect(spans, gapIndex + 1)
  if (left && right && isLineBreakBetween(left, right)) {
    return [
      { x: left.right, y: left.top, h: left.height },
      { x: right.left, y: right.top, h: right.height },
    ]
  }

  const r = getGapRect(spans, gapIndex)
  return r ? [r] : []
}

export function getGapPositions(spans: HTMLElement[]): GapPosition[] {
  const positions: GapPosition[] = []
  for (let gapIndex = -1; gapIndex < spans.length; gapIndex++) {
    const rect = getGapRect(spans, gapIndex)
    if (!rect) continue
    positions.push({ gapIndex, x: rect.x, y: rect.y })
  }
  return positions
}

export function moveCursorVertically(
  spans: HTMLElement[],
  currentGap: number,
  direction: 'up' | 'down',
): number {
  const positions = getGapPositions(spans)
  const current = positions.find(position => position.gapIndex === currentGap)
  if (!current) return currentGap

  const lineThreshold = 4
  const directional = positions.filter(position =>
    direction === 'up'
      ? position.y < current.y - lineThreshold
      : position.y > current.y + lineThreshold,
  )
  if (directional.length === 0) return currentGap

  const nearestLineY = direction === 'up'
    ? Math.max(...directional.map(position => position.y))
    : Math.min(...directional.map(position => position.y))

  const lineCandidates = directional.filter(position => Math.abs(position.y - nearestLineY) <= lineThreshold)
  return lineCandidates.reduce((best, position) => {
    const bestDist = Math.abs(best.x - current.x)
    const nextDist = Math.abs(position.x - current.x)
    return nextDist < bestDist ? position : best
  }).gapIndex
}
