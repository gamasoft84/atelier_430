/**
 * glTF binario (GLB): plano vertical a escala con textura embebida (JPEG/PNG/WebP).
 * La textura va dentro del BIN para que model-viewer cargue sin depender de CORS en el cliente.
 */

import type { GltfDocument } from "./gltf-types"
import { encodeGlb } from "./encode-glb"

const ARRAY_BUFFER = 34962
const ELEMENT_ARRAY_BUFFER = 34963

/** Longitud fija del bloque de geometría (posiciones + uvs + índices) */
const GEOMETRY_BYTE_LENGTH = 92

export interface PosterArParams {
  widthMeters: number
  heightMeters: number
  /** Bytes de imagen (respuesta de Cloudinary u otro origen) */
  imageBytes: Buffer
  /** p.ej. image/jpeg, image/png, image/webp */
  imageMimeType: string
}

function buildGltfDocument(
  params: PosterArParams,
  totalBinByteLength: number,
  imageByteLength: number
): GltfDocument {
  const { widthMeters: w, heightMeters: h } = params
  const min = [-w / 2, 0, 0] as [number, number, number]
  const max = [w / 2, h, 0] as [number, number, number]

  return {
    asset: { version: "2.0", generator: "atelier430-poster-glb" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: {
              POSITION: 0,
              TEXCOORD_0: 1,
            },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0,
          roughnessFactor: 0.85,
        },
        doubleSided: true,
      },
    ],
    textures: [{ source: 0 }],
    images: [
      {
        bufferView: 3,
        mimeType: params.imageMimeType,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: 4,
        type: "VEC3",
        max,
        min,
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: 4,
        type: "VEC2",
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5123,
        count: 6,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: 48,
        target: ARRAY_BUFFER,
      },
      {
        buffer: 0,
        byteOffset: 48,
        byteLength: 32,
        target: ARRAY_BUFFER,
      },
      {
        buffer: 0,
        byteOffset: 80,
        byteLength: 12,
        target: ELEMENT_ARRAY_BUFFER,
      },
      {
        buffer: 0,
        byteOffset: GEOMETRY_BYTE_LENGTH,
        byteLength: imageByteLength,
      },
    ],
    buffers: [{ byteLength: totalBinByteLength }],
  }
}

export function buildPosterGlbBuffer(params: PosterArParams): Buffer {
  const { widthMeters: w, heightMeters: h, imageBytes } = params

  const positions = new Float32Array([
    -w / 2,
    0,
    0,
    w / 2,
    0,
    0,
    w / 2,
    h,
    0,
    -w / 2,
    h,
    0,
  ])

  // glTF: origen UV arriba-izquierda, +V hacia abajo en la imagen.
  // Vértice inferior del plano (y=0) → V=1; superior (y=h) → V=0.
  const uvs = new Float32Array([
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
  ])

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3])

  const geom = Buffer.concat([
    Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength),
    Buffer.from(uvs.buffer, uvs.byteOffset, uvs.byteLength),
    Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength),
  ])

  const imgLen = imageBytes.length
  const binPadding = (4 - (imgLen % 4)) % 4
  const binChunk = Buffer.concat([geom, imageBytes, Buffer.alloc(binPadding)])
  const totalLen = binChunk.length

  const gltf = buildGltfDocument(params, totalLen, imgLen)
  return encodeGlb(gltf, binChunk)
}
