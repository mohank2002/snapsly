from fastapi import FastAPI
from routes.match_api import router as match_router
from routes.transform_api import router as transform_router
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mount all route modules here
app.include_router(match_router, prefix="/match")
app.include_router(transform_router, prefix="/transform")
