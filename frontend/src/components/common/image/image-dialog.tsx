import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import type { AppImage } from "@/components/common/image/types"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageDialogProps {
  images: AppImage[]
  open: boolean
  startIndex?: number
  onOpenChange: (open: boolean) => void
}

export function ImageDialog({
  images,
  open,
  startIndex = 0,
  onOpenChange,
}: ImageDialogProps) {
  const { t } = useTranslation("common")
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(startIndex)
  const hasCarousel = images.length > 1

  useEffect(() => {
    if (!api) {
      return undefined
    }

    const syncIndex = () => {
      setSelectedIndex(api.selectedScrollSnap())
    }

    syncIndex()
    api.on("select", syncIndex)

    return () => {
      api.off("select", syncIndex)
    }
  }, [api])

  const activeImage = images[selectedIndex] ?? images[0]

  if (!activeImage) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">{activeImage.alt}</DialogTitle>
        </DialogHeader>
        {hasCarousel ? (
          <div className="px-12">
            <Carousel
              key={startIndex}
              opts={{ startIndex, loop: true }}
              setApi={setApi}
              className="w-full"
            >
              <CarouselContent>
                {images.map((image) => (
                  <CarouselItem key={image.id}>
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="mx-auto max-h-[70vh] w-full rounded-lg object-contain"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="mt-3 flex justify-center">
              <Badge variant="secondary">
                {t("image.position", {
                  current: selectedIndex + 1,
                  total: images.length,
                })}
              </Badge>
            </div>
          </div>
        ) : (
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            className="mx-auto max-h-[70vh] w-full rounded-lg object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
