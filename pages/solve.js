import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { Camera, Upload, Loader, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';
import { gsap } from 'gsap';
import axios from 'axios'; // Ensure you have installed axios: npm install axios

// The actual endpoint of your Python backend.
// Make sure your backend is running and accessible at this address.
const API_ENDPOINT = "http://localhost:8000/api/v1/solver/solve-image";

const PhotoSolverPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [solution, setSolution] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Refs for GSAP animations
    const fileInputRef = useRef(null);
    const solutionRef = useRef(null);
    const errorRef = useRef(null);

    // Function to handle file selection from the input
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setSolution(null);
            setError('');
            // Animate the preview container into view
            gsap.fromTo("#preview-container", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" });
        } else {
            setError("Please select a valid image file (PNG, JPG).");
            gsap.fromTo(errorRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
        }
    };

    // Function to trigger the hidden file input
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Function to submit the image to the backend API
    const handleSubmit = async () => {
        if (!selectedFile) {
            setError("Please upload an image first.");
            gsap.fromTo(errorRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
            return;
        }

        setIsLoading(true);
        setError('');
        setSolution(null);

        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            // Make the actual API call to the backend with the image data
            const response = await axios.post(API_ENDPOINT, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Set the solution from the successful API response
            setSolution(response.data.solution);
            // Animate the solution container into view
            gsap.fromTo(solutionRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 });

        } catch (err) {
            // Handle potential errors (network issue, server error, etc.)
            const errorMessage = err.response?.data?.detail || "An unexpected error occurred. Please try again.";
            setError(errorMessage);
            gsap.fromTo(errorRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
            console.error("API Error:", err);
        } finally {
            // This will run whether the request succeeded or failed
            setIsLoading(false);
        }
    };

    // Function to simulate navigating back to the dashboard
    const handleBackClick = () => {
        alert("Navigating back to the dashboard...");
        // In a real app, you would use Next.js's router:
        // import { useRouter } from 'next/router';
        // const router = useRouter();
        // router.push('/dashboard');
    };

    return (
        <>
            <Head>
                <title>Photo Doubt Solver | JEE Solver</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 flex flex-col items-center">
                
                {/* Back Button */}
                <div className="w-full max-w-4xl">
                    <button onClick={handleBackClick} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                </div>

                <div className="w-full max-w-4xl bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                            <Camera size={32} className="text-blue-400" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white">Photo Doubt Solver</h1>
                        <p className="text-lg text-gray-400 mt-2">Upload a picture of your problem and let AI do the rest.</p>
                    </div>

                    {/* Upload Area */}
                    <div id="upload-container" className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center bg-white/5 transition-colors hover:border-blue-500 hover:bg-blue-500/5">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <Upload size={48} className="mx-auto text-gray-500 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Drag & Drop or Click to Upload</h2>
                        <p className="text-gray-400">PNG, JPG, or GIF (Max 5MB)</p>
                        <button onClick={handleUploadClick} className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-all transform hover:scale-105">
                            Choose File
                        </button>
                    </div>

                    {/* Preview Section */}
                    {preview && (
                        <div id="preview-container" className="mt-8">
                            <h3 className="text-xl font-bold mb-4 text-white">Your Uploaded Image:</h3>
                            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                                <img src={preview} alt="Problem preview" className="max-w-full h-auto rounded-lg mx-auto" />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="mt-8 text-center">
                        <button onClick={handleSubmit} disabled={isLoading || !selectedFile} className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-12 rounded-lg text-lg transition-all hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center mx-auto">
                            {isLoading ? (
                                <>
                                    <Loader className="animate-spin mr-2" size={20} />
                                    Solving...
                                </>
                            ) : "Get Solution"}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div ref={errorRef} className="mt-6 flex items-center gap-3 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {/* Solution Display */}
                    {solution && (
                        <div ref={solutionRef} className="mt-10 pt-8 border-t border-white/10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Sparkles className="text-yellow-400" />
                                AI Generated Solution
                            </h2>
                            <div className="prose prose-invert max-w-none bg-black/20 p-6 rounded-xl border border-white/10 text-lg leading-relaxed whitespace-pre-wrap">
                                {solution}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PhotoSolverPage;
