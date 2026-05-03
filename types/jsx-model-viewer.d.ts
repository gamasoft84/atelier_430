import type { DetailedHTMLProps, HTMLAttributes } from "react"

type ModelViewerAttributes = HTMLAttributes<HTMLElement> & {
  src?: string
  alt?: string
  ar?: boolean
  "ar-modes"?: string
  "ar-placement"?: string
  "ar-scale"?: string
  "camera-controls"?: boolean
  "shadow-intensity"?: string
  exposure?: string
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<ModelViewerAttributes, HTMLElement>
    }
  }
}

export {}
