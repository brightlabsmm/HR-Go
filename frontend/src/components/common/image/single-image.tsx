import { useState } from "react"

import { ImageDialog } from "@/components/common/image/image-dialog"
import type { AppImage } from "@/components/common/image/types"

interface SingleImageProps {
  image: AppImage
}

export function SingleImage({ image }: SingleImageProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="overflow-hidden rounded-lg border border-border"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={image.src}
          alt={image.alt}
          className="size-24 object-cover"
          loading="lazy"
        />
      </button>
      <ImageDialog
        images={[image]}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}
