import os
import chromadb
import json

# Đường dẫn đến ChromaDB
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")

print(f"Checking ChromaDB at: {DB_PATH}")

# Kết nối đến ChromaDB
try:
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    print("✅ Connected to ChromaDB successfully")
except Exception as e:
    print(f"❌ Failed to connect to ChromaDB: {e}")
    exit(1)

# Lấy danh sách collection
try:
    collections = chroma_client.list_collections()
    print(f"Found {len(collections)} collections in ChromaDB")
    
    for collection_info in collections:
        collection_name = collection_info.name
        print(f"\n📚 Collection: {collection_name}")
        
        # Lấy collection
        collection = chroma_client.get_collection(name=collection_name)
        
        # Lấy tất cả dữ liệu trong collection
        all_data = collection.get(include=["metadatas", "documents"])
        
        if not all_data or "ids" not in all_data or len(all_data["ids"]) == 0:
            print(f"📭 Collection {collection_name} is empty")
            continue
            
        print(f"📊 Total items in collection: {len(all_data['ids'])}")
        
        # Hiển thị chi tiết về mỗi item
        for i, (id, metadata, doc) in enumerate(zip(all_data["ids"], all_data["metadatas"], all_data["documents"])):
            doc_preview = doc[:100].replace('\n', ' ')
            if len(doc) > 100:
                doc_preview += "..."
                
            print(f"\n🔹 Item {i+1}:")
            print(f"  ID: {id}")
            print(f"  Document: {doc_preview}")
            print(f"  Metadata: {json.dumps(metadata, indent=2)}")
            
            # Nếu có nhiều hơn 10 items, chỉ hiện 10 cái đầu
            if i >= 9 and len(all_data["ids"]) > 10:
                print(f"\n... (and {len(all_data['ids']) - 10} more items)")
                break
                
except Exception as e:
    print(f"❌ Error while reading collections: {e}")
    import traceback
    traceback.print_exc()

print("\nDone checking ChromaDB") 