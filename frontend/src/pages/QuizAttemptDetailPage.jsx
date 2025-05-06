import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function QuizAttemptDetailPage() {
  const [viewReview, setViewReview] = useState(false);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(null);
  const [showFeedback, setShowFeedback] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { attempt } = location.state || {};
  
  if (!attempt) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Không tìm thấy dữ liệu bài làm</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Quay lại
        </button>
      </div>
    );
  }
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
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
  
  const toggleViewReview = () => {
    setViewReview(!viewReview);
    setReviewQuestionIndex(0);
    setShowSolution(null);
  };
  
  const handleNextReview = () => {
    if (reviewQuestionIndex < attempt.questions.length - 1) {
      setReviewQuestionIndex(reviewQuestionIndex + 1);
      setShowSolution(null);
    }
  };
  
  const handlePreviousReview = () => {
    if (reviewQuestionIndex > 0) {
      setReviewQuestionIndex(reviewQuestionIndex - 1);
      setShowSolution(null);
    }
  };
  
  const handleShowSolution = (index) => {
    if (showSolution === index) {
      setShowSolution(null);
    } else {
      setShowSolution(index);
    }
  };
  
  const toggleFeedback = () => {
    setShowFeedback(!showFeedback);
  };
  
  // Hiển thị từng câu một trong chế độ xem lại
  const renderReviewQuestion = () => {
    const question = attempt.questions[reviewQuestionIndex];
    
    // Format options to match the expected structure if needed
    const options = {};
    if (Array.isArray(question.options)) {
      question.options.forEach((option, index) => {
        const key = String.fromCharCode(65 + index); // A, B, C, D...
        options[key] = option;
      });
    } else {
      // If options is already an object
      Object.assign(options, question.options);
    }
    
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold">Xem lại bài kiểm tra</h2>
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <h3 className="font-semibold mr-3">
              Câu {reviewQuestionIndex + 1} / {attempt.questions.length}: 
            </h3>
            {question.difficulty && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                typeof question.difficulty === 'string' && 
                (question.difficulty.includes("1") || question.difficulty.toLowerCase().includes("easy") || 
                 question.difficulty.toLowerCase().includes("dễ")) ? "bg-green-100 text-green-800" :
                typeof question.difficulty === 'string' && 
                (question.difficulty.includes("3") || question.difficulty.toLowerCase().includes("hard") || 
                 question.difficulty.toLowerCase().includes("khó")) ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {question.difficulty}
              </span>
            )}
          </div>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {question.question}
          </ReactMarkdown>
          <div>
            {Object.entries(options).map(([key, option]) => {
              const isSelected = question.user_answer === key;
              const isAnswerCorrect = question.correct_answer === key;
              
              // Xác định class CSS dựa trên trạng thái lựa chọn
              let bgColorClass = "";
              if (isSelected) {
                bgColorClass = isAnswerCorrect ? "bg-green-300" : "bg-red-300";
              } else if (isAnswerCorrect) {
                bgColorClass = "bg-green-100";
              } else {
                bgColorClass = "bg-gray-100";
              }
              
              return (
                <div 
                  key={key} 
                  className={`p-2 border rounded my-1 ${bgColorClass}`}
                >
                  {key}. <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</ReactMarkdown>
                </div>
              );
            })}
          </div>
          
          <div className="mt-2">
            {question.user_answer === undefined || question.user_answer === null ? (
              <div className="p-2 bg-yellow-100 border rounded">
                <span className="font-semibold">Chưa chọn đáp án</span>
              </div>
            ) : (
              <div className={`p-2 ${question.is_correct ? "bg-green-100" : "bg-red-100"} border rounded`}>
                <span className="font-semibold">
                  {question.is_correct ? "Đáp án đúng" : `Đáp án sai. Đáp án đúng là: ${question.correct_answer}`}
                </span>
              </div>
            )}
          </div>
          
          <button
            className="mt-2 p-1 bg-blue-500 text-white rounded"
            onClick={() => handleShowSolution(reviewQuestionIndex)}
          >
            {showSolution === reviewQuestionIndex ? "Ẩn lời giải" : "Xem lời giải"}
          </button>
          
          {showSolution === reviewQuestionIndex && question.solution && (
            <div className="mt-4 p-2 border rounded bg-gray-100">
              <h4 className="font-semibold">Lời giải:</h4>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {question.solution}
              </ReactMarkdown>
            </div>
          )}
          
          <div className="mt-4 flex justify-between">
            <button 
              className="p-2 bg-gray-500 text-white rounded" 
              onClick={handlePreviousReview} 
              disabled={reviewQuestionIndex === 0}
            >
              Bài trước
            </button>
            <span className="p-2">
              {reviewQuestionIndex + 1} / {attempt.questions.length}
            </span>
            <button 
              className="p-2 bg-blue-500 text-white rounded" 
              onClick={handleNextReview}
              disabled={reviewQuestionIndex === attempt.questions.length - 1}
            >
              Bài sau
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chi tiết bài làm</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Quay lại
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Chủ đề:</p>
            <p className="font-medium">{attempt.topic_name}</p>
          </div>
          <div>
            <p className="text-gray-600">Ngày làm:</p>
            <p className="font-medium">{formatDate(attempt.completed_at)}</p>
          </div>
          <div>
            <p className="text-gray-600">Điểm số:</p>
            <p className="font-medium text-lg">
              {attempt.score_text || `${attempt.score}/${attempt.total_questions}`}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Thời gian làm bài:</p>
            <p className="font-medium">{formatTime(attempt.time_taken || 0)}</p>
          </div>
          <div>
            <p className="text-gray-600">Số câu trả lời:</p>
            <p className="font-medium">
              {attempt.answered_questions || 0}/{attempt.total_questions || attempt.questions.length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Số câu đúng:</p>
            <p className="font-medium">
              {attempt.total_correct || attempt.questions.filter(q => q.is_correct).length}
              /{attempt.total_questions || attempt.questions.length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded font-medium"
          onClick={toggleViewReview}
        >
          {viewReview ? "Ẩn xem lại" : "Xem lại bài làm"}
        </button>
        
        {attempt.feedback && (
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded font-medium"
            onClick={toggleFeedback}
          >
            {showFeedback ? "Ẩn nhận xét" : "Xem nhận xét"}
          </button>
        )}
      </div>
      
      {showFeedback && attempt.feedback && (
        <div className="mt-4 p-4 border rounded bg-blue-50 mb-6">
          <h3 className="text-xl font-bold mb-2">Nhận xét về bài làm</h3>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {attempt.feedback}
          </ReactMarkdown>
        </div>
      )}
      
      {viewReview && renderReviewQuestion()}
    </div>
  );
} 