/** Ornamento tipo catálogo de galería — líneas con motivo central. */
export default function ComparativoFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width={200}
      height={18}
      viewBox="0 0 200 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0 9h72"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeOpacity="0.45"
      />
      <path
        d="M128 9h72"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeOpacity="0.45"
      />
      <path
        d="M100 4.5c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4Z"
        stroke="currentColor"
        strokeWidth="0.55"
        strokeOpacity="0.65"
      />
      <path
        d="M96 9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Z"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <path
        d="M100 7.2v3.6M98.2 9h3.6"
        stroke="currentColor"
        strokeWidth="0.45"
        strokeOpacity="0.5"
      />
      <path
        d="M88 9c2-3 6-4.5 12-4.5s10 1.5 12 4.5"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeOpacity="0.35"
        fill="none"
      />
      <path
        d="M112 9c-2-3-6-4.5-12-4.5S90 6 88 9"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeOpacity="0.35"
        fill="none"
      />
    </svg>
  )
}
