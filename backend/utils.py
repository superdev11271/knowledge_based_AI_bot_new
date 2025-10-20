import os
from dotenv import load_dotenv
from openai import OpenAI
import openai

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
mode = os.getenv("MODE")

if mode == "develop":
    proxy_url = os.getenv("PROXY_URL")
    os.environ["HTTP_PROXY"] = proxy_url
    os.environ["HTTPS_PROXY"] = proxy_url
    openai.proxy = {
        "http": proxy_url,
        "https": proxy_url,
    }

client = OpenAI(api_key=OPENAI_API_KEY)



def embed_text(text):
    """Get OpenAI embedding for a chunk of text"""
    resp = client.embeddings.create(
        input=text,
        model="text-embedding-3-large"  # or "large" if you want higher quality
    )
    
    data = resp.data
    embeddings = [item.embedding for item in data]
    return embeddings