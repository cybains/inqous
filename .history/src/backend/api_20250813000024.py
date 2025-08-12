from flask import Flask, request, jsonify
from flask-cors import CORS
import os, tempfile
from resume_extractor import extract_any  # local module

app = Flask(__name__)
CORS(app)  # helpful in dev even if you proxy via Next

@app.post("/upload")
def upload():
    if "file" not in request.files:
        return jsonify(error="No file part"), 400
    f = request.files["file"]
    if not f or not f.filename:
        return jsonify(error="No filename"), 400

    suffix = os.path.splitext(f.filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        f.save(tmp.name)
        tmp_path = tmp.name

    try:
        lang = request.args.get("lang", "eng")
        res = extract_any(tmp_path, lang=lang)
        return jsonify(text=res["text"], meta=res["meta"], warnings=res["warnings"])
    except Exception as e:
        return jsonify(error=str(e)), 500
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

if __name__ == "__main__":
    # Windows: set these before running if needed
    # os.environ["TESSERACT_CMD"] = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    # os.environ["PATH"] = r"C:\Program Files\gs\gs10.05.1\bin" + os.pathsep + os.environ["PATH"]
    app.run(host="0.0.0.0", port=5000, debug=True)
