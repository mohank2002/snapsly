# backend/routes/download.py

from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel
import zipfile
import os
import uuid
import json

router = APIRouter()

class ZipExportRequest(BaseModel):
    transformJs: str
    mappings: dict
    sampleInput: dict

@router.post("/download-zip")
def download_zip(payload: ZipExportRequest):
    export_id = str(uuid.uuid4())
    folder = f"/tmp/snapsly_export_{export_id}"
    os.makedirs(folder, exist_ok=True)

    # Save files
    with open(f"{folder}/transform.js", "w") as f:
        f.write(payload.transformJs)

    with open(f"{folder}/mappings.json", "w") as f:
        json.dump(payload.mappings, f, indent=2)

    with open(f"{folder}/sampleInput.json", "w") as f:
        json.dump(payload.sampleInput, f, indent=2)

    zip_path = f"{folder}.zip"
    with zipfile.ZipFile(zip_path, "w") as zipf:
        for filename in ["transform.js", "mappings.json", "sampleInput.json"]:
            zipf.write(f"{folder}/{filename}", arcname=filename)

    return FileResponse(zip_path, filename="snapsly-export.zip", media_type="application/zip")
