import { useState, useEffect } from "react";
import axios from 'axios';
import { config } from '../config';

function GradeMathPaperPage() {
  const [files, setFiles] = useState([]); // Các file ảnh bài làm học sinh
  const [answerKeyType, setAnswerKeyType] = useState("text"); // Loại đáp án: "text" hoặc "image"
  const [answerKeyFile, setAnswerKeyFile] = useState(null); // File ảnh đáp án
  const [answerKeyText, setAnswerKeyText] = useState(""); // Text đáp án
  const [isLoading, setIsLoading] = useState(false); // Trạng thái đang xử lý
  const [error, setError] = useState(null); // Thông báo lỗi
  const [results, setResults] = useState([]); // Kết quả từ API
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]); // URL preview ảnh
  const [imagePaths, setImagePaths] = useState([]); // Đường dẫn ảnh sau khi upload
  const [currentIndex, setCurrentIndex] = useState(0); // Chỉ số ảnh đang xử lý
  const [answerKeyPath, setAnswerKeyPath] = useState(""); // Đường dẫn ảnh đáp án
  const [selectedDetail, setSelectedDetail] = useState(null); // Chi tiết được chọn để xem
  const [showDetailModal, setShowDetailModal] = useState(false); // Hiển thị modal chi tiết
  const [editingResult, setEditingResult] = useState(null); // Kết quả đang được chỉnh sửa
  const [showEditModal, setShowEditModal] = useState(false); // Hiển thị modal chỉnh sửa
  const [isExporting, setIsExporting] = useState(false); // Trạng thái đang xuất Excel
  const [editForm, setEditForm] = useState({ // Form dữ liệu chỉnh sửa
    studentName: "",
    studentClass: "",
    totalScore: ""
  });

  // Xử lý khi người dùng chọn ảnh bài làm
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      
      // Tạo URL preview cho các ảnh được chọn
      const newPreviewUrls = selectedFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));
      
      // Xóa các URL cũ để tránh rò rỉ bộ nhớ
      imagePreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
      
      setImagePreviewUrls(newPreviewUrls);
    }
  };

  // Xử lý khi người dùng chọn ảnh đáp án
  const handleAnswerKeyFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnswerKeyFile(file);
    }
  };

  // Xử lý khi người dùng nhập text đáp án
  const handleAnswerKeyTextChange = (e) => {
    setAnswerKeyText(e.target.value);
  };

  // Xử lý khi thay đổi loại đáp án
  const handleAnswerTypeChange = (e) => {
    setAnswerKeyType(e.target.value);
  };

  // Gọi API chấm điểm cho một ảnh với đường dẫn
  const gradeImage = async (imagePath, answerKey) => {
    try {
      console.log(`Đang chấm điểm ảnh: ${imagePath}`);
      console.log(`keykey : ${answerKey}`)
      // Chuẩn bị dữ liệu để gửi đến API theo định dạng bạn đã chỉ định
      const postData = {
        student_image_path: imagePath,
        answer_key: answerKey
      };

      // Gọi API bằng fetch
      
    //   const response = await fetch("http://127.0.0.1:8000/grade_math_paper", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(postData)
    //   });
        const response = await axios.post(config.apiEndpoints.ragApi.gradeMathPaper, 
            postData
        );
        console.log(`Đang chấm điểm ảnh: ${imagePath}`);
    //   if (!response.ok) {
    //     throw new Error(`Lỗi API: ${response.status}`);
    //   }

      // Xử lý kết quả
      console.log(response)

      const data = response.data.answer
      
      // Check if the answer contains error message
      if (data && data.startsWith('❌')) {
        throw new Error(data);
      }
      
      return data
      
      
    } catch (error) {
      console.error("Lỗi khi gọi API chấm điểm:", error);
      // Extract the error message from axios error response if available
      const errorMessage = error.response?.data?.error || error.message || "Không xác định";
      throw new Error(errorMessage);
    }
  };

  // Hàm xử lý dữ liệu kết quả để trích xuất thông tin
  const parseGradeResult = (resultText) => {
    try {
      // Mặc định nếu không tìm thấy
      let studentName = "Không xác định";
      let studentClass = "Không xác định";
      let totalScore = "Không xác định";
      
      // Trích xuất họ tên
      const nameMatch = resultText.match(/-Họ và tên:\s*(.+?)(?:\r|\n|$)/);
      if (nameMatch && nameMatch[1]) {
        studentName = nameMatch[1].trim();
      }
      
      // Trích xuất lớp
      const classMatch = resultText.match(/-Lớp:\s*(.+?)(?:\r|\n|$)/);
      if (classMatch && classMatch[1]) {
        studentClass = classMatch[1].trim();
      }
      
      // Trích xuất điểm tổng
      const scoreMatch = resultText.match(/TỔNG ĐIỂM:\s*(.+?)(?:\r|\n|$)/);
      if (scoreMatch && scoreMatch[1]) {
        totalScore = scoreMatch[1].trim();
      }
      
      return {
        studentName,
        studentClass,
        totalScore,
        fullResult: resultText
      };
    } catch (error) {
      console.error("Lỗi khi xử lý kết quả:", error);
      return {
        studentName: "Lỗi xử lý",
        studentClass: "Lỗi xử lý",
        totalScore: "Lỗi xử lý",
        fullResult: resultText
      };
    }
  };

  // Xử lý khi người dùng nhấn nút xem chi tiết
  const handleViewDetail = (result) => {
    // Create a display URL for the image
    const resultWithImageUrl = {
      ...result,
      imageUrl: result.path ? `${config.RAG_API_URL}/static/${result.path.replace(/^uploads[\/\\]/, '')}` : null
    };
    
    console.log("Image URL for detail view:", resultWithImageUrl.imageUrl);
    
    setSelectedDetail(resultWithImageUrl);
    setShowDetailModal(true);
  };

  // Xử lý khi người dùng đóng modal chi tiết
  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedDetail(null);
  };

  // Xử lý khi người dùng nhấn nút chỉnh sửa
  const handleEditClick = (result, index) => {
    setEditingResult({ ...result, index });
    setEditForm({
      studentName: result.parsed.studentName,
      studentClass: result.parsed.studentClass,
      totalScore: result.parsed.totalScore
    });
    setShowEditModal(true);
  };

  // Xử lý khi người dùng thay đổi giá trị trong form chỉnh sửa
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý khi người dùng lưu thông tin chỉnh sửa
  const handleSaveEdit = () => {
    const updatedResults = [...results];
    const index = editingResult.index;
    
    // Cập nhật dữ liệu đã parse
    updatedResults[index] = {
      ...updatedResults[index],
      parsed: {
        ...updatedResults[index].parsed,
        studentName: editForm.studentName,
        studentClass: editForm.studentClass,
        totalScore: editForm.totalScore
      }
    };
    
    // Cập nhật nội dung văn bản đầy đủ
    let updatedAnswer = updatedResults[index].answer;
    updatedAnswer = updatedAnswer.replace(
      /-Họ và tên:.*(\r|\n|$)/,
      `-Họ và tên: ${editForm.studentName}$1`
    );
    updatedAnswer = updatedAnswer.replace(
      /-Lớp:.*(\r|\n|$)/,
      `-Lớp: ${editForm.studentClass}$1`
    );
    updatedAnswer = updatedAnswer.replace(
      /TỔNG ĐIỂM:.*(\r|\n|$)/,
      `TỔNG ĐIỂM: ${editForm.totalScore}$1`
    );
    
    updatedResults[index].answer = updatedAnswer;
    updatedResults[index].parsed.fullResult = updatedAnswer;
    
    // Cập nhật state
    setResults(updatedResults);
    setShowEditModal(false);
    setEditingResult(null);
  };

  // Xử lý khi người dùng hủy chỉnh sửa
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingResult(null);
  };

  // Xử lý khi người dùng nhấn nút xóa dòng
  const handleDeleteRow = async (index, imagePath) => {
    // Xác nhận xóa
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài làm này không?')) {
      return;
    }
    
    try {
      // Nếu có đường dẫn ảnh, gọi API để xóa ảnh từ server
      if (imagePath) {
        console.log('Đang xóa ảnh:', imagePath);
        await axios.post(config.apiEndpoints.ragApi.deleteImage, { file_path: imagePath });
        console.log('Đã xóa ảnh:', imagePath);
      } else {
        console.warn('Không có đường dẫn ảnh để xóa');
      }
      
      // Xóa dòng khỏi danh sách kết quả
      const updatedResults = results.filter((_, i) => i !== index);
      setResults(updatedResults);
    } catch (error) {
      console.error('Lỗi khi xóa dòng:', error);
      setError('Không thể xóa dòng. Vui lòng thử lại sau: ' + error.message);
    }
  };

  // Hiển thị thông báo trạng thái
  const StatusMessage = ({ message, type = 'info' }) => {
    const bgColor = {
      info: 'bg-blue-50 text-blue-700',
      success: 'bg-green-50 text-green-700',
      error: 'bg-red-50 text-red-700',
      warning: 'bg-yellow-50 text-yellow-700'
    }[type];

    return (
      <div className={`mb-6 p-4 ${bgColor} rounded-md flex items-center`}>
        {type === 'info' && (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {type === 'success' && (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {type === 'warning' && (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    );
  };

  // Xử lý khi người dùng nhấn nút chấm điểm
  const handleGradeImages = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (files.length === 0) {
      setError("Vui lòng chọn ít nhất một ảnh bài làm");
      return;
    }

    if (answerKeyType === "text" && !answerKeyText.trim()) {
      setError("Vui lòng nhập đáp án");
      return;
    }

    if (answerKeyType === "image" && !answerKeyFile) {
      setError("Vui lòng chọn ảnh đáp án");
      return;
    }

    // Kiểm tra xem đã đang chấm bài chưa (để tránh nhấn nhiều lần)
    if (isLoading) {
      return;
    }

    // Reset các state liên quan đến lô ảnh mới
    setError(null);
    setCurrentIndex(0);
    setImagePaths([]); // Reset imagePaths trước khi upload mới

    try {
      // Hiển thị trạng thái tải lên
      setIsLoading(true);
      setError("Đang tải ảnh lên server. Vui lòng đợi...");

      // Upload tất cả ảnh trước
      const uploadSuccess = await uploadAllFiles();
      if (!uploadSuccess) {
        setError("Lỗi khi tải file lên server. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }

      // Thêm delay đảm bảo tất cả file đã được ghi đầy đủ vào server
      setError("Đang chuẩn bị chấm điểm...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      setError(null);

      // Bắt đầu quy trình chấm điểm ảnh đầu tiên
      if (imagePaths.length > 0) {
        await processNextImage();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý ảnh:", error);
      setError("Có lỗi xảy ra: " + error.message);
      setIsLoading(false);
    }
  };

  const uploadAllFiles = async () => {
    try {
      // Upload các file ảnh bài làm
      const paths = [];
      
      // Hiển thị thông tin về số lượng file cần tải lên
      setError(`Đang tải lên ${files.length} ảnh bài làm...`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setError(`Đang tải lên ảnh ${i+1}/${files.length}: ${file.name}`);
        
        try {
          const path = await uploadFileAndGetPath(file);
          
          // Verify the path is valid
          if (!path) {
            throw new Error(`Không nhận được đường dẫn hợp lệ cho file ${file.name}`);
          }
          
          // Thêm thông tin vào mảng paths
          paths.push({
            file: file,
            path: path,
            preview: imagePreviewUrls.find(img => img.name === file.name)?.url
          });
          
          // Small delay between uploads to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (uploadError) {
          console.error(`Lỗi khi tải lên ảnh ${file.name}:`, uploadError);
          throw new Error(`Lỗi khi tải lên ảnh ${file.name}: ${uploadError.message}`);
        }
      }
      
      // Cập nhật state imagePaths với tất cả đường dẫn mới
      setImagePaths(paths);
      console.log("Đã upload tất cả ảnh:", paths);
      
      // Upload file đáp án nếu có
      if (answerKeyType === "image" && answerKeyFile) {
        setError(`Đang tải lên ảnh đáp án: ${answerKeyFile.name}`);
        try {
          const path = await uploadFileAndGetPath(answerKeyFile);
          if (!path) {
            throw new Error("Không nhận được đường dẫn hợp lệ cho file đáp án");
          }
          setAnswerKeyPath(path);
        } catch (answerKeyError) {
          console.error("Lỗi khi tải lên ảnh đáp án:", answerKeyError);
          throw new Error(`Lỗi khi tải lên ảnh đáp án: ${answerKeyError.message}`);
        }
      }
      
      return paths.length > 0; // Trả về true nếu có ít nhất một đường dẫn hợp lệ
    } catch (error) {
      console.error("Lỗi trong quá trình upload:", error);
      setError(error.message);
      return false;
    }
  };

  const processNextImage = async () => {
    if (currentIndex >= imagePaths.length) {
      setIsLoading(false);
      return;
    }

    const currentImage = imagePaths[currentIndex];
    console.log(`Đang xử lý ảnh ${currentIndex + 1}/${imagePaths.length}:`, currentImage);

    try {
      // Add a more substantial delay to ensure the file is fully written and available on the server
      setError(`Đang chấm điểm ảnh ${currentIndex + 1}/${imagePaths.length}: ${currentImage.file.name}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify path before calling API
      console.log(`Bắt đầu chấm điểm ảnh: ${currentImage.path}`);
      
      // Gọi API để chấm điểm cho ảnh hiện tại
      const answer = await gradeImage(currentImage.path, answerKeyPath);
      
      // Parse kết quả để trích xuất thông tin
      const parsedResult = parseGradeResult(answer);
      
      // Thêm kết quả vào danh sách
      const newResult = {
        fileName: currentImage.file.name,
        answer: answer,
        preview: currentImage.preview,
        parsed: parsedResult,
        path: currentImage.path // Lưu đường dẫn ảnh để có thể xóa sau này
      };
      
      setResults(prev => [...prev, newResult]);
      setError(null);
      
      // Chờ một chút trước khi xử lý ảnh tiếp theo để tránh quá tải API
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 800);
      
    } catch (error) {
      console.error(`Lỗi khi xử lý ảnh ${currentIndex + 1}:`, error);
      setError(`Lỗi khi chấm điểm ảnh ${currentImage.file.name}: ${error.message}`);
      // Vẫn tiếp tục với ảnh tiếp theo
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 800);
    }
  };

  // Theo dõi khi currentIndex thay đổi để xử lý ảnh tiếp theo
  useEffect(() => {
    let mounted = true;

    // Hàm để xử lý ảnh tiếp theo một cách an toàn
    const handleNextImage = async () => {
      if (!mounted || !isLoading || currentIndex >= imagePaths.length) return;
      
      try {
        await processNextImage();
      } catch (error) {
        console.error("Lỗi trong useEffect khi xử lý ảnh:", error);
        if (mounted) {
          setError("Lỗi xử lý: " + error.message);
        }
      }
    };

    // Nếu đang tải và có ảnh cần xử lý, xử lý ảnh tiếp theo
    if (isLoading && currentIndex < imagePaths.length) {
      handleNextImage();
    } else if (currentIndex >= imagePaths.length && imagePaths.length > 0) {
      // Đã xử lý xong tất cả các ảnh
      if (mounted) {
        setIsLoading(false);
        
        // Reset tất cả state liên quan đến ảnh và đường dẫn
        setFiles([]);
        setImagePaths([]); // Reset mảng đường dẫn
        setCurrentIndex(0);
        
        // Xóa các URL preview để tránh rò rỉ bộ nhớ
        imagePreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
        setImagePreviewUrls([]);
        
        // Làm trống các phần tử input
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          // Chỉ reset input chọn bài làm, không reset input chọn đáp án
          if (input.getAttribute('multiple') !== null) {
            input.value = '';
          }
        });
      }
    }

    // Hàm cleanup khi component unmount hoặc deps thay đổi
    return () => {
      mounted = false;
    };
  }, [currentIndex, imagePaths.length, isLoading]);

  // Xóa tất cả ảnh và reset form
  const handleClearAll = () => {
    // Xác nhận trước khi xóa tất cả
    if (results.length > 0 && !window.confirm('Bạn có chắc muốn xóa tất cả kết quả đã chấm?')) {
      return;
    }
    
    // Xóa các URL preview để tránh rò rỉ bộ nhớ
    imagePreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
    
    // Reset tất cả state
    setFiles([]);
    setAnswerKeyFile(null);
    setAnswerKeyText("");
    setImagePreviewUrls([]);
    setResults([]);
    setError(null);
    setImagePaths([]);
    setCurrentIndex(0);
    setAnswerKeyPath("");
    
    // Reset các input file
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = '';
    });
  };
  
  // Hủy quá trình chấm điểm
  const handleCancel = () => {
    setIsLoading(false);
    // Dừng ở ảnh hiện tại, không xử lý tiếp
    setCurrentIndex(imagePaths.length);
  };

  // Mô phỏng việc tải file lên server và lấy đường dẫn
  const uploadFileAndGetPath = async (file) => {
    // Số lần thử lại tối đa
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        console.log(`Đang tải file: ${file.name} (lần thử ${retryCount + 1}/${maxRetries})`);
        
        const response = await axios.post(config.apiEndpoints.ragApi.uploadImage, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data && response.data.success) {
          const filePath = response.data.file_path;
          console.log(`Tải lên thành công: ${file.name} -> ${filePath}`);
          
          // Kiểm tra đường dẫn trả về có hợp lệ không
          if (!filePath || filePath.trim() === '') {
            throw new Error("Server trả về đường dẫn rỗng");
          }
          
          // Thêm kiểm tra xác nhận file đã tồn tại
          try {
            // Gọi API kiểm tra file tồn tại
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return filePath;
          } catch (verifyError) {
            console.error("Lỗi khi xác minh file:", verifyError);
            throw new Error("Không thể xác minh file trên server");
          }
        } else {
          throw new Error(response.data.error || "Lỗi không xác định khi tải file lên");
        }
      } catch (error) {
        console.error(`Lỗi lần ${retryCount + 1}/${maxRetries} khi tải file ${file.name}:`, error);
        lastError = error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Tăng thời gian chờ giữa các lần thử
          const delayMs = 1000 * retryCount; // 1s, 2s, 3s,...
          console.log(`Đợi ${delayMs/1000}s trước khi thử lại...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // Nếu tất cả các lần thử đều thất bại
    console.error(`Đã thử ${maxRetries} lần nhưng không thành công:`, lastError);
    throw lastError || new Error("Không thể tải file lên sau nhiều lần thử");
  };

  // Thêm hàm xử lý xuất Excel vào đây
  const handleExportExcel = async () => {
    if (results.length === 0) {
      setError("Không có dữ liệu để xuất Excel");
      return;
    }
    
    try {
      setIsExporting(true);
      setError("Đang chuẩn bị xuất file Excel...");
      
      // Chuẩn bị dữ liệu để gửi
      const exportData = results.map(result => {
        // Đảm bảo dữ liệu hợp lệ bằng cách kiểm tra từng trường
        return {
          studentName: result.parsed?.studentName || "Không xác định",
          studentClass: result.parsed?.studentClass || "Không xác định",
          totalScore: result.parsed?.totalScore || "0",
          fullResult: result.parsed?.fullResult || result.answer || "Không có dữ liệu",
          imagePath: result.path || ""
        };
      });
      
      console.log(`Chuẩn bị xuất ${exportData.length} bản ghi`);
      
      // Gọi API xuất Excel
      const response = await axios.post(
        config.apiEndpoints.ragApi.exportExcel, 
        { results: exportData },
        { 
          responseType: 'blob',  // Quan trọng để nhận file
          timeout: 30000  // Tăng timeout lên 30 giây
        }
      );
      
      // Kiểm tra response
      if (response.status !== 200) {
        throw new Error(`Lỗi từ server: ${response.status}`);
      }
      
      if (!response.data || response.data.size === 0) {
        throw new Error("Nhận được file rỗng từ server");
      }
      
      // Tạo URL và link tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ket_qua_cham_diem_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      
      // Kích hoạt tải xuống
      link.click();
      
      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      link.remove();
      
      setError("Xuất file Excel thành công!");
      
      // Tự động xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        if (error === "Xuất file Excel thành công!") {
          setError(null);
        }
      }, 3000);
      
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      setError("Lỗi khi xuất file Excel: " + (error.message || "Không xác định"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Hệ thống chấm điểm bài tập toán
          </h1>

          {/* Hiển thị thông báo trạng thái */}
          {error && <StatusMessage message={error} type={error.includes("Lỗi") ? "error" : "info"} />}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Phần tải lên ảnh bài làm */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-4">Bài làm của học sinh</h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Chọn ảnh bài làm (có thể chọn nhiều ảnh)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept="image/*"
                  multiple
                  disabled={isLoading}
                />
              </div>

              {/* Hiển thị preview các ảnh đã chọn */}
              {imagePreviewUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Đã chọn {imagePreviewUrls.length} ảnh
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviewUrls.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img.url}
                          alt={`Preview ${index}`}
                          className="h-24 w-full object-cover rounded"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                          {img.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phần đáp án */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-4">Đáp án</h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Chọn loại đáp án</label>
                <select
                  value={answerKeyType}
                  onChange={handleAnswerTypeChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="text">Đáp án dạng text</option>
                  <option value="image">Đáp án dạng ảnh</option>
                </select>
              </div>

              {answerKeyType === "text" ? (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Nhập đáp án</label>
                  <textarea
                    value={answerKeyText}
                    onChange={handleAnswerKeyTextChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Nhập đáp án tại đây"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Chọn ảnh đáp án</label>
                  <input
                    type="file"
                    onChange={handleAnswerKeyFileChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept="image/*"
                    disabled={isLoading}
                  />
                  {answerKeyFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Đã chọn: {answerKeyFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nút chức năng */}
          <div className="mt-6 flex gap-4">
            {!isLoading ? (
              <>
                <button
                  onClick={handleGradeImages}
                  className={`flex-1 p-3 ${files.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'} text-white rounded-md font-medium`}
                  disabled={files.length === 0 || isLoading}
                >
                  Chấm điểm các bài làm
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium"
                  disabled={isLoading}
                >
                  Xóa tất cả
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                >
                  Dừng lại
                </button>
                <div className="p-3 text-gray-500 rounded-md font-medium">
                  Đang chấm bài {currentIndex + 1}/{imagePaths.length}
                </div>
              </>
            )}
          </div>

          {/* Trạng thái đang xử lý và tiến trình */}
          {isLoading && (
            <div className="mt-6 bg-blue-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-700">
                  Đang xử lý ảnh {currentIndex + 1}/{imagePaths.length}
                </span>
                <span className="text-sm text-blue-600">
                  {Math.round((currentIndex / imagePaths.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(currentIndex / imagePaths.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Kết quả chấm điểm dạng bảng */}
          {results.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                Kết quả chấm điểm ({results.length}/{files.length})
              </h2>
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || results.length === 0}
                  className={`px-4 py-2 ${
                    isExporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-md font-medium flex items-center`}
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Xuất Excel
                    </>
                  )}
                </button>
              </div>
              
              {/* Bảng kết quả */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b border-gray-200 text-left">STT</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Họ và tên</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Lớp</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Điểm</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                {results.map((result, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="py-3 px-4 border-b border-gray-200">{index + 1}</td>
                        <td className="py-3 px-4 border-b border-gray-200">{result.parsed?.studentName || "Không xác định"}</td>
                        <td className="py-3 px-4 border-b border-gray-200">{result.parsed?.studentClass || "Không xác định"}</td>
                        <td className="py-3 px-4 border-b border-gray-200 font-medium">{result.parsed?.totalScore || "Không xác định"}</td>
                        <td className="py-3 px-4 border-b border-gray-200 flex space-x-2">
                          <button 
                            onClick={() => handleViewDetail(result)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Chi tiết
                          </button>
                          <button 
                            onClick={() => handleEditClick(result, index)}
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleDeleteRow(index, result.path)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal xem chi tiết */}
          {showDetailModal && selectedDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Chi tiết kết quả chấm điểm</h3>
                    <button 
                      onClick={handleCloseDetail}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 p-4 rounded">
                      <h4 className="font-medium mb-2">Bài làm</h4>
                      <div className="p-3 bg-gray-200 rounded text-center text-gray-700 mt-2">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <p className="font-medium text-gray-900">Thông tin file</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Tên file:</span> {selectedDetail.fileName}
                        </p>
                        {selectedDetail.path && (
                          <>
                            <div className="mt-3">
                              <img 
                                src={selectedDetail.imageUrl} 
                                alt="Bài làm của học sinh" 
                                className="w-full h-auto rounded border border-gray-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/300x400?text=Không+thể+hiển+thị+ảnh";
                                  console.error("Không thể tải ảnh từ đường dẫn:", selectedDetail.path);
                                }}
                              />
                            </div>
                            <p className="text-xs mt-2 text-gray-500">
                              Đường dẫn: {selectedDetail.path}
                          </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-100 p-4 rounded h-full overflow-y-auto">
                        <h4 className="font-medium mb-2">Kết quả chấm điểm</h4>
                        <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded shadow-sm h-[calc(100%-2rem)] overflow-y-auto">
                          {selectedDetail.answer}
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseDetail}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal chỉnh sửa thông tin */}
          {showEditModal && editingResult && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Chỉnh sửa thông tin</h3>
                    <button 
                      onClick={handleCancelEdit}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Họ và tên</label>
                      <input
                        type="text"
                        name="studentName"
                        value={editForm.studentName}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Lớp</label>
                      <input
                        type="text"
                        name="studentClass"
                        value={editForm.studentClass}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Điểm số</label>
                      <input
                        type="text"
                        name="totalScore"
                        value={editForm.totalScore}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default GradeMathPaperPage;