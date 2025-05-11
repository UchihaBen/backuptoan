import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from '../config';

function QuizSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, topicId, questionCount = 0, fromQuiz } = location.state || {};
  const token = localStorage.getItem("token");

  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [questionStats, setQuestionStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bảng phân bố số lượng câu hỏi theo độ khó
  const distributionTable = {
    10: {
      easy: { level1: 7, level2: 2, level3: 1 },
      medium: { level1: 3, level2: 4, level3: 3 },
      hard: { level1: 1, level2: 3, level3: 6 }
    },
    15: {
      easy: { level1: 10, level2: 3, level3: 2 },
      medium: { level1: 4, level2: 6, level3: 5 },
      hard: { level1: 2, level2: 5, level3: 8 }
    },
    20: {
      easy: { level1: 13, level2: 5, level3: 2 },
      medium: { level1: 6, level2: 8, level3: 6 },
      hard: { level1: 3, level2: 6, level3: 11 }
    },
    25: {
      easy: { level1: 16, level2: 7, level3: 2 },
      medium: { level1: 7, level2: 10, level3: 8 },
      hard: { level1: 3, level2: 7, level3: 15 }
    },
    30: {
      easy: { level1: 20, level2: 8, level3: 2 },
      medium: { level1: 9, level2: 12, level3: 9 },
      hard: { level1: 4, level2: 8, level3: 18 }
    }
  };

  // Lấy thông tin về số lượng câu hỏi theo từng mức độ khi component mount
  useEffect(() => {
    if (topicId) {
      fetchQuestionStats();
    }
  }, [topicId]);

  // Hàm lấy thông tin về số lượng câu hỏi theo từng mức độ
  const fetchQuestionStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.apiEndpoints.admin}/topics/${topicId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.question_set && response.data.question_set.questions) {
        const questions = response.data.question_set.questions;
        const actualQuestionCount = questions.length;
        
        // Đếm số lượng câu hỏi theo từng mức độ
        let level1Count = 0;
        let level2Count = 0;
        let level3Count = 0;
        
        questions.forEach(q => {
          const difficulty = (q.difficulty || "").toLowerCase();
          
          if (difficulty.includes("1") || difficulty === "easy" || 
              difficulty.includes("dễ") || difficulty.includes("cơ bản")) {
            level1Count++;
          } 
          else if (difficulty.includes("3") || difficulty === "hard" || 
                   difficulty.includes("khó") || difficulty.includes("nâng cao")) {
            level3Count++;
          }
          else {
            level2Count++;
          }
        });
        
        setQuestionStats({
          level1: level1Count,
          level2: level2Count,
          level3: level3Count,
          total: actualQuestionCount
        });
      }
    } catch (err) {
      console.error("Lỗi khi lấy thông tin câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    const distribution = distributionTable[selectedQuestionCount][selectedDifficulty];
    
    navigate("/quiz", {
      state: {
        topic,
        topicId,
        questionCount: selectedQuestionCount,
        difficulty: selectedDifficulty,
        distribution
      }
    });
  };

  if (!topic || !topicId) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Lỗi</h2>
        <p>Không tìm thấy thông tin chủ đề. Vui lòng quay lại và chọn chủ đề.</p>
        <button 
          onClick={() => navigate("/topics")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Quay lại danh sách chủ đề
        </button>
      </div>
    );
  }

  // Kiểm tra nếu đang loading hoặc chưa có dữ liệu
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin chủ đề...</p>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra số lượng câu hỏi dựa trên dữ liệu đã lấy từ API
  if (questionStats && questionStats.total < 10) {
    return (
      <div className="p-6 bg-yellow-100 text-yellow-800 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Thông báo</h2>
        <p>Chủ đề này chỉ có {questionStats.total} câu hỏi, không đủ để tạo bài kiểm tra.</p>
        <p className="mt-2">Vui lòng chọn chủ đề khác có nhiều câu hỏi hơn.</p>
        <button 
          onClick={() => navigate("/topics")}
          className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Quay lại danh sách chủ đề
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Cài đặt bài kiểm tra</h1>
          <p className="mt-1 opacity-90">Chủ đề: {topic}</p>
          {fromQuiz && (
            <div className="mt-2 bg-blue-700 p-2 rounded text-sm">
              Bạn đã hoàn thành bài kiểm tra trước đó. Hãy điều chỉnh cài đặt để làm thêm bài mới.
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Hiển thị thông tin về số lượng câu hỏi theo từng mức độ */}
          {questionStats && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Thông tin chủ đề:</h3>
              <div className="grid grid-cols-4 text-center">
                <div className="p-2">
                  <div className="text-gray-600">Tổng số</div>
                  <div className="text-xl font-bold">{questionStats.total}</div>
                </div>
                <div className="p-2">
                  <div className="text-green-600">Cơ bản</div>
                  <div className="text-xl font-bold">{questionStats.level1}</div>
                </div>
                <div className="p-2">
                  <div className="text-yellow-600">Trung bình</div>
                  <div className="text-xl font-bold">{questionStats.level2}</div>
                </div>
                <div className="p-2">
                  <div className="text-red-600">Nâng cao</div>
                  <div className="text-xl font-bold">{questionStats.level3}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Lưu ý: Nếu không đủ câu hỏi ở một mức độ, hệ thống sẽ tự động bổ sung từ các mức độ khác.</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Số lượng câu hỏi</h2>
            <div className="grid grid-cols-5 gap-2">
              {[10, 15, 20, 25, 30].map(count => (
                <button
                  key={count}
                  className={`py-2 px-4 border rounded-lg ${
                    selectedQuestionCount === count 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white hover:bg-gray-100 border-gray-300'
                  } ${count > questionStats?.total ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setSelectedQuestionCount(count)}
                  disabled={count > questionStats?.total}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Độ khó</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`py-3 px-4 border rounded-lg ${
                  selectedDifficulty === 'easy' 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-white hover:bg-gray-100 border-gray-300'
                }`}
                onClick={() => setSelectedDifficulty('easy')}
              >
                <span className="block text-lg font-medium">Dễ</span>
              </button>
              <button
                className={`py-3 px-4 border rounded-lg ${
                  selectedDifficulty === 'medium' 
                    ? 'bg-yellow-500 text-white border-yellow-500' 
                    : 'bg-white hover:bg-gray-100 border-gray-300'
                }`}
                onClick={() => setSelectedDifficulty('medium')}
              >
                <span className="block text-lg font-medium">Trung bình</span>
              </button>
              <button
                className={`py-3 px-4 border rounded-lg ${
                  selectedDifficulty === 'hard' 
                    ? 'bg-red-500 text-white border-red-500' 
                    : 'bg-white hover:bg-gray-100 border-gray-300'
                }`}
                onClick={() => setSelectedDifficulty('hard')}
              >
                <span className="block text-lg font-medium">Khó</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Phân bố câu hỏi:</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-100 p-2 rounded">
                <div className="font-medium text-green-800">Cơ bản</div>
                <div className="text-xl font-bold">
                  {distributionTable[selectedQuestionCount][selectedDifficulty].level1}
                </div>
                {questionStats && questionStats.level1 < distributionTable[selectedQuestionCount][selectedDifficulty].level1 && (
                  <div className="text-xs text-red-500 mt-1">
                    (Thiếu {distributionTable[selectedQuestionCount][selectedDifficulty].level1 - questionStats.level1})
                  </div>
                )}
              </div>
              <div className="bg-yellow-100 p-2 rounded">
                <div className="font-medium text-yellow-800">Trung bình</div>
                <div className="text-xl font-bold">
                  {distributionTable[selectedQuestionCount][selectedDifficulty].level2}
                </div>
                {questionStats && questionStats.level2 < distributionTable[selectedQuestionCount][selectedDifficulty].level2 && (
                  <div className="text-xs text-red-500 mt-1">
                    (Thiếu {distributionTable[selectedQuestionCount][selectedDifficulty].level2 - questionStats.level2})
                  </div>
                )}
              </div>
              <div className="bg-red-100 p-2 rounded">
                <div className="font-medium text-red-800">Nâng cao</div>
                <div className="text-xl font-bold">
                  {distributionTable[selectedQuestionCount][selectedDifficulty].level3}
                </div>
                {questionStats && questionStats.level3 < distributionTable[selectedQuestionCount][selectedDifficulty].level3 && (
                  <div className="text-xs text-red-500 mt-1">
                    (Thiếu {distributionTable[selectedQuestionCount][selectedDifficulty].level3 - questionStats.level3})
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => navigate("/topics")}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Trở lại
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizSetupPage; 