/**
 * Lecture d'un CSV de carte (nom, description, prix, categorie, image_url, badge, disponible).
 * Gère les guillemets, les virgules ou points-virgules, et les retours à la ligne Windows.
 */
export type CsvRow = Record<string, string>;

function detectSeparator(line: string): string {
  const counts = [",", ";", "\t"].map((sep) => ({
    sep,
    count: line.split(sep).length,
  }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0]!.count > 1 ? counts[0]!.sep : ",";
}

function splitLine(line: string, sep: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === sep) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const separator = detectSeparator(lines[0]!);
  const headers = splitLine(lines[0]!, separator).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const cells = splitLine(line, separator);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

/** "2 500 FCFA" ou "2.500,50" -> 2500.5 */
export function parsePrice(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "");
  const normalized =
    cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function pick(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value && value.trim().length > 0) return value.trim();
  }
  return "";
}

export function parseBoolean(value: string, fallback = true): boolean {
  if (!value) return fallback;
  return !/^(0|non|no|false|indispo\w*|rupture)$/i.test(value.trim());
}
