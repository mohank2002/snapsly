from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Literal
from llm.openai_provider import generate_transform_code
from openai import OpenAI
import os
import json

router = APIRouter()
client = OpenAI()  # Automatically uses OPENAI_API_KEY from env

# -------------------------
# 🧠 Day 12: Suggest transform expression per field
# -------------------------

class SuggestRequest(BaseModel):
    sourceField: str
    targetField: str
    sampleInput: dict
    existingMappings: dict

@router.post("/suggest-transform")
async def suggest_transform(request: SuggestRequest):
    prompt = f"""
You are a JavaScript data transformation expert.
Given a source JSON object and a target field, suggest a valid JavaScript transform expression.

Rules:
- Use `input.<field>` to access input values.
- Output must be a single expression, no explanation.

Target field: {request.targetField}
Sample source JSON: {json.dumps(request.sampleInput)}
Existing mappings: {request.existingMappings}

Expression:
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You write JavaScript transform expressions for API integration."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        raw = response.choices[0].message.content
        print("=== RAW GPT RESPONSE ===")
        print(raw)

        cleaned = clean_expression(raw)
        print("=== CLEANED EXPRESSION ===")
        print(cleaned)

        return {"transform": cleaned}
    except Exception as e:
        print("Error generating suggestion:", str(e))
        return {"error": str(e)}

def clean_expression(text: str) -> str:
    if "```" in text:
        text = text.replace("```javascript", "").replace("```", "")
    return text.strip()


# -------------------------
# 💡 Day 7 & 8: Full transform generator (detailed + simple)
# -------------------------

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


# -------------------------
# 🤖 Day 8: Simple mapping format for test UI
# -------------------------

class SimpleTransformRequest(BaseModel):
    sourceJson: dict
    mappings: dict
    llm: Literal["openai"] = "openai"

@router.post("/generate-transform-simple")
async def generate_transform_simple(request: SimpleTransformRequest):
    spec = []
    for source, config in request.mappings.items():
        spec.append({
            "source": source,
            "target": config.get("target", ""),
            "transform": config.get("transform", f"input.{source}")
        })

    prompt = f"""
You are a code generator that writes clean and reliable JavaScript transform functions.

Given the following input JSON sample:
{request.sourceJson}

And the field mapping spec (with transform expressions):

{spec}

Write a single JavaScript function like:

function transform(input) {{
  return {{
    ...mapped fields here
  }};
}}

- Use the "transform" field as the right-hand side expression.
- Structure the object according to "target".
- Output only the function.
"""

    if request.llm == "openai":
        code = await generate_transform_code(prompt)
    else:
        raise NotImplementedError(f"LLM provider {request.llm} not supported yet.")

    return {"code": code}
