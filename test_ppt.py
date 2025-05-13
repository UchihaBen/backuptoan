import requests
import json
import os

# Define the API endpoint
api_url = "http://api_rag:8000/generate_ppt"

# Define a simple slide structure
slides_data = [
    {
        "slide_number": 1,
        "title": "Test Slide",
        "sections": [
            {
                "heading": "Test Heading",
                "content": "This is a test content."
            }
        ],
        "notes": "Test notes"
    }
]

# Send the request
print("Sending request to generate_ppt endpoint...")
response = requests.post(
    api_url,
    json={"slides": slides_data, "test_mode": True},
    headers={"Content-Type": "application/json"}
)

# Check the response
print(f"Response status code: {response.status_code}")
if response.status_code == 200:
    # Save the response content to a file
    with open("test_presentation.pptx", "wb") as f:
        f.write(response.content)
    print(f"PowerPoint file saved to: {os.path.abspath('test_presentation.pptx')}")
else:
    print(f"Error response: {response.text}") 