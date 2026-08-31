"use client";

import { useEffect, useRef, useState } from "react";
import "@neshan-maps-platform/leaflet/dist/leaflet.css";
import { NESHAN_API_KEY, NESHAN_API_BASE_URL } from "@/lib/neshan/config";
import { Button } from "@/components/ui/button";

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  province?: string;
  city?: string;
  addressLine?: string;
}

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (result: ReverseGeocodeResult) => void;
}

// مرکز پیش‌فرض نقشه در صورت نبود موقعیت اولیه: تهران
const DEFAULT_CENTER: [number, number] = [35.699756, 51.338076];

/**
 * انتخاب موقعیت با Marker قابل جابه‌جایی روی نقشه نشان + دکمه «تأیید
 * موقعیت» که با Reverse Geocoding نشان تلاش می‌کند استان/شهر/آدرس را
 * خودکار پر کند (بند ۵ سند Audit). اگر Reverse Geocoding شکست بخورد
 * یا فیلدی از آن قابل استخراج نباشد، فقط مختصات را برمی‌گرداند و بقیه
 * فیلدها دستی توسط کاربر تکمیل می‌شوند — دقیقاً طبق نکته صریح سند.
 *
 * SDK نشان مبتنی بر Leaflet است و ذاتاً به `window`/`document` نیاز
 * دارد، به همین دلیل عمداً با `import()` پویا داخل `useEffect` بارگذاری
 * می‌شود (نه Import ایستا) تا هیچ مشکل SSR‌ای در Next.js پیش نیاید.
 */
export function NeshanMapPicker({ initialLatitude, initialLongitude, onConfirm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const [position, setPosition] = useState({
    lat: initialLatitude ?? DEFAULT_CENTER[0],
    lng: initialLongitude ?? DEFAULT_CENTER[1],
  });
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const mod = await import("@neshan-maps-platform/leaflet");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (mod as any).default ?? mod;
      if (cancelled || !containerRef.current) return;

      const map = new L.Map(containerRef.current, {
        key: NESHAN_API_KEY,
        maptype: "neshan",
        poi: true,
        traffic: false,
        center: [position.lat, position.lng],
        zoom: 14,
      });
      mapRef.current = map;

      const marker = L.marker([position.lat, position.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const latLng = marker.getLatLng();
        setPosition({ lat: latLng.lat, lng: latLng.lng });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    setGeocoding(true);
    setError(null);
    try {
      const res = await fetch(
        `${NESHAN_API_BASE_URL}/v5/reverse?lat=${position.lat}&lng=${position.lng}`,
        { headers: { "Api-Key": NESHAN_API_KEY } },
      );
      if (!res.ok) throw new Error("reverse geocoding failed");
      const body = await res.json();

      onConfirm({
        latitude: position.lat,
        longitude: position.lng,
        province: body.state || body.address_compound?.province || undefined,
        city: body.city || body.address_compound?.city || undefined,
        addressLine: body.formatted_address || undefined,
      });
    } catch {
      setError(
        "دریافت آدرس از روی نقشه ممکن نشد؛ موقعیت ثبت شد، لطفاً بقیه فیلدهای آدرس را دستی تکمیل کنید",
      );
      onConfirm({ latitude: position.lat, longitude: position.lng });
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-[var(--radius-md)] border border-border"
      />
      {loading ? <p className="text-xs text-muted">در حال بارگذاری نقشه...</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="flex items-center justify-between">
        <p dir="ltr" className="text-xs text-muted">
          {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={geocoding || loading}>
          {geocoding ? "در حال دریافت آدرس..." : "تأیید موقعیت"}
        </Button>
      </div>
    </div>
  );
}
