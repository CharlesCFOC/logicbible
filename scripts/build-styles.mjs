import fs from "node:fs";
import path from "node:path";
import { transform } from "lightningcss";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(projectRoot, "styles", "source");
const manifest = JSON.parse(fs.readFileSync(path.join(sourceDir, "manifest.json"), "utf8"));
const sourceStylesheet = manifest
  .map((filename) => fs.readFileSync(path.join(sourceDir, filename), "utf8"))
  .join("\n");

const stylesheet = transform({
  filename: "styles.css",
  code: Buffer.from(sourceStylesheet),
  minify: true,
  sourceMap: false,
}).code.toString();

fs.writeFileSync(path.join(projectRoot, "styles.css"), stylesheet);
console.log(`Built minified styles.css from ${manifest.length} organized source modules.`);
