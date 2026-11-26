import type { SVGProps } from "react"

export function TrashCanIcon(props: SVGProps<SVGSVGElement>) {
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
      <path
        d="M38 42h44c1.1 0 2 .9 2 2v52c0 3.3-2.7 6-6 6H42c-3.3 0-6-2.7-6-6V44c0-1.1.9-2 2-2Z"
        fill="#1787F5"
      />
      <path
        d="M34 36h52c1.1 0 2 .9 2 2v4H32v-4c0-1.1.9-2 2-2Z"
        fill="#0F2B71"
      />
      <rect x="52" y="30" width="16" height="6" rx="2" fill="#0F2B71" />
      <path
        d="M48 52v34M60 52v34M72 52v34"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M44 40c-2-10 4-18 12-18 3 0 5 1 7 3 2-6 8-10 14-8 7 2 10 10 8 16"
        stroke="#1787F5"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M78 28c6-2 12 2 13 8 1 5-2 10-7 11"
        stroke="#0F2B71"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <ellipse cx="36" cy="88" rx="10" ry="14" fill="#9AD297" opacity="0.9" />
      <ellipse cx="28" cy="94" rx="7" ry="10" fill="#16A34A" opacity="0.75" />
      <ellipse cx="92" cy="86" rx="9" ry="13" fill="#9AD297" opacity="0.85" />
      <ellipse cx="98" cy="94" rx="6" ry="9" fill="#16A34A" opacity="0.7" />
      <path
        d="M50 38 44 28c-.6-1 .2-2.2 1.3-2l8 2.2c.7.2 1.1.9.9 1.6L52 38"
        fill="#B5DFFD"
      />
      <path
        d="M70 38 78 26c.5-1-.3-2.1-1.4-1.9l-9 2c-.7.2-1.1 1-.8 1.7L70 38"
        fill="white"
        stroke="#1787F5"
        strokeWidth="1"
      />
    </svg>
  )
}
