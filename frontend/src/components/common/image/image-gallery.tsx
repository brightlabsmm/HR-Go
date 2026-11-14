import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ImageDialog } from "@/components/common/image/image-dialog"
import type { AppImage } from "@/components/common/image/types"

interface ImageGalleryProps {
  images: AppImage[]
  visibleCount?: number
}

export function ImageGallery({ images, visibleCount = 4 }: ImageGalleryProps) {
  const { t } = useTranslation("common")
  const [isOpen, setIsOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  const visibleImages = images.slice(0, visibleCount)
  const remainingCount = Math.max(images.length - visibleCount, 0)

  const openAt = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {visibleImages.map((image, index) => {
          const isLastVisible =
            index === visibleImages.length - 1 && remainingCount > 0

          return (
            <button
              key={image.id}
              type="button"
              className="relative overflow-hidden rounded-lg border border-border"
              onClick={() => openAt(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="size-24 object-cover"
                loading="lazy"
              />
              {isLastVisible ? (
                <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-medium text-foreground">
                  {t("image.more_count", { count: remainingCount })}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <ImageDialog
        images={images}
        open={isOpen}
        startIndex={startIndex}
        onOpenChange={setIsOpen}
      />
    </>
  )
}
