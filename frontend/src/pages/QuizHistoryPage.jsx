import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export function QuizHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { topicId, topicName } = location.state || {};
  
  // Kiểm tra thông tin đăng nhập từ localStorage
  const userStr = localStorage.getItem("user");
  let userId = null;
  
  // Lấy userId từ object user trong localStorage
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      userId = userObj.id;
      console.log("Debug - Found user in localStorage:", userObj);
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  } 
  
  if (!userId) {
    // Thử các cách lưu trữ userId khác
    userId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    console.log("Debug - Using fallback userId:", userId);
  }
  
  const token = localStorage.getItem("token");
  
  // Debug info
  console.log("Debug - userId:", userId);
  console.log("Debug - token exists:", !!token);
  console.log("Debug - topicName:", topicName);

  useEffect(() => {
    console.log("Fetching history for topic:", topicName, "topicId:", topicId);
    
    // Vẫn tiếp tục nếu không có userId (sẽ sử dụng "anonymous")
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (topicName) params.append("topic", topicName);
        
        // Tạo array để lưu kết quả
        let allAttempts = [];
        
        // Đầu tiên thử lấy lịch sử của người dùng hiện tại
        if (userId && token) {
          try {
            console.log("Fetching records for logged in user:", userId);
            const userResponse = await axios.get(
              `http://localhost:5000/api/quiz/quiz-attempts/${userId}?${params.toString()}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            if (userResponse.data?.attempts) {
              allAttempts = [...userResponse.data.attempts];
              console.log(`Found ${allAttempts.length} attempts for logged in user`);
            }
          } catch (err) {
            console.error("Error fetching user history:", err);
          }
        }
        
        // Sau đó luôn thử lấy lịch sử "anonymous" cho chủ đề này
        try {
          console.log("Fetching anonymous records for topic:", topicName);
          const anonymousResponse = await axios.get(
            `http://localhost:5000/api/quiz/anonymous-attempts?${params.toString()}`
          );
          
          if (anonymousResponse.data?.attempts) {
            allAttempts = [...allAttempts, ...anonymousResponse.data.attempts];
            console.log(`Found ${anonymousResponse.data.attempts.length} anonymous attempts`);
          }
        } catch (err) {
          console.error("Error fetching anonymous history:", err);
        }
        
        console.log(`Total attempts: ${allAttempts.length}`);
        
        // Sắp xếp theo thời gian mới nhất
        allAttempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        
        setAttempts(allAttempts);
        setLoading(false);
      } catch (err) {
        let errorMessage = "Không thể tải lịch sử làm bài";
        
        if (err.response) {
          if (err.response.status === 403) {
            errorMessage = "Bạn không có quyền xem lịch sử này";
          } else {
            errorMessage = `Lỗi từ server: ${err.response.data?.error || err.response.status}`;
          }
        } else if (err.request) {
          errorMessage = "Không thể kết nối đến server";
        } else {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, topicName, token, topicId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const viewAttemptDetail = (attempt) => {
    navigate("/quiz-attempt-detail", { state: { attempt } });
  };

  if (loading) return <div className="p-4 text-center">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Lịch sử làm bài: {topicName || "Tất cả chủ đề"}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Quay lại
        </button>
      </div>

      {attempts.length === 0 ? (
        <p className="text-center py-8">Bạn chưa làm bài kiểm tra nào về chủ đề này.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Ngày làm</th>
                <th className="p-3 text-left">Chủ đề</th>
                <th className="p-3 text-center">Điểm số</th>
                <th className="p-3 text-center">Thời gian</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{formatDate(attempt.completed_at)}</td>
                  <td className="p-3">{attempt.topic_name}</td>
                  <td className="p-3 text-center font-semibold">
                    {attempt.score_text || `${attempt.score}/${attempt.total_questions}`}
                  </td>
                  <td className="p-3 text-center">
                    {formatTime(attempt.time_taken || 0)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => viewAttemptDetail(attempt)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 