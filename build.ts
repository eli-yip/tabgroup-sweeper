await Bun.build({
  entrypoints: ["src/popup.ts"],
  outdir: "public",
  target: "browser",
});
