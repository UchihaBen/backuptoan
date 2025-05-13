import os
import chromadb
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from PIL import Image as PILImage
from model_manager import get_model_instance  # Import model manager


GENMINI_API_KEY = "AIzaSyCkouU85gLzz8utrcOzz8MwsJ3Pgqqfuqc"
genai.configure(api_key=GENMINI_API_KEY)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")


MODEL_NAME = "intfloat/multilingual-e5-base"
# Sử dụng model_manager để tải model từ cache
sentence_ef = get_model_instance()
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="my_collection")


def get_fresh_collection():
    from chromadb import PersistentClient
    chroma_client = PersistentClient(path=DB_PATH)
    return chroma_client.get_collection(name="my_collection")

def search_similar_chunks(question, top_k=3):
    query_embedding = sentence_ef.encode([question]).tolist()
    # Lấy collection mới nhất từ disk để đảm bảo dữ liệu mới nhất
    collection = get_fresh_collection()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)

    chunks_found = []
    if results["documents"]:
        for doc, metadata, score in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
            # Kiểm tra metadata có phải None không
            if metadata is None:
                metadata = {'page': 0}
            
            chunks_found.append({
                'page': metadata.get('page', metadata.get('chunk_index', 0)),
                'content': doc,
                'score': score
            })
    
    return chunks_found

def generate_answer_with_genmini(question, context, image_paths=None):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')

        input_parts = [
            f"""
            Bạn là một trợ lý AI gia sư Toán học với nhiều năm kinh nghiệm giảng dạy.
        Nhiệm vụ của bạn là hướng dẫn học sinh một cách tự nhiên, rõ ràng và dễ hiểu, chỉ dựa trên thông tin từ sách giáo khoa mà tôi cung cấp.
        Lưu ý: Bạn không được sử dụng bất kỳ kiến thức nào từ nguồn ngoài – chỉ dựa trên nội dung sách giáo khoa.
        
        📖 Thông tin từ sách giáo khoa:
        {context}
        
        ❓ Câu hỏi của học sinh:
        {question}
        
        Hướng dẫn trả lời: Bao gồm đầy đủ các mục sau
        
        1. Tóm tắt kiến thức trọng tâm:
           - Tóm tắt ngắn gọn các khái niệm, công thức và phương pháp giải (bao gồm cách giải) liên quan đến câu hỏi.
        
        2. Bản tóm tắt và lưu ý quan trọng:
           - Tổng hợp những điểm mấu chốt, lưu ý đặc biệt và lỗi sai thường gặp mà học sinh cần tránh.
        
        3. Các thuật ngữ quan trọng:
           - Liệt kê và giải thích các thuật ngữ chuyên môn bằng ngôn ngữ đơn giản, dễ hiểu.
        
        4. Câu hỏi trắc nghiệm (Multiple Choice Questions):
           - Đưa ra đúng 10 câu hỏi trắc nghiệm(không được phép thiếu) từ 1 đến 10 với 4 đáp án cho mỗi câu, giúp kiểm tra nhanh kiến thức.
        
        5. Câu hỏi ngắn (Short Answer Questions):
           - Đưa ra từ 3-5 câu hỏi mở ngắn gọn nhằm kích thích tư duy của học sinh.
        
        6. Bài toán mở rộng, ứng dụng thực tế (Open-ended Prompts):
           - Đưa ra 1-2 bài toán hoặc tình huống ứng dụng thực tế, giúp học sinh liên hệ kiến thức với thực tiễn.
        
        7. Ví dụ và bài giải cụ thể:
           - Lấy 1 ví dụ và lời giải từ 1 ví dụ có lời giải trong tài liệu.
           - Lưu ý: Giữ nguyên đề bài lời giải và định dạng Markdown của hình ảnh nếu có của ví dụ trên không thay đổi thêm bớt gì, tuy nhiên có thể thêm chú ý vào những phần quan trọng sau khi giải xong NẾU CẦN.
        
        8. Trả lời câu hỏi:
           - Trả lời câu hỏi được hỏi một các trực tiếp đi thẳng vào vấn đề dựa vào phần kiến thức đã để cập bên trên
        
        Nguyên tắc quan trọng khi trả lời
        
        - Chỉ sử dụng thông tin từ sách giáo khoa:
          Nếu sách giáo khoa không cung cấp đủ thông tin, hãy trả lời:
          "Tôi không có đủ thông tin để trả lời câu hỏi này dựa trên sách giáo khoa."
        
        - Phong cách giảng dạy của gia sư:
          - Sử dụng lời văn tự nhiên, gần gũi như khi giảng bài trực tiếp.
          - Sử dụng phép so sánh trực quan (ví dụ: cực đại như đỉnh núi, cực tiểu như đáy thung lũng) để học sinh dễ hình dung.
          - Đặt câu hỏi ngược lại khi cần để kích thích tư duy học sinh.
        
        - Hình ảnh:
          - Nếu tài liệu chứa định dạng Markdown của hình ảnh (ví dụ: `![Bảng biến thiên - Ví dụ 6](images/minhhoa_trang11_06.png)`), hãy giữ nguyên định dạng đó trong câu trả lời.
          - Không render hay thay đổi định dạng; chỉ trả về nguyên văn đoạn Markdown.
          - Không thay đổi số liệu trong bài tập có hình ảnh liên quan.
          - Nếu cần hình minh họa của đồ thị hàm số thì bạn trả về dạng 
          
        - Công thức toán học:
          - Hãy sử dụng định dạng **Markdown raw** để đảm bảo công thức hiển thị đúng bởi MathJax.
          - Dùng **\( ... \) cho công thức inline** và **$$ ... $$ cho công thức block**.
          - Tuyệt đối **không sử dụng \[ ... \]** để tránh lỗi hiển thị trên một số nền tảng.
          - Giữ nguyên tất cả **ký tự escape** và **không tự động chuyển đổi ký hiệu toán học**.
          - Nếu công thức quá dài, hãy **xuống dòng hợp lý** khi dùng `$$ ... $$` để dễ đọc.
          - **Không chèn ký tự dư thừa** hoặc khoảng trắng không cần thiết trong công thức.


        - Từng bước giải bài tập:
          - Không giải bài tập tương tự ngay lập tức; hãy hướng dẫn từng bước để học sinh tự tìm ra lời giải.
          - Các bài tập bổ sung cần có độ khó tăng dần, từ cơ bản đến nâng cao.
        
        Hãy đảm bảo câu trả lời của bạn rõ ràng, có cấu trúc khoa học và giúp học sinh phát triển tư duy độc lập!

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
