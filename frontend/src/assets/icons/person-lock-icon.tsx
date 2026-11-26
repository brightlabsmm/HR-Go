import type { SVGProps } from "react"

export function PersonLockIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="56" cy="56" r="14" fill="#0F2B71" />
      <rect x="49" y="52" width="14" height="11" rx="2" fill="white" />
      <path
        d="M52 52v-4a4 4 0 0 1 8 0"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="56" cy="57.5" r="1.5" fill="#0F2B71" />
    </svg>
  )
}