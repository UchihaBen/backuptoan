import os
import chromadb
import fastapi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import base64
from PIL import Image
import io
# 🔐 Đặt API key của Gemini từ biến môi trường thay vì hardcode (bảo mật hơn)
GENMINI_API_KEY = "AIzaSyAqX5bkYluS_QKYSILRVCJHvY6KpSy2-ds"
genai.configure(api_key=GENMINI_API_KEY)

app = FastAPI()

# ✅ Thêm CORS Middleware để React frontend có thể gọi API mà không lỗi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hoặc thay "*" bằng ["http://localhost:3000"] nếu chỉ dùng nội bộ
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")
MODEL_NAME = "intfloat/multilingual-e5-large"

# ✅ Kiểm tra model có tải thành công không
try:
    sentence_ef = SentenceTransformer(MODEL_NAME)
except Exception as e:
    print(f"⚠️ Lỗi khi tải model {MODEL_NAME}: {e}")

# ✅ Kiểm tra kết nối ChromaDB
try:
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    collection = chroma_client.get_or_create_collection(name="my_collection")
except Exception as e:
    print(f"⚠️ Lỗi khi kết nối ChromaDB: {e}")

# Định nghĩa request
class QuestionRequest(BaseModel):
    question: str

class GradeRequest(BaseModel):
    student_image_path: str
    answer_key: str

# Tạo class TopicRequest cho API tạo câu hỏi từ admin
class TopicRequest(BaseModel):
    topic: str

def search_similar_chunks(question, top_k=3):
    try:
        query_embedding = sentence_ef.encode([question]).tolist()
        results = collection.query(query_embeddings=query_embedding, n_results=top_k)

        if not results["documents"]:
            return []

        return [
            {
                'page': metadata.get('page', metadata.get('chunk_index', 0)), 
                'content': doc, 
                'score': score,
                'document_id': metadata.get('document_id', 'unknown'),
                'title': metadata.get('title', 'Unnamed Chunk')
            }
            for doc, metadata, score in zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
        ]
    except Exception as e:
        print(f"⚠️ Lỗi khi tìm kiếm tài liệu: {str(e)}")
        return []

def generate_answer(question, context):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')  # 🔄 Cập nhật model mới hơn nếu có
        input_parts = [
            f"""
            Bạn là một trợ lý AI gia sư Toán học với nhiều năm kinh nghiệm giảng dạy.  
            Nhiệm vụ của bạn là hướng dẫn học sinh một cách tự nhiên, rõ ràng và dễ hiểu, **chỉ dựa trên thông tin từ sách giáo khoa mà tôi cung cấp**.  

            ---  

            ### **🚨 Lưu ý quan trọng:**  
            - **KHÔNG** sử dụng bất kỳ kiến thức nào từ nguồn ngoài – chỉ dựa trên nội dung sách giáo khoa. 
            - ** Nếu câu hỏi không liên quan đến chủ đề Toán học thì từ chối trả lờilời"** 
            - **Nếu câu hỏi liên quan đến toán học nhưng kiến thức trong sách giao khoa không có đủ thông tin liên quan để trả lời câu hỏi thì trả lời là ""Không đủ kiến thứuc để trả lời"
            - **Trả về kết quả định dạng Markdown**, đảm bảo hiển thị tốt trong React:
            - **Công thức toán inline:** `$...$`
            - **Công thức toán block:** `$$...$$`  
            - **Chữ in đậm:** `**...**`

            ---  

            ### **📚 Thông tin từ sách giáo khoa:**  
            {context}  

            ### **❓ Câu hỏi của học sinh:**  
            {question}  

            ### **🔹 Hướng dẫn trả lời (tuân theo cấu trúc sau):**  

            #### **1. Tóm tắt kiến thức trọng tâm:**  
            - Trình bày ngắn gọn các khái niệm, công thức và phương pháp giải.
            - Các công thức phải được viết dưới dạng LaTeX:
            - **Inline:** `Diện tích hình tròn: $S = \pi r^2$`
            - **Block:**  
                ```md
                $$S = \pi r^2$$
                ```

            #### **2. Bản tóm tắt và lưu ý quan trọng:**  
            - Liệt kê các điểm mấu chốt, lỗi sai thường gặp.

            #### **3. Các thuật ngữ quan trọng:**  
            - Giải thích các thuật ngữ chuyên môn bằng ngôn ngữ dễ hiểu.

            #### **. Trả lời câu hỏi:**  
            - Trả lời câu hỏi trực tiếp dựa trên kiến thức đã trình bày.

            ---

            ### **⚠️ Nguyên tắc quan trọng khi trả lời:**  

            ✅ **Chỉ dựa trên thông tin từ sách giáo khoa.**  
            - Nếu sách không cung cấp đủ thông tin, trả lời:  
            > _"Tôi không có đủ thông tin để trả lời câu hỏi này dựa trên sách giáo khoa."_  
            -

            ✅ **Phong cách giảng dạy của gia sư:**  
            - Sử dụng lời văn tự nhiên, gần gũi.
            - Dùng phép so sánh trực quan để giúp học sinh dễ hình dung.
            - Đặt câu hỏi ngược lại để kích thích tư duy học sinh.

            ✅ **Hướng dẫn từng bước giải bài tập:**  
            - KHÔNG giải bài tập ngay lập tức; hướng dẫn từng bước để học sinh tự suy nghĩ.
            - Đưa ra bài tập bổ sung có độ khó tăng dần.

            ---

            📈 **Hãy đảm bảo câu trả lời của bạn rõ ràng, có cấu trúc khoa học(xuống dòng hợp lý) và giúp học sinh phát triển tư duy độc lập!**

        """
        ]

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
        return "⚠️ Lỗi khi gọi GenMini API."
    
# //-----------------------------------------------------------------------------------------------

def generate_Multiple_Choice_Questions(question, context):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')  # 🔄 Cập nhật model mới hơn nếu có
        input_parts = [
            f"""
            # Hướng Dẫn Tạo Câu Hỏi Trắc Nghiệm Toán Học Thông Minh với Đánh Giá Độ Khó

## 🤖 Vai Trò
Bạn là một trợ lý AI chuyên tạo câu hỏi trắc nghiệm Toán học và đánh giá độ khó của các câu hỏi.

## 📚 Đầu Vào
📖 Thông tin từ sách giáo khoa:
""" + context + """

❓ Câu hỏi của học sinh:
""" + question + """

## 🎯 Nguyên Tắc Tạo Câu Hỏi
1. Yêu Cầu Cơ Bản:
   - Liên quan trực tiếp đến chủ đề Câu hỏi của học sinh.
   - Xây dựng dựa trên thông tin từ sách giáo khoa.
   - Có độ khó đa dạng phân bố ở cả 3 mức độ khó

2. Chiến Lược Chi Tiết
   - Phân tích sâu câu hỏi của học sinh và thông tin từ sách giáo khoa.
   - Xác định từ khóa chính
   - Tạo câu hỏi từ nhận biết đến vận dụng cao

3. **Lưu ý quan trọng:**  
   - **Trả về kết quả định dạng Markdown**, đảm bảo hiển thị tốt trong React:
   - **Công thức toán inline:** `$...$`
   - **Công thức toán block:** `$$...$$`  
   - **Chữ in đậm:** `**...**`
   - Các công thức phải được viết dưới dạng LaTeX:
   - **Inline:** `Diện tích hình tròn: $S = \pi r^2$`
   - **Block:**  
     ```md
     $$S = \pi r^2$$
     ```
   - Không thêm khoảng trắng thừa
   - Sử dụng các lệnh LaTeX chuẩn

## 📝 Cấu Trúc Câu Hỏi
- Tổng: **10 câu hỏi**
- Mỗi câu: 4 đáp án (A, B, C, D)
- Chỉ 1 đáp án đúng
- Phân bố: 3-4 câu Mức 1, 3-4 câu Mức 2, 2-3 câu Mức 3

## 🔢 Tiêu Chí Đánh Giá Độ Khó
### Mức 1 - Cơ bản
- Yêu cầu áp dụng trực tiếp công thức, định nghĩa hoặc quy tắc cơ bản
- Chỉ cần một bước giải đơn giản hoặc vài bước đơn giản
- Không đòi hỏi biến đổi phức tạp
- Sử dụng kiến thức cơ bản trong chương trình
- Học sinh trung bình có thể giải quyết trong thời gian ngắn

### Mức 2 - Trung bình
- Yêu cầu kết hợp 2-3 công thức hoặc khái niệm
- Cần nhiều bước giải quyết có logic
- Có thể có một số biến đổi toán học vừa phải
- Đòi hỏi hiểu sâu về kiến thức trong chương trình
- Học sinh khá có thể giải quyết được

### Mức 3 - Nâng cao
- Yêu cầu kết hợp nhiều công thức, khái niệm từ các phần khác nhau
- Đòi hỏi nhiều bước giải với cách tiếp cận sáng tạo
- Có các biến đổi toán học phức tạp
- Cần tư duy phân tích, tổng hợp hoặc suy luận logic cao
- Chỉ học sinh giỏi mới có thể giải quyết được
- Có thể chứa nội dung mở rộng hoặc nâng cao

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
      "difficulty": "Mức 1/Mức 2/Mức 3",
      "solution": "Lời giải chi tiết từng bước, giải thích công thức và phân tích sai lầm thường gặp nếu có "
    }
            ]
            }
            ```
    ⚠️ Lưu Ý QUAN TRỌNG

    Nếu không đủ thông tin: Trả về JSON rỗng
    Ưu tiên thuật ngữ từ text trong sách giáo khoa
    LUÔN LUÔN tuân thủ quy tắc viết công thức toán học
    TRÁNH sinh những câu hỏi cần nhìn hình hoặc dựa vào bảng biến thiên
    ĐÁP ÁN VÀ LỜI GIẢI PHẢI ĐÚNG VÀ ĂN KHỚP VỚI NHAU.CHỈ ĐƯỢC PHÉP CÓ 1 ĐÁP ÁN ĐÚNG
    Tránh lỗi sai định dạng JSON
    Lưu ý thêm xuống dòng phù hơp để trình bày đẹp hơn
    Phải sinh đủ 10 câu hỏi không được thiếu câu nào.
    """
        ]

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
        return "⚠️ Lỗi khi gọi GenMini API."

# //-----------------------------------------------------------------------------------------------
# sinh câu hỏi lý thuyết(Chưa sử dụng)
def generate_Essay(question, context):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')  # 🔄 Cập nhật model mới hơn nếu có
        input_parts = [
            f"""
            Bạn là một trợ lý AI chuyên tạo câu hỏi lý thuyết Toán học.

            📚 Đầu Vào
            📖 Thông tin từ sách giáo khoa:
            """ + context + """

            ❓ Câu hỏi của học sinh:
            """ + question + """

            🎯 Nguyên Tắc Tạo Câu Hỏi
            1. Yêu Cầu Cơ Bản:
            Câu hỏi ngắn gọn, tập trung vào lý thuyết (khái niệm, định nghĩa, công thức, tính chất).

            Không yêu cầu tính toán hay chọn đáp án.

            Có sẵn câu trả lời, không cần người học tự suy luận hoặc giải bài toán.

            2. Chiến Lược Chi Tiết
            Chọn lọc thông tin quan trọng từ sách giáo khoa.

            Tạo câu hỏi đơn giản, dễ hiểu, có câu trả lời chính xác.

            Tránh câu hỏi quá rộng hoặc cần minh họa bằng hình vẽ.

            3. Lưu ý quan trọng:
            Trả về kết quả định dạng Markdown, đảm bảo hiển thị tốt trong React.

            Công thức toán inline: $...$

            Công thức toán block: $$...$$

            Chữ in đậm: **...**

            Các công thức phải được viết dưới dạng LaTeX.

            📝 Cấu Trúc Câu Hỏi
            Tổng: 10 câu hỏi

            Mỗi câu hỏi có dạng:

            Câu hỏi: Nội dung câu hỏi

            Đáp án: Câu trả lời chính xác

            🔍 Định Dạng JSON
            json

            {
            "questions": [
                {
                "question": "Nội dung câu hỏi lý thuyết",
                "answer": "Câu trả lời chính xác"
                }
            ]
            }
            ⚠️ Lưu Ý QUAN TRỌNG
            Nếu không đủ thông tin: Trả về JSON rỗng

            Chỉ tạo câu hỏi lý thuyết, không yêu cầu tính toán hay trắc nghiệm.

            Không sinh câu hỏi cần hình minh họa hoặc bảng số liệu.

            LUÔN tuân thủ định dạng JSON chuẩn, không để lỗi cú pháp.
    """
        ]

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
        return "⚠️ Lỗi khi gọi GenMini API."
    
# //--------------------------------------------------------------------------------
# hàm này tìm topic từ các lượt trò chuyện 
def get_chat_topic(context):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash')  # 🔄 Cập nhật model mới hơn nếu có
        input_parts = [
            f"""
            Đây là các lượt hỏi gần nhất của người dùng cho hệ thống: 

            {context}

            Dựa trên các lượt hoir, hãy xác định chủ đề chính mà người dùng đang quan tâm. 
            Chỉ cần đưa ra một chủ đề duy nhất mà người dùng đang thảo luận.
        """
        ]

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
        return "⚠️ Lỗi khi gọi GenMini API."

# Hàm này trả về feedback về bài kiểm tra của sinh viên
def get_Quiz_Feedback(context):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash') 
        input_parts = [
            f"""
           Bạn là một gia sư toán học. Tôi sẽ cung cấp dữ liệu bài kiểm tra của một học sinh dưới dạng JSON (chứa câu hỏi, đáp án đúng, câu trả lời của học sinh và điểm số).
            Hãy phân tích bài làm của học sinh, nhận xét về điểm mạnh, điểm yếu của học sinh và đề xuất hướng cải thiện.
            Trả lời theo định dạng sau:

            Điểm số: [ghi điểm số của học sinh]

            Nhận xét tổng quan: [đưa ra đánh giá tổng quan về bài làm]

            Điểm mạnh: [liệt kê những điểm học sinh làm tốt]

            Điểm yếu: [liệt kê những lỗi sai, kiến thức cần cải thiện]

            Gợi ý ôn tập: [đề xuất nội dung hoặc dạng bài tập học sinh nên luyện tập thêm]

            Dữ liệu bài làm của học sinh:
            {context}
            với độ khó được đánh giá như sau:
            ### Mức 1 - Cơ bản
            - Yêu cầu áp dụng trực tiếp công thức, định nghĩa hoặc quy tắc cơ bản
            - Chỉ cần một bước giải đơn giản hoặc vài bước đơn giản
            - Không đòi hỏi biến đổi phức tạp
            - Sử dụng kiến thức cơ bản trong chương trình
            - Học sinh trung bình có thể giải quyết trong thời gian ngắn

            ### Mức 2 - Trung bình
            - Yêu cầu kết hợp 2-3 công thức hoặc khái niệm
            - Cần nhiều bước giải quyết có logic
            - Có thể có một số biến đổi toán học vừa phải
            - Đòi hỏi hiểu sâu về kiến thức trong chương trình
            - Học sinh khá có thể giải quyết được

            ### Mức 3 - Nâng cao
            - Yêu cầu kết hợp nhiều công thức, khái niệm từ các phần khác nhau
            - Đòi hỏi nhiều bước giải với cách tiếp cận sáng tạo
            - Có các biến đổi toán học phức tạp
            - Cần tư duy phân tích, tổng hợp hoặc suy luận logic cao
            - Chỉ học sinh giỏi mới có thể giải quyết được
            - Có thể chứa nội dung mở rộng hoặc nâng cao
        """
        ]

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
        return "⚠️ Lỗi khi gọi GenMini API."
# Hàm này gọi khi sinh lại câu hỏi( ấn làm lại sau khi làm bài trắc nghiệm theo chủ đềđề)
def Adaptive_Questions(topic, previous_results_json):
    try:
        model_gen = genai.GenerativeModel('gemini-2.0-flash') 
        input_parts = [
            f"""
           # Hướng Dẫn Tạo Câu Hỏi Trắc Nghiệm Toán Học Adaptive Dựa Trên Bài Làm Trước Đó

            ## 🤖 Vai Trò
            Bạn là một trợ lý AI chuyên tạo câu hỏi trắc nghiệm Toán học thông minh (adaptive), giúp học sinh luyện tập hiệu quả hơn dựa vào kết quả làm bài trước đó.

            ## 📚 Đầu Vào
            📖 Chủ đề trọng tâm:  
            """ + topic + """

            🧾 Thông tin bài làm trước đó của học sinh:
            ```json
            """ + previous_results_json + """
            ```

            ## 🎯 Mục Tiêu
            1. **Củng cố các phần học sinh yếu** (học sinh câu sai, đặc biệt nếu sai nhiều lần hoặc sai ở Mức 1-2). thì giảm độ khó của đề bằng cách tăng câu hỏi mức 1-2 lên
            2. **Tăng thử thách cho phần học sinh làm tốt** (làm đúng nhiều lần, đúng nhanh và đúng ở mức độ 3 nhiều) thì tăng số câu hỏi mức 3 lên
            3. **Câu hỏi chỉ nên cùng dạng không được giống ý hệt câu hỏi mà học sinh đã làm trước đó.**
            4. **ĐÁP ÁN VÀ LỜI GIẢI PHẢI ĐÚNG VÀ ĂN KHỚP VỚI NHAU.CHỈ ĐƯỢC PHÉP CÓ 1 ĐÁP ÁN ĐÚNG**
            ## 🔧 Nguyên Tắc Tạo Câu Hỏi
            - Mỗi câu hỏi phải liên quan trực tiếp đến **chủ đề trọng tâm** và xoay quanh những câu sai nhiều hoặc phải khó hơn nếu học sinh làm đúngđúng.
            - Có 4 đáp án A, B, C, D, chỉ một đáp án đúng.
            - Mỗi câu phải có trường `"difficulty"` là `"Mức 1"`, `"Mức 2"` hoặc `"Mức 3"`.
            - Chú ý xuống dòng phù hợp để trình bày đẹp hơn
            - **Tránh sinh câu hỏi yêu cầu nhìn hình, bảng biến thiên hoặc đồ thị.**
            5. Lưu ý quan trọng:
                    Trả về kết quả định dạng Markdown, đảm bảo hiển thị tốt trong React.

                    Công thức toán inline: $...$

                    Công thức toán block: $$...$$

                    Chữ in đậm: **...**

                    Các công thức phải được viết dưới dạng LaTeX.

                    📝 Cấu Trúc Câu Hỏi
                    Tổng: 10 câu hỏi

                    Mỗi câu hỏi có dạng:

                    Câu hỏi: Nội dung câu hỏi

                    Đáp án: Câu trả lời chính xác

            ## 📝 Định Dạng Kết Quả
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
                "difficulty": "Mức 1/Mức 2/Mức 3",
                "solution": "Lời giải chi tiết từng bước, giải thích công thức và phân tích sai lầm thường gặp nếu có"
                }
            ]
            }
            ```

            ## ✅ Lưu Ý
            - Các công thức toán học phải viết bằng LaTeX:
            - Inline: `$...$`
            - Block:  
                ```md
                $$...$$
                ```
            - Kết quả trả về phải đúng chuẩn JSON.
            - Nếu thiếu thông tin: Trả về `{ "questions": [] }`

        """
        ]

        response = model_gen.generate_content(input_parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ GenMini."
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
        return "⚠️ Lỗi khi gọi GenMini API."

def Grade_math_paper(student_image_path, answer_key, model_name='gemini-2.0-flash'):
    
    # Function to encode image to base64
    def encode_image(image_path):
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None
    
    # Process student image
    student_image_b64 = encode_image(student_image_path)
    if not student_image_b64:
        return "❌ Failed to process student's paper image."
    
    # Process answer key - check if it's an image path or text
    is_answer_key_image = os.path.isfile(answer_key) if isinstance(answer_key, str) else False
    answer_key_content = ""
    answer_key_b64 = None
    
    if is_answer_key_image:
        answer_key_b64 = encode_image(answer_key)
        if not answer_key_b64:
            return "❌ Failed to process answer key image."
    else:
        answer_key_content = answer_key
    
    try:
        model_gen = genai.GenerativeModel(model_name)  # Load the model
        
        # Prepare the prompt
        prompt = """
        # Hướng dẫn chấm điểm bài làm toán viết tay của học sinh

        ## 🧑‍🏫 Vai trò của bạn
        Bạn là một giáo viên toán giàu kinh nghiệm, chấm điểm bài làm viết tay của học sinh theo biểu điểm cho sẵn một cách công bằng, chính xác và chi tiết.

        ## 📝 Nhiệm vụ
        1. Phân tích kỹ hình ảnh bài làm viết tay của học sinh
        2. So sánh với đáp án và biểu điểm được cung cấp
        3. Chấm điểm chi tiết từng câu, từng ý
        4. Nêu rõ lỗi sai và thiếu sót (nếu có)
        5. Đề xuất hướng cải thiện

        ## 🎯 Yêu cầu kết quả
        1. **Điểm số cụ thể** cho từng câu và tổng điểm
        2. **Nhận xét chi tiết** về từng câu:
           - Đúng hoàn toàn: nêu rõ các bước làm đúng
           - Đúng một phần: nêu rõ điểm đúng và điểm thiếu
           - Sai: phân tích lỗi sai và cách sửa
        3. **Nhận xét tổng quát** về bài làm, ưu điểm và nhược điểm
        4. **Đề xuất cụ thể** để học sinh tiến bộ

        ## 📋 Trình bày kết quả
        Trả lời theo cấu trúc sau:
        ```
        # KẾT QUẢ CHẤM ĐIỂM
        ## THÔNG TIN SINH VIÊN
        -Họ và tên: Lê văn x
        -Lớp: 12A
        ## ĐIỂM SỐ
        - Câu 1: x/y điểm
        - Câu 2: x/y điểm
        ...
        - TỔNG ĐIỂM: X/Y

        ## NHẬN XÉT CHI TIẾT
        ### Câu 1:
        - Nhận xét...
        - Lỗi sai/thiếu sót (nếu có)...

        ### Câu 2:
        - Nhận xét...
        - Lỗi sai/thiếu sót (nếu có)...
        ...

        ## NHẬN XÉT TỔNG QUÁT
        - Ưu điểm:...
        - Nhược điểm:...

        ## ĐỀ XUẤT CẢI THIỆN
        1. ...
        2. ...
        ```

        ## ⚠️ Lưu ý quan trọng
        - Chấm điểm công bằng, không quá nghiêm khắc hay quá dễ dãi
        - Nhận diện các phương pháp giải khác với đáp án nhưng vẫn đúng
        - Khi học sinh làm đúng kết quả nhưng cách giải khác, cần phân tích cách giải của học sinh xem có chặt chẽ không
        - Với những câu khó hiểu hoặc không rõ ràng, hãy nêu rõ trong phần nhận xét
        - Đề xuất cải thiện phải cụ thể, dựa trên lỗi sai thường gặp của học sinh
        """
        
        # Add content based on the type of answer key
        parts = [{"text": prompt}]
        
        # Add student's paper image
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": student_image_b64
            }
        })
        
        # Add answer key information
        if is_answer_key_image:
            parts.append({
                "text": "\n\n## 📑 Đáp án và biểu điểm (trong hình ảnh):"
            })
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": answer_key_b64
                }
            })
        else:
            parts.append({
                "text": f"\n\n## 📑 Đáp án và biểu điểm:\n\n{answer_key_content}"
            })
        
        # Generate response
        response = model_gen.generate_content(parts)
        return response.text.strip() if response else "❌ Không có phản hồi từ LLM."
    
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi LLM API: {e}")
        return f"⚠️ Lỗi khi chấm điểm: {e}"

# API gọi tới hàm generate_answer để trả lời câu hỏihỏi
@app.post("/answer")
async def question(request: QuestionRequest):
    question = request.question
    retrieved_chunks = search_similar_chunks(question, top_k=3)

    if not retrieved_chunks:
        return {"question": question, "answer": "❌ Không tìm thấy tài liệu phù hợp."}

    context = "\n\n".join(f"{chunk['content']}" for chunk in retrieved_chunks)
    answer = generate_answer(question, context)

    return {"question": question, "answer": answer, "retrieved_chunks": retrieved_chunks}

# API sinh caau hoir
@app.post("/Multiple_Choice_Questions")
async def Multiple_Choice_Questions(request: QuestionRequest):
    question = request.question
    retrieved_chunks = search_similar_chunks(question, top_k=3)

    if not retrieved_chunks:
        return {"question": question, "answer": "❌ Không tìm thấy tài liệu phù hợp."}

    context = "\n\n".join(f"{chunk['content']}" for chunk in retrieved_chunks)
    answer = generate_Multiple_Choice_Questions(question, context)

    return {"question": question, "answer": answer, "retrieved_chunks": retrieved_chunks}

@app.post("/chat_topic")
async def chat_topic(request: QuestionRequest):
    try:
        context = request.question  # Đảm bảo nhận đúng dữ liệu từ request
        answer = get_chat_topic(context)
        return {"question": context, "answer": answer}
    except Exception as e:
        return {"error": str(e)} 
    
@app.post("/Quiz_Feedback")
async def Quiz_Feedback(request: QuestionRequest):
    try:
        context = request.question  # Đảm bảo nhận đúng dữ liệu từ request
        answer = get_Quiz_Feedback(context)
        return {"question": context, "answer": answer}
    except Exception as e:
        return {"error": str(e)}

@app.post("/Adaptive_Questions_endpoint")
async def Adaptive_Questions_endpoint(request: QuestionRequest):
    try:
        # Kiểm tra xem có previousPerformance trong request không
        if hasattr(request, 'previousPerformance'):
            previous_results_json = request.previousPerformance
        else:
            # Giả định thông tin hiệu suất trước đó có thể được gửi trong question
            previous_results_json = request.question
            
        topic = request.question  # Chủ đề được gửi qua trường question
        
        # Nếu request có định dạng đặc biệt, thử phân tích
        if hasattr(request, 'previous_performance'):
            previous_results_json = request.previous_performance
            
        answer = Adaptive_Questions(topic, previous_results_json)
        return {"question": topic, "answer": answer}
    except Exception as e:
        return {"error": str(e)}
    
@app.post("/grade_math_paper")
async def grade_math_paper(request: GradeRequest):
    try:
        student_image_path = request.student_image_path
        answer_key = request.answer_key 
        answer = Grade_math_paper(student_image_path,answer_key)
        return {"student_image_path": student_image_path, "answer": answer}
    except Exception as e:
        return {"error": str(e)}

# def generate_admin_questions(topic):
#     try:
#         model_gen = genai.GenerativeModel('gemini-2.0-flash') 
#         input_parts = [
#             f"""
#             Tạo một bộ câu hỏi trắc nghiệm về chủ đề "{topic}" để sử dụng trong hệ thống ôn tập toán học. 
            
#             Hãy tạo 5 câu hỏi ở các mức độ khác nhau (2 câu dễ, 2 câu trung bình, 1 câu khó). 
            
#             Đối với mỗi câu hỏi, hãy cung cấp:
#             1. Nội dung câu hỏi
#             2. Bốn lựa chọn (A, B, C, D)
#             3. Đáp án đúng (dưới dạng số thứ tự 0-3)
#             4. Độ khó (easy, medium, hard)
#             5. Lời giải chi tiết
            
#             Trả về kết quả dưới dạng mảng JSON với mỗi câu hỏi là một đối tượng có các trường: question, options (mảng 4 lựa chọn), correct_answer (số từ 0-3), difficulty, solution.
            
#             Đảm bảo rằng đáp án đúng là số nguyên từ 0-3 tương ứng với vị trí trong mảng options.
            
#             Ví dụ:
#             [
#               {
#                 "question": "Câu hỏi mẫu?",
#                 "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
#                 "correct_answer": 2,
#                 "difficulty": "medium",
#                 "solution": "Lời giải chi tiết"
#               }
#             ]
#             """
#         ]

#         response = model_gen.generate_content(input_parts)
#         return response.text.strip() if response else "[]"
#     except Exception as e:
#         print(f"⚠️ Lỗi khi gọi GenMini API: {e}")
#         return "[]"

# @app.post("/generate_questions")
# async def generate_questions(request: TopicRequest):
#     try:
#         topic = request.topic
#         questions_json = generate_admin_questions(topic)
        
#         # Xử lý trường hợp câu trả lời có dạng ```json ... ``` hoặc json code block
#         if "```json" in questions_json:
#             questions_json = questions_json.split("```json")[1].split("```")[0].strip()
#         elif "```" in questions_json:
#             questions_json = questions_json.split("```")[1].split("```")[0].strip()
            
#         import json
#         try:
#             questions = json.loads(questions_json)
#             return {"topic": topic, "questions": questions}
#         except json.JSONDecodeError as e:
#             print(f"Lỗi decode JSON: {e}")
#             print(f"JSON gốc: {questions_json}")
#             return {"topic": topic, "questions": [], "error": "Lỗi định dạng câu hỏi"}
#     except Exception as e:
#         return {"error": str(e), "questions": []}

@app.post("/search-test")
async def search_test(request: QuestionRequest):
    """API đơn giản để kiểm tra khả năng tìm kiếm các embedding"""
    try:
        question = request.question
        retrieved_chunks = search_similar_chunks(question, top_k=5)
        
        # In thông tin debugging
        print(f"Câu hỏi: {question}")
        print(f"Tìm thấy {len(retrieved_chunks)} chunk liên quan")
        
        # Lấy thông tin về collection
        collection_info = collection.get(include=["metadatas"])
        total_chunks = len(collection_info["ids"]) if "ids" in collection_info else 0
        
        return {
            "question": question, 
            "chunks_found": len(retrieved_chunks),
            "total_chunks_in_db": total_chunks,
            "chunks": retrieved_chunks
        }
    except Exception as e:
        print(f"⚠️ Lỗi khi thực hiện search-test: {str(e)}")
        return {"error": str(e)}

# Chạy serve
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
