from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer, util

router = APIRouter()
model = SentenceTransformer('all-MiniLM-L6-v2')  # Lightweight + good accuracy

class MatchRequest(BaseModel):
    sourceFields: List[str]
    targetFields: List[str]

@router.post("/auto")
async def auto_match_fields(payload: MatchRequest):
    source = payload.sourceFields
    target = payload.targetFields

    source_embeddings = model.encode(source, convert_to_tensor=True)
    target_embeddings = model.encode(target, convert_to_tensor=True)

    mappings = {}

    for i, src_field in enumerate(source):
        similarity_scores = util.pytorch_cos_sim(source_embeddings[i], target_embeddings)[0]
        best_idx = int(similarity_scores.argmax())
        best_match = target[best_idx]
        confidence = round(float(similarity_scores[best_idx]), 2)

        # Store just the best target field; optionally include confidence
        mappings[src_field] = {
            "target": best_match,
            "confidence": confidence
        }

    return {"mappings": mappings}
