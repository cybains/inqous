import path from "node:path";
import { TextDecoder } from "node:util";
import { inflateRawSync } from "node:zlib";

const TEXT_WARNING_THRESHOLD = 300;

export type ExtractResumeArgs = {
  buffer: Buffer;
  filename: string;
};

export type ExtractResumeResult = {
  text: string;
  meta: Record<string, unknown>;
  warnings: string[];
};

const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });

function decodePdfString(str: string) {
  let out = "";
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    if (ch === "\\" && i + 1 < str.length) {
      const next = str[i + 1];
      switch (next) {
        case "n":
          out += "\n";
          i += 1;
          break;
        case "r":
          out += "\r";
          i += 1;
          break;
        case "t":
          out += "\t";
          i += 1;
          break;
        case "b":
          out += "\b";
          i += 1;
          break;
        case "f":
          out += "\f";
          i += 1;
          break;
        case "(":
        case ")":
        case "\\":
          out += next;
          i += 1;
          break;
        default: {
          const octalMatch = str.slice(i + 1, i + 4).match(/^[0-7]{1,3}/);
          if (octalMatch) {
            out += String.fromCharCode(parseInt(octalMatch[0], 8));
            i += octalMatch[0].length;
          } else {
            out += next;
            i += 1;
          }
        }
      }
    } else {
      out += ch;
    }
  }
  return out;
}

function extractPdf(buffer: Buffer) {
  const data = buffer.toString("latin1");
  const textParts: string[] = [];
  const tokenRegex = /(\[(?:\\.|[^\]])*\]|\((?:\\.|[^\\])*?\))\s*(TJ|Tj)/gms;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(data))) {
    const [, token, operator] = match;
    if (token.startsWith("[")) {
      const innerRegex = /\((?:\\.|[^\\])*?\)/g;
      let innerMatch: RegExpExecArray | null;
      while ((innerMatch = innerRegex.exec(token))) {
        textParts.push(decodePdfString(innerMatch[0].slice(1, -1)));
      }
    } else if (operator === "Tj") {
      textParts.push(decodePdfString(token.slice(1, -1)));
    }
  }

  const text = textParts
    .join("")
    .replace(/\r\n/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const warnings: string[] = [];
  if (!text) {
    warnings.push("No text extracted from PDF. Consider enabling an external OCR service.");
  }

  return {
    text,
    meta: { detected_type: "pdf" },
    warnings,
  } satisfies ExtractResumeResult;
}

function decodeXmlEntities(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractDocx(buffer: Buffer) {
  const DOCX_ENTRY = "word/document.xml";
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }
    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const name = buffer.slice(nameStart, nameEnd).toString("utf8");
    const dataStart = nameEnd + extraFieldLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) {
      break;
    }

    if (name === DOCX_ENTRY) {
      let fileBuf: Buffer;
      if (compression === 0) {
        fileBuf = buffer.slice(dataStart, dataEnd);
      } else if (compression === 8) {
        fileBuf = inflateRawSync(buffer.slice(dataStart, dataEnd));
      } else {
        throw new Error(`Unsupported DOCX compression method ${compression}`);
      }

      const xml = fileBuf.toString("utf8");
      const paragraphs = xml.split(/<\/?w:p[^>]*>/g);
      const texts: string[] = [];
      const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/gms;
      let textMatch: RegExpExecArray | null;
      for (const para of paragraphs) {
        const parts: string[] = [];
        while ((textMatch = textRegex.exec(para))) {
          parts.push(decodeXmlEntities(textMatch[1]));
        }
        if (parts.length) {
          texts.push(parts.join(""));
        }
      }

      const text = texts
        .join("\n")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const warnings: string[] = [];
      if (!text) {
        warnings.push("No text extracted from DOCX.");
      }

      return {
        text,
        meta: { detected_type: "docx" },
        warnings,
      } satisfies ExtractResumeResult;
    }

    offset = dataEnd;
  }

  return {
    text: "",
    meta: { detected_type: "docx" },
    warnings: ["DOCX content not found."],
  } satisfies ExtractResumeResult;
}

async function extractTxt(buffer: Buffer) {
  const text = decoder.decode(buffer).trim();
  return {
    text,
    meta: { detected_type: "txt" },
    warnings: text ? [] : ["File was empty."],
  } satisfies ExtractResumeResult;
}

function qualityWarnings(text: string) {
  const warnings: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    warnings.push("No text extracted.");
    return warnings;
  }
  if (trimmed.length < TEXT_WARNING_THRESHOLD) {
    warnings.push("Very short extraction (<300 chars). May be incomplete.");
  }
  const total = trimmed.length;
  const alpha = [...trimmed].filter((ch) => /[A-Za-z]/.test(ch)).length;
  const symbols = [...trimmed].filter((ch) => !/[\w\s]/.test(ch)).length;
  if (alpha / total < 0.5) {
    warnings.push("Low alphabetic ratio; OCR or encoding issues possible.");
  }
  if (symbols / total > 0.25) {
    warnings.push("High symbol ratio; layout/encoding noise detected.");
  }
  return warnings;
}

export async function extractResume({ buffer, filename }: ExtractResumeArgs): Promise<ExtractResumeResult> {
  const ext = path.extname(filename).toLowerCase();
  let result: ExtractResumeResult;

  try {
    switch (ext) {
      case ".pdf":
        result = await extractPdf(buffer);
        break;
      case ".docx":
        result = await extractDocx(buffer);
        break;
      case ".txt":
        result = await extractTxt(buffer);
        break;
      default:
        result = {
          text: "",
          meta: { detected_type: ext.replace(/^\./, "") || "unknown" },
          warnings: [
            ext
              ? `Unsupported file type: ${ext}`
              : "Unsupported file type. Please upload PDF, DOCX or TXT resumes.",
          ],
        } satisfies ExtractResumeResult;
    }
  } catch (error: unknown) {
    result = {
      text: "",
      meta: { detected_type: ext.replace(/^\./, "") || "unknown" },
      warnings: [`Extraction error: ${error instanceof Error ? error.message : String(error)}`],
    } satisfies ExtractResumeResult;
  }

  const warnings = new Set(result.warnings);
  for (const w of qualityWarnings(result.text)) {
    warnings.add(w);
  }

  return { ...result, warnings: Array.from(warnings) };
}
