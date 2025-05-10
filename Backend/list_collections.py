import os
import chromadb

# Đường dẫn đến thư mục ChromaDB
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
print(f"Đường dẫn đến ChromaDB: {db_path}")

# Khởi tạo ChromaDB client
client = chromadb.PersistentClient(path=db_path)

# Liệt kê tất cả collections
collections = client.list_collections()
print(f"Số lượng collections: {len(collections)}")
for collection in collections:
    print(f"Tên collection: {collection.name}")
    coll = client.get_collection(collection.name)
    count = coll.count()
    print(f"Số lượng items trong collection {collection.name}: {count}")

# Kiểm tra collection cụ thể
try:
    my_collection = client.get_collection("my_collection")
    print(f"\nKiểm tra chi tiết collection 'my_collection':")
    print(f"Số lượng items: {my_collection.count()}")
    
    # Lấy 5 item đầu tiên
    results = my_collection.get(limit=5, include=["metadatas", "documents"])
    if results and "ids" in results and len(results["ids"]) > 0:
        print(f"5 document đầu tiên:")
        for i in range(len(results["ids"])):
            print(f"  ID: {results['ids'][i]}")
            print(f"  Metadata: {results['metadatas'][i]}")
    else:
        print("Không có dữ liệu trong collection")
except Exception as e:
    print(f"Lỗi khi truy cập collection 'my_collection': {str(e)}") 