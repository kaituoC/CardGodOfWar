import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const outDir = join(root, 'assets')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let crc = ~0
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function png(width, height, pixels) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function hex(color) {
  const value = color.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    value.length > 6 ? parseInt(value.slice(6, 8), 16) : 255,
  ]
}

function mix(a, b, t) {
  return a + (b - a) * t
}

function blend(dst, src) {
  const a = src[3] / 255
  const ia = 1 - a
  return [
    Math.round(src[0] * a + dst[0] * ia),
    Math.round(src[1] * a + dst[1] * ia),
    Math.round(src[2] * a + dst[2] * ia),
    255,
  ]
}

function roundedRect(x, y, w, h, r, px, py) {
  const dx = Math.max(Math.abs(px - (x + w / 2)) - (w / 2 - r), 0)
  const dy = Math.max(Math.abs(py - (y + h / 2)) - (h / 2 - r), 0)
  return dx * dx + dy * dy <= r * r
}

function poly(points, x, y) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0], yi = points[i][1]
    const xj = points[j][0], yj = points[j][1]
    const intersect = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function distToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax
  const vy = by - ay
  const wx = px - ax
  const wy = py - ay
  const c1 = vx * wx + vy * wy
  if (c1 <= 0) return Math.hypot(px - ax, py - ay)
  const c2 = vx * vx + vy * vy
  if (c2 <= c1) return Math.hypot(px - bx, py - by)
  const t = c1 / c2
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy))
}

function inRotRect(px, py, cx, cy, w, h, deg) {
  const a = -deg * Math.PI / 180
  const dx = px - cx
  const dy = py - cy
  const x = dx * Math.cos(a) - dy * Math.sin(a)
  const y = dx * Math.sin(a) + dy * Math.cos(a)
  return Math.abs(x) <= w / 2 && Math.abs(y) <= h / 2
}

function colorAt(x, y) {
  const cx = 512
  const cy = 512
  const dx = x - cx
  const dy = y - cy
  const bgRadius = 468

  let c = [0, 0, 0, 0]
  if (roundedRect(32, 32, 960, 960, 220, x, y)) {
    const t = Math.min(1, Math.max(0, (x + y) / 2048))
    c = [Math.round(mix(24, 18, t)), Math.round(mix(34, 9, t)), Math.round(mix(74, 20, t)), 255]
    const ring = Math.abs(Math.hypot(dx, dy) - 392)
    if (ring < 14) c = blend(c, [240, 192, 64, 50])
    if (Math.hypot(dx, dy) > bgRadius) c[3] = 0
  }

  const cardX = x + (y - 512) * 0.13
  const cardY = y - (x - 512) * 0.13
  if (roundedRect(276, 164, 448, 704, 42, cardX, cardY)) {
    const t = Math.min(1, Math.max(0, (cardY - 164) / 704))
    c = blend(c, [Math.round(mix(247, 127, t)), Math.round(mix(223, 53, t)), Math.round(mix(138, 30, t)), 255])
  }
  if (roundedRect(316, 220, 368, 596, 22, cardX, cardY)) c = blend(c, [22, 22, 45, 232])
  if (inRotRect(cardX, cardY, 476, 340, 252, 82, -8)) c = blend(c, [233, 69, 96, 255])
  if (inRotRect(cardX, cardY, 504, 474, 252, 72, -8)) c = blend(c, [52, 152, 219, 255])
  if (inRotRect(cardX, cardY, 506, 592, 206, 72, -8)) c = blend(c, [243, 156, 18, 255])

  const blade = [[512, 116], [592, 338], [548, 646], [476, 646], [432, 338]]
  if (poly(blade, x, y)) {
    const t = Math.min(1, Math.max(0, (y - 116) / 530))
    c = blend(c, [Math.round(mix(250, 43, t)), Math.round(mix(255, 83, t)), Math.round(mix(255, 115, t)), 255])
  }
  if (distToSegment(x, y, 512, 148, 512, 638) < 7) c = blend(c, [255, 255, 255, 190])

  if (poly([[370, 636], [654, 636], [602, 724], [422, 724]], x, y)) c = blend(c, [240, 192, 64, 255])
  if (poly([[466, 704], [558, 704], [596, 864], [428, 864]], x, y)) c = blend(c, [90, 39, 57, 255])
  const gem = Math.hypot(x - 512, y - 680)
  if (gem < 46) c = blend(c, [240, 192, 64, 255])
  if (gem < 31) c = blend(c, [233, 69, 96, 255])

  if (poly([[226, 644], [332, 598], [374, 678]], x, y)) c = blend(c, [231, 76, 60, 235])
  if (poly([[792, 372], [696, 292], [704, 404]], x, y)) c = blend(c, [243, 156, 18, 235])
  if (poly([[744, 700], [632, 790], [670, 676]], x, y)) c = blend(c, [52, 152, 219, 235])

  return c
}

function render(size) {
  const scale = 1024 / size
  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = [0, 0, 0, 0]
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const c = colorAt((x + (sx + 0.5) / 2) * scale, (y + (sy + 0.5) / 2) * scale)
          acc = [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2], acc[3] + c[3]]
        }
      }
      const i = (y * size + x) * 4
      pixels[i] = Math.round(acc[0] / 4)
      pixels[i + 1] = Math.round(acc[1] / 4)
      pixels[i + 2] = Math.round(acc[2] / 4)
      pixels[i + 3] = Math.round(acc[3] / 4)
    }
  }
  return png(size, size, pixels)
}

const png1024 = render(1024)
writeFileSync(join(outDir, 'icon.png'), png1024)

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoPngs = icoSizes.map(size => ({ size, data: render(size) }))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(icoPngs.length, 4)
const entries = Buffer.alloc(icoPngs.length * 16)
let offset = 6 + entries.length
icoPngs.forEach((entry, index) => {
  const base = index * 16
  entries[base] = entry.size === 256 ? 0 : entry.size
  entries[base + 1] = entry.size === 256 ? 0 : entry.size
  entries[base + 2] = 0
  entries[base + 3] = 0
  entries.writeUInt16LE(1, base + 4)
  entries.writeUInt16LE(32, base + 6)
  entries.writeUInt32LE(entry.data.length, base + 8)
  entries.writeUInt32LE(offset, base + 12)
  offset += entry.data.length
})
writeFileSync(join(outDir, 'icon.ico'), Buffer.concat([header, entries, ...icoPngs.map(entry => entry.data)]))

const icnsEntries = [
  ['icp4', render(16)],
  ['icp5', render(32)],
  ['icp6', render(64)],
  ['ic07', render(128)],
  ['ic08', render(256)],
  ['ic09', render(512)],
  ['ic10', png1024],
]
const icnsChunks = icnsEntries.map(([type, data]) => {
  const header = Buffer.alloc(8)
  header.write(String(type), 0, 4, 'ascii')
  header.writeUInt32BE(8 + data.length, 4)
  return Buffer.concat([header, data])
})
const icnsHeader = Buffer.alloc(8)
icnsHeader.write('icns', 0, 4, 'ascii')
icnsHeader.writeUInt32BE(8 + icnsChunks.reduce((sum, item) => sum + item.length, 0), 4)
writeFileSync(join(outDir, 'icon.icns'), Buffer.concat([icnsHeader, ...icnsChunks]))

console.log(`Generated ${join(outDir, 'icon.png')}, ${join(outDir, 'icon.ico')}, and ${join(outDir, 'icon.icns')}`)
