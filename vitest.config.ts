import { defineConfig } from "vitest/config";

// Unit test untuk fungsi murni (tanpa React Native), misal hitung harga.
export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
