# AI Interview Analyzer

This project consists of a frontend (React) and a backend (Node.js with Express) designed to analyze interview videos using the Google Gemini AI.

## Project Structure

-   `backend/`: Contains the Node.js server, responsible for handling video uploads, interacting with the Gemini AI, and providing analysis results.
-   `frontend/`: Contains the React application, which provides the user interface for uploading videos and displaying analysis.
-   `uploads/`: A temporary directory used by the backend to store uploaded video files before processing.

## Local Setup Instructions

Follow these steps to get the project running on your local machine.

### Prerequisites

-   Node.js (LTS version recommended)
-   npm (Node Package Manager)
-   A Google Cloud Project with the Gemini API enabled.
-   A `GEMINI_API_KEY` from your Google Cloud Project.

### 1. Clone the Repository

If you haven't already, clone this repository to your local machine:

```bash
git clone <your-repository-url>
cd ai-interview-analyzer
```

### 2. Backend Setup

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory with your Gemini API key:

```
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Replace `"YOUR_GEMINI_API_KEY"` with your actual API key.

#### Start the Backend Server

```bash
npm start
# Or, if you prefer:
node server.js
```

The backend server should start on `http://localhost:5001`.

### 3. Frontend Setup

Open a new terminal window, navigate to the `frontend` directory, and install dependencies:

```bash
cd ../frontend # If you are still in the backend directory
npm install
```

#### Start the Frontend Application

```bash
npm start
```

The frontend application should open in your browser at `http://localhost:3000`.

### 4. Usage

1.  Ensure both the backend and frontend servers are running.
2.  Open your browser to `http://localhost:3000`.
3.  Select a video file to upload.
4.  Click "Analyze Video" to get an AI-powered communication analysis.

## Troubleshooting

-   **`net::ERR_CONNECTION_REFUSED`**: Ensure your backend server is running. Check the terminal where you started the backend for any errors.
-   **API Key Issues**: Double-check that your `GEMINI_API_KEY` is correctly set in `backend/.env` and that the Gemini API is enabled in your Google Cloud Project.
-   **Log Files**: The backend generates `backend.log` and `exceptions.log` files in the `backend/` directory for debugging. Check these files if you encounter server-side errors.
