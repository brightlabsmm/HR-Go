import type { SVGProps } from "react"

/** Top-left clipped wash circle used behind confirm dialog content. */
export function ConfirmDialogOverlayTop(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="104"
      height="107"
      viewBox="0 0 104 107"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <circle cx="18.5" cy="21.5" r="85.5" fill="#EAF3FF" />
    </svg>
  )
}

/** Bottom-right wash circle, intended to sit overflow-clipped. */
export function ConfirmDialogOverlayBottom(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <circle cx="100" cy="100" r="70" fill="#EAF3FF" />
    </svg>
  )
}
