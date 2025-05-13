import { useNavigate } from "react-router-dom";

export function TopicHistoryButton({ topicId, topicName }) {
  const navigate = useNavigate();

  const viewHistory = () => {
    navigate("/quiz-history", { 
      state: { 
        topicId, 
        topicName 
      } 
    });
  };

  return (
    <button
      onClick={viewHistory}
      className="ml-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      History
    </button>
  );
} 