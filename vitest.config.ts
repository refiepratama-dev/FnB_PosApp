import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit test untuk fungsi murni (tanpa React Native), misal hitung harga.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
