import { describe, expect, it } from "vitest";
import { computeWalletSplitPreview } from "@/lib/cart/wallet-split-preview";

describe("computeWalletSplitPreview", () => {
  it("sends everything to the gateway when the wallet is empty", () => {
    expect(computeWalletSplitPreview(0, 500000)).toEqual({
      walletPortion: 0,
      gatewayPortion: 500000,
      fullyCoveredByWallet: false,
    });
  });

  it("caps the wallet portion at the wallet balance when the balance is lower than the total", () => {
    expect(computeWalletSplitPreview(200000, 500000)).toEqual({
      walletPortion: 200000,
      gatewayPortion: 300000,
      fullyCoveredByWallet: false,
    });
  });

  it("covers the whole total from the wallet when the balance is enough", () => {
    expect(computeWalletSplitPreview(900000, 500000)).toEqual({
      walletPortion: 500000,
      gatewayPortion: 0,
      fullyCoveredByWallet: true,
    });
  });

  it("never reports full coverage for a zero total", () => {
    expect(computeWalletSplitPreview(100000, 0)).toEqual({
      walletPortion: 0,
      gatewayPortion: 0,
      fullyCoveredByWallet: false,
    });
  });

  it("treats a negative balance or total as zero", () => {
    expect(computeWalletSplitPreview(-100, -50)).toEqual({
      walletPortion: 0,
      gatewayPortion: 0,
      fullyCoveredByWallet: false,
    });
  });
});
