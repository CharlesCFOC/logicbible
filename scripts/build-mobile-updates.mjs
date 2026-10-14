import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { zipSync } from "fflate";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const version = JSON.parse(fs.readFileSync(path.join(dist, "mobile-version.json")));
const files = {};
for (const filename of fs.readdirSync(dist, { recursive: true }).sort()) {
  if (filename === "mobile-updates" || filename.startsWith(`mobile-updates${path.sep}`)) continue;
  const fullPath = path.join(dist, filename);
  if (!fs.statSync(fullPath).isFile()) continue;
  files[filename.split(path.sep).join("/")] = fs.readFileSync(fullPath);
}
const zip = zipSync(files, { level: 6, mtime: new Date("2020-01-01T00:00:00Z") });
// Vercel serves this as a static file, not through a function response.
if (zip.length > 100 * 1024 * 1024) throw new Error("Mobile update ZIP exceeds 100 MiB; reduce assets before publishing.");
const updates = path.join(dist, "mobile-updates");
fs.rmSync(updates, { recursive: true, force: true });
fs.mkdirSync(updates);
fs.writeFileSync(path.join(updates, `${version.bundleId}.zip`), zip);
fs.writeFileSync(path.join(updates, "latest.json"), JSON.stringify({
  ...version,
  url: `/mobile-updates/${version.bundleId}.zip`,
  checksum: createHash("sha256").update(zip).digest("hex"),
}));
console.log(`Prepared mobile update ${version.bundleId.slice(0, 12)} (${(zip.length / 1e6).toFixed(1)} MB).`);
