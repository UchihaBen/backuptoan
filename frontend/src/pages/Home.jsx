import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarMenu from "../components/SidebarMenu";
import Chatbot from "../components/Chatbot";

function Home() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const chatbotRef = useRef(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Nhận conversationId từ URL state (khi chọn từ lịch sử)
  useEffect(() => {
    if (location.state?.conversationId) {
      console.log("Setting conversation ID from location state:", location.state.conversationId);
      setCurrentConversationId(location.state.conversationId);
    }
  }, [location.state]);

  const handleConversationSelect = (conversationId) => {
    console.log("Conversation selected:", conversationId);
    setCurrentConversationId(conversationId);
  };

  return (
    <div className="relative h-screen">
      <button className="absolute top-4 left-4 bg-gray-800 text-white p-2 rounded" onClick={() => setMenuOpen(true)}>
        ☰ Menu
      </button>
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <SidebarMenu 
            closeMenu={() => setMenuOpen(false)} 
            chatbotRef={chatbotRef} 
            onConversationSelect={handleConversationSelect}
            isVisible={menuOpen}
          />
        </div>
      )}
      <Chatbot 
        ref={chatbotRef} 
        conversationId={currentConversationId}
      />
    </div>
  );
}

export default Home;
