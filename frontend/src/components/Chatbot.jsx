import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { API_URL } from "../lib/api";

const Chatbot = forwardRef((props, ref) => {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Lấy token từ localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  useEffect(() => {
    console.log("Chatbot: conversationId changed to:", props.conversationId);
    setMessages([]);
    setConversationId(props.conversationId);
    
    // Kiểm tra nếu có conversationId từ route state (khi chọn từ lịch sử)
    if (location.state?.conversationId) {
      console.log("Chatbot: Loading from location state:", location.state.conversationId);
      fetchChatHistory(location.state.conversationId);
    } 
    // Nếu không, kiểm tra từ props
    else if (props.conversationId) {
      console.log("Chatbot: Loading from props:", props.conversationId);
      fetchChatHistory(props.conversationId);
    }
  }, [location.state, props.conversationId]);
  
  const fetchChatHistory = async (convId) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching chat history for conversation:", convId);
      
      const res = await axios.get(`${API_URL}/api/chat/conversations/${convId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Chat history response:", res.data);
      
      if (res.data.messages && res.data.messages.length > 0) {
        const formattedMessages = res.data.messages.map(msg => ({
          text: msg.content,
          sender: msg.user_id === "bot" ? "bot" : "user"
        }));
        setMessages(formattedMessages);
        setConversationId(convId);
      } else {
        // Hội thoại không có tin nhắn, reset messages
        setMessages([]);
        setConversationId(convId);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/login";
      }
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    getLastMessages: () => {
      // Lọc ra chỉ tin nhắn của người dùng trong cuộc hội thoại hiện tại
      const userMessages = messages.filter(msg => msg.sender === "user");
      
      // Nếu không có tin nhắn của người dùng, trả về chuỗi rỗng
      if (userMessages.length === 0) {
        return "";
      }
      
      // Lấy tối đa 3 tin nhắn gần nhất của người dùng
      const lastThreeUserMessages = userMessages.slice(-3);
      
      // Định dạng tin nhắn theo yêu cầu: "lần hỏi X: nội dung"
      const formattedMessages = lastThreeUserMessages.map((msg, index) => {
        const messageIndex = userMessages.length - (lastThreeUserMessages.length - index);
        return `lần hỏi ${messageIndex}: ${msg.text}`;
      });
      
      // Ghép các tin nhắn thành một chuỗi
      return formattedMessages.join("\n");
    },
  }));

  const handleAsk = async () => {
    if (!question.trim() || !token) return;
    
    // Thêm message của user vào state
    const newMessages = [...messages, { text: question, sender: "user" }];
    setMessages(newMessages);
    setQuestion("");
    setIsLoading(true);

    try {
      // Gọi API backend với token
      const res = await axios.post(
        `${API_URL}/api/chat/ask`, 
        { 
          conversationId,
          question
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Lưu conversationId nếu là hội thoại mới
      if (res.data.conversationId && !conversationId) {
        setConversationId(res.data.conversationId);
      }
      
      // Hiển thị câu trả lời từ bot
      const botMessage = { text: res.data.botResponse, sender: "bot" };
      setMessages([...newMessages, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      if (error.response?.status === 401) {
        // Token hết hạn hoặc không hợp lệ
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/login";
      } else {
      setMessages([...newMessages, { text: "Lỗi khi gọi API.", sender: "bot" }]);
    }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (!token) {
    return (
      <div className="p-4 w-full max-w-md mx-auto flex flex-col h-screen bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-500">
            Vui lòng <a href="/login" className="text-blue-500">đăng nhập</a> để sử dụng chatbot
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full max-w-md mx-auto flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-auto border p-2 bg-white rounded-lg shadow-sm">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Hãy đặt câu hỏi để bắt đầu cuộc trò chuyện</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-2 rounded-lg max-w-xs ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="bg-gray-200 p-2 rounded-lg">
              <span>Đang xử lý...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex mt-2">
        <input 
          type="text" 
          className="flex-1 p-2 border rounded-lg mr-2" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Nhập câu hỏi..." 
          disabled={isLoading}
        />
        <button 
          className={`px-4 py-2 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-blue-500 text-white'}`} 
          onClick={handleAsk}
          disabled={isLoading}
        >
          Gửi
        </button>
      </div>
    </div>
  );
});

export default Chatbot;