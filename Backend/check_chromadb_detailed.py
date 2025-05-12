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
        
        # Kiểm tra metadata
        none_metadata_count = 0
        incomplete_metadata_count = 0
        required_fields = ["document_id", "chunk_id", "title", "page"]
        
        for i, (id, metadata, doc) in enumerate(zip(all_data["ids"], all_data["metadatas"], all_data["documents"])):
            # Kiểm tra metadata là None
            if metadata is None:
                none_metadata_count += 1
                print(f"\n⚠️ Item {i+1} has None metadata:")
                print(f"  ID: {id}")
                doc_preview = doc[:100].replace('\n', ' ')
                if len(doc) > 100:
                    doc_preview += "..."
                print(f"  Document: {doc_preview}")
                continue
                
            # Kiểm tra các trường thiếu
            missing_fields = [field for field in required_fields if field not in metadata or metadata[field] is None]
            if missing_fields:
                incomplete_metadata_count += 1
                print(f"\n⚠️ Item {i+1} has incomplete metadata (missing: {', '.join(missing_fields)}):")
                print(f"  ID: {id}")
                doc_preview = doc[:100].replace('\n', ' ')
                if len(doc) > 100:
                    doc_preview += "..."
                print(f"  Document: {doc_preview}")
                print(f"  Metadata: {json.dumps(metadata, indent=2)}")
            
            # In ra tất cả các item
            print(f"\n🔹 Item {i+1}:")
            print(f"  ID: {id}")
            doc_preview = doc[:100].replace('\n', ' ')
            if len(doc) > 100:
                doc_preview += "..."
            print(f"  Document: {doc_preview}")
            print(f"  Metadata: {json.dumps(metadata, indent=2)}")
        
        print(f"\n📋 Summary for collection {collection_name}:")
        print(f"  Total items: {len(all_data['ids'])}")
        print(f"  Items with None metadata: {none_metadata_count}")
        print(f"  Items with incomplete metadata: {incomplete_metadata_count}")
                
except Exception as e:
    print(f"❌ Error while reading collections: {e}")
    import traceback
    traceback.print_exc()

print("\nDone checking ChromaDB") 