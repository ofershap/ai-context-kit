import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    treeshake: true,
    minify: true,
    clean: true,
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    sourcemap: true,
    treeshake: true,
    minify: true,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
