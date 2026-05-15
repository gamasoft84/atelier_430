import { toPng } from "html-to-image"

export const COMPARATIVO_EXPORTING_CLASS = "comparativo-exporting"

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"))
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener("load", done, { once: true })
          img.addEventListener("error", done, { once: true })
        }),
    ),
  ).then(() => undefined)
}

/** Expande scroll horizontal y captura la lámina completa (todas las obras). */
export async function exportComparativoBoardPng(
  boardId: string,
  options: { backgroundColor?: string } = {},
): Promise<string> {
  const node = document.getElementById(boardId)
  if (!node) throw new Error("Comparativo board not found")

  const scrollInner = node.querySelector(
    ".comparativo-gallery-scroll-inner",
  ) as HTMLElement | null
  if (scrollInner) scrollInner.scrollLeft = 0

  node.classList.add(COMPARATIVO_EXPORTING_CLASS)

  try {
    await waitForLayout()
    await waitForImages(node)

    const width = node.scrollWidth
    const height = node.scrollHeight
    const pixelRatio = width * 2 > 8_000 ? 1.5 : 2

    return await toPng(node, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: options.backgroundColor ?? "#f3efe8",
      width,
      height,
      canvasWidth: Math.round(width * pixelRatio),
      canvasHeight: Math.round(height * pixelRatio),
      skipAutoScale: true,
    })
  } finally {
    node.classList.remove(COMPARATIVO_EXPORTING_CLASS)
  }
}
