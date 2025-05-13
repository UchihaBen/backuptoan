import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TopicHistoryButton } from "../components/TopicHistoryButton";
import { config } from '../config';

function TopicsPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      // Use user API endpoint instead of admin
      const response = await axios.get(`${config.apiEndpoints.admin}/topics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.question_sets) {
        setTopics(response.data.question_sets);
      } else {
        setError("Unable to load topic list");
      }
    } catch (err) {
      console.error("Error getting topic list:", err);
      setError("Error loading topic list. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topicId, topicName, questionCount) => {
    // Navigate to quiz setup page with selected topic
    navigate("/quiz-setup", { 
      state: { 
        topic: topicName,
        topicId: topicId,
        questionCount: questionCount
      } 
    });
  };

  // Filter topic list by search keyword
  const filteredTopics = searchTerm.trim() === ''
    ? topics
    : topics.filter(topic =>
        topic.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study by Topic</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate("/home")}
        >
          Back
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search topics..."
          className="w-full p-3 border border-gray-300 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">
            {searchTerm.trim() ? "No matching topics found" : "No topics have been created yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic._id}
              className="border rounded-lg shadow-sm hover:shadow-md transition p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{topic.name}</h2>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{topic.questionCount} questions</span>
                <span>Updated: {new Date(topic.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <button 
                  className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition"
                  onClick={() => handleTopicClick(topic._id, topic.name, topic.questionCount)}
                >
                  Start Practice
                </button>
                <TopicHistoryButton topicId={topic._id} topicName={topic.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopicsPage; 