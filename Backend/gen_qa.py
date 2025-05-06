import os
import chromadb
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from PIL import Image as PILImage


GENMINI_API_KEY = "AIzaSyCkouU85gLzz8utrcOzz8MwsJ3Pgqqfuqc"
genai.configure(api_key=GENMINI_API_KEY)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")


MODEL_NAME = "intfloat/multilingual-e5-large"
sentence_ef = SentenceTransformer(MODEL_NAME)
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")


def search_similar_chunks(question, top_k=3):
    query_embedding = sentence_ef.encode([question]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)

    return [
        {'page': metadata['page'], 'content': doc, 'score': score}
        for doc, metadata, score in zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
    ] if results["documents"] else []

def generate_answer_with_genmini(question, context, image_paths=None):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')

        input_parts = [
    f"""
    # Hướng Dẫn Tạo Câu Hỏi Trắc Nghiệm Toán Học Thông Minh

    ## 🤖 Vai Trò
    Bạn là một trợ lý AI chuyên tạo câu hỏi trắc nghiệm Toán học.

    ## 📚 Đầu Vào
    📖 Thông tin từ sách giáo khoa:
    """ + context + """

    ❓ Câu hỏi của học sinh:
    """ + question + """

    ## 🎯 Nguyên Tắc Tạo Câu Hỏi
    1. Yêu Cầu Cơ Bản:
       - Liên quan trực tiếp đến chủ đề Câu hỏi của học sinh.
       - Xây dựng dựa trên thông tin từ sách giáo khoa.
       - Có độ khó đa dạng

    2. Chiến Lược Chi Tiết
       - Phân tích sâu câu hỏi của học sinh và thông tin từ sách giáo khoa.
       - Xác định từ khóa chính
       - Tạo câu hỏi từ nhận biết đến vận dụng cao

    ## 🧮 Quy Tắc Viết Công Thức Toán Học
    ### Nguyên Tắc Bắt Buộc:
    1. Công Thức Inline:
       - Luôn sử dụng \( ... \)
       - Ví dụ: \( x^2 + y^2 = z^2 \)
       - KHÔNG được dùng $ ... $ hay [ ... ]

    2. Công Thức Block:
       - Luôn sử dụng $$ ... $$
       - Ví dụ: 
         $$\int_{a}^{b} f(x) dx$$
       - Xuống dòng trước và sau công thức
       - KHÔNG được dùng \[ ... \]

    3. Các Lưu Ý Quan Trọng:
       - Sử dụng ký tự toán học gốc
       - Không thêm khoảng trắng thừa
       - Sử dụng các lệnh LaTeX chuẩn
       - Ưu tiên các hàm toán học chuẩn: \sin, \cos, \lim, \log, v.v.

    ## 📝 Cấu Trúc Câu Hỏi
    - Tổng: **10 câu hỏi**
    - Mỗi câu: 4 đáp án (A, B, C, D)
    - Chỉ 1 đáp án đúng

    ## 🔍 Định Dạng JSON
    ```json
    {
      "questions": [
        {
          "question": "Nội dung câu hỏi",
          "options": {
            "A": "Đáp án A",
            "B": "Đáp án B", 
            "C": "Đáp án C",
            "D": "Đáp án D"
          },
          "answer": "B",
          "solution": "Giải thích chi tiết"
        }
      ]
    }
    ```

    ## ⚠️ Lưu Ý QUAN TRỌNG
    - Nếu không đủ thông tin: Trả về JSON rỗng
    - Ưu tiên thuật ngữ từ text chunk
    - Tránh câu hỏi quá khó/dễ
    - LUÔN LUÔN tuân thủ quy tắc viết công thức toán học
    """
]


        if image_paths:
            for img_path in image_paths:
                if os.path.exists(img_path):
                    input_parts.append(PILImage.open(img_path))

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."

    except Exception as e:
        return f"⚠️ Lỗi khi gọi GenMini API: {str(e)}"
def rag_pipeline(question):
    retrieved_chunks = search_similar_chunks(question, top_k=3)
    image_paths = []

    context = "\n\n".join(f"{chunk['content']}" for chunk in retrieved_chunks)
    answer = generate_answer_with_genmini(question, context, image_paths) if context else "❌ Không tìm thấy tài liệu phù hợp."

    return {
        'question': question,
        'retrieved_chunks': retrieved_chunks,
        'answer': answer
    }



if __name__ == "__main__":
    user_question = "Điều kiện để một điểm là cực tiểu của hàm số là gì?"
    result = rag_pipeline(user_question)

    print("\n===== 📖 Kết quả tìm kiếm =====")
    for chunk in result['retrieved_chunks']:
        print(f"- Trang {chunk['page']}: {chunk['content'][:200]}...")  # Chỉ hiển thị 200 ký tự đầu tiên

    print("\n===== Gia sư trả lời =====")
    print(f"### Kết quả: \n\n**{result['answer']}**")  
