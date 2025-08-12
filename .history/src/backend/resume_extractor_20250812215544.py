import os, re, tempfile, io, mimetypes, shutil
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional, Tuple, List

import numpy as np
import cv2
import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
import pytesseract

# Optional dependencies with graceful degradation
try:
    from docx import Document
except Exception:
    Document = None

try:
    from odf.opendocument import load as odf_load
    from odf import text as odf_text, table as odf_table
    from odf.element import Element as ODFElement
except Exception:
    odf_load = None
    odf_text = None
    odf_table = None
    ODFElement = None

# --- Config ---
TESSERACT_CMD = os.environ.get("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD  # e.g. r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"

# If Ghostscript isn't on PATH, pdf2image may need it. You can set:
# os.environ['PATH'] = r"C:\Program Files\gs\gs10.05.1\bin" + os.pathsep + os.environ['PATH']

@dataclass
class ExtractResult:
    text: str
    meta: Dict[str, Any]
    warnings: List[str]

# ----------- Image Preprocessing for OCR -----------
def preprocess_image_for_ocr_bgr(bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    thr = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 31, 2)
    blurred = cv2.GaussianBlur(thr, (3, 3), 0)
    resized = cv2.resize(blurred, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    return resized

def ocr_np_image(gray_like: np.ndarray, lang: str = "eng") -> str:
    config = "--oem 1 --psm 3"
    pil_img = Image.fromarray(gray_like)
    return pytesseract.image_to_string(pil_img, lang=lang, config=config)

# ----------- Cleanups -----------
def normalize_whitespace(text: str) -> str:
    # Fix hyphenated line breaks: “experi-\nence” → “experience”
    text = re.sub(r"(\w)-\n(\w)", r"\\1\\2", text)
    # Normalize newlines and collapse excess blank lines
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def strip_common_headers_footers(pages: List[str]) -> List[str]:
    # Heuristic: remove lines that appear identically on >= 50% of pages
    if len(pages) < 3:
        return pages
    line_counts: Dict[str, int] = {}
    page_lines: List[List[str]] = []
    for p in pages:
        lines = [ln.strip() for ln in p.splitlines() if ln.strip()]
        page_lines.append(lines)
        for ln in set(lines[:3] + lines[-3:]):  # top 3 and bottom 3 lines heuristic
            line_counts[ln] = line_counts.get(ln, 0) + 1
    common = {ln for ln, c in line_counts.items() if c >= max(2, len(pages)//2)}
    cleaned_pages = []
    for lines in page_lines:
        cleaned = [ln for ln in lines if ln not in common]
        cleaned_pages.append("\n".join(cleaned))
    return cleaned_pages

# ----------- Quality scoring -----------
def low_quality(text: str) -> Tuple[bool, List[str]]:
    warnings = []
    s = text.strip()
    if not s:
        return True, ["No text extracted."]
    if len(s) < 300:
        warnings.append("Very short extraction (<300 chars). May be incomplete.")
    total = len(s)
    alpha = sum(ch.isalpha() for ch in s)
    symbols = sum(1 for ch in s if not ch.isalnum() and not ch.isspace())
    alpha_ratio = alpha / total
    symbol_ratio = symbols / total
    if alpha_ratio < 0.5:
        warnings.append("Low alphabetic ratio; OCR may be noisy.")
    if symbol_ratio > 0.25:
        warnings.append("High symbol ratio; layout/encoding noise detected.")
    return (len(warnings) > 0), warnings

# ----------- File-type handlers -----------
def extract_pdf(path: str, lang: str = "eng") -> Tuple[str, Dict[str, Any], List[str]]:
    warnings: List[str] = []
    pages_text: List[str] = []
    used_ocr_pages: int = 0

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            try:
                txt = page.extract_text(
                    x_tolerance=2, y_tolerance=2, keep_blank_chars=False
                )
            except Exception:
                txt = None
            if txt and txt.strip():
                pages_text.append(txt)
            else:
                # OCR fallback for this page
                try:
                    images = convert_from_path(path, dpi=300, first_page=page.page_number, last_page=page.page_number)
                    if images:
                        pil = images[0]
                        bgr = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
                        processed = preprocess_image_for_ocr_bgr(bgr)
                        ocr_txt = ocr_np_image(processed, lang=lang)
                        pages_text.append(ocr_txt)
                        used_ocr_pages += 1
                    else:
                        pages_text.append(\"\\n\")
                except Exception as e:
                    warnings.append(f\"OCR failed on page {page.page_number}: {e}\")\n                    pages_text.append(\"\\n\")\n\n    # Header/footer cleanup\n    pages_text = strip_common_headers_footers(pages_text)\n    merged = \"\\n\\n\".join(pages_text)\n    merged = normalize_whitespace(merged)\n\n    meta = {\n        \"detected_type\": \"pdf\",\n        \"page_count\": len(pages_text),\n        \"used_ocr_pages\": used_ocr_pages,\n    }\n    return merged, meta, warnings\n\n\ndef extract_docx(path: str) -> Tuple[str, Dict[str, Any], List[str]]:\n    warnings: List[str] = []\n    if Document is None:\n        return \"\", {\"detected_type\": \"docx\"}, [\"python-docx not installed\"]\n    try:\n        doc = Document(path)\n        text = \"\\n\".join(p.text for p in doc.paragraphs)\n    except Exception as e:\n        return \"\", {\"detected_type\": \"docx\"}, [f\"DOCX parse error: {e}\"]\n    return normalize_whitespace(text), {\"detected_type\": \"docx\"}, warnings\n\n\ndef extract_odt(path: str) -> Tuple[str, Dict[str, Any], List[str]]:\n    warnings: List[str] = []\n    if not odf_load:\n        return \"\", {\"detected_type\": \"odt\"}, [\"odfpy not installed\"]\n\n    def get_text_recursive(element) -> str:\n        txt = \"\"\n        for node in element.childNodes:\n            if getattr(node, \"nodeType\", None) == node.TEXT_NODE:\n                txt += node.data\n            elif ODFElement and isinstance(node, ODFElement):\n                txt += get_text_recursive(node)\n        return txt\n\n    try:\n        doc = odf_load(path)\n        blocks = []\n        for elem in doc.getElementsByType(odf_text.P) + doc.getElementsByType(odf_text.H):\n            t = get_text_recursive(elem).strip()\n            if t:\n                blocks.append(t)\n        for tbl in doc.getElementsByType(odf_table.Table):\n            for row in tbl.getElementsByType(odf_table.TableRow):\n                cells = []\n                for cell in row.getElementsByType(odf_table.TableCell):\n                    ps = cell.getElementsByType(odf_text.P)\n                    cell_text = \" \".join(get_text_recursive(p).strip() for p in ps if get_text_recursive(p).strip())\n                    if cell_text:\n                        cells.append(cell_text)\n                if cells:\n                    blocks.append(\" | \".join(cells))\n        text = \"\\n\".join(blocks)\n        return normalize_whitespace(text), {\"detected_type\": \"odt\"}, warnings\n    except Exception as e:\n        return \"\", {\"detected_type\": \"odt\"}, [f\"ODT parse error: {e}\"]\n\n\ndef extract_image(path: str, lang: str = \"eng\") -> Tuple[str, Dict[str, Any], List[str]]:\n    warnings: List[str] = []\n    try:\n        bgr = cv2.imread(path)\n        if bgr is None:\n            return \"\", {\"detected_type\": \"image\"}, [\"Could not read image\"]\n        processed = preprocess_image_for_ocr_bgr(bgr)\n        text = ocr_np_image(processed, lang=lang)\n        return normalize_whitespace(text), {\"detected_type\": \"image\"}, warnings\n    except Exception as e:\n        return \"\", {\"detected_type\": \"image\"}, [f\"Image OCR error: {e}\"]\n\n\ndef extract_txt(path: str) -> Tuple[str, Dict[str, Any], List[str]]:\n    try:\n        with open(path, \"r\", encoding=\"utf-8\", errors=\"ignore\") as f:\n            return normalize_whitespace(f.read()), {\"detected_type\": \"txt\"}, []\n    except Exception as e:\n        return \"\", {\"detected_type\": \"txt\"}, [f\"TXT read error: {e}\"]\n\n\ndef extract_rtf_naive(path: str) -> Tuple[str, Dict[str, Any], List[str]]:\n    # Very naive RTF strip (works for simple exports). For best results, use an RTF parser lib if allowed.\n    try:\n        raw = open(path, \"r\", encoding=\"utf-8\", errors=\"ignore\").read()\n        # Remove {\\*\\...}, control words, and braces\n        no_controls = re.sub(r\"\\\\[a-zA-Z]+-?\\d* ?\", \"\", raw)\n        no_groups = re.sub(r\"[{}]\", \"\", no_controls)\n        text = re.sub(r\"\\\\'([0-9a-fA-F]{2})\", lambda m: bytes.fromhex(m.group(1)).decode('latin1'), no_groups)\n        return normalize_whitespace(text), {\"detected_type\": \"rtf\"}, []\n    except Exception as e:\n        return \"\", {\"detected_type\": \"rtf\"}, [f\"RTF parse error: {e}\"]\n\n# ----------- Dispatcher -----------\nSUPPORTED = {\".pdf\", \".docx\", \".odt\", \".png\", \".jpg\", \".jpeg\", \".txt\", \".rtf\"}\n\ndef extract_any(path: str, lang: str = \"eng\") -> ExtractResult:\n    ext = os.path.splitext(path)[1].lower()\n    text = \"\"\n    meta: Dict[str, Any] = {}\n    warnings: List[str] = []\n\n    if ext == \".pdf\":\n        text, meta, w = extract_pdf(path, lang=lang)\n        warnings += w\n    elif ext == \".docx\":\n        text, meta, w = extract_docx(path)\n        warnings += w\n    elif ext == \".odt\":\n        text, meta, w = extract_odt(path)\n        warnings += w\n    elif ext in {\".png\", \".jpg\", \".jpeg\"}:\n        text, meta, w = extract_image(path, lang=lang)\n        warnings += w\n    elif ext == \".txt\":\n        text, meta, w = extract_txt(path)\n        warnings += w\n    elif ext == \".rtf\":\n        text, meta, w = extract_rtf_naive(path)\n        warnings += w\n    else:\n        warnings.append(f\"Unsupported file type: {ext}\")\n\n    # Quality pass & extra warnings\n    is_low, q_warnings = low_quality(text)\n    warnings += q_warnings\n    if meta.get(\"detected_type\") == \"pdf\" and meta.get(\"used_ocr_pages\", 0) > 0:\n        warnings.append(f\"Used OCR on {meta['used_ocr_pages']} page(s).\")\n\n    return ExtractResult(text=text, meta=meta, warnings=warnings)\n\nif __name__ == \"__main__\":\n    import argparse, json\n    ap = argparse.ArgumentParser()\n    ap.add_argument(\"path\")\n    ap.add_argument(\"--lang\", default=\"eng\")\n    args = ap.parse_args()\n    res = extract_any(args.path, lang=args.lang)\n    print(json.dumps({\"text\": res.text, \"meta\": res.meta, \"warnings\": res.warnings}, ensure_ascii=False, indent=2))\n```

## `api.py` (Flask upload endpoint)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, tempfile, shutil
from resume_extractor import extract_any

app = Flask(__name__)
CORS(app)  # allow your frontend at dev time

@app.post("/upload")
def upload():
    if "file" not in request.files:
        return jsonify(error="No file part"), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify(error="No filename"), 400

    suffix = os.path.splitext(f.filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        f.save(tmp.name)
        tmp_path = tmp.name

    try:
        res = extract_any(tmp_path, lang=request.args.get("lang", "eng"))
        return jsonify(text=res.text, meta=res.meta, warnings=res.warnings)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

if __name__ == "__main__":
    # Optionally set TESSERACT_CMD and PATH for Ghostscript before running
    # os.environ['TESSERACT_CMD'] = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
    # os.environ['PATH'] = r\"C:\\Program Files\\gs\\gs10.05.1\\bin\" + os.pathsep + os.environ['PATH']
    app.run(host="0.0.0.0", port=5000, debug=True)

