import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const destination = process.argv[2];
if (!destination) {
  throw new Error("Usage: node bundle.mjs <output.html>");
}
const root = new URL("./", import.meta.url);
const sourcePath = new URL("index.html", root);
if (resolve(destination) === fileURLToPath(sourcePath)) {
  throw new Error("Choose a destination other than the source index.html.");
}
let html = await readFile(sourcePath, "utf8");
const css = await readFile(new URL("styles.css", root), "utf8");
const js = await readFile(new URL("site.js", root), "utf8");
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script src="site.js"></script>', `<script>\n${js}\n</script>`);
for (const path of ["support.html", "privacy.html"]) {
  html = html.replaceAll(`href="${path}"`, `href="https://callmevg.github.io/photoso-website/${path}"`);
}
const assets = new Set([...html.matchAll(/["'](assets\/[^"']+)["']/g)].map(([, path]) => path));
for (const path of assets) {
  const image = await readFile(new URL(path, root));
  const mime = path.endsWith(".png") ? "image/png" : "image/jpeg";
  html = html.replaceAll(path, `data:${mime};base64,${image.toString("base64")}`);
}
const license = await readFile(new URL("LICENSE", root), "utf8");
const credits = await readFile(new URL("ASSETS.md", root), "utf8");
html = html.replace("<!doctype html>", `<!doctype html>\n<!--\n${license}\n${credits}\n-->`);
await writeFile(destination, html);
console.log(`Created ${resolve(destination)} (${Math.round(Buffer.byteLength(html) / 1024)} KiB)`);
