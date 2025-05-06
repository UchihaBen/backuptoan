import { useState, useEffect } from "react";
import axios from 'axios';

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
        const response = await axios.post("http://127.0.0.1:8000/grade_math_paper", 
            postData
        );
        console.log(`Đang chấm điểm ảnh: ${imagePath}`);
    //   if (!response.ok) {
    //     throw new Error(`Lỗi API: ${response.status}`);
    //   }

      // Xử lý kết quả
      console.log(response)

      const data = response.data.answer
      
      return data
      
      
    } catch (error) {
      console.error("Lỗi khi gọi API chấm điểm:", error);
      throw error;
    }
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

    // Reset các state
    setResults([]);
    setError(null);
    setCurrentIndex(0);

    // Upload tất cả ảnh trước
    const uploadSuccess = await uploadAllFiles();
    if (!uploadSuccess) return;

    // Bắt đầu quy trình chấm điểm ảnh đầu tiên
    if (imagePaths.length > 0) {
      await processNextImage();
    } else {
      setIsLoading(false);
    }
  };
  
  // Hàm xử lý từng ảnh một
  const processNextImage = async () => {
    if (currentIndex >= imagePaths.length) {
      setIsLoading(false);
      return;
    }
    
    const currentImage = imagePaths[currentIndex];
    
    try {
      // Gọi API để chấm điểm cho ảnh hiện tại
      const answer = await gradeImage(currentImage.path, answerKeyPath);
      
      // Thêm kết quả vào danh sách
      const newResult = {
        fileName: currentImage.file.name,
        answer: answer,
        preview: currentImage.preview
      };
      
      setResults(prev => [...prev, newResult]);
      
      // Tăng chỉ số để xử lý ảnh tiếp theo
      setCurrentIndex(prev => prev + 1);
      
    } catch (err) {
      // Xử lý lỗi cho ảnh hiện tại
      const errorResult = {
        fileName: currentImage.file.name,
        answer: "Lỗi khi chấm bài này",
        preview: currentImage.preview
      };
      
      setResults(prev => [...prev, errorResult]);
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  // Theo dõi khi currentIndex thay đổi để xử lý ảnh tiếp theo
  useEffect(() => {
    if (isLoading && currentIndex < imagePaths.length) {
      processNextImage();
    } else if (currentIndex >= imagePaths.length && imagePaths.length > 0) {
      setIsLoading(false);
    }
  }, [currentIndex, imagePaths.length]);


  // Xóa tất cả ảnh và reset form
  const handleClearAll = () => {
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
  };
  
  // Hủy quá trình chấm điểm
  const handleCancel = () => {
    setIsLoading(false);
    // Dừng ở ảnh hiện tại, không xử lý tiếp
    setCurrentIndex(imagePaths.length);
  };

  // Mô phỏng việc tải file lên server và lấy đường dẫn
  const uploadFileAndGetPath = async (file) => {
    // Trong thực tế, đây là nơi bạn sẽ gửi file lên server để lưu tạm
    // Ở đây chỉ mô phỏng bằng cách trả về đường dẫn giả
    
    // Mô phỏng thời gian upload (1 giây)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Trả về đường dẫn giả định, trong thực tế sẽ là đường dẫn thật từ server
        resolve(`/uploads/temp/${file.name}`);
      }, 1000);
    });
  };
  
  // Upload tất cả các file và lấy đường dẫn
  const uploadAllFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Upload các file ảnh bài làm
      const paths = [];
      for (const file of files) {
        const path = await uploadFileAndGetPath(file);
        paths.push({
          file: file,
          path: path,
          preview: imagePreviewUrls.find(img => img.name === file.name)?.url
        });
      }
      setImagePaths(paths);
      
      // Upload file đáp án nếu có
      if (answerKeyType === "image" && answerKeyFile) {
        const path = await uploadFileAndGetPath(answerKeyFile);
        setAnswerKeyPath(path);
      } else {
        setAnswerKeyPath(answerKeyText);
      }
      
      return true;
    } catch (err) {
      setError("Lỗi khi tải file lên server");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Hệ thống chấm điểm bài tập toán
          </h1>

          {/* Hiển thị lỗi */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

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
                  className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  Chấm điểm các bài làm
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium"
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

          {/* Kết quả chấm điểm */}
          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                Kết quả chấm điểm ({results.length}/{files.length})
              </h2>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="grid md:grid-cols-3">
                      {/* Hiển thị ảnh bài làm */}
                      <div className="bg-gray-100 p-4">
                        <h3 className="font-medium mb-2 truncate">{result.fileName}</h3>
                        {result.preview && (
                          <img
                            src={result.preview}
                            alt={`Bài làm ${index + 1}`}
                            className="max-h-48 max-w-full object-contain mx-auto"
                          />
                        )}
                      </div>
                      
                      {/* Hiển thị nhận xét */}
                      <div className="p-4 md:col-span-2 bg-white">
                        <h3 className="font-medium mb-2">Nhận xét và điểm số:</h3>
                        <div className="whitespace-pre-wrap text-gray-700">
                          {result.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GradeMathPaperPage;