from fastapi import FastAPI
from routes.match_api import router as match_router
from routes.transform_api import router as transform_router
from routes.download import router as download_router  # ✅ Import the ZIP download router
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from routes.upload import router as upload_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to "http://localhost:3000" if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Mount all route modules here
app.include_router(match_router, prefix="/match")
app.include_router(transform_router, prefix="/transform")
app.include_router(download_router, prefix="/api")  # ✅ ZIP export endpoint available at /api/download-zip
app.include_router(upload_router, prefix="/api")  # ✅ ZIP upload endpoint available at /api/upload-zip