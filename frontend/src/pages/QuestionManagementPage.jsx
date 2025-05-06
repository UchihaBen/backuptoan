import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function QuestionManagementPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [topicLocked, setTopicLocked] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedTopics, setSavedTopics] = useState([]);
  const [loadingSavedTopics, setLoadingSavedTopics] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(null);
  
  // Token lấy từ localStorage
  const token = localStorage.getItem("token");
  
  // Lấy câu hỏi hiện tại
  const currentQuestion = allQuestions[currentQuestionIndex] || null;
  
  // Lấy danh sách chủ đề đã lưu khi component mount
  useEffect(() => {
    fetchSavedTopics();
  }, []);
  
  // Hàm lấy danh sách chủ đề đã lưu
  const fetchSavedTopics = async () => {
    setLoadingSavedTopics(true);
    try {
      const response = await axios.get("http://localhost:5000/api/admin/questions", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.question_sets) {
        // Chuyển đổi từ danh sách bộ câu hỏi sang danh sách chủ đề
        const topics = response.data.question_sets.map(set => ({
          _id: set._id,
          name: set.topic,
          questionCount: set.questions?.length || 0,
          updatedAt: set.created_at,
          created_by: set.created_by
        }));
        setSavedTopics(topics);
      } else {
        console.error("API không trả về dữ liệu theo định dạng mong đợi:", response.data);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách chủ đề:", err);
    } finally {
      setLoadingSavedTopics(false);
    }
  };
  
  // Hàm lấy câu hỏi theo chủ đề
  const fetchQuestionsByTopic = async (topicId, topicName) => {
    setLoading(true);
    setError(null);
    
    try {
      // Gọi API lấy chi tiết bộ câu hỏi
      const response = await axios.get(`http://localhost:5000/api/admin/questions/${topicId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Dữ liệu câu hỏi theo chủ đề:", response.data);
      
      // Kiểm tra cấu trúc dữ liệu trả về
      if (response.data && response.data.question_set) {
        // Lưu ID của chủ đề đang chỉnh sửa
        setCurrentTopicId(topicId);
        
        // Chuyển đổi định dạng câu hỏi nếu cần
        const questions = response.data.question_set.questions || [];
        
        if (Array.isArray(questions) && questions.length > 0) {
          const processedQuestions = questions.map(q => ({
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [
              q.options?.A || "",
              q.options?.B || "",
              q.options?.C || "",
              q.options?.D || ""
            ],
            correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 
                          q.answer === 'A' || q.correct_answer === 'A' ? 0 : 
                          q.answer === 'B' || q.correct_answer === 'B' ? 1 :
                          q.answer === 'C' || q.correct_answer === 'C' ? 2 : 
                          q.answer === 'D' || q.correct_answer === 'D' ? 3 : 0,
            difficulty: q.difficulty,
            solution: q.solution || q.explanation || ""
          }));
          
          setAllQuestions(processedQuestions);
          setTopic(topicName);
          setTopicLocked(true);
          setCurrentQuestionIndex(0);
          setIsCreatingNew(true);
        } else {
          setAllQuestions([]);
          setTopic(topicName);
          setTopicLocked(true);
          setError("Chủ đề này không có câu hỏi nào.");
          setIsCreatingNew(true);
        }
      } else {
        console.error("Cấu trúc dữ liệu không đúng:", response.data);
        setError("Không thể lấy câu hỏi cho chủ đề này. Cấu trúc dữ liệu không đúng định dạng.");
      }
    } catch (err) {
      console.error("Lỗi khi lấy câu hỏi theo chủ đề:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Không thể lấy câu hỏi: ${err.response.data.error}`);
      } else {
        setError("Không thể lấy câu hỏi. Lỗi kết nối API.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Chuyển đổi từ format options {A, B, C, D} sang format options [A, B, C, D]
  const convertApiResponseToQuestions = (questions) => {
    return questions.map(q => {
      try {
        // Nếu options là object thì chuyển thành array
        if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
          const optionsArray = [
            q.options.A || "",
            q.options.B || "",
            q.options.C || "",
            q.options.D || ""
          ];
          
          // Xác định chỉ số của đáp án đúng
          let correctAnswer = 0;
          if (q.answer === 'A') correctAnswer = 0;
          else if (q.answer === 'B') correctAnswer = 1;
          else if (q.answer === 'C') correctAnswer = 2;
          else if (q.answer === 'D') correctAnswer = 3;
          
          // Nếu không có trường solution, cố gắng dùng trường explanation nếu có
          const solution = q.solution || q.explanation || "";
          
          return {
            question: q.question,
            options: optionsArray,
            correct_answer: correctAnswer,
            // Đảm bảo difficulty đúng định dạng
            difficulty: q.difficulty?.toLowerCase().includes('mức 1') ? 'easy' : 
                      q.difficulty?.toLowerCase().includes('mức 2') ? 'medium' : 
                      q.difficulty?.toLowerCase().includes('mức 3') ? 'hard' : 'medium',
            solution: solution
          };
        }
        return q;
      } catch (e) {
        console.error("Lỗi khi xử lý câu hỏi:", e, q);
        // Trả về câu hỏi mặc định nếu có lỗi
        return {
          question: q.question || "Câu hỏi không hợp lệ",
          options: ["", "", "", ""],
          correct_answer: 0,
          difficulty: "medium",
          solution: ""
        };
      }
    });
  };
  
  const generateQuestions = async () => {
    if (!topic.trim()) {
      alert("Vui lòng nhập chủ đề");
      return;
    }
    
    setGeneratingQuestions(true);
    setError(null);
    
    try {
      const response = await axios.post("http://127.0.0.1:8000/Multiple_Choice_Questions", 
        { question: topic }
      );
      
      // Xử lý câu trả lời từ API
      if (response.data && response.data.answer) {
        try {
          console.log("API response:", response.data.answer);
          
          // Xử lý JSON giống như trong QuizPage.jsx
          const jsonString = response.data.answer
            .replace(/```json\n?|```/g, "")  // Xóa ký hiệu code block JSON
            .replace(/(?<!\\)\\(?!\\)/g, "\\\\")  // Chỉ thay \ đơn thành \\ nhưng giữ nguyên \\ đã có
            .trim();
          
          console.log("Processed JSON string:", jsonString);
          
          // Parse chuỗi JSON đã xử lý
          const jsonData = JSON.parse(jsonString);
          console.log("Parsed data:", jsonData);
          
          // Kiểm tra xem có cấu trúc questions không
          if (jsonData && jsonData.questions && Array.isArray(jsonData.questions) && jsonData.questions.length > 0) {
            const formattedQuestions = convertApiResponseToQuestions(jsonData.questions);
            
            // Thêm vào danh sách câu hỏi hiện có
            setAllQuestions(prev => [...prev, ...formattedQuestions]);
            
            // Khóa chủ đề sau khi tạo thành công
            setTopicLocked(true);
            
            // Nếu đây là lần đầu tiên, chọn câu hỏi đầu tiên
            if (!currentQuestion) {
              setCurrentQuestionIndex(0);
            }
          } else if (Array.isArray(jsonData)) {
            // Trường hợp API trả về mảng trực tiếp không có key questions
            const formattedQuestions = convertApiResponseToQuestions(jsonData);
            
            // Thêm vào danh sách câu hỏi hiện có
            setAllQuestions(prev => [...prev, ...formattedQuestions]);
            
            // Khóa chủ đề sau khi tạo thành công
            setTopicLocked(true);
            
            // Nếu đây là lần đầu tiên, chọn câu hỏi đầu tiên
            if (!currentQuestion) {
              setCurrentQuestionIndex(0);
            }
          } else {
            throw new Error("Không có câu hỏi trong dữ liệu nhận được");
          }
        } catch (jsonError) {
          console.error("Lỗi xử lý JSON:", jsonError);
          console.error("Dữ liệu gốc từ API:", response.data.answer);
          setError("Lỗi định dạng dữ liệu. Vui lòng thử lại với chủ đề khác.");
        }
      } else {
        setError("Không thể tạo câu hỏi. Vui lòng thử lại với chủ đề khác.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo câu hỏi:", err);
      setError("Không thể tạo câu hỏi. Lỗi kết nối API.");
    } finally {
      setGeneratingQuestions(false);
      setSavedSuccessfully(false);
    }
  };
  
  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setTopic("");
    setAllQuestions([]);
    setCurrentQuestionIndex(0);
    setTopicLocked(false);
    setError(null);
    setCurrentTopicId(null); // Reset currentTopicId khi tạo mới
  };
  
  const handleBackToTopics = () => {
    // Nếu có câu hỏi, hiển thị hộp thoại lưu
    if (allQuestions.length > 0 && !savedSuccessfully) {
      setShowSaveDialog(true);
    } else {
      // Nếu không có câu hỏi hoặc đã lưu, quay lại danh sách trực tiếp
      resetForm();
    }
  };
  
  const handleNewTopic = () => {
    // Nếu có câu hỏi, hiển thị hộp thoại lưu
    if (allQuestions.length > 0) {
      setShowSaveDialog(true);
    } else {
      // Nếu không có câu hỏi, reset form trực tiếp
      resetForm();
    }
  };
  
  const handleSaveDialogResponse = (shouldSave) => {
    if (shouldSave) {
      // Lưu câu hỏi rồi reset form
      saveQuestions();
    } else {
      // Không lưu, chỉ reset form
      setShowSaveDialog(false);
      resetForm();
    }
  };
  
  // Lọc danh sách chủ đề theo từ khóa tìm kiếm
  const filteredTopics = searchTerm.trim() === '' 
    ? savedTopics 
    : savedTopics.filter(topic => 
        topic.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
  const updateCurrentQuestion = (field, value) => {
    if (!currentQuestion) return;
    
    const updatedQuestions = [...allQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      [field]: value
    };
    
    setAllQuestions(updatedQuestions);
    setSavedSuccessfully(false);
  };
  
  const updateOption = (optionIndex, value) => {
    if (!currentQuestion) return;
    
    const newOptions = [...currentQuestion.options];
    newOptions[optionIndex] = value;
    
    const updatedQuestions = [...allQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      options: newOptions
    };
    
    setAllQuestions(updatedQuestions);
    setSavedSuccessfully(false);
  };
  
  const addNewQuestion = () => {
    const newQuestion = {
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      difficulty: "medium",
      solution: ""
    };
    
    setAllQuestions([...allQuestions, newQuestion]);
    setCurrentQuestionIndex(allQuestions.length);
    setSavedSuccessfully(false);
  };
  
  const removeCurrentQuestion = () => {
    if (allQuestions.length <= 1) {
      alert("Phải giữ lại ít nhất một câu hỏi");
      return;
    }
    
    const updatedQuestions = [...allQuestions];
    updatedQuestions.splice(currentQuestionIndex, 1);
    
    setAllQuestions(updatedQuestions);
    
    // Điều chỉnh index hiện tại nếu cần
    if (currentQuestionIndex >= updatedQuestions.length) {
      setCurrentQuestionIndex(updatedQuestions.length - 1);
    }
    
    setSavedSuccessfully(false);
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Thêm API endpoint để cập nhật bộ câu hỏi đã tồn tại
  const updateExistingQuestionSet = async (topicId, data) => {
    console.log(`Cập nhật bộ câu hỏi có ID ${topicId}`, data);
    try {
      const response = await axios.put(`http://localhost:5000/api/admin/questions/${topicId}`, 
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  const saveQuestions = async () => {
    if (allQuestions.length === 0) {
      alert("Không có câu hỏi để lưu");
      return;
    }
    
    // Kiểm tra xem dữ liệu có hợp lệ không
    const invalidQuestions = allQuestions.filter(q => 
      !q.question.trim() || 
      q.options.some(opt => !opt.trim()) ||
      q.solution.trim() === ""
    );
    
    if (invalidQuestions.length > 0) {
      alert(`Có ${invalidQuestions.length} câu hỏi chưa hoàn thiện. Vui lòng điền đầy đủ nội dung câu hỏi, các lựa chọn và lời giải.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Chuẩn bị dữ liệu gửi lên theo đúng định dạng API mong đợi
      const questionData = {
        topic: topic,
        questions: allQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty,
          solution: q.solution
        }))
      };
      
      console.log("Dữ liệu gửi lên server:", questionData);
      
      let response;
      
      // Nếu đang chỉnh sửa chủ đề đã tồn tại
      if (currentTopicId) {
        response = await updateExistingQuestionSet(currentTopicId, questionData);
        console.log("Đã cập nhật chủ đề hiện tại:", response.data);
      } else {
        // Tạo mới nếu là chủ đề mới
        response = await axios.post("http://localhost:5000/api/admin/questions", 
          questionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Cập nhật currentTopicId với ID vừa tạo
        if (response.data && response.data.question_set_id) {
          setCurrentTopicId(response.data.question_set_id);
        }
        
        console.log("Đã tạo chủ đề mới:", response.data);
      }
      
      console.log("Phản hồi từ server:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSavedSuccessfully(true);
        
        // Cập nhật lại danh sách chủ đề sau khi lưu
        fetchSavedTopics();
        
        // Nếu đang trong dialog chủ đề mới, xử lý sau khi lưu
        if (showSaveDialog) {
          setShowSaveDialog(false);
          resetForm();
        } else {
          setTimeout(() => setSavedSuccessfully(false), 3000);
        }
      } else {
        setError(`Lỗi: Server trả về trạng thái ${response.status}`);
      }
    } catch (err) {
      console.error("Lỗi khi lưu câu hỏi:", err);
      // Hiển thị thông báo lỗi cụ thể từ server nếu có
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Không thể lưu câu hỏi: ${err.response.data.error}`);
      } else {
        setError("Không thể lưu câu hỏi: Lỗi kết nối hoặc máy chủ không phản hồi");
      }
      
      // Nếu đang trong dialog chủ đề mới, đóng dialog
      if (showSaveDialog) {
        setShowSaveDialog(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTopic("");
    setAllQuestions([]);
    setCurrentQuestionIndex(0);
    setTopicLocked(false);
    setError(null);
    setIsCreatingNew(false);
    setCurrentTopicId(null); // Reset currentTopicId khi reset form
  };
  
  // Xử lý xóa chủ đề
  const handleDeleteTopic = (topicId, topicName, event) => {
    // Ngăn sự kiện click lan ra thẻ cha
    event.stopPropagation();
    
    // Xác nhận bằng hộp thoại nhỏ (confirm browser)
    if (window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topicName}"?`)) {
      deleteTopicById(topicId, topicName);
    }
  };
  
  // Xóa chủ đề theo ID
  const deleteTopicById = async (topicId, topicName) => {
    setLoading(true);
    
    try {
      const response = await axios.delete(`http://localhost:5000/api/admin/questions/${topicId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Kết quả xóa chủ đề:", response.data);
      
      // Cập nhật lại danh sách chủ đề
      fetchSavedTopics();
      
      // Hiển thị thông báo xóa thành công dạng toast
      setDeleteSuccessMessage(`Đã xóa chủ đề "${topicName}" thành công`);
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setDeleteSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error("Lỗi khi xóa chủ đề:", err);
      
      // Hiển thị thông báo lỗi dạng toast
      setError("Không thể xóa chủ đề. Vui lòng thử lại sau.");
      
      // Tự động ẩn thông báo lỗi sau 3 giây
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý câu hỏi</h1>
        <div className="flex space-x-2">
          {isCreatingNew && (
            <button 
              onClick={handleBackToTopics}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Quay lại danh sách
            </button>
          )}
          <button 
            onClick={() => navigate("/admin")}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </div>
      
      {!isCreatingNew ? (
        <>
          {/* Danh sách chủ đề chính */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold">Các chủ đề</h2>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleCreateNew}
              >
                Tạo mới
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                  placeholder="Tìm kiếm chủ đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loadingSavedTopics ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Đang tải...</span>
                  </div>
                ) : filteredTopics.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredTopics.map((savedTopic) => (
                      <div
                        key={savedTopic._id}
                        className="p-4 border rounded hover:bg-blue-50 cursor-pointer transition relative"
                        onClick={() => fetchQuestionsByTopic(savedTopic._id, savedTopic.name)}
                      >
                        <h3 className="font-medium mb-2 pr-6">{savedTopic.name}</h3>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{savedTopic.questionCount || 0} câu hỏi</span>
                          <span>Cập nhật: {new Date(savedTopic.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Nút xóa */}
                        <button 
                          className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                          onClick={(e) => handleDeleteTopic(savedTopic._id, savedTopic.name, e)}
                          title="Xóa chủ đề"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p className="mb-3">Không tìm thấy chủ đề nào khớp với từ khóa.</p>
                        <button 
                          className="px-4 py-2 bg-blue-500 text-white rounded"
                          onClick={handleCreateNew}
                        >
                          Tạo chủ đề mới
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-3">Chưa có chủ đề nào được lưu.</p>
                        <button 
                          className="px-4 py-2 bg-blue-500 text-white rounded"
                          onClick={handleCreateNew}
                        >
                          Tạo chủ đề đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Giao diện tạo/chỉnh sửa chủ đề */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold" htmlFor="topic">
                  Chủ đề
                </label>
                {topicLocked && (
                  <button 
                    className="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                    onClick={handleNewTopic}
                  >
                    Chủ đề mới
                  </button>
                )}
              </div>
              <div className="flex">
                <input 
                  id="topic"
                  type="text" 
                  className={`w-full px-3 py-2 border rounded-l-lg focus:outline-none ${topicLocked ? 'bg-gray-100' : ''}`} 
                  placeholder="Nhập chủ đề (ví dụ: Phương trình bậc 2)" 
                  value={topic}
                  onChange={(e) => !topicLocked && setTopic(e.target.value)}
                  readOnly={topicLocked}
                />
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-lg disabled:bg-blue-300"
                  onClick={generateQuestions}
                  disabled={generatingQuestions || !topic.trim()}
                >
                  {generatingQuestions ? 
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Đang tạo...</span>
                    </div> : 
                    <span>Tạo câu hỏi</span>
                  }
                </button>
              </div>
              
              {error && (
                <div className="mt-3 text-red-600 text-sm">{error}</div>
              )}
            </div>
          </div>
          
          {allQuestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold">
                  Câu hỏi {currentQuestionIndex + 1}/{allQuestions.length}
                </h2>
                <div className="flex space-x-2">
                  <button 
                    className="p-2 bg-red-500 text-white rounded"
                    onClick={removeCurrentQuestion}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button 
                    className="p-2 bg-green-500 text-white rounded"
                    onClick={addNewQuestion}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {currentQuestion && (
                <div className="p-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nội dung câu hỏi
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded focus:outline-none" 
                      value={currentQuestion.question}
                      onChange={(e) => updateCurrentQuestion("question", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Các lựa chọn
                    </label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <input 
                            type="radio"
                            checked={currentQuestion.correct_answer === index}
                            onChange={() => updateCurrentQuestion("correct_answer", index)}
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="w-8 h-8 bg-gray-200 flex items-center justify-center font-bold mr-2 rounded">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <input 
                          type="text"
                          className="flex-1 px-3 py-2 border rounded focus:outline-none"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Độ khó
                    </label>
                    <select 
                      className="w-full px-3 py-2 border rounded focus:outline-none"
                      value={currentQuestion.difficulty}
                      onChange={(e) => updateCurrentQuestion("difficulty", e.target.value)}
                    >
                      <option value="easy">Dễ (Mức 1)</option>
                      <option value="medium">Trung bình (Mức 2)</option>
                      <option value="hard">Khó (Mức 3)</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Lời giải
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded focus:outline-none" 
                      value={currentQuestion.solution}
                      onChange={(e) => updateCurrentQuestion("solution", e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                      onClick={goToPrevQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      ← Câu trước
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === allQuestions.length - 1}
                    >
                      Câu tiếp theo →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {allQuestions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button 
                className="sm:flex-1 px-4 py-3 bg-blue-500 text-white rounded shadow-sm hover:bg-blue-600 disabled:bg-blue-300"
                onClick={saveQuestions}
                disabled={loading}
              >
                {loading ? 
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Đang lưu...</span>
                  </div> : 
                  <span>Lưu tất cả câu hỏi</span>
                }
              </button>
              
              <button 
                className="sm:flex-1 px-4 py-3 bg-green-500 text-white rounded shadow-sm hover:bg-green-600 disabled:bg-green-300"
                onClick={generateQuestions}
                disabled={generatingQuestions || !topic.trim() || !topicLocked}
              >
                Tạo thêm câu hỏi
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Thông báo lưu thành công */}
      {savedSuccessfully && (
        <div className="fixed bottom-6 right-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Lưu thành công!</p>
              <p className="text-sm">Tất cả câu hỏi đã được lưu vào hệ thống.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Thông báo xóa thành công */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-6 right-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Xóa thành công!</p>
              <p className="text-sm">{deleteSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dialog xác nhận lưu */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Lưu câu hỏi?</h3>
            <p className="mb-4">Bạn có muốn lưu các câu hỏi đã tạo cho chủ đề "{topic}" trước khi thoát không?</p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => handleSaveDialogResponse(false)}
              >
                Không lưu
              </button>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => handleSaveDialogResponse(true)}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionManagementPage; 