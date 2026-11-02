import { beforeEach, describe, expect, it } from "vitest";
import { useCart } from "../cartStore";

describe("pilih member mengisi nama pelanggan", () => {
  beforeEach(() => useCart.getState().reset());

  it("nama yang sudah diketik diganti nama member", () => {
    useCart.getState().setField("customerName", "Pak Andi");
    useCart.getState().setMember({ id: "m1", name: "Budi Santoso" });
    expect(useCart.getState().customerName).toBe("Budi Santoso");
  });

  it("hapus member -> nama ikut kosong kalau belum diubah", () => {
    useCart.getState().setMember({ id: "m1", name: "Budi Santoso" });
    useCart.getState().setMember(null);
    expect(useCart.getState().customerName).toBe("");
  });

  it("hapus member -> nama yang sudah diubah kasir tetap", () => {
    useCart.getState().setMember({ id: "m1", name: "Budi Santoso" });
    useCart.getState().setField("customerName", "Budi (meja pojok)");
    useCart.getState().setMember(null);
    expect(useCart.getState().customerName).toBe("Budi (meja pojok)");
  });
});
