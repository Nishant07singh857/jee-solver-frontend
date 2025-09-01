import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, BrainCircuit, Upload, Loader, AlertTriangle, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';

// --- Main AI Assessment Page Component ---
const AssessmentPage = () => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const router = useRouter();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError('');
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);

        // --- Mock AI Analysis ---
        // In a real app, you would upload the PDF to your backend.
        // The backend would then process it, perform step-wise scoring with an AI,
        // and return a detailed analysis.
        setTimeout(() => {
            const mockResult = {
                score: 185,
                totalMarks: 300,
                accuracy: 61.7,
                strongTopics: ['Kinematics', 'Chemical Bonding'],
                weakTopics: ['Rotational Motion', 'P-Block Elements'],
            };
            setResult(mockResult);
            setLoading(false);
            gsap.fromTo(".result-card", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
        }, 3000); // Simulate a 3-second analysis time
    };

    return (
        <>
            <Head>
                <title>AI Assessment | JEE Solver</title>
            </Head>

            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-10">
                         <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-4xl font-black text-white text-center">AI Assessment Engine</h1>
                        <div className="w-32"></div> {/* Spacer */}
                    </header>

                    {/* Upload Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="text-center">
                             <div className="inline-flex items-center justify-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
                                <BrainCircuit size={32} className="text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Upload Your Answer Sheet</h2>
                            <p className="text-gray-400 mt-2">Submit your completed mock test (PDF) for a detailed, step-by-step analysis.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-8">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-purple-500 transition-colors">
                                <Upload size={40} className="text-gray-500 mb-3" />
                                <span className="font-semibold text-white">{fileName || "Click to choose a PDF file"}</span>
                                <span className="text-sm text-gray-400">Max file size: 10MB</span>
                                <input id="file-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                            </label>

                            <button type="submit" disabled={loading || !file} className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg text-lg transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center">
                                {loading ? <><Loader className="animate-spin mr-2" /> Analyzing...</> : "Start Analysis"}
                            </button>
                            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        </form>
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="mt-12">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><Sparkles className="text-yellow-400"/> Your Analysis is Ready!</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="result-card bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                    <p className="text-gray-400">Your Score</p>
                                    <p className="text-5xl font-bold text-white">{result.score}<span className="text-3xl text-gray-500">/{result.totalMarks}</span></p>
                                </div>
                                <div className="result-card bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                    <p className="text-gray-400">Overall Accuracy</p>
                                    <p className="text-5xl font-bold text-white">{result.accuracy}%</p>
                                </div>
                                <div className="result-card bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="font-bold text-white mb-3">Strong Topics 💪</h3>
                                    <ul className="list-disc list-inside text-green-400">
                                        {result.strongTopics.map(topic => <li key={topic}>{topic}</li>)}
                                    </ul>
                                </div>
                                <div className="result-card md:col-span-3 bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="font-bold text-white mb-3">Areas for Improvement 🧠</h3>
                                     <ul className="list-disc list-inside text-yellow-400">
                                        {result.weakTopics.map(topic => <li key={topic}>{topic}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AssessmentPage;
