import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { kidsAdventures } from "../src/react/kids-adventures-data.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(projectRoot, "dist");

const requiredFiles = ["index.html", "styles.css", "script.js", "bible-data.js", "privacy.html", "terms.html", "community-guidelines.html"];
const requiredDirectories = ["scripts", "assets"];
const adventureImages = kidsAdventures.map(adventure => adventure.image);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const filename of requiredFiles) {
  const source = path.join(projectRoot, filename);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing mobile build input: ${filename}`);
  }
  fs.copyFileSync(source, path.join(outputDir, filename));
}

for (const directory of requiredDirectories) {
  const source = path.join(projectRoot, directory);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing mobile build directory: ${directory}`);
  }
  fs.cpSync(source, path.join(outputDir, directory), {
    recursive: true,
    filter: filename => {
      const relative = path.relative(projectRoot, filename).split(path.sep).join("/");
      if (!relative.startsWith("assets/kids-bible/")) return true;
      // Ship the current adventures' illustrations, without the old book-reader assets.
      return adventureImages.some(image => image === relative || image.startsWith(`${relative}/`));
    },
  });
}

const hash = createHash("sha256");
for (const filename of fs.readdirSync(outputDir, { recursive: true }).sort()) {
  const fullPath = path.join(outputDir, filename);
  if (!fs.statSync(fullPath).isFile()) continue;
  hash.update(filename.split(path.sep).join("/"));
  hash.update("\0");
  hash.update(createHash("sha256").update(fs.readFileSync(fullPath)).digest());
}
const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "mobile-update.config.json")));
const nativeBuild = fs.readFileSync(path.join(projectRoot, "android/app/build.gradle"), "utf8");
if (!nativeBuild.includes(`versionName "${config.nativeVersion}"`)) {
  throw new Error("mobile-update.config.json nativeVersion must match Android versionName.");
}
fs.writeFileSync(path.join(outputDir, "mobile-version.json"), JSON.stringify({
  bundleId: hash.digest("hex"), nativeVersion: config.nativeVersion,
}));
console.log(`Prepared local Android web assets in ${path.relative(projectRoot, outputDir)}.`);
