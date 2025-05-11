import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from '../config';

function SystemSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    maxQuestionPerTest: 30,
    defaultDifficulty: "medium",
    enableAIGeneration: true,
    enableUserFeedback: true,
    systemMaintenanceMode: false,
    apiEndpoints: {
      aiGenerationUrl: config.apiEndpoints.ragApi.answer.split('/answer')[0],
      backendUrl: config.API_URL
    },
    chunkSettings: {
      chunkSize: 1000,
      chunkOverlap: 200
    }
  });
  const [saved, setSaved] = useState(false);
  
  // State cho phần quản lý tài liệu
  const [file, setFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentChunks, setDocumentChunks] = useState([]);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [chunkContent, setChunkContent] = useState("");
  
  // State thêm mới cho chức năng embedding
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState(null);
  
  // State thêm mới cho chức năng sửa/xóa
  const [editingDocumentTitle, setEditingDocumentTitle] = useState("");
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [editingChunkTitle, setEditingChunkTitle] = useState("");
  const [editingChunkContent, setEditingChunkContent] = useState("");
  const [isEditingChunk, setIsEditingChunk] = useState(false);
  const [showDeleteDocumentConfirm, setShowDeleteDocumentConfirm] = useState(false);
  const [showDeleteChunkConfirm, setShowDeleteChunkConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Token xác thực JWT
  const token = localStorage.getItem("token");
  
  // Kiểm tra quyền admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "admin") {
      navigate("/home");
    }
    
    // Kiểm tra token
    if (!token) {
      setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [navigate, token]);

  // Giả sử chúng ta sẽ lấy cài đặt từ API trong tương lai
  useEffect(() => {
    // fetchSettings();
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  // Tự động ẩn thông báo lỗi sau 3 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchSettings = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${settings.apiEndpoints.backendUrl}/api/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSettings(response.data);
    } catch (err) {
      console.error("Lỗi khi lấy cài đặt:", err);
      handleApiError(err, "Không thể lấy cài đặt hệ thống");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lỗi API chung
  const handleApiError = (err, defaultMessage) => {
    console.error(`${defaultMessage}:`, err);
    
    if (err.response) {
      // Server trả về lỗi với status code
      if (err.response.status === 401) {
        setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }, 2000);
      } else if (err.response.data && err.response.data.error) {
        // Server trả về thông báo lỗi cụ thể
        setError(err.response.data.error);
      } else {
        setError(`${defaultMessage}. Mã lỗi: ${err.response.status}`);
      }
    } else if (err.request) {
      // Không nhận được phản hồi từ server
      setError(`${defaultMessage}. Không thể kết nối đến server.`);
    } else {
      // Lỗi khác
      setError(`${defaultMessage}. ${err.message}`);
    }
  };

  // Hàm lấy danh sách tài liệu
  const fetchDocuments = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${settings.apiEndpoints.backendUrl}/api/documents/`, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      setDocuments(response.data);
      setLoading(false);
    } catch (err) {
      handleApiError(err, "Không thể lấy danh sách tài liệu");
      setLoading(false);
    }
  };

  // Hàm lấy danh sách các chunk của tài liệu
  const fetchDocumentChunks = async (documentId) => {
    if (!token) return;
    
    try {
      setLoading(true);
      console.log(`Fetching chunks for document: ${documentId}`);
      
      const response = await axios.get(`${settings.apiEndpoints.backendUrl}/api/documents/${documentId}/chunks`, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Chunks response:", response.data);
      setDocumentChunks(response.data);
      setLoading(false);
    } catch (err) {
      handleApiError(err, "Không thể lấy danh sách chunk");
      setLoading(false);
    }
  };

  // Hàm lấy nội dung của một chunk
  const fetchChunkContent = async (documentId, chunkIndex) => {
    if (!token) return;
    
    try {
      setLoading(true);
      console.log(`Fetching content for chunk ${chunkIndex} of document: ${documentId}`);
      
      const response = await axios.get(`${settings.apiEndpoints.backendUrl}/api/documents/${documentId}/chunks/${chunkIndex}`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      console.log("Chunk content response:", response.data);
      setChunkContent(response.data.content);
      setLoading(false);
    } catch (err) {
      handleApiError(err, "Không thể lấy nội dung chunk");
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!documentTitle) {
        setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    
    if (!file || !documentTitle) {
      setError("Vui lòng chọn file và nhập tên tài liệu");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", documentTitle);
      formData.append("chunkSize", settings.chunkSettings.chunkSize.toString());
      formData.append("chunkOverlap", settings.chunkSettings.chunkOverlap.toString());
      
      console.log("Uploading document with settings:", {
        title: documentTitle,
        chunkSize: settings.chunkSettings.chunkSize,
        chunkOverlap: settings.chunkSettings.chunkOverlap
      });
      
      const authToken = localStorage.getItem("token");
      console.log("Authorization token:", authToken);
      
      const response = await axios.post(`${settings.apiEndpoints.backendUrl}/api/documents/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${authToken}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      console.log("Upload response:", response.data);
      
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setDocumentTitle("");
        setUploadProgress(0);
        
        // Cập nhật danh sách tài liệu
        fetchDocuments();
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }, 1000);
      
    } catch (err) {
      handleApiError(err, "Không thể tải lên tài liệu");
      setIsUploading(false);
    }
  };

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
    setSelectedChunk(null);
    setChunkContent("");
    fetchDocumentChunks(document.id);
    checkEmbeddingStatus(document.id);
  };

  const handleChunkSelect = (chunk) => {
    setSelectedChunk(chunk);
    fetchChunkContent(chunk.document_id, chunk.index);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Xử lý nested object (như apiEndpoints.aiGenerationUrl)
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseInt(value) : value
        }
      }));
    } else {
      // Xử lý các trường thông thường
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    
    setLoading(true);
    setSaved(false);
    
    try {
      await axios.post(`${settings.apiEndpoints.backendUrl}/api/admin/settings`, settings, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleApiError(err, "Không thể lưu cài đặt hệ thống");
    } finally {
      setLoading(false);
    }
  };

  // Hàm hiển thị thông báo thành công
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Hàm kiểm tra trạng thái embedding của tài liệu
  const checkEmbeddingStatus = async (documentId) => {
    if (!token || !documentId) return;
    
    try {
      const response = await axios.get(
        `${settings.apiEndpoints.backendUrl}/api/documents/${documentId}/embedding-status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setEmbeddingStatus(response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, "Không thể lấy thông tin trạng thái embedding");
      return null;
    }
  };
  
  // Hàm thực hiện embedding tài liệu
  const embedDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      setIsEmbedding(true);
      const response = await axios.post(
        `${settings.apiEndpoints.backendUrl}/api/documents/${selectedDocument.id}/embed`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Cập nhật trạng thái
      await checkEmbeddingStatus(selectedDocument.id);
      
      setIsEmbedding(false);
      showSuccess(`Đã tạo embedding cho ${response.data.chunks_count} chunk thành công`);
    } catch (err) {
      setIsEmbedding(false);
      handleApiError(err, "Không thể tạo embedding cho tài liệu");
    }
  };

  // Hàm bắt đầu sửa tài liệu
  const startEditDocument = () => {
    if (!selectedDocument) return;
    setEditingDocumentTitle(selectedDocument.title);
    setIsEditingDocument(true);
  };

  // Hàm lưu tên tài liệu đã sửa
  const saveDocumentEdit = async () => {
    if (!selectedDocument || !editingDocumentTitle.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.put(
        `${settings.apiEndpoints.backendUrl}/api/documents/${selectedDocument.id}`,
        { title: editingDocumentTitle },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Cập nhật state
      setSelectedDocument({...selectedDocument, title: editingDocumentTitle});
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === selectedDocument.id 
            ? {...doc, title: editingDocumentTitle} 
            : doc
        )
      );
      
      setIsEditingDocument(false);
      showSuccess("Đã cập nhật tên tài liệu thành công");
    } catch (err) {
      handleApiError(err, "Không thể cập nhật tên tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Hàm hủy sửa tài liệu
  const cancelDocumentEdit = () => {
    setIsEditingDocument(false);
    setEditingDocumentTitle("");
  };

  // Hàm xóa tài liệu
  const deleteDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(
        `${settings.apiEndpoints.backendUrl}/api/documents/${selectedDocument.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Cập nhật state
      setDocuments(docs => docs.filter(doc => doc.id !== selectedDocument.id));
      setSelectedDocument(null);
      setDocumentChunks([]);
      setSelectedChunk(null);
      setChunkContent("");
      setEmbeddingStatus(null);
      setShowDeleteDocumentConfirm(false);
      
      showSuccess("Đã xóa tài liệu thành công");
    } catch (err) {
      handleApiError(err, "Không thể xóa tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Hàm bắt đầu sửa chunk
  const startEditChunk = () => {
    if (!selectedChunk) return;
    setEditingChunkTitle(selectedChunk.title);
    setEditingChunkContent(chunkContent);
    setIsEditingChunk(true);
  };

  // Hàm lưu chunk đã sửa
  const saveChunkEdit = async () => {
    if (!selectedChunk || !editingChunkTitle.trim() || !editingChunkContent.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.put(
        `${settings.apiEndpoints.backendUrl}/api/documents/${selectedDocument.id}/chunks/${selectedChunk.index}`,
        { 
          title: editingChunkTitle,
          content: editingChunkContent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Cập nhật state
      const updatedChunk = {
        ...selectedChunk, 
        title: editingChunkTitle
      };
      
      setSelectedChunk(updatedChunk);
      setChunkContent(editingChunkContent);
      setDocumentChunks(chunks => 
        chunks.map(chunk => 
          chunk.id === selectedChunk.id 
            ? updatedChunk
            : chunk
        )
      );
      
      setIsEditingChunk(false);
      showSuccess("Đã cập nhật chunk thành công");
    } catch (err) {
      handleApiError(err, "Không thể cập nhật chunk");
    } finally {
      setLoading(false);
    }
  };

  // Hàm hủy sửa chunk
  const cancelChunkEdit = () => {
    setIsEditingChunk(false);
    setEditingChunkTitle("");
    setEditingChunkContent("");
  };

  // Hàm xóa chunk
  const deleteChunk = async () => {
    if (!selectedChunk) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(
        `${settings.apiEndpoints.backendUrl}/api/documents/${selectedDocument.id}/chunks/${selectedChunk.index}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Cập nhật state
      setDocumentChunks(chunks => {
        // Lọc bỏ chunk bị xóa
        const filteredChunks = chunks.filter(chunk => chunk.id !== selectedChunk.id);
        
        // Cập nhật lại các index
        return filteredChunks.map(chunk => {
          if (chunk.index > selectedChunk.index) {
            return {...chunk, index: chunk.index - 1};
          }
          return chunk;
        });
      });
      
      setSelectedChunk(null);
      setChunkContent("");
      setShowDeleteChunkConfirm(false);
      
      // Cập nhật số lượng chunk trong document
      if (selectedDocument) {
        setSelectedDocument({
          ...selectedDocument,
          chunks_count: selectedDocument.chunks_count - 1
        });
        
        // Cập nhật trong danh sách documents
        setDocuments(docs => 
          docs.map(doc => 
            doc.id === selectedDocument.id 
              ? {...doc, chunks_count: doc.chunks_count - 1} 
              : doc
          )
        );
      }
      
      showSuccess("Đã xóa chunk thành công");
    } catch (err) {
      handleApiError(err, "Không thể xóa chunk");
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị nội dung theo tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cài đặt bài kiểm tra */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Cài đặt bài kiểm tra</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Số câu hỏi tối đa mỗi bài kiểm tra</label>
                <input
                  type="number"
                  name="maxQuestionPerTest"
                  value={settings.maxQuestionPerTest}
                  onChange={handleChange}
                  min="5"
                  max="100"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Độ khó mặc định</label>
                <select
                  name="defaultDifficulty"
                  value={settings.defaultDifficulty}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="enableAIGeneration"
                  name="enableAIGeneration"
                  checked={settings.enableAIGeneration}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="enableAIGeneration" className="text-gray-700">
                  Bật tính năng sinh câu hỏi bằng AI
                </label>
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="enableUserFeedback"
                  name="enableUserFeedback"
                  checked={settings.enableUserFeedback}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="enableUserFeedback" className="text-gray-700">
                  Bật tính năng nhận xét bài làm
                </label>
              </div>
            </div>
            
            {/* Cài đặt hệ thống */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Cài đặt hệ thống</h2>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="systemMaintenanceMode"
                  name="systemMaintenanceMode"
                  checked={settings.systemMaintenanceMode}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="systemMaintenanceMode" className="text-gray-700">
                  Chế độ bảo trì hệ thống
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">URL API AI Generation</label>
                <input
                  type="text"
                  name="apiEndpoints.aiGenerationUrl"
                  value={settings.apiEndpoints.aiGenerationUrl}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">URL API Backend</label>
                <input
                  type="text"
                  name="apiEndpoints.backendUrl"
                  value={settings.apiEndpoints.backendUrl}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );
        
      case "documents":
        return (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Danh sách tài liệu */}
            <div className="md:col-span-4 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Tài liệu đã tải lên</h2>
              
              {loading && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {!loading && documents.length === 0 ? (
                <p className="text-gray-500">Chưa có tài liệu nào</p>
              ) : (
                <ul className="divide-y">
                  {documents.map(doc => (
                    <li 
                      key={doc.id} 
                      className={`py-2 cursor-pointer ${selectedDocument?.id === doc.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleDocumentSelect(doc)}
                    >
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-gray-500 flex justify-between">
                        <span>{doc.chunks_count} chunks</span>
                        <span>{doc.upload_date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Chi tiết tài liệu và chunk */}
            <div className="md:col-span-8">
              {selectedDocument ? (
                <div className="space-y-4">
                  {/* Thông tin tài liệu */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    {isEditingDocument ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingDocumentTitle}
                          onChange={(e) => setEditingDocumentTitle(e.target.value)}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={saveDocumentEdit}
                            disabled={loading}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Lưu
                          </button>
                          <button 
                            onClick={cancelDocumentEdit}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{selectedDocument.title}</h3>
                          <p className="text-sm text-gray-500">
                            Tải lên: {selectedDocument.upload_date} | {selectedDocument.chunks_count} chunks
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Tổng số từ: {selectedDocument.total_words} | File type: {selectedDocument.file_type}
                          </p>
                          
                          {/* Hiển thị trạng thái embedding */}
                          {embeddingStatus && (
                            <div className="mt-2">
                              <p className={`text-sm ${embeddingStatus.is_fully_embedded ? 'text-green-600' : 'text-amber-600'}`}>
                                <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" 
                                  style={{backgroundColor: embeddingStatus.is_fully_embedded ? '#16a34a' : '#d97706'}}></span>
                                {embeddingStatus.is_fully_embedded 
                                  ? `Đã embedding ${embeddingStatus.embedded_chunks}/${embeddingStatus.total_chunks} chunk` 
                                  : `Đã embedding ${embeddingStatus.embedded_chunks}/${embeddingStatus.total_chunks} chunk`}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={startEditDocument} 
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Sửa tên tài liệu"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => setShowDeleteDocumentConfirm(true)} 
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Xóa tài liệu"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {/* Nút Embedding */}
                          <button 
                            onClick={embedDocument}
                            disabled={isEmbedding || (embeddingStatus && embeddingStatus.is_fully_embedded)}
                            className={`ml-2 py-1 px-2 text-xs rounded-md ${
                              isEmbedding 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                : embeddingStatus && embeddingStatus.is_fully_embedded
                                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                            title="Tạo vector embedding cho các chunk"
                          >
                            {isEmbedding 
                              ? 'Đang embedding...' 
                              : embeddingStatus && embeddingStatus.is_fully_embedded
                                ? 'Đã embedding'
                                : embeddingStatus && embeddingStatus.embedded_chunks > 0
                                  ? 'Tiếp tục embedding'
                                  : 'Tạo embedding'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Dialog xác nhận xóa tài liệu */}
                  {showDeleteDocumentConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa tài liệu <span className="font-semibold">{selectedDocument.title}</span>?</p>
                        <p className="text-red-600 text-sm mt-2">Lưu ý: Hành động này không thể hoàn tác và sẽ xóa tất cả các chunk thuộc tài liệu.</p>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button 
                            onClick={() => setShowDeleteDocumentConfirm(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={deleteDocument}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Danh sách chunks */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">Danh sách Chunks</h3>
                    
                    {loading && (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    
                    {!loading && documentChunks.length === 0 ? (
                      <p className="text-gray-500">Không có chunk nào</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {documentChunks.map(chunk => (
                          <div
                            key={chunk.id}
                            className={`p-3 border rounded cursor-pointer ${selectedChunk?.id === chunk.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                            onClick={() => handleChunkSelect(chunk)}
                          >
                            <div className="font-medium truncate">{chunk.title}</div>
                            <div className="text-xs text-gray-500">
                              Index: {chunk.index} | {chunk.word_count} từ {chunk.tokens && `| ${chunk.tokens} tokens`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Nội dung chunk */}
                  {selectedChunk && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      {isEditingChunk ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-700 mb-1">Tiêu đề</label>
                            <input
                              type="text"
                              value={editingChunkTitle}
                              onChange={(e) => setEditingChunkTitle(e.target.value)}
                              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 mb-1">Nội dung</label>
                            <textarea
                              value={editingChunkContent}
                              onChange={(e) => setEditingChunkContent(e.target.value)}
                              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={saveChunkEdit}
                              disabled={loading}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Lưu
                            </button>
                            <button 
                              onClick={cancelChunkEdit}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold">Chunk #{selectedChunk.index}: {selectedChunk.title}</h3>
                            <div className="flex space-x-2">
                              <button 
                                onClick={startEditChunk}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Sửa chunk"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => setShowDeleteChunkConfirm(true)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Xóa chunk"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="mb-2 text-sm text-gray-600">
                            <span className="mr-3">{selectedChunk.word_count} từ</span>
                            {selectedChunk.tokens && <span>{selectedChunk.tokens} tokens</span>}
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                            {chunkContent}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Dialog xác nhận xóa chunk */}
                  {showDeleteChunkConfirm && selectedChunk && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa chunk <span className="font-semibold">#{selectedChunk.index}</span>?</p>
                        <p className="text-red-600 text-sm mt-2">Lưu ý: Hành động này không thể hoàn tác.</p>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button 
                            onClick={() => setShowDeleteChunkConfirm(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={deleteChunk}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : !loading && (
                <div className="bg-gray-50 p-4 rounded-lg h-full flex items-center justify-center">
                  <p className="text-gray-500">Chọn một tài liệu để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case "upload":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form tải tài liệu */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Tải lên tài liệu mới</h2>
              
              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Tên tài liệu</label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Tệp tài liệu (PDF, DOCX, TXT)</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.docx,.txt"
                    required
                  />
                </div>
                
                {isUploading && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress}%</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full p-2 rounded ${
                    isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-medium`}
                >
                  {isUploading ? 'Đang tải lên...' : 'Tải lên và chia chunk'}
                </button>
              </form>
            </div>
            
            {/* Cài đặt chunk */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Cài đặt chia chunk</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Kích thước chunk (token)</label>
                <input
                  type="number"
                  name="chunkSettings.chunkSize"
                  value={settings.chunkSettings.chunkSize}
                  onChange={handleChange}
                  min="100"
                  max="2000"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Số token tối đa cho mỗi chunk. Giá trị đề xuất: 1000 token (~750 từ)
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Độ chồng lấn (token)</label>
                <input
                  type="number"
                  name="chunkSettings.chunkOverlap"
                  value={settings.chunkSettings.chunkOverlap}
                  onChange={handleChange}
                  min="0"
                  max="500"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Số token chồng lấn giữa các chunk liên tiếp. Giá trị đề xuất: 100-200 token
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-6">
                <h3 className="font-medium text-blue-800 mb-2">Lưu ý về chia chunk</h3>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>Kích thước chunk được tính bằng số token (đơn vị xử lý của mô hình LLM)</li>
                  <li>Kích thước chunk nhỏ hơn giúp câu trả lời chính xác hơn nhưng tăng số lượng chunk</li>
                  <li>Độ chồng lấn giúp duy trì ngữ cảnh giữa các chunk liên tiếp</li>
                  <li>Tùy chỉnh cài đặt tùy thuộc vào đặc điểm của tài liệu và mô hình sử dụng</li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Tab Navigation */}
        <div className="bg-gray-100 px-4 border-b">
          <div className="flex overflow-x-auto">
            <button
              className={`py-3 px-4 font-medium ${
                activeTab === "general" 
                  ? "border-b-2 border-blue-600 text-blue-600" 
                  : "text-gray-600 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("general")}
            >
              Cài đặt chung
            </button>
            <button
              className={`py-3 px-4 font-medium ${
                activeTab === "documents" 
                  ? "border-b-2 border-blue-600 text-blue-600" 
                  : "text-gray-600 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("documents")}
            >
              Quản lý tài liệu
            </button>
            <button
              className={`py-3 px-4 font-medium ${
                activeTab === "upload" 
                  ? "border-b-2 border-blue-600 text-blue-600" 
                  : "text-gray-600 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Tải lên tài liệu
            </button>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Cài đặt hệ thống</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Quản lý tài nguyên</h2>
              <p className="text-gray-600 mb-4">Tải lên và quản lý tài liệu, hình ảnh cho hệ thống</p>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => alert('Tính năng đang phát triển')}
              >
                Quản lý tài liệu
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Cấu hình hệ thống</h2>
              <p className="text-gray-600 mb-4">Điều chỉnh các thiết lập cho hệ thống như thời gian làm bài, số câu hỏi</p>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => alert('Tính năng đang phát triển')}
              >
                Thiết lập cấu hình
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

export default SystemSettingsPage; 