import os, re
from typing import Tuple, Dict, Any, List

import numpy as np
import cv2
import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
import pytesseract

# Optional deps (graceful fallbacks)
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

# If you set this in your shell, pdf2image will find pdftoppm/pdftocairo:
POPPLER_PATH = os.getenv("POPPLER_PATH")  # e.g. C:\Program Files\poppler-24.07.0\Library\bin

# -------------- helpers --------------

def _preprocess_bgr_for_ocr(bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    den = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    thr = cv2.adaptiveThreshold(den, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 31, 2)
    blur = cv2.GaussianBlur(thr, (3, 3), 0)
    up = cv2.resize(blur, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    return up

def _ocr_array(arr: np.ndarray, lang: str) -> str:
    return pytesseract.image_to_string(Image.fromarray(arr), lang=lang, config="--oem 1 --psm 3")

def _normalize(text: str) -> str:
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)    # dehyphenate across line breaks
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def _strip_headers_footers(pages: List[str]) -> List[str]:
    if len(pages) < 3:
        return pages
    counts = {}
    per_page = []
    for p in pages:
        lines = [l.strip() for l in p.splitlines() if l.strip()]
        per_page.append(lines)
        for ln in set(lines[:3] + lines[-3:]):  # top 3 + bottom 3 heuristic
            counts[ln] = counts.get(ln, 0) + 1
    common = {ln for ln, c in counts.items() if c >= max(2, len(pages)//2)}
    out = []
    for lines in per_page:
        out.append("\n".join([l for l in lines if l not in common]))
    return out

def _quality(text: str) -> List[str]:
    w = []
    s = text.strip()
    if not s:
        return ["No text extracted."]
    if len(s) < 300:
        w.append("Very short extraction (<300 chars). May be incomplete.")
    total = len(s)
    alpha = sum(ch.isalpha() for ch in s)
    symbols = sum(1 for ch in s if not ch.isalnum() and not ch.isspace())
    if alpha / total < 0.5:
        w.append("Low alphabetic ratio; OCR may be noisy.")
    if symbols / total > 0.25:
        w.append("High symbol ratio; layout/encoding noise detected.")
    return w

# -------------- extractors --------------

def extract_pdf(path: str, lang: str) -> Tuple[str, Dict[str, Any], List[str]]:
    warnings: List[str] = []
    pages: List[str] = []
    used_ocr = 0

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            txt = None
            try:
                txt = page.extract_text(x_tolerance=2, y_tolerance=2, keep_blank_chars=False)
            except Exception:
                txt = None

            if txt and txt.strip():
                pages.append(txt)
            else:
                try:
                    images = convert_from_path(
                        path, dpi=300,
                        first_page=page.page_number, last_page=page.page_number,
                        poppler_path=POPPLLER_PATH if (POPPLER_PATH := os.getenv("POPPLER_PATH")) else None
                    )
                    if images:
                        bgr = cv2.cvtColor(np.array(images[0]), cv2.COLOR_RGB2BGR)
                        proc = _preprocess_bgr_for_ocr(bgr)
                        ocr = _ocr_array(proc, lang)
                        pages.append(ocr)
                        used_ocr += 1
                    else:
                        pages.append("\n")
                except Exception as e:
                    warnings.append(f"OCR failed on page {page.page_number}: {e}")
                    pages.append("\n")

    pages = _strip_headers_footers(pages)
    merged = _normalize("\n\n".join(pages))
    meta = {"detected_type": "pdf", "page_count": len(pages), "used_ocr_pages": used_ocr}
    if used_ocr:
        warnings.append(f"Used OCR on {used_ocr} page(s).")
    return merged, meta, warnings

def extract_docx(path: str) -> Tuple[str, Dict[str, Any], List[str]]:
    if not Document:
        return "", {"detected_type": "docx"}, ["python-docx not installed"]
    try:
        doc = Document(path)
        text = "\n".join(p.text for p in doc.paragraphs)
        return _normalize(text), {"detected_type": "docx"}, []
    except Exception as e:
        return "", {"detected_type": "docx"}, [f"DOCX parse error: {e}"]

def extract_odt(path: str) -> Tuple[str, Dict[str, Any], List[str]]:
    if not odf_load:
        return "", {"detected_type": "odt"}, ["odfpy not installed"]

    def rec(el) -> str:
        t = ""
        for node in getattr(el, "childNodes", []):
            if getattr(node, "nodeType", None) == node.TEXT_NODE:
                t += node.data
            elif ODFElement and isinstance(node, ODFElement):
                t += rec(node)
        return t

    try:
        doc = odf_load(path)
        blocks: List[str] = []
        for elem in doc.getElementsByType(odf_text.P) + doc.getElementsByType(odf_text.H):
            s = rec(elem).strip()
            if s:
                blocks.append(s)
        for tbl in doc.getElementsByType(odf_table.Table):
            for row in tbl.getElementsByType(odf_table.TableRow):
                cells = []
                for cell in row.getElementsByType(odf_table.TableCell):
                    ps = cell.getElementsByType(odf_text.P)
                    c = " ".join(rec(p).strip() for p in ps if rec(p).strip())
                    if c:
                        cells.append(c)
                if cells:
                    blocks.append(" | ".join(cells))
        text = "\n".join(blocks)
        return _normalize(text), {"detected_type": "odt"}, []
    except Exception as e:
        return "", {"detected_type": "odt"}, [f"ODT parse error: {e}"]

def extract_image(path: str, lang: str) -> Tuple[str, Dict[str, Any], List[str]]:
    bgr = cv2.imread(path)
    if bgr is None:
        return "", {"detected_type": "image"}, ["Could not read image"]
    proc = _preprocess_bgr_for_ocr(bgr)
    text = _ocr_array(proc, lang)
    return _normalize(text), {"detected_type": "image"}, []

def extract_txt(path: str) -> Tuple[str, Dict[str, Any], List[str]]:
    try:
        s = open(path, "r", encoding="utf-8", errors="ignore").read()
        return _normalize(s), {"detected_type": "txt"}, []
    except Exception as e:
        return "", {"detected_type": "txt"}, [f"TXT read error: {e}"]

def extract_rtf_naive(path: str) -> Tuple[str, Dict[str, Any], List[str]]:
    try:
        raw = open(path, "r", encoding="utf-8", errors="ignore").read()
        no_controls = re.sub(r"\\[a-zA-Z]+-?\d* ?", "", raw)
        no_groups = re.sub(r"[{}]", "", no_controls)
        text = re.sub(r"\\'([0-9a-fA-F]{2})", lambda m: bytes.fromhex(m.group(1)).decode("latin1"), no_groups)
        return _normalize(text), {"detected_type": "rtf"}, []
    except Exception as e:
        return "", {"detected_type": "rtf"}, [f"RTF parse error: {e}"]

# -------------- dispatcher --------------

SUPPORTED = {".pdf", ".docx", ".odt", ".png", ".jpg", ".jpeg", ".txt", ".rtf"}

def extract_any(path: str, lang: str = "eng") -> Dict[str, Any]:
    ext = os.path.splitext(path)[1].lower()
    text = ""
    meta: Dict[str, Any] = {}
    warnings: List[str] = []

    if ext == ".pdf":
        text, meta, w = extract_pdf(path, lang)
    elif ext == ".docx":
        text, meta, w = extract_docx(path)
    elif ext == ".odt":
        text, meta, w = extract_odt(path)
    elif ext in {".png", ".jpg", ".jpeg"}:
        text, meta, w = extract_image(path, lang)
    elif ext == ".txt":
        text, meta, w = extract_txt(path)
    elif ext == ".rtf":
        text, meta, w = extract_rtf_naive(path)
    else:
        w = [f"Unsupported file type: {ext}"]

    warnings += w
    warnings += _quality(text)
    return {"text": text, "meta": meta, "warnings": warnings}
