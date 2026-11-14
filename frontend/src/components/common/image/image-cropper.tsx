import {
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react"
import { useTranslation } from "react-i18next"
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop"

import { Button } from "@/components/ui/button"

import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperProps {
  aspect?: number
  onCropComplete: (file: Blob) => void
}

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY

  const context = canvas.getContext("2d")
  if (!context) {
    return Promise.reject(new Error("Canvas context is unavailable"))
  }

  context.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create cropped image"))
        return
      }
      resolve(blob)
    }, "image/webp")
  })
}

export function ImageCropper({
  aspect = 1,
  onCropComplete,
}: ImageCropperProps) {
  const { t } = useTranslation("common")
  const imageRef = useRef<HTMLImageElement>(null)
  const [src, setSrc] = useState<string>()
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setSrc(URL.createObjectURL(file))
  }

  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    const nextCrop = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 90 },
        aspect,
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    )
    setCrop(nextCrop)
  }

  const onConfirm = async () => {
    const image = imageRef.current
    if (!image || !completedCrop) {
      return
    }

    const blob = await getCroppedBlob(image, completedCrop)
    onCropComplete(blob)
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="file" accept="image/*" onChange={onSelectFile} />
      {src ? (
        <ReactCrop
          crop={crop}
          aspect={aspect}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
        >
          <img
            ref={imageRef}
            src={src}
            alt={t("image.crop")}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      ) : null}
      {src ? (
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setSrc(undefined)}>
            {t("actions.cancel")}
          </Button>
          <Button type="button" onClick={() => void onConfirm()}>
            {t("image.crop")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
