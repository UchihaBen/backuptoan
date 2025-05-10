import sys
from embedding_service import embed_document_chunks

if __name__ == "__main__":
    if len(sys.argv) > 1:
        document_id = sys.argv[1]
        print(f"Đang thực hiện embedding lại cho document: {document_id}")
        result = embed_document_chunks(document_id)
        print(f"Kết quả: {result}")
    else:
        print("Usage: python reembed_document.py <document_id>")
        print("Example: python reembed_document.py 6808a1acfe312cf82bedeecc") 