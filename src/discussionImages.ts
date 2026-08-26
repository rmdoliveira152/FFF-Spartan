const MAX_SOURCE_BYTES = 20 * 1024 * 1024
export const MAX_COMMENT_IMAGES = 5
export const MAX_COMMENT_IMAGE_BYTES = 1024 * 1024

const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const canvasBlob = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to compress image.')), 'image/webp', quality)
})

export async function compressDiscussionImage(source: File) {
  if (!supportedTypes.has(source.type) || source.size > MAX_SOURCE_BYTES) {
    throw new Error('INVALID_IMAGE')
  }

  const bitmap = await createImageBitmap(source)
  let scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
  let output: Blob | null = null

  for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      throw new Error('Unable to compress image.')
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.84, 0.76, 0.68, 0.6]) {
      output = await canvasBlob(canvas, quality)
      if (output.size <= MAX_COMMENT_IMAGE_BYTES) break
    }
    if (output && output.size <= MAX_COMMENT_IMAGE_BYTES) break
    scale *= 0.82
  }

  bitmap.close()
  if (!output || output.size > MAX_COMMENT_IMAGE_BYTES) throw new Error('IMAGE_TOO_LARGE')

  return new File([output], `${crypto.randomUUID()}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}