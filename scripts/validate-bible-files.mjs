import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const manifestPath = path.resolve(projectRoot, "src/data/bible/manifest.ts");

async function loadManifest() {
  const manifestModule = await import(`file://${manifestPath.replace(/\\/g, "/")}`);
  return manifestModule.bibleManifest;
}

function validateBookJson(book, json) {
  const errors = [];

  if (!json || typeof json !== "object") {
    errors.push("El archivo no contiene un objeto JSON válido.");
    return errors;
  }

  if (json.id !== book.id) {
    errors.push(`id inválido. Esperado: "${book.id}", recibido: "${json.id}"`);
  }

  if (json.name !== book.name) {
    errors.push(`name inválido. Esperado: "${book.name}", recibido: "${json.name}"`);
  }

  if (json.shortName !== book.shortName) {
    errors.push(
      `shortName inválido. Esperado: "${book.shortName}", recibido: "${json.shortName}"`
    );
  }

  if (!Array.isArray(json.chapters)) {
    errors.push("chapters debe ser un arreglo.");
    return errors;
  }

  if (json.chapters.length === 0) {
    errors.push("chapters está vacío.");
    return errors;
  }

  if (json.chapters.length > book.chaptersCount) {
    errors.push(
      `Tiene más capítulos de los esperados. Esperado máximo: ${book.chaptersCount}, recibido: ${json.chapters.length}`
    );
  }

  for (const chapter of json.chapters) {
    if (typeof chapter.chapter !== "number") {
      errors.push("Cada capítulo debe tener 'chapter' numérico.");
      continue;
    }

    if (!Array.isArray(chapter.verses)) {
      errors.push(`El capítulo ${chapter.chapter} debe tener 'verses' como arreglo.`);
      continue;
    }

    if (chapter.verses.length === 0) {
      errors.push(`El capítulo ${chapter.chapter} no tiene versículos.`);
      continue;
    }

    for (const verse of chapter.verses) {
      if (typeof verse.verse !== "number") {
        errors.push(
          `Capítulo ${chapter.chapter}: cada versículo debe tener 'verse' numérico.`
        );
      }

      if (typeof verse.text !== "string" || !verse.text.trim()) {
        errors.push(
          `Capítulo ${chapter.chapter}, versículo ${verse.verse}: 'text' inválido o vacío.`
        );
      }
    }
  }

  return errors;
}

async function main() {
  try {
    const manifest = await loadManifest();

    if (!manifest || !Array.isArray(manifest.books)) {
      console.error("❌ No se pudo leer correctamente bibleManifest.books");
      process.exit(1);
    }

    let missingFiles = 0;
    let invalidFiles = 0;
    let validFiles = 0;

    console.log(`\n📘 Validando ${manifest.books.length} libros...\n`);

    for (const book of manifest.books) {
      const relativeFile = book.file.replace(/^\//, "");
      const absoluteFile = path.resolve(projectRoot, "public", relativeFile.replace(/^data\//, "data/"));

      if (!fs.existsSync(absoluteFile)) {
        missingFiles++;
        console.log(`❌ FALTA: ${book.name} -> ${book.file}`);
        continue;
      }

      try {
        const raw = fs.readFileSync(absoluteFile, "utf8");
        const json = JSON.parse(raw);
        const errors = validateBookJson(book, json);

        if (errors.length > 0) {
          invalidFiles++;
          console.log(`⚠️ INVÁLIDO: ${book.name} -> ${book.file}`);
          for (const error of errors) {
            console.log(`   - ${error}`);
          }
        } else {
          validFiles++;
          console.log(`✅ OK: ${book.name}`);
        }
      } catch (error) {
        invalidFiles++;
        console.log(`⚠️ ERROR JSON: ${book.name} -> ${book.file}`);
        console.log(`   - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log("\n==============================");
    console.log(`✅ Válidos:   ${validFiles}`);
    console.log(`❌ Faltantes: ${missingFiles}`);
    console.log(`⚠️ Inválidos: ${invalidFiles}`);
    console.log("==============================\n");

    if (missingFiles > 0 || invalidFiles > 0) {
      process.exit(1);
    }

    console.log("🎉 Todo bien. La estructura base de la Biblia está correcta.");
  } catch (error) {
    console.error("❌ Error ejecutando validación:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();