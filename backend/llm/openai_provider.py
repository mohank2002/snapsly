import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()  # ✅ ensure env is loaded before accessing it


client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_transform_code(prompt: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You generate JavaScript transform functions."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )
    return response.choices[0].message.content.strip()
