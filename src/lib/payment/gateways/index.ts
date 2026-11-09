import { zarinpalGateway } from "@/lib/payment/gateways/zarinpal-gateway";
import {
  ONLINE_GATEWAY_IDS,
  type OnlineGatewayId,
  type PaymentGateway,
} from "@/lib/payment/gateways/types";

export * from "@/lib/payment/gateways/types";

export function isOnlineGatewayId(value: unknown): value is OnlineGatewayId {
  return typeof value === "string" && (ONLINE_GATEWAY_IDS as readonly string[]).includes(value);
}

/**
 * ثبت درگاه‌ها. Adapterهای غیرپیش‌فرض با `import()` پویا بارگذاری می‌شوند تا
 * تنظیمات (`env`) فقط وقتی لازم است خوانده شود. افزودن درگاه جدید:
 * یک Adapter + یک `case` اینجا + یک مقدار در `OnlineGatewayId`.
 */
export async function getGateway(id: OnlineGatewayId): Promise<PaymentGateway> {
  switch (id) {
    case "sepehr":
      return (await import("@/lib/payment/gateways/sepehr-gateway")).sepehrGateway;
    case "zarinpal":
    default:
      return zarinpalGateway;
  }
}

/** درگاه فعال برای پرداخت‌های جدید (`PAYMENT_GATEWAY`؛ پیش‌فرض زرین‌پال). */
export async function getActiveGateway(): Promise<PaymentGateway> {
  const { env } = await import("@/config/env");
  const id = (env as { PAYMENT_GATEWAY?: string }).PAYMENT_GATEWAY;
  return getGateway(isOnlineGatewayId(id) ? id : "zarinpal");
}
