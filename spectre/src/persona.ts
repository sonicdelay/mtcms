import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const personasDir = path.join(__dirname, "personas");
const botPersonaFile = "_bot.md";

const normalizePersonaKey = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");

const readPersonaFile = (fileName: string): string | null => {
  const filePath = path.join(personasDir, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8").trim();
  return content.length > 0 ? content : null;
};

const readRequiredPersonaFile = (fileName: string): string => {
  const content = readPersonaFile(fileName);
  if (content) {
    return content;
  }

  throw new Error(`Required persona file is missing or empty: ${fileName}`);
};

const resolvePersonaFileByName = (userName: string): string | null => {
  if (!fs.existsSync(personasDir)) {
    return null;
  }

  const normalizedUser = normalizePersonaKey(userName);
  const files = fs
    .readdirSync(personasDir)
    .filter(
      (fileName) => fileName.endsWith(".md") && !fileName.startsWith("_")
    );

  for (const fileName of files) {
    const baseName = fileName.replace(/\.md$/, "");
    if (normalizePersonaKey(baseName) === normalizedUser) {
      return fileName;
    }
  }

  return null;
};

export const persona = readRequiredPersonaFile(botPersonaFile);

export const getUserPersonaContext = (userName?: string): string | null => {
  if (!userName) {
    return null;
  }

  const personaFile = resolvePersonaFileByName(userName);
  if (!personaFile) {
    return null;
  }

  const profile = readPersonaFile(personaFile);
  if (!profile) {
    return null;
  }

  return `Active user profile (${personaFile}):\n${profile}\nUse this info only when it helps answer the request better.`;
};
