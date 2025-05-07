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
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    
    // Tạo URL preview cho các ảnh
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
  };

  // Xử lý khi người dùng chọn ảnh đáp án
  const handleAnswerKeyFileChange = (event) => {
    const file = event.target.files[0];
    setAnswerKeyFile(file);
  };

  // Xử lý khi người dùng nhập text đáp án
  const handleAnswerKeyTextChange = (e) => {
    setAnswerKeyText(e.target.value);
  };

  // Xử lý khi thay đổi loại đáp án
  const handleAnswerTypeChange = (e) => {
    setAnswerKeyType(e.target.value);
  };

  // Xử lý upload file
  const handleFileUpload = async (files) => {
    try {
      setError("Đang tải lên các file...");
      const paths = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        try {
          const response = await axios.post("http://127.0.0.1:8000/upload_image", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 30000, // Tăng timeout lên 30 giây
          });
          
          if (response.data.success) {
            // Kiểm tra nếu file đã tồn tại
            if (response.data.file_exists) {
              const confirmOverwrite = window.confirm(
                `File "${response.data.original_filename}" đã tồn tại. Bạn có muốn ghi đè không?`
              );
              
              if (!confirmOverwrite) {
                setError(`Đã bỏ qua file "${response.data.original_filename}" vì đã tồn tại.`);
                continue;
              }
            }
            
            paths.push(response.data.file_path);
            setError(`Đã tải lên ${paths.length}/${files.length} file...`);
          } else {
            throw new Error(response.data.error || "Lỗi không xác định khi tải lên");
          }
        } catch (uploadError) {
          console.error("Lỗi khi tải lên file:", uploadError);
          setError(`Lỗi khi tải lên file ${file.name}: ${uploadError.message}`);
          continue;
        }
      }
      
      // Verify that all uploads were successful
      if (paths.length !== files.length) {
        throw new Error(`Chỉ tải lên được ${paths.length}/${files.length} ảnh bài làm`);
      }
      
      // Add a larger delay to ensure all files are available on the server
      setError("Hoàn tất tải lên, đang chuẩn bị chấm điểm...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (err) {
      console.error("Lỗi trong quá trình tải file:", err);
      setError(`Lỗi khi tải file lên server: ${err.message}`);
      return false;
    }
  };

  // Xử lý khi người dùng nhấn nút chấm điểm
  const handleGrade = async () => {
    if (files.length === 0) {
      setError("Vui lòng chọn ít nhất một ảnh bài làm");
      return;
    }

    if (!answerKeyText && !answerKeyFile) {
      setError("Vui lòng nhập đáp án hoặc chọn file đáp án");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentIndex(0);

    try {
      // Upload tất cả các file
      const uploadSuccess = await handleFileUpload(files);
      if (!uploadSuccess) {
        return;
      }

      // Upload đáp án nếu là file
      if (answerKeyFile) {
        const formData = new FormData();
        formData.append("file", answerKeyFile);
        const response = await axios.post("http://127.0.0.1:8000/upload_image", formData);
        if (response.data.success) {
          setAnswerKeyPath(response.data.file_path);
        } else {
          throw new Error(response.data.error || "Lỗi khi tải lên đáp án");
        }
      }

      // Chấm điểm từng bài
      const newResults = [];
      for (let i = 0; i < files.length; i++) {
        setCurrentIndex(i + 1);
        setError(`Đang chấm bài ${i + 1}/${files.length}...`);

        const response = await axios.post("http://127.0.0.1:8000/grade_math_paper", {
          student_image_path: imagePaths[i],
          answer_key: answerKeyType === "text" ? answerKeyText : answerKeyPath
        });

        newResults.push({
          path: imagePaths[i],
          answer: response.data.answer
        });
      }

      setResults(newResults);
      setError("Chấm điểm hoàn tất!");
    } catch (err) {
      console.error("Lỗi khi chấm điểm:", err);
      setError(`Lỗi khi chấm điểm: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xuất Excel
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
        return {
          studentName: result.parsed?.studentName || "Không xác định",
          studentClass: result.parsed?.studentClass || "Không xác định",
          totalScore: result.parsed?.totalScore || "0",
          fullResult: result.parsed?.fullResult || result.answer || "Không có dữ liệu",
          imagePath: result.path || ""
        };
      });
      
      // Gọi API xuất Excel
      const response = await axios.post(
        "http://127.0.0.1:8000/export_excel", 
        { results: exportData },
        { 
          responseType: 'blob',
          timeout: 30000
        }
      );
      
      // Tạo URL và link tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ket_qua_cham_diem_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
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

          {/* Hiển thị lỗi */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Phần upload ảnh bài làm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ảnh bài làm
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
              />
              
              {/* Hiển thị preview ảnh */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                        {files[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phần nhập đáp án */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại đáp án
              </label>
              <div className="flex space-x-4 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={answerKeyType === "text"}
                    onChange={(e) => setAnswerKeyType(e.target.value)}
                    className="form-radio"
                  />
                  <span className="ml-2">Nhập text</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="image"
                    checked={answerKeyType === "image"}
                    onChange={(e) => setAnswerKeyType(e.target.value)}
                    className="form-radio"
                  />
                  <span className="ml-2">Upload ảnh</span>
                </label>
              </div>

              {answerKeyType === "text" ? (
                <textarea
                  value={answerKeyText}
                  onChange={(e) => setAnswerKeyText(e.target.value)}
                  placeholder="Nhập đáp án và biểu điểm..."
                  className="w-full h-32 p-2 border rounded-md"
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAnswerKeyFileChange}
                  className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                />
              )}
            </div>
          </div>

          {/* Nút chấm điểm */}
          <div className="mt-6">
            <button
              onClick={handleGrade}
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang chấm điểm...
                </span>
              ) : (
                'Chấm điểm'
              )}
            </button>
          </div>

          {/* Hiển thị kết quả */}
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
                        <td className="py-2 px-4 border-b border-gray-200">{index + 1}</td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {result.parsed?.studentName || "Không xác định"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {result.parsed?.studentClass || "Không xác định"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {result.parsed?.totalScore || "0"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          <button
                            onClick={() => {
                              setSelectedDetail(result);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết */}
      {showDetailModal && selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chi tiết bài làm</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap">{selectedDetail.answer}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GradeMathPaperPage;