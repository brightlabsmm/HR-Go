import type { SVGProps } from "react"

export function PersonSuspendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <circle cx="40" cy="24" r="12" fill="#1787F5" />
      <path
        d="M20 62c0-11 9-18 20-18s20 7 20 18v2H20v-2Z"
        fill="#1787F5"
      />
      <path
        d="M28 14c-2.5-1-5 .5-5.5 3M25 10c-2-1.5-5 0-5.5 2.5"
        stroke="#1787F5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="56" cy="56" r="14" fill="#0F2B71" />
      <path
        d="M48 56h16"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
