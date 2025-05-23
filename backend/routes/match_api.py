# routes/match_api.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer, util

router = APIRouter()
model = SentenceTransformer('all-MiniLM-L6-v2')

class MatchRequest(BaseModel):
    sourceFields: List[str]
    targetFields: List[str]

@router.post("/")
async def match_fields(payload: MatchRequest):
    src = payload.sourceFields
    tgt = payload.targetFields

    src_emb = model.encode(src, convert_to_tensor=True)
    tgt_emb = model.encode(tgt, convert_to_tensor=True)

    matches = []
    for i, s in enumerate(src):
        sim = util.pytorch_cos_sim(src_emb[i], tgt_emb)[0]
        best_idx = int(sim.argmax())
        confidence = round(float(sim[best_idx]), 2)
        matches.append({
            "source": s,
            "target": tgt[best_idx],
            "confidence": confidence
        })
    return matches
