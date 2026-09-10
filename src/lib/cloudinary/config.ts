import { v2 as cloudinary } from "cloudinary";
import { env } from "@/config/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const PRODUCT_IMAGES_FOLDER = "saghchi-carpet/products";
export const BANK_LOGOS_FOLDER = "saghchi-carpet/banks";
export const BANNER_IMAGES_FOLDER = "saghchi-carpet/banners";
export const CATEGORY_IMAGES_FOLDER = "saghchi-carpet/categories";
