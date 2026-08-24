import mongoose, { Schema, type Model } from "mongoose";

export interface ICounter {
  key: string;
  value: number;
}

const CounterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

type CounterModel = Model<ICounter>;

export const Counter: CounterModel =
  (mongoose.models.Counter as CounterModel) ||
  mongoose.model<ICounter, CounterModel>("Counter", CounterSchema);

/**
 * Atomically increments and returns the next value for `key`. Safe
 * under concurrent requests — $inc + upsert is a single atomic
 * MongoDB operation, so two simultaneous callers can never receive
 * the same number.
 */
export async function getNextSequence(key: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  return counter.value;
}
