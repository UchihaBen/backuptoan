import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { config } from '../config';

function SidebarMenu({ closeMenu, chatbotRef, onConversationSelect, isVisible = true }) {
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  // Lấy token từ localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Kiểm tra có phải là admin không
  const isAdmin = user && user.role === "admin";

  // Lấy lịch sử chat khi component mount
  useEffect(() => {
    if (token && isVisible) {
      fetchChatHistory();
    }
  }, [token, isVisible]);

  const fetchChatHistory = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching chat history with token:", token ? "Valid token" : "No token");
      
      // Giới hạn token log để tránh rò rỉ thông tin
      const authHeader = `Bearer ${token}`;
      console.log("Auth header length:", authHeader.length);
      
      const response = await axios.get(`${config.apiEndpoints.chat}/history`, {
        headers: {
          Authorization: authHeader
        }
      });
      
      console.log("Chat history response status:", response.status);
      console.log("Chat history data structure:", Object.keys(response.data));
      
      if (response.data && response.data.conversations) {
        console.log(`Received ${response.data.conversations.length} conversations`);
        setChatHistory(response.data.conversations || []);
      } else {
        console.log("No conversations in response data");
        setChatHistory([]);
      }
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử chat:", err);
      if (err.response) {
        console.error("Error response status:", err.response.status);
        console.error("Error response data:", err.response.data);
      }
      setError("Không thể lấy lịch sử chat");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async (page) => {
    if (chatbotRef.current) {
      try {
        // Lấy 3 tin nhắn gần nhất đã được định dạng
      const lastMessages = chatbotRef.current.getLastMessages();
        console.log("Tin nhắn gần nhất:", lastMessages);
        
        // Nếu không có tin nhắn, sử dụng một giá trị mặc định
        const messageToSend = lastMessages || "Hãy tạo bài trắc nghiệm về toán học";
        
        // Gọi API để xác định chủ đề từ lịch sử trò chuyện
        console.log("Gửi đến API chat_topic:", messageToSend);
        const res = await axios.post(config.apiEndpoints.ragApi.chatTopic, { "question": messageToSend });
        const topic = res.data.answer;
        console.log("Chủ đề nhận được:", topic);
        
        // Điều hướng đến trang phù hợp và truyền chủ đề qua state
        navigate(page, { state: { topic } });
      } catch (error) {
        console.error("Lỗi khi xác định chủ đề:", error);
        alert("Không thể xác định chủ đề từ cuộc trò chuyện. Vui lòng thử lại.");
      }
    } else {
      // Trường hợp không có chatbot reference
      navigate(page, { state: { topic: "Toán học cơ bản" } });
    }
  };

  const handleConversationClick = (conversationId) => {
    // Thông báo cho component cha biết conversation được chọn
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
    
    // Chuyển đến trang home với conversationId cụ thể
    navigate("/home", { state: { conversationId } });
    closeMenu();
  };

  const handleNewConversation = async () => {
    try {
      const response = await axios.post(
        `${config.apiEndpoints.chat}/conversations`,
        { title: `Cuộc hội thoại (${new Date().toLocaleString()})` },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh lịch sử chat
      await fetchChatHistory();
      
      // Chuyển đến trang home với conversationId mới
      const newConversationId = response.data.conversation_id;
      navigate("/home", { state: { conversationId: newConversationId } });
      
      // Thông báo cho component cha biết conversation được chọn
      if (onConversationSelect) {
        onConversationSelect(newConversationId);
      }
      
      closeMenu();
    } catch (error) {
      console.error("Lỗi khi tạo hội thoại mới:", error);
      alert("Không thể tạo hội thoại mới. Vui lòng thử lại.");
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    // Ngăn event lan ra phần tử cha (không mở conversation khi click nút delete)
    e.stopPropagation();
    
    setShowConfirmDelete(conversationId);
  };
  
  const confirmDelete = async (conversationId) => {
    try {
      await axios.delete(
        `${config.apiEndpoints.chat}/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh lịch sử chat
      await fetchChatHistory();
      setShowConfirmDelete(null);
      
    } catch (error) {
      console.error("Lỗi khi xóa hội thoại:", error);
      alert("Không thể xóa hội thoại. Vui lòng thử lại.");
    }
  };

  const handleLogout = () => {
    // Xóa token và thông tin người dùng
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed top-0 left-0 w-4/5 h-full bg-white shadow-lg p-4 overflow-y-auto z-10">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold">Menu</h2>
        <button 
          className="p-2 rounded-full hover:bg-gray-200" 
          onClick={closeMenu}
        >
          ❌
        </button>
      </div>
      
      {user && user.username && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium">Xin chào, {user.username}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
          {isAdmin && (
            <p className="text-sm mt-1 text-blue-600 font-medium">Admin</p>
          )}
        </div>
      )}

      {/* Admin Menu - chỉ hiển thị nếu là admin */}
      {isAdmin && (
        <>
          <h3 className="font-medium mb-2 mt-4 text-blue-700">Quản trị</h3>
          <ul className="mb-4">
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin")}
              >
                👑 Bảng điều khiển Admin
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin?tab=questions")}
              >
                📝 Tạo câu hỏi
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin/system-settings")}
              >
                ⚙️ Tải tài liệu lên
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin/GradeMathPaperPage")}
              >
                ✏️ Chấm điểm tự động
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin/generate-slides")}
              >
                🖼️ Tạo Slide PowerPoint
              </button>
            </li>
          </ul>
          <div className="border-t my-2"></div>
        </>
      )}

      <h3 className="font-medium mb-2 mt-4">Bài tập</h3>
      <ul className="mb-4">
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => handleButtonClick("/quiz")}
          >
            🔢 Làm bài trắc nghiệm
          </button>
        </li>
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => handleButtonClick("/essay")}
          >
            📝 Làm bài tự luận
          </button>
        </li>
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => handleButtonClick("/practical")}
          >
            🧮 Bài tập thực hành
          </button>
        </li>
      </ul>

      <h3 className="font-medium mb-2 mt-4">Ôn luyện theo chủ đề</h3>
      <ul className="mb-4">
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => navigate("/topics")}
          >
            📚 Danh sách chủ đề
          </button>
        </li>
      </ul>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Lịch sử trò chuyện</h3>
          <button 
            className="text-blue-500 hover:bg-blue-50 rounded px-2 py-1 text-sm flex items-center"
            onClick={handleNewConversation}
          >
            <span className="mr-1">+</span> Tạo mới
          </button>
        </div>
        
        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        {!loading && !error && chatHistory.length === 0 && (
          <p className="text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</p>
        )}
        
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {chatHistory.map(conversation => (
            <li 
              key={conversation._id}
              className="p-2 hover:bg-gray-100 rounded cursor-pointer relative group"
              onClick={() => handleConversationClick(conversation._id)}
            >
              {showConfirmDelete === conversation._id ? (
                <div className="absolute inset-0 bg-white p-2 rounded flex flex-col justify-center items-center z-20">
                  <p className="text-sm font-medium mb-2">Xác nhận xóa hội thoại?</p>
                  <div className="flex space-x-2">
                    <button 
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(conversation._id);
                      }}
                    >
                      Xóa
                    </button>
                    <button 
                      className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirmDelete(null);
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="w-3/4">
                      <p className="font-medium truncate">{conversation.title}</p>
                      <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(conversation.updated_at)}</span>
                  </div>
                  <button 
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-50"
                    onClick={(e) => handleDeleteConversation(conversation._id, e)}
                  >
                    🗑️
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-4 mt-4">
        <button 
          className="w-full text-left text-red-500 p-2 hover:bg-gray-100 rounded"
          onClick={handleLogout}
        >
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default SidebarMenu;
