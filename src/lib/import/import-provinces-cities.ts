import mongoose, { type Types } from "mongoose";
import { Province } from "@/models/Province";
import { City } from "@/models/City";
import type { ValidatedImportData } from "./validate-province-city-rows";

export interface ImportSummary {
  provincesUpserted: number;
  citiesUpserted: number;
  transactional: boolean;
}

async function upsertAll(data: ValidatedImportData, session?: mongoose.ClientSession) {
  const provinceIdByCode = new Map<string, Types.ObjectId>();

  for (const [code, name] of data.provinces) {
    const doc = await Province.findOneAndUpdate(
      { code },
      { $set: { name }, $setOnInsert: { code } },
      { upsert: true, new: true, session },
    );
    provinceIdByCode.set(code, doc._id);
  }

  for (const [code, { name, provinceCode }] of data.cities) {
    const provinceId = provinceIdByCode.get(provinceCode);
    if (!provinceId) continue; // نباید رخ دهد؛ validate-province-city-rows این حالت را رد می‌کند
    await City.findOneAndUpdate(
      { code },
      { $set: { name, province: provinceId }, $setOnInsert: { code } },
      { upsert: true, new: true, session },
    );
  }

  return {
    provincesUpserted: data.provinces.size,
    citiesUpserted: data.cities.size,
  };
}

/**
 * استان‌ها و شهرهای Validate‌شده را در MongoDB Upsert می‌کند.
 *
 * طبق درخواست سند («در صورت امکان Import را به‌صورت Transactional انجام
 * دهد») ابتدا تلاش می‌شود با یک Session/Transaction واقعی اجرا شود
 * (روی MongoDB Atlas که یک Replica Set است، همیشه کار می‌کند). اگر
 * Deployment از Transaction پشتیبانی نکند (مثلاً یک MongoDB standalone
 * محلی در توسعه)، به‌صورت Best-effort و غیر-Transactional دوباره اجرا
 * می‌شود تا کار در محیط توسعه هم متوقف نشود؛ در پاسخ API این حالت با
 * `transactional: false` مشخص می‌شود.
 */
export async function importProvincesAndCities(
  data: ValidatedImportData,
): Promise<ImportSummary> {
  const session = await mongoose.startSession();
  try {
    let result: { provincesUpserted: number; citiesUpserted: number } | undefined;
    await session.withTransaction(async () => {
      result = await upsertAll(data, session);
    });
    return { ...result!, transactional: true };
  } catch (error) {
    console.warn(
      "Transactional import failed (deployment may not support transactions); falling back to non-transactional import:",
      error,
    );
    const result = await upsertAll(data);
    return { ...result, transactional: false };
  } finally {
    await session.endSession();
  }
}
