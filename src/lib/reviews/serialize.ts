import type { ReviewRecommendation, ReviewStatus } from "@/lib/reviews/constants";

interface Ref {
  _id: unknown;
  title?: string;
  slug?: string;
  fullName?: string;
  phoneNumber?: string;
  orderNumber?: number;
}

export interface LeanReview {
  _id: unknown;
  product: Ref | null;
  user: Ref | null;
  rating: number;
  text: string;
  recommendation: ReviewRecommendation;
  status: ReviewStatus;
  isVerifiedBuyer: boolean;
  order?: Ref | null;
  images?: Array<{ url: string; publicId: string; width: number; height: number }>;
  moderatedBy?: Ref | null;
  moderatedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
}

export interface AdminReviewDTO {
  id: string;
  product: { id: string; title: string } | null;
  user: { id: string; name: string; phoneNumber: string } | null;
  rating: number;
  recommendation: ReviewRecommendation;
  status: ReviewStatus;
  isVerifiedBuyer: boolean;
  imageCount: number;
  createdAt: string;
}

export interface AdminReviewDetailDTO extends AdminReviewDTO {
  text: string;
  orderNumber: number | null;
  images: Array<{ url: string; width: number; height: number }>;
  moderatedAt: string | null;
  moderator: string | null;
  rejectionReason: string | null;
}

const personName = (ref: Ref) => ref.fullName?.trim() || ref.phoneNumber || "";

export function toAdminReviewDTO(doc: LeanReview): AdminReviewDTO {
  return {
    id: String(doc._id),
    product: doc.product ? { id: String(doc.product._id), title: doc.product.title ?? "" } : null,
    user: doc.user
      ? { id: String(doc.user._id), name: personName(doc.user), phoneNumber: doc.user.phoneNumber ?? "" }
      : null,
    rating: doc.rating,
    recommendation: doc.recommendation,
    status: doc.status,
    isVerifiedBuyer: doc.isVerifiedBuyer === true,
    imageCount: (doc.images ?? []).length,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function toAdminReviewDetailDTO(doc: LeanReview): AdminReviewDetailDTO {
  return {
    ...toAdminReviewDTO(doc),
    text: doc.text,
    orderNumber: doc.order?.orderNumber ?? null,
    images: (doc.images ?? []).map((i) => ({ url: i.url, width: i.width, height: i.height })),
    moderatedAt: doc.moderatedAt ? new Date(doc.moderatedAt).toISOString() : null,
    moderator: doc.moderatedBy ? personName(doc.moderatedBy) : null,
    rejectionReason: doc.rejectionReason ?? null,
  };
}
