import { useState, useEffect } from "react";
import axios from 'axios';
import { config } from '../config';

function GradeMathPaperPage() {
  const [files, setFiles] = useState([]); // Student's math paper image files
  const [answerKeyType, setAnswerKeyType] = useState("text"); // Answer key type: "text" or "image"
  const [answerKeyFile, setAnswerKeyFile] = useState(null); // Answer key image file
  const [answerKeyText, setAnswerKeyText] = useState(""); // Answer key text
  const [isLoading, setIsLoading] = useState(false); // Processing status
  const [error, setError] = useState(null); // Error message
  const [results, setResults] = useState([]); // API results
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]); // Image preview URLs
  const [imagePaths, setImagePaths] = useState([]); // Image paths after upload
  const [currentIndex, setCurrentIndex] = useState(0); // Index of image being processed
  const [answerKeyPath, setAnswerKeyPath] = useState(""); // Answer key image path
  const [selectedDetail, setSelectedDetail] = useState(null); // Selected detail for viewing
  const [showDetailModal, setShowDetailModal] = useState(false); // Show detail modal
  const [editingResult, setEditingResult] = useState(null); // Result being edited
  const [showEditModal, setShowEditModal] = useState(false); // Show edit modal
  const [isExporting, setIsExporting] = useState(false); // Exporting to Excel status
  const [editForm, setEditForm] = useState({ // Edit form data
    studentName: "",
    studentClass: "",
    totalScore: ""
  });

  // Handle student paper image selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      
      // Create preview URLs for selected images
      const newPreviewUrls = selectedFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));
      
      // Revoke old URLs to avoid memory leaks
      imagePreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
      
      setImagePreviewUrls(newPreviewUrls);
    }
  };

  // Handle answer key image selection
  const handleAnswerKeyFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnswerKeyFile(file);
    }
  };

  // Handle answer key text input
  const handleAnswerKeyTextChange = (e) => {
    setAnswerKeyText(e.target.value);
  };

  // Handle answer key type change
  const handleAnswerTypeChange = (e) => {
    setAnswerKeyType(e.target.value);
  };

  // Call API to grade an image with given path
  const gradeImage = async (imagePath, answerKey) => {
    try {
      console.log(`Grading image: ${imagePath}`);
      console.log(`keykey : ${answerKey}`)
      // Prepare data to send to API in specified format
      const postData = {
        student_image_path: imagePath,
        answer_key: answerKey
      };

      // Call API using fetch
      
    //   const response = await fetch("http://api_rag:8000/grade_math_paper", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(postData)
    //   });
        const response = await axios.post(config.apiEndpoints.ragApi.gradeMathPaper, 
            postData
        );
        console.log(`Grading image: ${imagePath}`);
    //   if (!response.ok) {
    //     throw new Error(`API Error: ${response.status}`);
    //   }

      // Process result
      console.log(response)

      const data = response.data.answer
      
      // Check if the answer contains error message
      if (data && data.startsWith('❌')) {
        throw new Error(data);
      }
      
      return data
      
      
    } catch (error) {
      console.error("Error calling grading API:", error);
      // Extract the error message from axios error response if available
      const errorMessage = error.response?.data?.error || error.message || "Unknown";
      throw new Error(errorMessage);
    }
  };

  // Function to parse result data to extract information
  const parseGradeResult = (resultText) => {
    try {
      // Default if not found
      let studentName = "Not specified";
      let studentClass = "Not specified";
      let totalScore = "Not specified";
      
      // Extract name
      const nameMatch = resultText.match(/-Họ và tên:\s*(.+?)(?:\r|\n|$)/);
      if (nameMatch && nameMatch[1]) {
        studentName = nameMatch[1].trim();
      }
      
      // Extract class
      const classMatch = resultText.match(/-Lớp:\s*(.+?)(?:\r|\n|$)/);
      if (classMatch && classMatch[1]) {
        studentClass = classMatch[1].trim();
      }
      
      // Extract total score
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
      console.error("Error processing result:", error);
      return {
        studentName: "Processing error",
        studentClass: "Processing error",
        totalScore: "Processing error",
        fullResult: resultText
      };
    }
  };

  // Handle view detail button click
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

  // Handle detail modal close
  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedDetail(null);
  };

  // Handle edit button click
  const handleEditClick = (result, index) => {
    setEditingResult({ ...result, index });
    setEditForm({
      studentName: result.parsed.studentName,
      studentClass: result.parsed.studentClass,
      totalScore: result.parsed.totalScore
    });
    setShowEditModal(true);
  };

  // Handle form value changes in edit form
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save edit information
  const handleSaveEdit = () => {
    const updatedResults = [...results];
    const index = editingResult.index;
    
    // Update parsed data
    updatedResults[index] = {
      ...updatedResults[index],
      parsed: {
        ...updatedResults[index].parsed,
        studentName: editForm.studentName,
        studentClass: editForm.studentClass,
        totalScore: editForm.totalScore
      }
    };
    
    // Update full text content
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
    
    // Update state
    setResults(updatedResults);
    setShowEditModal(false);
    setEditingResult(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingResult(null);
  };

  // Handle delete row button click
  const handleDeleteRow = async (index, imagePath) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }
    
    try {
      // If there's an image path, call API to delete image from server
      if (imagePath) {
        console.log('Deleting image:', imagePath);
        await axios.post(config.apiEndpoints.ragApi.deleteImage, { file_path: imagePath });
        console.log('Image deleted:', imagePath);
      } else {
        console.warn('No image path to delete');
      }
      
      // Remove row from result list
      const updatedResults = results.filter((_, i) => i !== index);
      setResults(updatedResults);
    } catch (error) {
      console.error('Error deleting row:', error);
      setError('Could not delete row. Please try again later: ' + error.message);
    }
  };

  // Show status message
  const StatusMessage = ({ message, type = 'info' }) => {
    const bgColor = {
      info: 'bg-blue-50 border-blue-300 text-blue-800',
      error: 'bg-red-50 border-red-300 text-red-800',
      success: 'bg-green-50 border-green-300 text-green-800',
    }[type];

    return (
      <div className={`${bgColor} p-4 rounded-md mb-4 border`}>
        <p className="text-sm">{message}</p>
      </div>
    );
  };

  // Handle grade images button click
  const handleGradeImages = async () => {
    // Check input data
    if (files.length === 0) {
      setError("Please select at least one image");
      return;
    }

    if (answerKeyType === "text" && !answerKeyText.trim()) {
      setError("Please enter the answer");
      return;
    }

    if (answerKeyType === "image" && !answerKeyFile) {
      setError("Please select the answer image");
      return;
    }

    // Check if already grading (to avoid multiple presses)
    if (isLoading) {
      return;
    }

    // Reset related state for new image batch
    setError(null);
    setCurrentIndex(0);
    setImagePaths([]); // Reset imagePaths before uploading new

    try {
      // Show upload status
      setIsLoading(true);
      setError("Uploading images to server. Please wait...");

      // Upload all images before
      const uploadSuccess = await uploadAllFiles();
      if (!uploadSuccess) {
        setError("Error uploading file to server. Please try again.");
        setIsLoading(false);
        return;
      }

      // Add delay to ensure all files are fully written to server
      setError("Preparing to grade...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      setError(null);

      // Start grading process with first image
      if (imagePaths.length > 0) {
        await processNextImage();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setError("An error occurred: " + error.message);
      setIsLoading(false);
    }
  };

  const uploadAllFiles = async () => {
    try {
      // Upload all image files
      const paths = [];
      
      // Show upload progress for number of files to upload
      setError(`Uploading ${files.length} image files...`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setError(`Uploading image ${i+1}/${files.length}: ${file.name}`);
        
        try {
          const path = await uploadFileAndGetPath(file);
          
          // Verify the path is valid
          if (!path) {
            throw new Error(`Could not get valid path for file ${file.name}`);
          }
          
          // Add path info to paths array
          paths.push({
            file: file,
            path: path,
            preview: imagePreviewUrls.find(img => img.name === file.name)?.url
          });
          
          // Small delay between uploads to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (uploadError) {
          console.error(`Error uploading image ${file.name}:`, uploadError);
          throw new Error(`Error uploading image ${file.name}: ${uploadError.message}`);
        }
      }
      
      // Update state imagePaths with all new paths
      setImagePaths(paths);
      console.log("All images uploaded:", paths);
      
      // Upload answer key file if exists
      if (answerKeyType === "image" && answerKeyFile) {
        setError(`Uploading answer key image: ${answerKeyFile.name}`);
        try {
          const path = await uploadFileAndGetPath(answerKeyFile);
          if (!path) {
            throw new Error("Could not get valid path for answer key file");
          }
          setAnswerKeyPath(path);
        } catch (answerKeyError) {
          console.error("Error uploading answer key image:", answerKeyError);
          throw new Error(`Error uploading answer key image: ${answerKeyError.message}`);
        }
      }
      
      return paths.length > 0; // Return true if there's at least one valid path
    } catch (error) {
      console.error("Error in upload process:", error);
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
    console.log(`Processing image ${currentIndex + 1}/${imagePaths.length}:`, currentImage);

    try {
      // Add a more substantial delay to ensure the file is fully written and available on the server
      setError(`Grading image ${currentIndex + 1}/${imagePaths.length}: ${currentImage.file.name}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify path before calling API
      console.log(`Starting grading image: ${currentImage.path}`);
      
      // Call API to grade current image
      const answer = await gradeImage(currentImage.path, answerKeyPath);
      
      // Parse result to extract information
      const parsedResult = parseGradeResult(answer);
      
      // Add result to result list
      const newResult = {
        fileName: currentImage.file.name,
        answer: answer,
        preview: currentImage.preview,
        parsed: parsedResult,
        path: currentImage.path // Save image path for possible deletion later
      };
      
      setResults(prev => [...prev, newResult]);
      setError(null);
      
      // Wait a bit before processing next image to avoid API overload
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 800);
      
    } catch (error) {
      console.error(`Error processing image ${currentIndex + 1}:`, error);
      setError(`Error grading image ${currentImage.file.name}: ${error.message}`);
      // Continue with next image
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 800);
    }
  };

  // Watch currentIndex change to process next image
  useEffect(() => {
    let mounted = true;

    // Function to process next image safely
    const handleNextImage = async () => {
      if (!mounted || !isLoading || currentIndex >= imagePaths.length) return;
      
      try {
        await processNextImage();
      } catch (error) {
        console.error("Error in useEffect when processing image:", error);
        if (mounted) {
          setError("Processing error: " + error.message);
        }
      }
    };

    // If uploading and there's image to process, process next image
    if (isLoading && currentIndex < imagePaths.length) {
      handleNextImage();
    } else if (currentIndex >= imagePaths.length && imagePaths.length > 0) {
      // Processed all images
      if (mounted) {
        setIsLoading(false);
        
        // Reset all state related to images and paths
        setFiles([]);
        setImagePaths([]); // Reset paths array
        setCurrentIndex(0);
        
        // Revoke all image preview URLs to avoid memory leaks
        imagePreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
        setImagePreviewUrls([]);
        
        // Reset all input elements
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          // Only reset input for image selection, not answer key selection
          if (input.getAttribute('multiple') !== null) {
            input.value = '';
          }
        });
      }
    }

    // Cleanup when component unmounts or deps change
    return () => {
      mounted = false;
    };
  }, [currentIndex, imagePaths.length, isLoading]);

  // Clear all images and reset form
  const handleClearAll = () => {
    // Confirm before clearing all
    if (results.length > 0 && !window.confirm('Are you sure you want to delete all graded results?')) {
      return;
    }
    
    // Revoke all image preview URLs to avoid memory leaks
    imagePreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
    
    // Reset all state
    setFiles([]);
    setAnswerKeyFile(null);
    setAnswerKeyText("");
    setImagePreviewUrls([]);
    setResults([]);
    setError(null);
    setImagePaths([]);
    setCurrentIndex(0);
    setAnswerKeyPath("");
    
    // Reset all input elements
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = '';
    });
  };
  
  // Cancel grading process
  const handleCancel = () => {
    setIsLoading(false);
    // Stop at current image, don't process further
    setCurrentIndex(imagePaths.length);
  };

  // Mock file upload and get path
  const uploadFileAndGetPath = async (file) => {
    // Maximum retry attempts
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        console.log(`Uploading file: ${file.name} (attempt ${retryCount + 1}/${maxRetries})`);
        
        const response = await axios.post(config.apiEndpoints.ragApi.uploadImage, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data && response.data.success) {
          const filePath = response.data.file_path;
          console.log(`Upload successful: ${file.name} -> ${filePath}`);
          
          // Verify returned path is valid
          if (!filePath || filePath.trim() === '') {
            throw new Error("Server returned empty path");
          }
          
          // Add verification check to ensure file exists
          try {
            // Call API to check file existence
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return filePath;
          } catch (verifyError) {
            console.error("Error verifying file:", verifyError);
            throw new Error("Could not verify file existence on server");
          }
        } else {
          throw new Error(response.data.error || "Unknown error when uploading");
        }
      } catch (error) {
        console.error(`Error attempt ${retryCount + 1}/${maxRetries} when uploading file ${file.name}:`, error);
        lastError = error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Increase wait time between attempts
          const delayMs = 1000 * retryCount; // 1s, 2s, 3s,...
          console.log(`Waiting ${delayMs/1000}s before retrying...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // If all attempts fail
    console.error(`Attempted ${maxRetries} times but failed:`, lastError);
    throw lastError || new Error("Could not upload file after multiple attempts");
  };

  // Add export Excel handling function here
  const handleExportExcel = async () => {
    if (results.length === 0) {
      setError("No data to export to Excel");
      return;
    }
    
    try {
      setIsExporting(true);
      setError("Preparing to export Excel file...");
      
      // Prepare data to send
      const exportData = results.map(result => {
        // Ensure data is valid by checking each field
        return {
          studentName: result.parsed?.studentName || "Not specified",
          studentClass: result.parsed?.studentClass || "Not specified",
          totalScore: result.parsed?.totalScore || "0",
          fullResult: result.parsed?.fullResult || result.answer || "No data",
          imagePath: result.path || ""
        };
      });
      
      console.log(`Preparing to export ${exportData.length} records`);
      
      // Call API to export Excel
      const response = await axios.post(
        config.apiEndpoints.ragApi.exportExcel, 
        { results: exportData },
        { 
          responseType: 'blob',  // Important to receive file
          timeout: 30000  // Increase timeout to 30 seconds
        }
      );
      
      // Check response
      if (response.status !== 200) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      if (!response.data || response.data.size === 0) {
        throw new Error("Received empty file from server");
      }
      
      // Create URL and download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grading_results_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
      
      setError("Excel export successful!");
      
      // Automatically clear success message after 3 seconds
      setTimeout(() => {
        if (error === "Excel export successful!") {
          setError(null);
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error exporting Excel:", error);
      setError("Error exporting Excel: " + (error.message || "Unknown"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Grading System for Math Problems
          </h1>

          {/* Show status message */}
          {error && <StatusMessage message={error} type={error.includes("Error") ? "error" : "info"} />}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload section for student paper images */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-4">Student's Math Paper</h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Select images (can select multiple images)
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

              {/* Show preview of selected images */}
              {imagePreviewUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected {imagePreviewUrls.length} images
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

            {/* Answer section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-4">Answer</h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Select answer type</label>
                <select
                  value={answerKeyType}
                  onChange={handleAnswerTypeChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="text">Answer in text</option>
                  <option value="image">Answer in image</option>
                </select>
              </div>

              {answerKeyType === "text" ? (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Enter answer</label>
                  <textarea
                    value={answerKeyText}
                    onChange={handleAnswerKeyTextChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Enter answer here"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Select answer image</label>
                  <input
                    type="file"
                    onChange={handleAnswerKeyFileChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept="image/*"
                    disabled={isLoading}
                  />
                  {answerKeyFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {answerKeyFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Function buttons */}
          <div className="mt-6 flex gap-4">
            {!isLoading ? (
              <>
                <button
                  onClick={handleGradeImages}
                  className={`flex-1 p-3 ${files.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'} text-white rounded-md font-medium`}
                  disabled={files.length === 0 || isLoading}
                >
                  Grade student papers
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium"
                  disabled={isLoading}
                >
                  Clear all
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                >
                  Stop
                </button>
                <div className="p-3 text-gray-500 rounded-md font-medium">
                  Grading image {currentIndex + 1}/{imagePaths.length}
                </div>
              </>
            )}
          </div>

          {/* Processing status and progress */}
          {isLoading && (
            <div className="mt-6 bg-blue-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-700">
                  Processing image {currentIndex + 1}/{imagePaths.length}
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

          {/* Grading results in table format */}
          {results.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                Grading results ({results.length}/{files.length})
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
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Export Excel
                    </>
                  )}
                </button>
              </div>
              
              {/* Grading results table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b border-gray-200 text-left">STT</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Name</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Class</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Score</th>
                      <th className="py-2 px-4 border-b border-gray-200 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                {results.map((result, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="py-3 px-4 border-b border-gray-200">{index + 1}</td>
                        <td className="py-3 px-4 border-b border-gray-200">{result.parsed?.studentName || "Not specified"}</td>
                        <td className="py-3 px-4 border-b border-gray-200">{result.parsed?.studentClass || "Not specified"}</td>
                        <td className="py-3 px-4 border-b border-gray-200 font-medium">{result.parsed?.totalScore || "Not specified"}</td>
                        <td className="py-3 px-4 border-b border-gray-200 flex space-x-2">
                          <button 
                            onClick={() => handleViewDetail(result)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Detail
                          </button>
                          <button 
                            onClick={() => handleEditClick(result, index)}
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteRow(index, result.path)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail modal */}
          {showDetailModal && selectedDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Grading Result Detail</h3>
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
                      <h4 className="font-medium mb-2">Student Paper</h4>
                      <div className="p-3 bg-gray-200 rounded text-center text-gray-700 mt-2">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <p className="font-medium text-gray-900">File information</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">File name:</span> {selectedDetail.fileName}
                        </p>
                        {selectedDetail.path && (
                          <>
                            <div className="mt-3">
                              <img 
                                src={selectedDetail.imageUrl} 
                                alt="Student's math paper" 
                                className="w-full h-auto rounded border border-gray-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/300x400?text=Could+not+display+image";
                                  console.error("Could not load image from path:", selectedDetail.path);
                                }}
                              />
                            </div>
                            <p className="text-xs mt-2 text-gray-500">
                              Path: {selectedDetail.path}
                          </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-100 p-4 rounded h-full overflow-y-auto">
                        <h4 className="font-medium mb-2">Grading Result</h4>
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
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit modal */}
          {showEditModal && editingResult && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit Information</h3>
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
                      <label className="block text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        name="studentName"
                        value={editForm.studentName}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Class</label>
                      <input
                        type="text"
                        name="studentClass"
                        value={editForm.studentClass}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Score</label>
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
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                    >
                      Save changes
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