const ALLOWED_TAGS = new Set(['SPAN', 'BR', 'I', 'B', 'EM', 'STRONG'])

function normalizeDescription(raw: string) {
  return raw
    .replace(/\\n/g, ' ')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .trim()
}

function sanitizeColorStyle(style: string) {
  const match = style.match(/color\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))/i)
  return match ? `color: ${match[1]}` : ''
}

function appendSanitized(
  doc: Document,
  target: HTMLElement,
  node: Node,
) {
  if (node.nodeType === Node.TEXT_NODE) {
    target.appendChild(doc.createTextNode(node.textContent ?? ''))
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const element = node as HTMLElement
  const tag = element.tagName

  if (tag === 'BR') {
    target.appendChild(doc.createElement('br'))
    return
  }

  if (!ALLOWED_TAGS.has(tag)) {
    for (const child of Array.from(element.childNodes)) {
      appendSanitized(doc, target, child)
    }
    return
  }

  const clean = doc.createElement(tag.toLowerCase())

  if (tag === 'SPAN') {
    const style = sanitizeColorStyle(element.getAttribute('style') ?? '')
    if (style) clean.setAttribute('style', style)
  }

  for (const child of Array.from(element.childNodes)) {
    appendSanitized(doc, clean, child)
  }

  target.appendChild(clean)
}

/**
 * Sanitiza HTML de descrição de skins (Steam/CSGO-API) para renderização segura.
 * Mantém apenas tags básicas e `color` em span.
 */
export function sanitizeSkinDescriptionHtml(raw?: string | null) {
  if (!raw?.trim()) return ''

  const normalized = normalizeDescription(raw)

  if (typeof DOMParser === 'undefined') {
    return normalized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(
    `<wrapper>${normalized}</wrapper>`,
    'text/html',
  )
  const wrapper = doc.body.querySelector('wrapper')
  if (!wrapper) return ''

  const output = doc.createElement('div')
  for (const child of Array.from(wrapper.childNodes)) {
    appendSanitized(doc, output, child)
  }

  return output.innerHTML
}

export function plainSkinDescription(raw?: string | null) {
  if (!raw?.trim()) return ''
  const html = sanitizeSkinDescriptionHtml(raw)
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
