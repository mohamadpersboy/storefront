"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { getCroppedImageBlob } from "@/lib/utils/image-crop";

export function ImageCropModal({
  imageSrc,
  aspect = 3 / 4,
  aspectLabel = "۳:۴",
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  aspect?: number;
  aspectLabel?: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onCropped(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative flex w-full max-w-md flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">
          برش تصویر (نسبت {aspectLabel})
        </h2>

        <div className="relative h-80 w-full overflow-hidden rounded-[var(--radius-md)] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="بزرگ‌نمایی"
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={processing}>
            انصراف
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={processing}>
            {processing ? "در حال پردازش..." : "تأیید برش"}
          </Button>
        </div>
      </div>
    </div>
  );
}
