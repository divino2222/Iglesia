import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function loadManifest() {
  const manifestPath = path.resolve(projectRoot, "src/data/bible/manifest.ts");
  const manifestModule = await import(`file://${manifestPath.replace(/\\/g, "/")}`);
  return manifestModule.bibleManifest;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildPlaceholderBook(book) {
  return {
    id: book.id,
    name: book.name,
    shortName: book.shortName,
    chapters: [
      {
        chapter: 1,
        verses: [
          {
            verse: 1,
            text: "PENDIENTE"
          }
        ]
      }
    ]
  };
}

async function main() {
  try {
    const manifest = await loadManifest();

    if (!manifest || !Array.isArray(manifest.books)) {
      console.error("❌ No se pudo leer correctamente bibleManifest.books");
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;

    console.log(`\n📘 Generando placeholders para ${manifest.books.length} libros...\n`);

    for (const book of manifest.books) {
      const relativeFile = book.file.replace(/^\//, "");
      const absoluteFile = path.resolve(projectRoot, "public", relativeFile);

      ensureDir(path.dirname(absoluteFile));

      if (fs.existsSync(absoluteFile)) {
        skipped++;
        console.log(`⏭️ YA EXISTE: ${book.name}`);
        continue;
      }

      const placeholder = buildPlaceholderBook(book);
      fs.writeFileSync(absoluteFile, JSON.stringify(placeholder, null, 2), "utf8");

      created++;
      console.log(`✅ CREADO: ${book.name} -> ${book.file}`);
    }

    console.log("\n==============================");
    console.log(`✅ Creados:  ${created}`);
    console.log(`⏭️ Omitidos: ${skipped}`);
    console.log("==============================\n");

    console.log("🎉 Listo. Ya se generaron los JSON base faltantes.");
  } catch (error) {
    console.error("❌ Error generando placeholders:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();