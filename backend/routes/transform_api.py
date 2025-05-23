from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Literal
from llm.openai_provider import generate_transform_code

router = APIRouter()

class MappingEntry(BaseModel):
    target: str
    source: Optional[str] = None
    transform: Optional[str] = None
    type: Optional[str] = "field"
    children: Optional[List['MappingEntry']] = None

MappingEntry.update_forward_refs()

class TransformRequest(BaseModel):
    spec: List[MappingEntry]
    llm: Literal["openai", "llama", "deepseek"] = "openai"

@router.post("/generate-transform")
async def generate_transform(request: TransformRequest):
    prompt = build_prompt(request.spec)

    if request.llm == "openai":
        code = await generate_transform_code(prompt)
    else:
        raise NotImplementedError(f"LLM provider {request.llm} not supported yet.")

    return {"code": code}


def build_prompt(spec: List[MappingEntry]) -> str:
    return f"""
You are a code generator that writes JavaScript transform functions.

Given an object `input`, generate a function like:

function transform(input) {{
  return {{
    ...mapped fields...
  }};
}}

Use this mapping spec:
{[entry.dict() for entry in spec]}

Include nested objects and transformation logic where applicable.
Use safe defaults. Output only the function.
"""
