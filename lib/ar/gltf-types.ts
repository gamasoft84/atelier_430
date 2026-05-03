/** Subconjunto tipado de glTF 2.0 para el poster AR */
export interface GltfDocument {
  asset: { version: "2.0"; generator?: string }
  scene: number
  scenes: Array<{ nodes: number[] }>
  nodes: Array<{ mesh: number }>
  meshes: Array<{
    primitives: Array<{
      attributes: Record<string, number>
      indices: number
      material: number
    }>
  }>
  materials: Array<{
    pbrMetallicRoughness: {
      baseColorTexture: { index: number }
      metallicFactor: number
      roughnessFactor: number
    }
    doubleSided?: boolean
  }>
  textures: Array<{ source: number }>
  images: Array<{ uri: string } | { bufferView: number; mimeType: string }>
  accessors: Array<{
    bufferView: number
    byteOffset: number
    componentType: number
    count: number
    type: string
    max?: [number, number, number]
    min?: [number, number, number]
  }>
  bufferViews: Array<{
    buffer: number
    byteOffset: number
    byteLength: number
    /** Vertex buffers / índices; omitir para texturas embebidas */
    target?: number
  }>
  buffers: Array<{ byteLength: number; uri?: string }>
}
