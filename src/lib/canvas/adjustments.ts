export function brightnessContrast(
  ctx: CanvasRenderingContext2D,
  brightness: number,
  contrast: number,
): void {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height)
  const b = brightness * 2.55
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = data.data[i + c]! + b
      v = factor * (v - 128) + 128
      data.data[i + c] = Math.min(255, Math.max(0, v))
    }
  }
  ctx.putImageData(data, 0, 0)
}

export function hueSaturationLightness(
  ctx: CanvasRenderingContext2D,
  hue: number,
  sat: number,
  light: number,
): void {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height)
  const sMult = 1 + sat / 100
  const lAdd = light * 2.55

  for (let i = 0; i < data.data.length; i += 4) {
    let [h, s, l] = rgbToHsl(
      data.data[i]!,
      data.data[i + 1]!,
      data.data[i + 2]!,
    )
    h = (h + hue / 360) % 1
    if (h < 0) h += 1
    s = Math.min(1, Math.max(0, s * sMult))
    l = Math.min(1, Math.max(0, l + lAdd / 255))
    const [r, g, b] = hslToRgb(h, s, l)
    data.data[i] = r
    data.data[i + 1] = g
    data.data[i + 2] = b
  }
  ctx.putImageData(data, 0, 0)
}

export function levels(
  ctx: CanvasRenderingContext2D,
  blackIn: number,
  gamma: number,
  whiteIn: number,
): void {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height)
  const lut = new Uint8Array(256)
  const b = blackIn / 255
  const w = whiteIn / 255
  const g = Math.max(0.1, gamma)

  for (let i = 0; i < 256; i++) {
    let n = i / 255
    if (n <= b) n = 0
    else if (n >= w) n = 1
    else n = Math.pow((n - b) / (w - b), 1 / g)
    lut[i] = Math.round(n * 255)
  }

  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data.data[i + c] = lut[data.data[i + c]!]!
    }
  }
  ctx.putImageData(data, 0, 0)
}

export function invertColors(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height)
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 255 - data.data[i]!
    data.data[i + 1] = 255 - data.data[i + 1]!
    data.data[i + 2] = 255 - data.data[i + 2]!
  }
  ctx.putImageData(data, 0, 0)
}

export function grayscale(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height)
  for (let i = 0; i < data.data.length; i += 4) {
    const g =
      data.data[i]! * 0.299 +
      data.data[i + 1]! * 0.587 +
      data.data[i + 2]! * 0.114
    data.data[i] = g
    data.data[i + 1] = g
    data.data[i + 2] = g
  }
  ctx.putImageData(data, 0, 0)
}

export function colorBalance(
  ctx: CanvasRenderingContext2D,
  cyanRed: number,
  magentaGreen: number,
  yellowBlue: number,
): void {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height)
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.min(255, Math.max(0, data.data[i]! + cyanRed))
    data.data[i + 1] = Math.min(
      255,
      Math.max(0, data.data[i + 1]! + magentaGreen),
    )
    data.data[i + 2] = Math.min(
      255,
      Math.max(0, data.data[i + 2]! + yellowBlue),
    )
  }
  ctx.putImageData(data, 0, 0)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}
