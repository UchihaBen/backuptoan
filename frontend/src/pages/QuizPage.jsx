import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { config } from '../config';

export function QuizPage() {
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({}); // Để lưu trữ các tùy chọn đã chọn
  const [viewReview, setViewReview] = useState(false); // Để điều khiển chế độ xem lại
  const [showSolution, setShowSolution] = useState(null); // Để hiển thị/ẩn lời giải
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0); // Để theo dõi câu hỏi hiện tại trong chế độ xem lại
  const [feedback, setFeedback] = useState(null); // Để lưu trữ nhận xét từ API
  const [loadingFeedback, setLoadingFeedback] = useState(false); // Trạng thái loading khi gọi API nhận xét
  const [showFeedback, setShowFeedback] = useState(false); // Để kiểm soát việc hiển thị/ẩn nhận xét
  const [retryCount, setRetryCount] = useState(0); // Đếm số lần thử lại API
  const [isReady, setIsReady] = useState(false); // Trạng thái sẵn sàng làm bài
  const [timer, setTimer] = useState(0); // Thời gian làm bài (giây)
  const [timerActive, setTimerActive] = useState(false); // Trạng thái đồng hồ
  const timerInterval = useRef(null); // Ref để lưu interval

  const location = useLocation();
  const navigate = useNavigate();
  const { topic, topicId, difficulty, distribution } = location.state || {};
  const token = localStorage.getItem("token");
  
  // Lấy userId từ localStorage
  let userId = null;
  const userStr = localStorage.getItem("user");
  
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      userId = userObj.id;
      console.log("User ID from localStorage:", userId);
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }
  
  // Fallback nếu không lấy được từ user object
  userId = userId || localStorage.getItem("userId") || "anonymous";

  // Hàm để lấy dữ liệu quiz từ API
  const fetchQuizData = async (retryAttempt = 0) => {
    if (!topic) {
      setError("Không có chủ đề để tạo bài kiểm tra.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Reset các state khi lấy câu hỏi mới
      setCurrentQuestion(0);
      setSelectedOption(null);
      setScore(0);
      setQuizCompleted(false);
      setSelectedOptions({});
      setViewReview(false);
      setShowSolution(null);
      setReviewQuestionIndex(0);

      // Nếu có topicId, lấy câu hỏi từ bộ sưu tập đã lưu
      if (topicId) {
        const response = await axios.get(`${config.apiEndpoints.admin}/topics/${topicId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.question_set && response.data.question_set.questions) {
          const questions = response.data.question_set.questions;
          
          // Chuyển đổi định dạng câu hỏi và chuẩn hóa định dạng
          const formattedAllQuestions = questions.map(q => {
            // Xác định độ khó
            let questionDifficulty = "Mức 2"; // Mặc định là trung bình
            
            if (q.difficulty) {
              // Đối với độ khó là số hoặc chứa "Mức"
              if (q.difficulty === "Mức 1" || q.difficulty === 1 || 
                  q.difficulty.toLowerCase().includes("1") || 
                  q.difficulty.toLowerCase() === "easy" || 
                  q.difficulty.toLowerCase().includes("dễ") || 
                  q.difficulty.toLowerCase().includes("cơ bản")) {
                questionDifficulty = "Mức 1";
              } 
              else if (q.difficulty === "Mức 3" || q.difficulty === 3 || 
                       q.difficulty.toLowerCase().includes("3") || 
                       q.difficulty.toLowerCase() === "hard" || 
                       q.difficulty.toLowerCase().includes("khó") || 
                       q.difficulty.toLowerCase().includes("nâng cao")) {
                questionDifficulty = "Mức 3";
              }
              else if (q.difficulty === "Mức 2" || q.difficulty === 2 || 
                       q.difficulty.toLowerCase().includes("2") || 
                       q.difficulty.toLowerCase() === "medium" || 
                       q.difficulty.toLowerCase().includes("trung bình")) {
                questionDifficulty = "Mức 2";
              }
            }
            
            return {
              question: q.question,
              options: q.options.A ? {
                A: q.options.A,
                B: q.options.B,
                C: q.options.C,
                D: q.options.D
              } : {
                A: q.options[0],
                B: q.options[1],
                C: q.options[2],
                D: q.options[3]
              },
              answer: typeof q.correct_answer === 'number' ? 
                (q.correct_answer === 0 ? 'A' : 
                q.correct_answer === 1 ? 'B' : 
                q.correct_answer === 2 ? 'C' : 'D') : 
                q.correct_answer,
              difficulty: questionDifficulty,
              solution: q.solution || ""
            };
          });
          
          // Phân loại câu hỏi theo độ khó
          const level1Questions = formattedAllQuestions.filter(q => 
            q.difficulty === "Mức 1" || 
            q.difficulty.toLowerCase().includes("dễ") || 
            q.difficulty.toLowerCase().includes("easy") ||
            q.difficulty.toLowerCase().includes("cơ bản")
          );
          
          const level2Questions = formattedAllQuestions.filter(q => 
            q.difficulty === "Mức 2" || 
            q.difficulty.toLowerCase().includes("trung bình") ||
            q.difficulty.toLowerCase().includes("medium")
          );
          
          const level3Questions = formattedAllQuestions.filter(q => 
            q.difficulty === "Mức 3" || 
            q.difficulty.toLowerCase().includes("khó") || 
            q.difficulty.toLowerCase().includes("hard") ||
            q.difficulty.toLowerCase().includes("nâng cao")
          );
          
          console.log(`Câu hỏi theo độ khó: Mức 1: ${level1Questions.length}, Mức 2: ${level2Questions.length}, Mức 3: ${level3Questions.length}`);
          
          // Lấy ngẫu nhiên câu hỏi theo phân bố độ khó nếu distribution được cung cấp
          let selectedQuestions = [];
          
          if (distribution) {
            // Chọn ngẫu nhiên câu hỏi theo phân bố
            const getRandomQuestions = (pool, count) => {
              // Trả về tất cả nếu không đủ
              if (pool.length <= count) return [...pool];
              
              // Trộn ngẫu nhiên mảng
              const shuffled = [...pool].sort(() => 0.5 - Math.random());
              return shuffled.slice(0, count);
            };
            
            // Lấy câu hỏi theo từng mức độ
            const selected1 = getRandomQuestions(level1Questions, distribution.level1);
            const selected2 = getRandomQuestions(level2Questions, distribution.level2);
            const selected3 = getRandomQuestions(level3Questions, distribution.level3);
            
            // Kiểm tra nếu thiếu câu hỏi ở bất kỳ mức độ nào
            const missing1 = distribution.level1 - selected1.length;
            const missing2 = distribution.level2 - selected2.length;
            const missing3 = distribution.level3 - selected3.length;
            
            // Mảng tạm để bổ sung các câu hỏi bị thiếu
            let supplementalQuestions = [];
            
            // Nếu thiếu câu hỏi mức 1, bổ sung từ mức 2 hoặc mức 3
            if (missing1 > 0) {
              console.log(`Thiếu ${missing1} câu hỏi mức 1, bổ sung từ mức 2 và mức 3`);
              const remainingLevel2 = level2Questions.filter(q => !selected2.includes(q));
              const remainingLevel3 = level3Questions.filter(q => !selected3.includes(q));
              const remainingQuestions = [...remainingLevel2, ...remainingLevel3];
              
              // Trộn ngẫu nhiên và lấy đủ số câu thiếu
              supplementalQuestions = [
                ...supplementalQuestions,
                ...getRandomQuestions(remainingQuestions, missing1)
              ];
            }
            
            // Nếu thiếu câu hỏi mức 2, bổ sung từ mức 1 hoặc mức 3
            if (missing2 > 0) {
              console.log(`Thiếu ${missing2} câu hỏi mức 2, bổ sung từ mức 1 và mức 3`);
              const remainingLevel1 = level1Questions.filter(q => !selected1.includes(q));
              const remainingLevel3 = level3Questions.filter(q => !selected3.includes(q));
              const remainingQuestions = [...remainingLevel1, ...remainingLevel3];
              
              // Trộn ngẫu nhiên và lấy đủ số câu thiếu
              supplementalQuestions = [
                ...supplementalQuestions,
                ...getRandomQuestions(remainingQuestions, missing2)
              ];
            }
            
            // Nếu thiếu câu hỏi mức 3, bổ sung từ mức 1 hoặc mức 2
            if (missing3 > 0) {
              console.log(`Thiếu ${missing3} câu hỏi mức 3, bổ sung từ mức 1 và mức 2`);
              const remainingLevel1 = level1Questions.filter(q => !selected1.includes(q));
              const remainingLevel2 = level2Questions.filter(q => !selected2.includes(q));
              const remainingQuestions = [...remainingLevel1, ...remainingLevel2];
              
              // Trộn ngẫu nhiên và lấy đủ số câu thiếu
              supplementalQuestions = [
                ...supplementalQuestions,
                ...getRandomQuestions(remainingQuestions, missing3)
              ];
            }
            
            // Gộp các câu hỏi đã chọn và câu hỏi bổ sung
            selectedQuestions = [...selected1, ...selected2, ...selected3, ...supplementalQuestions];
            
            // Trộn thứ tự các câu hỏi
            selectedQuestions.sort(() => 0.5 - Math.random());
            
            console.log(`Đã chọn: Mức 1: ${selected1.length}/${distribution.level1}, Mức 2: ${selected2.length}/${distribution.level2}, Mức 3: ${selected3.length}/${distribution.level3}`);
            console.log(`Đã bổ sung thêm: ${supplementalQuestions.length} câu hỏi`);
            
            if (selectedQuestions.length === 0) {
              throw new Error("Không tìm thấy câu hỏi nào phù hợp với chủ đề này.");
            }
          } else {
            // Nếu không có phân bố được chỉ định, lấy tất cả câu hỏi
            selectedQuestions = formattedAllQuestions;
          }
          
          setQuizData(selectedQuestions);
        } else {
          throw new Error("Không thể lấy dữ liệu bài kiểm tra từ server.");
        }
      } else {
        // Nếu không có topicId, tạo câu hỏi mới từ GenMini
      const quizRes = await axios.post(
        config.apiEndpoints.ragApi.multipleChoice,
        { question: topic }
      );
      console.log("quizRes.data.answer", quizRes.data.answer);
      const jsonString = quizRes.data.answer
    .replace(/```json\n?|```/g, "")  // Xóa ký hiệu code block JSON
    .replace(/(?<!\\)\\(?!\\)/g, "\\\\")  // Chỉ thay \ đơn thành \\ nhưng giữ nguyên \\ đã có
          .trim();

      console.log("jsonString", jsonString);

        try {
      const parsedQuizData = JSON.parse(jsonString);
      console.log("parsedQuizData", parsedQuizData);

      if (parsedQuizData && Array.isArray(parsedQuizData.questions)) {
        setQuizData(parsedQuizData.questions);
            // Reset retry count khi thành công
            setRetryCount(0);
          } else {
            throw new Error("Dữ liệu bài kiểm tra không hợp lệ.");
          }
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          
          // Nếu chưa vượt quá số lần thử lại tối đa (3 lần)
          if (retryAttempt < 2) {
            console.log(`Thử lại lần ${retryAttempt + 1} sau lỗi JSON`);
            setRetryCount(retryAttempt + 1);
            return fetchQuizData(retryAttempt + 1);
      } else {
            throw new Error(`Không thể xử lý dữ liệu JSON sau 3 lần thử: ${jsonError.message}`);
          }
        }
      }
    } catch (err) {
      setError(`Lỗi khi lấy bài kiểm tra: ${err.message}`);
    }
    setLoading(false);
  };

  // Gọi API khi component mount
  useEffect(() => {
    console.log("Topic received:", topic, "TopicId:", topicId, "Difficulty:", difficulty, "Distribution:", distribution);
    fetchQuizData();
  }, [topic, topicId, difficulty, distribution]);

  // Hàm để gọi API nhận xét
  const fetchFeedback = async () => {
    // Nếu đang hiển thị xem lại, ẩn đi trước khi hiển thị nhận xét
    if (viewReview) {
      setViewReview(false);
    }
    
    // Nếu đã có nhận xét, chỉ cần hiển thị
    if (feedback) {
      setShowFeedback(!showFeedback);
      return;
    }

    try {
      setLoadingFeedback(true);
      
      // Chuẩn bị dữ liệu để gửi đến API
      const feedbackData = {
        topic: topic,
        quizData: quizData,
        userAnswers: selectedOptions,
        score: `${score} / ${quizData.length}`
      };
      const textData = JSON.stringify(feedbackData);

      // Gọi API nhận xét
      const response = await axios.post(
        config.apiEndpoints.ragApi.quizFeedback,
        {question: textData},
        { timeout: 30000 } // Tăng timeout lên 30s vì API nhận xét có thể mất thời gian
      );
      
      // Lưu nhận xét vào state
      setFeedback(response.data.answer || "Không có nhận xét nào.");
      setShowFeedback(true);
      
    } catch (err) {
      setFeedback(`Lỗi khi lấy nhận xét: ${err.message}`);
      setShowFeedback(true);
    }
    setLoadingFeedback(false);
  };

  const handleNext = () => {
    // Lưu lại tùy chọn đã chọn cho câu hỏi hiện tại
    if (selectedOption !== null) {
      setSelectedOptions({
        ...selectedOptions,
        [currentQuestion]: selectedOption,
      });
    }
    
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      // Kiểm tra xem câu hỏi tiếp theo đã được chọn chưa
      setSelectedOption(selectedOptions[currentQuestion + 1] !== undefined ? selectedOptions[currentQuestion + 1] : null);
    } else {
      // Tính điểm trước khi hoàn thành bài kiểm tra
      calculateScore();
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Kiểm tra xem câu hỏi trước đó đã được chọn chưa
      setSelectedOption(selectedOptions[currentQuestion - 1] !== undefined ? selectedOptions[currentQuestion - 1] : null);
    }
  };

  // Tính điểm một lần duy nhất khi hoàn thành bài kiểm tra
  const calculateScore = () => {
    // Lưu tùy chọn cho câu hỏi hiện tại nếu đã chọn
    const updatedSelectedOptions = { ...selectedOptions };
    if (selectedOption !== null) {
      updatedSelectedOptions[currentQuestion] = selectedOption;
      setSelectedOptions(updatedSelectedOptions);
    }
    
    // Tính điểm dựa trên tất cả các câu đã trả lời
    let totalScore = 0;
    quizData.forEach((question, index) => {
      // Kiểm tra nếu câu trả lời đúng
      if (updatedSelectedOptions[index] === question.answer) {
        totalScore++;
      }
    });
    
    setScore(totalScore);
    return totalScore;
  };

  // Bắt đầu đếm thời gian khi ấn nút Sẵn sàng
  const startQuiz = () => {
    setIsReady(true);
    setTimerActive(true);
  };

  // Định dạng thời gian thành mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Xử lý đồng hồ đếm thời gian
  useEffect(() => {
    if (timerActive) {
      timerInterval.current = setInterval(() => {
        setTimer(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [timerActive]);

  // Dừng đồng hồ khi hoàn thành bài kiểm tra
  useEffect(() => {
    if (quizCompleted && timerActive) {
      setTimerActive(false);
    }
  }, [quizCompleted]);

  const handleSubmit = () => {
    // Lưu đáp án cho câu hỏi cuối cùng nếu có
    const updatedSelectedOptions = { ...selectedOptions };
    if (selectedOption !== null) {
      updatedSelectedOptions[currentQuestion] = selectedOption;
      setSelectedOptions(updatedSelectedOptions);
    }
    
    // Tính điểm trực tiếp
    let totalScore = 0;
    quizData.forEach((question, index) => {
      if (updatedSelectedOptions[index] === question.answer) {
        totalScore++;
      }
    });
    
    // Cập nhật điểm và trạng thái
    setScore(totalScore);
    setQuizCompleted(true);
    setTimerActive(false);
    setLoadingFeedback(true);

    // Đóng gói dữ liệu chi tiết của bài làm
    const quizAttemptData = {
      user_id: userId,
      topic: topic,
      topic_id: topicId || null,
      completed_at: new Date().toISOString(),
      time_taken: timer,
      total_questions: quizData.length,
      answered_questions: Object.keys(updatedSelectedOptions).length,
      score: totalScore,
      score_text: `${totalScore}/${quizData.length}`,
      questions: quizData.map((question, index) => ({
        question: question.question,
        options: question.options,
        correct_answer: question.answer,
        user_answer: updatedSelectedOptions[index] || null,
        is_correct: updatedSelectedOptions[index] === question.answer,
        difficulty: question.difficulty || "Không xác định",
        solution: question.solution || ""
      }))
    };
    
    // Gọi API feedback với điểm số mới tính
    const feedbackData = {
      topic: topic,
      quizData: quizData,
      userAnswers: updatedSelectedOptions,
      score: `${totalScore}/${quizData.length}`
    };
    
    // Đầu tiên, gọi API nhận xét
    axios.post(
      config.apiEndpoints.ragApi.quizFeedback,
      { question: JSON.stringify(feedbackData) },
      { timeout: 30000 } // Tăng timeout lên 30s vì API nhận xét có thể mất thời gian
    )
    .then(response => {
      const feedbackText = response.data.answer || "Không có nhận xét nào.";
      setFeedback(feedbackText);
      setShowFeedback(true);
      
      // Thêm nhận xét vào dữ liệu bài làm
      quizAttemptData.feedback = feedbackText;
      
      // Sau khi có nhận xét, lưu dữ liệu bài làm vào cơ sở dữ liệu
      return axios.post(
        `${config.apiEndpoints.quiz}/quiz-attempts/save`,
        quizAttemptData
      );
    })
    .then(saveResponse => {
      console.log("Đã lưu bài làm thành công:", saveResponse?.data);
    })
    .catch(err => {
      console.error("Lỗi khi xử lý hoặc lưu bài làm:", err);
      
      // Hiển thị lỗi chi tiết hơn để debug
      let errorMessage = "Lỗi không xác định";
      
      if (err.response) {
        // Server trả về response với status code ngoài phạm vi 2xx
        errorMessage = `Lỗi từ server: ${err.response.status} - ${err.response.data?.message || JSON.stringify(err.response.data)}`;
      } else if (err.request) {
        // Request được gửi nhưng không nhận được response
        errorMessage = "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng hoặc xem server đã khởi động chưa.";
      } else {
        // Lỗi khi thiết lập request
        errorMessage = `Lỗi: ${err.message}`;
      }
      
      setFeedback(`Lỗi khi lấy nhận xét: ${errorMessage}`);
      setShowFeedback(true);
      
      // Vẫn lưu dữ liệu vào database nhưng không có phần nhận xét
      console.log("Lưu dữ liệu bài làm mà không có nhận xét do lỗi API nhận xét");
      quizAttemptData.feedback = "Không thể lấy nhận xét do lỗi kết nối";
      
      // Thử lưu vào DB bất kể có lỗi nhận xét
      axios.post(
        `${config.apiEndpoints.quiz}/quiz-attempts/save`,
        quizAttemptData
      ).then(saveRes => {
        console.log("Đã lưu bài làm (không có nhận xét):", saveRes?.data);
      }).catch(saveErr => {
        console.error("Không thể lưu bài làm:", saveErr);
      });
    })
    .finally(() => {
      setLoadingFeedback(false);
    });
  };

  const toggleViewReview = () => {
    // Khi bật xem lại, ẩn nhận xét nếu đang hiển thị
    if (!viewReview) {
      setShowFeedback(false);
    }
    setViewReview(!viewReview);
    setReviewQuestionIndex(0); // Reset về câu hỏi đầu tiên khi bật/tắt chế độ xem lại
    setShowSolution(null); // Reset hiển thị lời giải
  };

  // Di chuyển đến câu hỏi tiếp theo trong chế độ xem lại
  const handleNextReview = () => {
    if (reviewQuestionIndex < quizData.length - 1) {
      setReviewQuestionIndex(reviewQuestionIndex + 1);
      setShowSolution(null); // Reset hiển thị lời giải khi chuyển câu hỏi
    }
  };

  // Di chuyển đến câu hỏi trước đó trong chế độ xem lại
  const handlePreviousReview = () => {
    if (reviewQuestionIndex > 0) {
      setReviewQuestionIndex(reviewQuestionIndex - 1);
      setShowSolution(null); // Reset hiển thị lời giải khi chuyển câu hỏi
    }
  };

  const handleShowSolution = (index) => {
    // Nếu đang hiển thị lời giải của câu này, ẩn đi
    if (showSolution === index) {
      setShowSolution(null);
    } else {
      // Ngược lại, hiển thị lời giải của câu được chọn
      setShowSolution(index);
    }
  };
  
  const handleRequestMoreQuestions = async () => {
    // Kiểm tra xem nhận xét đã tải xong chưa
    if (loadingFeedback) {
      alert("Vui lòng đợi nhận xét được tải xong trước khi làm thêm");
      return;
    }

    // Nếu là quiz từ chủ đề có sẵn (có topicId), chuyển về trang setup
    if (topicId) {
      try {
        // Trước khi chuyển đến trang setup, lấy thông tin số lượng câu hỏi thực tế
        const response = await axios.get(`${config.apiEndpoints.admin}/topics/${topicId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.question_set && response.data.question_set.questions) {
          const actualQuestionCount = response.data.question_set.questions.length;
          
          // Chuyển đến trang setup với số lượng câu hỏi thực tế
          navigate("/quiz-setup", {
            state: {
              topic: topic,
              topicId: topicId,
              questionCount: actualQuestionCount,
              fromQuiz: true
            }
          });
        } else {
          // Nếu không lấy được thông tin, vẫn chuyển đến với thông tin tối thiểu
          navigate("/quiz-setup", {
            state: {
              topic: topic,
              topicId: topicId,
              questionCount: quizData.length, // Dùng số lượng câu hỏi hiện tại
              fromQuiz: true
            }
          });
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin chủ đề:", err);
        // Vẫn chuyển đến trang setup với thông tin tối thiểu
        navigate("/quiz-setup", {
          state: {
            topic: topic,
            topicId: topicId,
            questionCount: quizData.length, // Dùng số lượng câu hỏi hiện tại
            fromQuiz: true
          }
        });
      }
      return;
    }

    // Nếu là quiz thông thường (không có topicId), gọi API để sinh câu hỏi mới
    try {
      setLoading(true);
      setError(null);
      
      // Chuẩn bị dữ liệu về bài làm của học sinh
      const studentPerformance = {
        quiz: quizData.map((question, index) => ({
          ...question,
          studentAnswer: selectedOptions[index] || null,
          isCorrect: selectedOptions[index] === question.answer
        })),
        score: score,
        totalQuestions: quizData.length,
        timeTaken: timer,
        feedback: feedback
      };
      
      console.log("Gửi dữ liệu phân tích:", studentPerformance);
      
      // Gọi API Adaptive_Questions với context là bài làm cũ
      const quizRes = await axios.post(
        "http://127.0.0.1:8000/Adaptive_Questions",
        { 
          question: topic,
          previousPerformance: JSON.stringify(studentPerformance)
        }
      );
      
      // Xử lý response 
      console.log("quizRes.data.answer", quizRes.data.answer);
      const jsonString = quizRes.data.answer
        .replace(/```json\n?|```/g, "")
        .replace(/(?<!\\)\\(?!\\)/g, "\\\\")
        .trim();

      console.log("jsonString", jsonString);

      try {
        const parsedQuizData = JSON.parse(jsonString);
        console.log("parsedQuizData", parsedQuizData);

        if (parsedQuizData && Array.isArray(parsedQuizData.questions)) {
          // Reset states và cập nhật dữ liệu mới
          setQuizData(parsedQuizData.questions);
          setCurrentQuestion(0);
          setSelectedOption(null);
          setScore(0);
          setQuizCompleted(false);
          setSelectedOptions({});
          setViewReview(false);
          setShowSolution(null);
          setReviewQuestionIndex(0);
          setFeedback(null);
          setShowFeedback(false);
          
          // Reset timer và isReady để học sinh phải nhấn "Bắt đầu" lại
          setTimer(0);
          setIsReady(false);
          setRetryCount(0);
        } else {
          throw new Error("Dữ liệu bài kiểm tra không hợp lệ.");
        }
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        
        if (retryCount < 2) {
          console.log(`Thử lại lần ${retryCount + 1} sau lỗi JSON`);
          setRetryCount(prevCount => prevCount + 1);
          return handleRequestMoreQuestions();
        } else {
          throw new Error(`Không thể xử lý dữ liệu JSON sau 3 lần thử: ${jsonError.message}`);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tạo bài mới:", err);
      setError(`Lỗi khi tạo bài kiểm tra mới: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị từng câu một trong chế độ xem lại
  const renderReviewQuestion = () => {
    const question = quizData[reviewQuestionIndex];
    const selectedAnswer = selectedOptions[reviewQuestionIndex];
    const isCorrect = selectedAnswer !== undefined && question.answer === selectedAnswer;

    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold">Xem lại bài kiểm tra</h2>
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <h3 className="font-semibold mr-3">
            Câu {reviewQuestionIndex + 1} / {quizData.length}: 
            </h3>
            {question.difficulty && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                question.difficulty.includes("1") ? "bg-green-100 text-green-800" :
                question.difficulty.includes("2") ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {question.difficulty}
              </span>
            )}
          </div>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {question.question}
            </ReactMarkdown>
          <div>
            {Object.entries(question.options).map(([key, option]) => {
              const isSelected = selectedAnswer === key;
              const isAnswerCorrect = question.answer === key;
              
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
                  className={`p-2 border rounded ${bgColorClass}`}
                >
                  {key}. <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</ReactMarkdown>
                </div>
              );
            })}
          </div>
          
          <div className="mt-2">
            {selectedAnswer === undefined && (
              <div className="p-2 bg-yellow-100 border rounded">
                <span className="font-semibold">Chưa chọn đáp án</span>
              </div>
            )}
          </div>
          
          <button
            className="mt-2 p-1 bg-blue-500 text-white rounded"
            onClick={() => handleShowSolution(reviewQuestionIndex)}
          >
            {showSolution === reviewQuestionIndex ? "Ẩn lời giải" : "Xem lời giải"}
          </button>
          
          {showSolution === reviewQuestionIndex && (
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
              {reviewQuestionIndex + 1} / {quizData.length}
            </span>
            <button 
              className="p-2 bg-blue-500 text-white rounded" 
              onClick={handleNextReview}
              disabled={reviewQuestionIndex === quizData.length - 1}
            >
              Bài sau
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị phần nhận xét
  const renderFeedback = () => {
    if (!showFeedback) return null;
    
    if (loadingFeedback) {
      return (
        <div className="mt-4 p-4 border rounded bg-blue-50">
          <h3 className="text-xl font-bold mb-2">Nhận xét về bài làm</h3>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-center">Đang phân tích bài làm của bạn... Quá trình này có thể mất vài giây, vui lòng đợi.</p>
            
            {/* Skeleton loaders cho phần nội dung nhận xét */}
            <div className="w-full space-y-2 mt-4">
              <div className="h-4 bg-blue-100 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-blue-100 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-blue-100 rounded animate-pulse w-4/6"></div>
            </div>
          </div>
        </div>
      );
    }
    
    if (feedback) {
      return (
        <div className="mt-4 p-4 border rounded bg-blue-50">
          <h3 className="text-xl font-bold mb-2">Nhận xét về bài làm</h3>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {feedback}
          </ReactMarkdown>
        </div>
      );
    }
    
    return null;
  };

  // Hiển thị nút nhận xét có trạng thái đang tải
  const renderFeedbackButton = () => {
    return (
      <button
        className={`p-2 ${loadingFeedback ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-500'} text-white rounded flex items-center justify-center min-w-[120px]`}
        onClick={fetchFeedback}
        disabled={loadingFeedback}
      >
        {loadingFeedback ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            <span>Đang tải...</span>
          </>
        ) : (showFeedback ? "Ẩn nhận xét" : "Nhận xét")}
      </button>
    );
  };

  if (loading) return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Đang tải câu hỏi...</h2>
      <p className="text-gray-500 text-center max-w-md">
        Hệ thống đang chuẩn bị bài kiểm tra phù hợp với trình độ của bạn. Vui lòng đợi trong giây lát.
      </p>
      
      <div className="mt-8 w-full max-w-md space-y-3">
        {/* Skeleton loaders for questions */}
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded animate-pulse mb-4"></div>
        
        {/* Skeleton loaders for options */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" 
               style={{animationDelay: `${i * 0.1}s`}}></div>
        ))}
      </div>
    </div>
  );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!quizData) return null;

  // Hiển thị màn hình sẵn sàng nếu chưa bắt đầu
  if (!isReady) {
    // Tính số lượng câu hỏi theo từng độ khó
    const easyQuestions = quizData.filter(q => 
      q.difficulty.includes("1") || 
      q.difficulty.toLowerCase().includes("dễ") || 
      q.difficulty.toLowerCase().includes("easy") ||
      q.difficulty.toLowerCase().includes("cơ bản")
    ).length;
    
    const mediumQuestions = quizData.filter(q => 
      q.difficulty.includes("2") || 
      q.difficulty.toLowerCase().includes("trung bình") ||
      q.difficulty.toLowerCase().includes("medium")
    ).length;
    
    const hardQuestions = quizData.filter(q => 
      q.difficulty.includes("3") || 
      q.difficulty.toLowerCase().includes("khó") || 
      q.difficulty.toLowerCase().includes("hard") ||
      q.difficulty.toLowerCase().includes("nâng cao")
    ).length;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-2xl mx-auto">
        <div className="w-full bg-white border shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
            <h2 className="text-2xl md:text-3xl font-bold text-center">{topic}</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-4 text-center">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-lg font-medium mb-3">Bài kiểm tra gồm {quizData.length} câu hỏi</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col items-center bg-green-100 text-green-700 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span className="font-medium">Dễ</span>
                    </div>
                    <span className="text-lg font-bold">{easyQuestions} câu</span>
                  </div>
                  
                  <div className="flex flex-col items-center bg-yellow-100 text-yellow-700 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="font-medium">Trung bình</span>
                    </div>
                    <span className="text-lg font-bold">{mediumQuestions} câu</span>
                  </div>
                  
                  <div className="flex flex-col items-center bg-red-100 text-red-700 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      <span className="font-medium">Khó</span>
                    </div>
                    <span className="text-lg font-bold">{hardQuestions} câu</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-gray-600">Ấn nút Bắt đầu khi bạn đã sẵn sàng. Đồng hồ sẽ bắt đầu tính giờ.</p>
              </div>
              
              <button 
                className="w-full md:w-2/3 mx-auto p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold text-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                onClick={startQuiz}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bắt đầu làm bài
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tính số câu đã trả lời
  const answeredCount = Object.keys(selectedOptions).length;

  if (quizCompleted) {
    // Tính số câu đúng
    const correctCount = Object.keys(selectedOptions).filter(
      idx => quizData[idx].answer === selectedOptions[idx]
    ).length;
    
    // Tính phần trăm đúng
    const percentageCorrect = Math.round((correctCount / quizData.length) * 100);
    
    // Chọn thông báo dựa trên kết quả
    let resultMessage = "";
    let resultColor = "";
    
    if (percentageCorrect >= 90) {
      resultMessage = "Xuất sắc!";
      resultColor = "text-green-600";
    } else if (percentageCorrect >= 70) {
      resultMessage = "Rất tốt!";
      resultColor = "text-green-500";
    } else if (percentageCorrect >= 50) {
      resultMessage = "Khá tốt!";
      resultColor = "text-yellow-500";
    } else {
      resultMessage = "Cần cố gắng thêm!";
      resultColor = "text-red-500";
    }
    
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">Kết quả bài kiểm tra</h2>
            <p className="text-lg opacity-90">{topic}</p>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-around items-center mb-8">
              {/* Bộ đếm kết quả */}
              <div className="flex flex-col items-center mb-6 md:mb-0">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#eee"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={percentageCorrect >= 70 ? "#48bb78" : percentageCorrect >= 40 ? "#ecc94b" : "#f56565"}
                      strokeWidth="3"
                      strokeDasharray={`${percentageCorrect}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${resultColor}`}>{percentageCorrect}%</span>
                  </div>
                </div>
                <p className={`mt-2 text-xl font-bold ${resultColor}`}>{resultMessage}</p>
              </div>
              
              {/* Thống kê câu trả lời */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Thống kê chi tiết</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số câu hỏi:</span>
                    <span className="font-bold">{quizData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số câu đúng:</span>
                    <span className="font-bold text-green-600">{correctCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số câu sai:</span>
                    <span className="font-bold text-red-600">{quizData.length - correctCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số câu đã trả lời:</span>
                    <span className="font-bold">{answeredCount} / {quizData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Thời gian làm bài:</span>
                    <span className="font-bold">{formatTime(timer)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mt-6 border-t pt-6">
            <button
                className={`px-4 py-2 ${loadingFeedback ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg flex items-center justify-center min-w-[130px] shadow-md transition-all duration-300`}
              onClick={handleRequestMoreQuestions}
                disabled={loadingFeedback}
              >
                {loadingFeedback ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
              Làm thêm
                  </>
                )}
            </button>
            
            <button
                className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center min-w-[130px] shadow-md transition-all duration-300`}
              onClick={toggleViewReview}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              {viewReview ? "Ẩn xem lại" : "Xem lại"}
            </button>
            
            <button
                className={`px-4 py-2 ${loadingFeedback ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded-lg flex items-center justify-center min-w-[130px] shadow-md transition-all duration-300`}
              onClick={fetchFeedback}
              disabled={loadingFeedback}
            >
                {loadingFeedback ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {showFeedback ? "Ẩn nhận xét" : "Nhận xét"}
                  </>
                )}
            </button>
            </div>
          </div>
        </div>
        
        {renderFeedback()}
        {viewReview && renderReviewQuestion()}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button className="p-2 bg-gray-500 text-white rounded" onClick={() => navigate(-1)}>Trở về</button>
        <div className="bg-blue-100 text-blue-800 py-2 px-4 rounded-full font-bold">
          Thời gian: {formatTime(timer)}
        </div>
      </div>
      
      <div className="flex items-center mb-2">
        <h2 className="text-xl font-bold mr-3">
        Câu {currentQuestion + 1}: 
        </h2>
        {quizData[currentQuestion].difficulty && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            quizData[currentQuestion].difficulty.includes("1") ? "bg-green-100 text-green-800" :
            quizData[currentQuestion].difficulty.includes("2") ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }`}>
            {quizData[currentQuestion].difficulty}
          </span>
        )}
      </div>
      
      <div className="mt-2">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {quizData[currentQuestion].question}
        </ReactMarkdown>
      </div>
      <div className="mt-2">
        {Object.entries(quizData[currentQuestion].options).map(([key, option]) => (
          <button
            key={key}
            className={`block w-full p-2 mt-1 border rounded ${
              selectedOption === key ? "bg-blue-300" : "bg-white"
            }`}
            onClick={() => setSelectedOption(key)}
          >
            {key}. <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</ReactMarkdown>
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button className="p-2 bg-gray-500 text-white rounded" onClick={handlePrevious} disabled={currentQuestion === 0}>
          Câu trước
        </button>
        <button className="p-2 bg-red-500 text-white rounded" onClick={handleSubmit}>
          Nộp bài
        </button>
        <button className="p-2 bg-blue-500 text-white rounded" onClick={handleNext}>
          {currentQuestion < quizData.length - 1 ? "Câu sau" : "Hoàn thành"}
        </button>
      </div>
    </div>
  );
}