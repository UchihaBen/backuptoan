// config.js - File cấu hình trung tâm cho các API URL

// Đọc từ biến môi trường nếu có, nếu không sử dụng giá trị mặc định
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://127.0.0.1:8000';

// Xuất các biến để sử dụng trong toàn bộ ứng dụng
export const config = {
  API_URL,
  RAG_API_URL,
  apiEndpoints: {
    auth: `${API_URL}/api/auth`,
    chat: `${API_URL}/api/chat`,
    admin: `${API_URL}/api/admin`,
    quiz: `${API_URL}/api/quiz`,
    documents: `${API_URL}/api/documents`,
    ragApi: {
      answer: `${RAG_API_URL}/answer`,
      multipleChoice: `${RAG_API_URL}/Multiple_Choice_Questions`,
      chatTopic: `${RAG_API_URL}/chat_topic`,
      quizFeedback: `${RAG_API_URL}/Quiz_Feedback`,
      adaptiveQuestions: `${RAG_API_URL}/Adaptive_Questions_endpoint`,
      gradeMathPaper: `${RAG_API_URL}/grade_math_paper`,
      uploadImage: `${RAG_API_URL}/upload_image`,
      deleteImage: `${RAG_API_URL}/delete_image`,
      exportExcel: `${RAG_API_URL}/export_excel`,
      generateSlide: `${RAG_API_URL}/Generate_Slide`,
    }
  }
};

export default config; 