from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')  # Fast + accurate

def match_fields(source_fields, target_fields):
    source_embeddings = model.encode(source_fields, convert_to_tensor=True)
    target_embeddings = model.encode(target_fields, convert_to_tensor=True)

    matches = []

    for idx, src in enumerate(source_fields):
        cosine_scores = util.pytorch_cos_sim(source_embeddings[idx], target_embeddings)[0]
        best_idx = int(cosine_scores.argmax())
        confidence = round(float(cosine_scores[best_idx]), 2)

        matches.append({
            "source": src,
            "target": target_fields[best_idx],
            "confidence": confidence
        })

    return matches
