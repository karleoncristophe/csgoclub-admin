function srgbToLinear(channel: number) {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export type Oklch = { l: number; c: number; h: number }

export function hexToOklch(hex: string): Oklch {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw
  const r = srgbToLinear(parseInt(full.slice(0, 2), 16))
  const g = srgbToLinear(parseInt(full.slice(2, 4), 16))
  const b = srgbToLinear(parseInt(full.slice(4, 6), 16))

  const lRoot = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const mRoot = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const sRoot = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const l = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot
  const b2 = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot
  const c = Math.hypot(a, b2)
  let h = (Math.atan2(b2, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l, c, h: Number.isFinite(h) ? h : 0 }
}

export function formatOklch(l: number, c: number, h: number) {
  const lightness = Math.min(1, Math.max(0, l))
  const chroma = Math.max(0, c)
  const hue = ((h % 360) + 360) % 360
  return `oklch(${(lightness * 100).toFixed(2)}% ${chroma.toFixed(4)} ${hue.toFixed(2)})`
}

function linearToSrgb(channel: number) {
  const value = Math.min(1, Math.max(0, channel))
  const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
  return Math.round(encoded * 255)
}

function toHexByte(value: number) {
  return value.toString(16).padStart(2, '0')
}

export function oklchToHex(l: number, c: number, h: number) {
  const hue = (((h % 360) + 360) % 360 * Math.PI) / 180
  const a = Math.max(0, c) * Math.cos(hue)
  const b = Math.max(0, c) * Math.sin(hue)
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b
  const l3 = lRoot ** 3
  const m3 = mRoot ** 3
  const s3 = sRoot ** 3
  const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
  return `#${toHexByte(linearToSrgb(red))}${toHexByte(linearToSrgb(green))}${toHexByte(linearToSrgb(blue))}`
}
