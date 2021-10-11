import blake2b from '@bitgo/blake2b'
import { Injectable } from '@nestjs/common'
import { CanvasRenderingContext2D, createCanvas, Image, loadImage } from 'canvas'
import { accountColor } from 'das-ui-shared'
import path from 'path'

function unitIndexes (length: number): string[] {
  const maxLength = Math.max(length.toString().length, 2)

  return Array.from(new Array(length)).map((_, i) => {
    return (i + 1).toString().padStart(maxLength, '0')
  })
}

function blake2bHash (text: string): string {
  const output = new Uint8Array(32)
  const input = Buffer.from(text)

  return blake2b(
    output.length,
    undefined,
    undefined,
    Buffer.from('ckb-default-hash')
  )
    .update(input)
    .digest('hex')
}

async function loadUnitImage (layer: Layer, index: string): Promise<Image> {
  return await loadImage(
    path.resolve(
      __dirname,
      '../src',
      `imgs/davatar/layer${layer.layer}-${layer.name}/${layer.name}-${index}.png`
    )
  )
}

const layers = [
  {
    layer: '01',
    name: 'headset',
    units: unitIndexes(14),
    fromBytes: [0, 1]
  },
  {
    layer: '02',
    name: 'mask',
    units: unitIndexes(3),
    fromBytes: [2, 3],
  },
  {
    layer: '03',
    name: 'coupler',
    units: unitIndexes(5),
    fromBytes: [4, 5],
  },
  {
    layer: '04',
    name: 'armour',
    units: ['null', ...unitIndexes(3)],
    fromBytes: [6, 7],
  },
  {
    layer: '05',
    name: 'widget',
    units: ['null', ...unitIndexes(12)],
    fromBytes: [8, 9],
  },
  {
    layer: '06',
    name: 'badge',
    units: ['null', ...unitIndexes(11)],
    fromBytes: [10, 11],
  },
  {
    layer: '07',
    name: 'chest',
    units: unitIndexes(4),
    fromBytes: [12, 13],
  },
  {
    layer: '08',
    name: 'head',
    units: unitIndexes(3),
    fromBytes: [14],
  },
  {
    layer: '09',
    name: 'body',
    units: unitIndexes(11),
    fromBytes: [15, 16],
  },
  {
    layer: '10',
    name: 'back',
    units: ['null', ...unitIndexes(1)],
    fromBytes: [17, 18],
  },
  {
    layer: '11',
    name: 'texture',
    units: unitIndexes(2),
    fromBytes: [19],
  }
]

type Layer = typeof layers[0]

function getWeight (hash: string, layer: Layer): number {
  const hex = layer.fromBytes.map(byteIndex => hash[byteIndex]).join('')
  return parseInt(hex, 16)
}

@Injectable()
export class AvatarService {
  async avatar (account: string): Promise<Buffer> {
    // account = new Date().toString()
    const name = account.replace(/\.bit$/, '')
    const hash = blake2bHash(name)

    const size = 1000

    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // apply units backwards
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]

      const variantWeight = getWeight(hash, layer)

      if (layer.name === 'texture' && variantWeight > layer.units.length) {
        this.drawPlainBackground(account, ctx, size)
      }
      else {
        const unitIndex = layer.units[variantWeight % layer.units.length]

        const image = await loadUnitImage(layer, unitIndex)

        ctx.drawImage(image, 0, 0, size, size)

        // console.log(layer.name, variantWeight, unitIndex)
      }
    }

    return canvas.toBuffer('image/png', { compressionLevel: 1 })
  }

  drawPlainBackground (account: string, ctx: CanvasRenderingContext2D, size: number): void {
    const color = accountColor(account)
    ctx.fillStyle = color.color
    ctx.fillRect(0, 0, size, size)
  }
}