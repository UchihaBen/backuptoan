import { useState } from "react";
import axios from "axios";
import { FaDownload, FaEye, FaSpinner } from "react-icons/fa";
import config from "../config";

function GenerateSlidesPage() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [slideData, setSlideData] = useState(null);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError("Please enter a topic for the slide");
      return;
    }

    setIsLoading(true);
    setError("");
    setSlideData(null);
    setDownloadUrl("");
    
    try {
      const response = await axios.post(config.apiEndpoints.ragApi.generateSlide, {
        question: topic
      });
      
      if (response.data) {
        try {
          console.log("API response:", response.data);
          
          // Check if there's an error
          if (response.data.error) {
            throw new Error(response.data.error);
          }
          
          // If slides_data is directly available from API
          if (response.data.slides_data) {
            setSlideData(response.data.slides_data);
            
            // If PowerPoint file is available as base64
            if (response.data.ppt_base64) {
              // Convert base64 to blob
              const byteCharacters = atob(response.data.ppt_base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
              
              // Create URL for download
              const url = window.URL.createObjectURL(blob);
              setDownloadUrl(url);
              console.log("PowerPoint data received successfully!");
            }
          } 
          // If only answer is available as text, try to parse it
          else if (response.data.answer) {
            // Process JSON string to remove markdown code block markers
            const jsonString = response.data.answer
              .replace(/```json\n?|```/g, "")  // Remove JSON code block markers
              .replace(/(?<!\\)\\(?!\\)/g, "\\\\")  // Replace single \ with \\ but keep existing \\
              .trim();
            
            console.log("Processed JSON string:", jsonString);
            
            // Parse the processed JSON string
            const parsedData = JSON.parse(jsonString);
            console.log("Parsed data:", parsedData);
            
            setSlideData(parsedData);
            
            // Show error message because PowerPoint file is not available
            setError("Could not create PowerPoint file. Please try again later.");
          } else {
            throw new Error("No valid data received from server");
          }
        } catch (error) {
          console.error("Error processing slide data:", error);
          setError("Invalid data. Please try again with a different topic.");
        }
      } else {
        setError("No valid data received from server");
      }
    } catch (err) {
      console.error("Error calling API:", err);
      setError("An error occurred while creating slides. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${topic.replace(/\s+/g, '_')}_slides.pptx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Presentation Slides</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Topic
            </label>
            <input
              type="text"
              id="topic"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: Fraction multiplication, Solving quadratic equations, Function derivatives..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the math topic to create slides. The system will automatically generate detailed content.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <FaSpinner className="inline mr-2 animate-spin" />
                Creating slides...
              </>
            ) : "Create PowerPoint Slides"}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {slideData && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Created Slides: {topic}</h2>
            <div className="flex space-x-2">
              <button
                onClick={togglePreview}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FaEye className="mr-2" /> {showPreview ? "Hide Preview" : "Preview"}
              </button>
              
              <button
                onClick={handleDownload}
                disabled={!downloadUrl}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FaDownload className="mr-2" /> Download (.pptx)
              </button>
            </div>
          </div>
          
          {showPreview && (
            <div className="p-6">
              {slideData.map((slide, slideIndex) => (
                <div key={slideIndex} className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-3 border-b border-gray-200">
                    <h3 className="font-bold">Slide {slide.slide_number}: {slide.title}</h3>
                  </div>
                  <div className="p-4">
                    {slide.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-4">
                        <h4 className="font-semibold text-blue-700">{section.heading}</h4>
                        <div className="mt-2 text-gray-700 whitespace-pre-line">
                          {section.content}
                        </div>
                      </div>
                    ))}
                    {slide.notes && (
                      <div className="mt-4 p-2 bg-yellow-50 border border-yellow-100 rounded">
                        <p className="text-sm text-gray-700 italic">
                          <span className="font-medium">Note: </span>
                          {slide.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GenerateSlidesPage; 