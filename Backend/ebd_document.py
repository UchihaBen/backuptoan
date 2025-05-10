import os
import chromadb
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHUNK_DIR = os.path.join(BASE_DIR, "documents")
DB_PATH = os.path.join(BASE_DIR, "chroma_db")

MODEL_NAME = "intfloat/multilingual-e5-base"
sentence_ef = SentenceTransformer(MODEL_NAME)
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")

documents, metadatas = [], []
for i in range(1, 17):
    file_name = f"Chunk{i:02d}.md"
    file_path = os.path.join(CHUNK_DIR, file_name)

    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        documents.append(content)
        metadatas.append({"page": i})
# theme duwx lieuj vaof db
if documents:
    embeddings = sentence_ef.encode(documents).tolist()
    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=[f"doc_{i}" for i in range(1, len(documents) + 1)]
    )
    print(f"âœ… ÄÃ£ lÆ°u {len(documents)} embeddings vÃ o ChromaDB!")
else:
    print("âš ï¸ KhÃ´ng cÃ³ tÃ i liá»‡u nÃ o Ä‘á»ƒ embeding.")
