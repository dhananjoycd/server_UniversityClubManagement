import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["esm"],
  platform: "node",
  target: "node20",
  sourcemap: false,
  clean: true,
  splitting: false,
  dts: false,
  bundle: true,
  skipNodeModulesBundle: true,
});
