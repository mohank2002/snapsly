# backend/routes/upload.py

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import zipfile
import tempfile
import json
import os

router = APIRouter()

@router.post("/upload-zip")
async def upload_zip(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        return JSONResponse(status_code=400, content={"error": "Only ZIP files are allowed"})

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, file.filename)
        with open(zip_path, "wb") as f:
            f.write(await file.read())

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        try:
            with open(os.path.join(tmpdir, "mappings.json")) as f:
                mappings = json.load(f)
            with open(os.path.join(tmpdir, "sampleInput.json")) as f:
                sample_input = json.load(f)
            with open(os.path.join(tmpdir, "transform.js")) as f:
                transform_js = f.read()
        except FileNotFoundError as e:
            return JSONResponse(status_code=400, content={"error": f"Missing file: {e.filename}"})

        return {
            "mappings": mappings,
            "sampleInput": sample_input,
            "transformJs": transform_js
        }
