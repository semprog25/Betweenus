const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

/**
 * Compress and resize an image File for feed upload.
 * Returns a data URL suitable for the upload-post-image endpoint.
 */
export async function compressImageForUpload(file: File): Promise<{
  dataUrl: string
  width: number
  height: number
}> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas unavailable')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const preferWebp = file.type === 'image/webp' || file.type === 'image/png'
  const mime = preferWebp && supportsWebp() ? 'image/webp' : 'image/jpeg'
  const dataUrl = canvas.toDataURL(mime, JPEG_QUALITY)
  return { dataUrl, width, height }
}

function supportsWebp(): boolean {
  try {
    const c = document.createElement('canvas')
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}
