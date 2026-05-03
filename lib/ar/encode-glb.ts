import type { GltfDocument } from "./gltf-types"

/** Empaqueta JSON glTF 2.0 + chunk BIN en archivo `.glb`. */
export function encodeGlb(gltfJson: GltfDocument, binChunk: Buffer): Buffer {
  const jsonStr = JSON.stringify(gltfJson)
  const jsonPadding = (4 - (Buffer.byteLength(jsonStr, "utf8") % 4)) % 4
  const jsonChunkData = jsonStr + " ".repeat(jsonPadding)
  const jsonBuffer = Buffer.from(jsonChunkData, "utf8")

  const binPadding = (4 - (binChunk.length % 4)) % 4
  const binChunkData = Buffer.concat([binChunk, Buffer.alloc(binPadding)])

  const jsonChunkLength = jsonBuffer.length
  const binChunkLength = binChunkData.length
  const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength

  const out = Buffer.alloc(totalLength)
  let o = 0
  out.writeUInt32LE(0x46_54_6c_67, o)
  o += 4
  out.writeUInt32LE(2, o)
  o += 4
  out.writeUInt32LE(totalLength, o)
  o += 4

  out.writeUInt32LE(jsonChunkLength, o)
  o += 4
  out.writeUInt32LE(0x4e4f_534a, o)
  o += 4
  jsonBuffer.copy(out, o)
  o += jsonChunkLength

  out.writeUInt32LE(binChunkLength, o)
  o += 4
  out.writeUInt32LE(0x00_4e49_42, o)
  o += 4
  binChunkData.copy(out, o)

  return out
}
