import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from '../config';

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
  
  // Token from localStorage
  const token = localStorage.getItem("token");
  
  // Get current question
  const currentQuestion = allQuestions[currentQuestionIndex] || null;
  
  // Fetch saved topics when component mounts
  useEffect(() => {
    fetchSavedTopics();
  }, []);
  
  // Function to fetch saved topics
  const fetchSavedTopics = async () => {
    setLoadingSavedTopics(true);
    try {
      const response = await axios.get(`${config.apiEndpoints.admin}/questions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.question_sets) {
        // Convert from question sets list to topics list
        const topics = response.data.question_sets.map(set => ({
          _id: set._id,
          name: set.topic,
          questionCount: set.questions?.length || 0,
          updatedAt: set.created_at,
          created_by: set.created_by
        }));
        setSavedTopics(topics);
      } else {
        console.error("API did not return data in expected format:", response.data);
      }
    } catch (err) {
      console.error("Error fetching topics list:", err);
    } finally {
      setLoadingSavedTopics(false);
    }
  };
  
  // Function to fetch questions by topic
  const fetchQuestionsByTopic = async (topicId, topicName) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to get question set details
      const response = await axios.get(`${config.apiEndpoints.admin}/questions/${topicId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Question data by topic:", response.data);
      
      // Check returned data structure
      if (response.data && response.data.question_set) {
        // Save ID of topic being edited
        setCurrentTopicId(topicId);
        
        // Convert question format if needed
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
          setError("This topic has no questions.");
          setIsCreatingNew(true);
        }
      } else {
        console.error("Incorrect data structure:", response.data);
        setError("Could not get questions for this topic. Data structure is incorrect.");
      }
    } catch (err) {
      console.error("Error fetching questions by topic:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Could not get questions: ${err.response.data.error}`);
      } else {
        setError("Could not get questions. API connection error.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert from options format {A, B, C, D} to options format [A, B, C, D]
  const convertApiResponseToQuestions = (questions) => {
    return questions.map(q => {
      try {
        // If options is an object, convert to array
        if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
          const optionsArray = [
            q.options.A || "",
            q.options.B || "",
            q.options.C || "",
            q.options.D || ""
          ];
          
          // Determine index of correct answer
          let correctAnswer = 0;
          if (q.answer === 'A') correctAnswer = 0;
          else if (q.answer === 'B') correctAnswer = 1;
          else if (q.answer === 'C') correctAnswer = 2;
          else if (q.answer === 'D') correctAnswer = 3;
          
          // If no solution field, try to use explanation field if available
          const solution = q.solution || q.explanation || "";
          
          return {
            question: q.question,
            options: optionsArray,
            correct_answer: correctAnswer,
            // Ensure difficulty is in the right format
            difficulty: q.difficulty?.toLowerCase().includes('level 1') || q.difficulty?.toLowerCase().includes('mức 1') ? 'easy' : 
                      q.difficulty?.toLowerCase().includes('level 2') || q.difficulty?.toLowerCase().includes('mức 2') ? 'medium' : 
                      q.difficulty?.toLowerCase().includes('level 3') || q.difficulty?.toLowerCase().includes('mức 3') ? 'hard' : 'medium',
            solution: solution
          };
        }
        return q;
      } catch (e) {
        console.error("Error processing question:", e, q);
        // Return default question if error
        return {
          question: q.question || "Invalid question",
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
      alert("Please enter a topic");
      return;
    }
    
    setGeneratingQuestions(true);
    setError(null);
    
    try {
      const response = await axios.post(config.apiEndpoints.ragApi.multipleChoice, 
        { question: topic }
      );
      
      // Process API response
      if (response.data && response.data.answer) {
        try {
          console.log("API response:", response.data.answer);
          
          // Process JSON string
          const jsonString = response.data.answer
            .replace(/```json\n?|```/g, "")  // Remove JSON code block markers
            .replace(/(?<!\\)\\(?!\\)/g, "\\\\")  // Replace single backslash with double backslash but keep existing \\
            .trim();
          
          console.log("Processed JSON string:", jsonString);
          
          // Parse processed JSON string
          const jsonData = JSON.parse(jsonString);
          console.log("Parsed data:", jsonData);
          
          // Check if there's questions structure
          if (jsonData && jsonData.questions && Array.isArray(jsonData.questions) && jsonData.questions.length > 0) {
            const formattedQuestions = convertApiResponseToQuestions(jsonData.questions);
            
            // Add to existing questions list
            setAllQuestions(prev => [...prev, ...formattedQuestions]);
            
            // Lock topic after successful creation
            setTopicLocked(true);
            
            // If this is the first time, select the first question
            if (!currentQuestion) {
              setCurrentQuestionIndex(0);
            }
          } else if (Array.isArray(jsonData)) {
            // Case when API returns direct array without questions key
            const formattedQuestions = convertApiResponseToQuestions(jsonData);
            
            // Add to existing questions list
            setAllQuestions(prev => [...prev, ...formattedQuestions]);
            
            // Lock topic after successful creation
            setTopicLocked(true);
            
            // If this is the first time, select the first question
            if (!currentQuestion) {
              setCurrentQuestionIndex(0);
            }
          } else {
            throw new Error("No questions found in received data");
          }
        } catch (jsonError) {
          console.error("JSON processing error:", jsonError);
          console.error("Raw data from API:", response.data.answer);
          setError("Data formatting error. Please try with a different topic.");
        }
      } else {
        setError("Could not create question. Please try with a different topic.");
      }
    } catch (err) {
      console.error("Error creating question:", err);
      setError("Could not create question. API connection error.");
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
    setCurrentTopicId(null); // Reset currentTopicId when creating new
  };
  
  const handleBackToTopics = () => {
    // If there's question, show save dialog
    if (allQuestions.length > 0 && !savedSuccessfully) {
      setShowSaveDialog(true);
    } else {
      // If no questions or already saved, go back directly
      resetForm();
    }
  };
  
  const handleNewTopic = () => {
    // If there's question, show save dialog
    if (allQuestions.length > 0) {
      setShowSaveDialog(true);
    } else {
      // If no questions, reset form directly
      resetForm();
    }
  };
  
  const handleSaveDialogResponse = (shouldSave) => {
    if (shouldSave) {
      // Save questions then reset form
      saveQuestions();
    } else {
      // Don't save, just reset form
      setShowSaveDialog(false);
      resetForm();
    }
  };
  
  // Filter topics list by search term
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
      alert("Must keep at least one question");
      return;
    }
    
    const updatedQuestions = [...allQuestions];
    updatedQuestions.splice(currentQuestionIndex, 1);
    
    setAllQuestions(updatedQuestions);
    
    // Adjust current index if needed
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
  
  // Add API endpoint to update existing question set
  const updateExistingQuestionSet = async (topicId, data) => {
    console.log(`Updating question set with ID ${topicId}`, data);
    try {
      const response = await axios.put(`${config.apiEndpoints.admin}/questions/${topicId}`, 
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
      alert("No questions to save");
      return;
    }
    
    // Check if data is valid
    const invalidQuestions = allQuestions.filter(q => 
      !q.question.trim() || 
      q.options.some(opt => !opt.trim()) ||
      q.solution.trim() === ""
    );
    
    if (invalidQuestions.length > 0) {
      alert(`There are ${invalidQuestions.length} questions not completed. Please fill in all question, options, and solution.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data to send in the correct format expected by API
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
      
      console.log("Data sent to server:", questionData);
      
      let response;
      
      // If editing existing topic
      if (currentTopicId) {
        response = await updateExistingQuestionSet(currentTopicId, questionData);
        console.log("Updated existing topic:", response.data);
      } else {
        // Create new if it's new topic
        response = await axios.post(`${config.apiEndpoints.admin}/questions`, 
          questionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update currentTopicId with newly created ID
        if (response.data && response.data.question_set_id) {
          setCurrentTopicId(response.data.question_set_id);
        }
        
        console.log("Created new topic:", response.data);
      }
      
      console.log("Server response:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        setSavedSuccessfully(true);
        
        // Update topics list after saving
        fetchSavedTopics();
        
        // If in new topic dialog, handle after saving
        if (showSaveDialog) {
          setShowSaveDialog(false);
          resetForm();
        } else {
          setTimeout(() => setSavedSuccessfully(false), 3000);
        }
      } else {
        setError(`Server returned status ${response.status}`);
      }
    } catch (err) {
      console.error("Error saving questions:", err);
      // Show specific error from server if available
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Could not save questions: ${err.response.data.error}`);
      } else {
        setError("Could not save questions: API connection or server not responding");
      }
      
      // If in new topic dialog, close dialog
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
    setCurrentTopicId(null); // Reset currentTopicId when reset form
  };
  
  // Handle topic deletion
  const handleDeleteTopic = (topicId, topicName, event) => {
    // Prevent event propagation to parent element
    event.stopPropagation();
    
    // Confirm with small dialog (confirm browser)
    if (window.confirm(`Are you sure you want to delete topic "${topicName}"?`)) {
      deleteTopicById(topicId, topicName);
    }
  };
  
  // Delete topic by ID
  const deleteTopicById = async (topicId, topicName) => {
    setLoading(true);
    
    try {
      const response = await axios.delete(`${config.apiEndpoints.admin}/questions/${topicId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Topic deletion result:", response.data);
      
      // Update topics list
      fetchSavedTopics();
      
      // Show success deletion toast
      setDeleteSuccessMessage(`Topic "${topicName}" deleted successfully`);
      
      // Automatically hide success toast after 3 seconds
      setTimeout(() => {
        setDeleteSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error deleting topic:", err);
      
      // Show error toast
      setError("Could not delete topic. Please try again later.");
      
      // Automatically hide error toast after 3 seconds
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
        <h1 className="text-2xl font-bold">Question Management</h1>
        <div className="flex space-x-2">
          {isCreatingNew && (
            <button 
              onClick={handleBackToTopics}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Go back to topics list
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
          {/* Topics list */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold">Topics</h2>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleCreateNew}
              >
                Create new
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loadingSavedTopics ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Loading...</span>
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
                          <span>{savedTopic.questionCount || 0} questions</span>
                          <span>Updated: {new Date(savedTopic.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Delete button */}
                        <button 
                          className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                          onClick={(e) => handleDeleteTopic(savedTopic._id, savedTopic.name, e)}
                          title="Delete topic"
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
                        <p className="mb-3">No topics found matching the keyword.</p>
                        <button 
                          className="px-4 py-2 bg-blue-500 text-white rounded"
                          onClick={handleCreateNew}
                        >
                          Create new topic
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-3">No topics have been saved.</p>
                        <button 
                          className="px-4 py-2 bg-blue-500 text-white rounded"
                          onClick={handleCreateNew}
                        >
                          Create first topic
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
          {/* Topic creation/editing interface */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold" htmlFor="topic">
                  Topic
                </label>
                {topicLocked && (
                  <button 
                    className="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                    onClick={handleNewTopic}
                  >
                    New topic
                  </button>
                )}
              </div>
              <div className="flex">
                <input 
                  id="topic"
                  type="text" 
                  className={`w-full px-3 py-2 border rounded-l-lg focus:outline-none ${topicLocked ? 'bg-gray-100' : ''}`} 
                  placeholder="Enter topic (e.g., Quadratic Equation)" 
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
                      <span>Creating...</span>
                    </div> : 
                    <span>Create question</span>
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
                  Question {currentQuestionIndex + 1}/{allQuestions.length}
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
                      Question content
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
                      Options
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
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Difficulty
                    </label>
                    <select 
                      className="w-full px-3 py-2 border rounded focus:outline-none"
                      value={currentQuestion.difficulty}
                      onChange={(e) => updateCurrentQuestion("difficulty", e.target.value)}
                    >
                      <option value="easy">Easy (Level 1)</option>
                      <option value="medium">Medium (Level 2)</option>
                      <option value="hard">Hard (Level 3)</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Solution
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
                      ← Previous question
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === allQuestions.length - 1}
                    >
                      Next question →
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
                    <span>Saving...</span>
                  </div> : 
                  <span>Save all questions</span>
                }
              </button>
              
              <button 
                className="sm:flex-1 px-4 py-3 bg-green-500 text-white rounded shadow-sm hover:bg-green-600 disabled:bg-green-300"
                onClick={generateQuestions}
                disabled={generatingQuestions || !topic.trim() || !topicLocked}
              >
                Create more questions
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Success save notification */}
      {savedSuccessfully && (
        <div className="fixed bottom-6 right-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Save successful!</p>
              <p className="text-sm">All questions have been saved to the system.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success deletion notification */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-6 right-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Delete successful!</p>
              <p className="text-sm">{deleteSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Save confirmation dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Save questions?</h3>
            <p className="mb-4">Do you want to save the questions you've created for topic "{topic}" before exiting?</p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => handleSaveDialogResponse(false)}
              >
                Don't save
              </button>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => handleSaveDialogResponse(true)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionManagementPage; 