import { formatBytes } from "./utils";

/**
 * Read a File's text contents (UTF-8). Used for .txt uploads and pasted content.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Read a File and return a base64 string with the data-URL prefix stripped.
 * Used for transporting binary files (PDF) as JSON to the BFF.
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate a File against an allowlist of MIME types and a max size.
 * Accepts by extension as a fallback when the OS-reported MIME is missing/wrong
 * (common on Linux where text files arrive as application/octet-stream).
 */
export function validateFile(
  file: File,
  accept: readonly string[],
  maxSize: number,
): string | null {
  if (file.size === 0) return "File is empty";

  if (file.size > maxSize) {
    return `File is ${formatBytes(file.size)}, max is ${formatBytes(maxSize)}`;
  }

  const matchesMime = accept.includes(file.type);
  const matchesExt = accept.some((a) => {
    const subtype = a.split("/")[1];
    if (!subtype) return false;
    return file.name.toLowerCase().endsWith(`.${subtype}`);
  });

  if (!matchesMime && !matchesExt) {
    const labels = accept
      .map((a) => a.split("/")[1]?.toUpperCase() ?? a)
      .join(" or ");
    return `Expected ${labels} file`;
  }

  return null;
}
