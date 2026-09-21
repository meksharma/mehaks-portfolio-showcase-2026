const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const htmlFiles = ["index.html", "404.html"];
const missing = new Set();

const isLocalReference = (reference) => {
  return reference
    && !reference.startsWith("#")
    && !reference.startsWith("//")
    && !/^[a-z][a-z0-9+.-]*:/i.test(reference);
};

const checkReference = (reference, sourceFile) => {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (!isLocalReference(cleanReference) || cleanReference === "/") return;

  const decodedReference = decodeURIComponent(cleanReference);
  const assetPath = decodedReference.startsWith("/")
    ? path.join(root, decodedReference.slice(1))
    : path.resolve(root, path.dirname(sourceFile), decodedReference);

  if (!fs.existsSync(assetPath)) {
    missing.add(`${sourceFile}: ${cleanReference}`);
  }
};

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(root, htmlFile), "utf8");

  for (const match of html.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
    checkReference(match[1], htmlFile);
  }

  for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) {
      checkReference(candidate.trim().split(/\s+/, 1)[0], htmlFile);
    }
  }
}

if (missing.size) {
  console.error("Missing local assets:\n");
  for (const asset of missing) console.error(`- ${asset}`);
  process.exit(1);
}

console.log("Asset check passed.");