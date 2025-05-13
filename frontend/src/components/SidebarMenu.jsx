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

  // Get token from localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Check if user is admin
  const isAdmin = user && user.role === "admin";

  // Get chat history when component mounts
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
      
      // Limit token log to avoid information leakage
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
      console.error("Error when fetching chat history:", err);
      if (err.response) {
        console.error("Error response status:", err.response.status);
        console.error("Error response data:", err.response.data);
      }
      setError("Unable to fetch chat history");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async (page) => {
    if (chatbotRef.current) {
      try {
        // Get the 3 most recent formatted messages
        const lastMessages = chatbotRef.current.getLastMessages();
        console.log("Recent messages:", lastMessages);
        
        // If no messages, use a default value
        const messageToSend = lastMessages || "Create a math quiz";
        
        // Call API to determine topic from conversation history
        console.log("Sending to chat_topic API:", messageToSend);
        const res = await axios.post(config.apiEndpoints.ragApi.chatTopic, { "question": messageToSend });
        const topic = res.data.answer;
        console.log("Topic received:", topic);
        
        // Navigate to appropriate page and pass topic via state
        navigate(page, { state: { topic } });
      } catch (error) {
        console.error("Error determining topic:", error);
        alert("Unable to determine topic from conversation. Please try again.");
      }
    } else {
      // Case where there's no chatbot reference
      navigate(page, { state: { topic: "Basic Mathematics" } });
    }
  };

  const handleConversationClick = (conversationId) => {
    // Notify parent component of selected conversation
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
    
    // Navigate to home page with specific conversationId
    navigate("/home", { state: { conversationId } });
    closeMenu();
  };

  const handleNewConversation = async () => {
    try {
      const response = await axios.post(
        `${config.apiEndpoints.chat}/conversations`,
        { title: `Conversation (${new Date().toLocaleString()})` },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh chat history
      await fetchChatHistory();
      
      // Navigate to home page with new conversationId
      const newConversationId = response.data.conversation_id;
      navigate("/home", { state: { conversationId: newConversationId } });
      
      // Notify parent component of selected conversation
      if (onConversationSelect) {
        onConversationSelect(newConversationId);
      }
      
      closeMenu();
    } catch (error) {
      console.error("Error creating new conversation:", error);
      alert("Unable to create new conversation. Please try again.");
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    // Prevent event from propagating to parent elements (don't open conversation when clicking delete button)
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
      
      // Refresh chat history
      await fetchChatHistory();
      setShowConfirmDelete(null);
      
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Unable to delete conversation. Please try again.");
    }
  };

  const handleLogout = () => {
    // Remove token and user info
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
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
          <p className="font-medium">Hello, {user.username}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
          {isAdmin && (
            <p className="text-sm mt-1 text-blue-600 font-medium">Admin</p>
          )}
        </div>
      )}

      {/* Admin Menu - only shown if user is admin */}
      {isAdmin && (
        <>
          <h3 className="font-medium mb-2 mt-4 text-blue-700">Administration</h3>
          <ul className="mb-4">
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin")}
              >
                👑 Admin Dashboard
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin?tab=questions")}
              >
                📝 Create Questions
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin/system-settings")}
              >
                ⚙️ Upload Documents
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin/GradeMathPaperPage")}
              >
                ✏️ Auto Grading
              </button>
            </li>
            <li className="mb-2 hover:bg-gray-100 rounded p-2">
              <button 
                className="w-full text-left text-blue-700"
                onClick={() => navigate("/admin/generate-slides")}
              >
                🖼️ Create PowerPoint Slides
              </button>
            </li>
          </ul>
          <div className="border-t my-2"></div>
        </>
      )}

      <h3 className="font-medium mb-2 mt-4">Exercises</h3>
      <ul className="mb-4">
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => handleButtonClick("/quiz")}
          >
            🔢 Multiple Choice Quiz
          </button>
        </li>
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => handleButtonClick("/essay")}
          >
            📝 Essay Questions
          </button>
        </li>
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => handleButtonClick("/practical")}
          >
            🧮 Practical Exercises
          </button>
        </li>
      </ul>

      <h3 className="font-medium mb-2 mt-4">Study by Topic</h3>
      <ul className="mb-4">
        <li className="mb-2 hover:bg-gray-100 rounded p-2">
          <button 
            className="w-full text-left"
            onClick={() => navigate("/topics")}
          >
            📚 Topic List
          </button>
        </li>
      </ul>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Chat History</h3>
          <button 
            className="text-blue-500 hover:bg-blue-50 rounded px-2 py-1 text-sm flex items-center"
            onClick={handleNewConversation}
          >
            <span className="mr-1">+</span> New Chat
          </button>
        </div>
        
        {loading && <p className="text-gray-500 text-sm">Loading...</p>}
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        {!loading && !error && chatHistory.length === 0 && (
          <p className="text-gray-500 text-sm">No conversations yet</p>
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
                  <p className="text-sm font-medium mb-2">Confirm delete conversation?</p>
                  <div className="flex space-x-2">
                    <button 
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(conversation._id);
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirmDelete(null);
                      }}
                    >
                      Cancel
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
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default SidebarMenu;
