import sys
import os
from bson import ObjectId
from pymongo import MongoClient
import chromadb

# Kết nối MongoDB
from mongoDB.config import chunks_collection

# Function để kiểm tra trạng thái embedding
def check_embedding_status(document_id):
    # Chuyển document_id sang đúng định dạng
    if isinstance(document_id, str) and ObjectId.is_valid(document_id):
        doc_id = ObjectId(document_id)
    else:
        doc_id = document_id
        
    # Convert doc_id to string for consistent comparisons
    str_doc_id = str(doc_id)
    
    print(f"Kiểm tra trạng thái embedding cho document ID: {str_doc_id}")
    
    # Kiểm tra trong MongoDB
    chunks = list(chunks_collection.find({"document_id": str_doc_id}))
    print(f"Số lượng chunks trong MongoDB: {len(chunks)}")
    
    if len(chunks) > 0:
        # Kiểm tra trạng thái embedding
        completed = sum(1 for chunk in chunks if chunk.get("embedding_status") == "completed")
        print(f"Số chunks đã hoàn thành embedding: {completed}/{len(chunks)}")
        
        # In chi tiết về 5 chunk đầu tiên
        print("\nChi tiết 5 chunk đầu tiên:")
        for i, chunk in enumerate(chunks[:5]):
            print(f"Chunk {i+1}:")
            print(f"  ID: {chunk.get('_id')}")
            print(f"  Index: {chunk.get('index')}")
            print(f"  Embedding Status: {chunk.get('embedding_status', 'N/A')}")
            print(f"  Content (preview): {chunk.get('content', '')[:100]}...")
    else:
        print("Không tìm thấy chunks nào cho document này trong MongoDB")
    
    # Kiểm tra trong ChromaDB
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
    client = chromadb.PersistentClient(path=db_path)
    
    try:
        collection = client.get_collection("my_collection")
        results = collection.get(
            where={"document_id": str_doc_id},
            include=["metadatas"]
        )
        
        if results and "ids" in results:
            print(f"\nSố lượng chunks trong ChromaDB: {len(results['ids'])}")
            
            # In chi tiết về 5 chunk đầu tiên trong ChromaDB
            if len(results["ids"]) > 0:
                print("\nChi tiết 5 chunk đầu tiên trong ChromaDB:")
                for i in range(min(5, len(results["ids"]))):
                    print(f"Chunk {i+1}:")
                    print(f"  ID: {results['ids'][i]}")
                    print(f"  Metadata: {results['metadatas'][i]}")
            else:
                print("Không có dữ liệu nào trong ChromaDB cho document này")
        else:
            print("Không tìm thấy dữ liệu trong ChromaDB cho document này")
    except Exception as e:
        print(f"Lỗi khi truy cập ChromaDB: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        document_id = sys.argv[1]
        check_embedding_status(document_id)
    else:
        print("Usage: python check_embedding_status.py <document_id>")
        print("Example: python check_embedding_status.py 680a261ce1fd7668b46b8f00") 