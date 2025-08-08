// src/App.js
import React, { useState } from 'react';
import './App.css';

// A component to display a single analysis result item
function ResultCard({ title, score, reasoning, icon }) {
  return (
    <div className="result-card">
      <h3>{icon} {title}</h3>
      <p className="score">Score: <span>{score}/10</span></p>
      <p className="reasoning">{reasoning}</p>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  // Handles the file selection from the input
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setAnalysisResult(null); // Reset previous results
      setError(null);
    }
  };

  // Handles the form submission to the backend
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    if (!selectedFile) {
      setError('Please select a video file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    // FormData is the standard way to send files to a server
    const formData = new FormData();
    formData.append('video', selectedFile);

    try {
      // Make the API call to our backend server
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Handle server-side errors
        const errData = await response.json();
        throw new Error(errData.error || 'An unknown error occurred.');
      }

      const data = await response.json();
      setAnalysisResult(data);

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Interview Analyzer</h1>
        <p>Upload a candidate's video to get an AI-powered communication analysis.</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="upload-form">
          <label htmlFor="video-upload" className="custom-file-upload">
            {fileName || 'Click to Select a Video File'}
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
          />
          <button type="submit" className="analyze-button" disabled={isLoading || !selectedFile}>
            {isLoading ? 'Analyzing...' : 'Analyze Video'}
          </button>
        </form>

        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing video... This may take a minute or two depending on the video length.</p>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        {analysisResult && (
          <div className="results-container">
            <h2>Analysis Results</h2>
            <div className="results-grid">
              <ResultCard 
                title="English Speaking" 
                icon="🇬🇧"
                score={analysisResult.english_speaking.score}
                reasoning={analysisResult.english_speaking.reasoning}
              />
              <ResultCard 
                title="Confidence" 
                icon="💪"
                score={analysisResult.confidence.score}
                reasoning={analysisResult.confidence.reasoning}
              />
              <ResultCard 
                title="Humility" 
                icon="🤝"
                score={analysisResult.humility.score}
                reasoning={analysisResult.humility.reasoning}
              />
            </div>
            <div className="summary-card">
              <h3>📝 Overall Summary</h3>
              <p>{analysisResult.overall_summary}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

