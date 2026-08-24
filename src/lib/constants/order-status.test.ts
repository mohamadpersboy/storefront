import { describe, it, expect } from "vitest";
import {
  canTransitionOrderStatus,
  getAllowedNextStatuses,
} from "@/lib/constants/order-status";

describe("canTransitionOrderStatus", () => {
  it("allows the normal forward flow", () => {
    expect(canTransitionOrderStatus("pending", "confirmed")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "processing")).toBe(true);
    expect(canTransitionOrderStatus("processing", "ready_to_ship")).toBe(true);
    expect(canTransitionOrderStatus("ready_to_ship", "shipped")).toBe(true);
    expect(canTransitionOrderStatus("shipped", "delivered")).toBe(true);
  });

  it("allows cancellation from any pre-shipment status", () => {
    expect(canTransitionOrderStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("processing", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("ready_to_ship", "cancelled")).toBe(true);
  });

  it("does not allow cancellation after shipping", () => {
    expect(canTransitionOrderStatus("shipped", "cancelled")).toBe(false);
    expect(canTransitionOrderStatus("delivered", "cancelled")).toBe(false);
  });

  it("allows return only after shipped or delivered", () => {
    expect(canTransitionOrderStatus("shipped", "returned")).toBe(true);
    expect(canTransitionOrderStatus("delivered", "returned")).toBe(true);
    expect(canTransitionOrderStatus("pending", "returned")).toBe(false);
  });

  it("does not allow skipping stages", () => {
    expect(canTransitionOrderStatus("pending", "shipped")).toBe(false);
    expect(canTransitionOrderStatus("confirmed", "delivered")).toBe(false);
  });

  it("does not allow moving backward", () => {
    expect(canTransitionOrderStatus("shipped", "pending")).toBe(false);
    expect(canTransitionOrderStatus("delivered", "processing")).toBe(false);
  });

  it("treats cancelled and returned as terminal", () => {
    expect(getAllowedNextStatuses("cancelled")).toEqual([]);
    expect(getAllowedNextStatuses("returned")).toEqual([]);
  });

  it("never allows transitioning a status to itself", () => {
    expect(canTransitionOrderStatus("pending", "pending")).toBe(false);
  });
});
