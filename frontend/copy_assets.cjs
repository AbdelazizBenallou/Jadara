const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("=== Copying and extracting brand assets ===");

const publicImagesDir = path.join(__dirname, "public/images");
const publicFontsDir = path.join(__dirname, "public/fonts");

fs.mkdirSync(publicImagesDir, { recursive: true });
fs.mkdirSync(publicFontsDir, { recursive: true });

// Copy images
const imagesToCopy = [
  { src: "src/assets/logo_ar.png", dest: "public/images/logo_ar.png" },
  { src: "src/assets/dz_young_leaders_logo.png", dest: "public/images/dz_young_leaders_logo.png" },
  { src: "src/assets/patterns.png", dest: "public/images/patterns.png" },
];

imagesToCopy.forEach((item) => {
  const srcPath = path.join(__dirname, item.src);
  const destPath = path.join(__dirname, item.dest);
  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${item.src} to ${item.dest}`);
    } catch (err) {
      console.error(`Error copying ${item.src}:`, err);
    }
  }
});

// Extract font zips if present in src/assets
const assetsDir = path.join(__dirname, "src/assets");
if (fs.existsSync(assetsDir)) {
  const zips = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".zip"));
  zips.forEach((zipFile) => {
    const zipPath = path.join(assetsDir, zipFile);
    try {
      const tmpDir = path.join(__dirname, "public/fonts_tmp");
      fs.mkdirSync(tmpDir, { recursive: true });
      console.log(`Extracting ${zipFile}...`);
      execSync(`unzip -o -j "${zipPath}" -d "${tmpDir}"`);
      const files = fs.readdirSync(tmpDir);
      let count = 0;
      files.forEach((file) => {
        if (/\.(woff2|woff|ttf|otf)$/i.test(file)) {
          fs.copyFileSync(path.join(tmpDir, file), path.join(publicFontsDir, file));
          count++;
        }
      });
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log(`✓ Successfully extracted and copied ${count} font files to public/fonts/`);
    } catch (err) {
      console.error(`Error extracting ${zipFile}:`, err);
    }
  });
}

// Clean up old ribbon_pattern.svg
const oldPatternPath = path.join(__dirname, "public/images/ribbon_pattern.svg");
if (fs.existsSync(oldPatternPath)) {
  try {
    fs.unlinkSync(oldPatternPath);
    console.log("✓ Cleaned up old ribbon_pattern.svg");
  } catch (err) {
    // Ignore error
  }
}

// Clean up old dz_young_leaders_logo.jpg
const oldBadgePath = path.join(__dirname, "public/images/dz_young_leaders_logo.jpg");
if (fs.existsSync(oldBadgePath)) {
  try {
    fs.unlinkSync(oldBadgePath);
    console.log("✓ Cleaned up old dz_young_leaders_logo.jpg");
  } catch (err) {
    // Ignore error
  }
}

console.log("=== Assets copy check complete ===");
