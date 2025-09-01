import { useState } from 'react';
import { generateAndStoreQuestion } from '../lib/googleApiService';

const AIQuestionGenerator = () => {
  const [generationData, setGenerationData] = useState({
    topic: '',
    subject: 'physics',
    difficulty: 'medium'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGenerationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!generationData.topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const result = await generateAndStoreQuestion(
        generationData.topic,
        generationData.subject,
        generationData.difficulty
      );
      
      setResult(result);
      
      // Reset form if successful
      if (result.generationSuccess && result.storageSuccess) {
        setGenerationData({
          topic: '',
          subject: 'physics',
          difficulty: 'medium'
        });
      }
    } catch (error) {
      setResult({
        generationSuccess: false,
        error: error.message
      });
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Generate Question with AI</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
          <input
            type="text"
            name="topic"
            value={generationData.topic}
            onChange={handleInputChange}
            required
            placeholder="e.g., Thermodynamics, Calculus, Organic Chemistry"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              name="subject"
              value={generationData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="mathematics">Mathematics</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              name="difficulty"
              value={generationData.difficulty}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isGenerating ? 'Generating and Storing...' : 'Generate & Store Question'}
        </button>
      </form>
      
      {result && (
        <div className="mt-6 p-4 rounded-lg">
          {result.generationSuccess && result.storageSuccess ? (
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-green-800 font-bold">✓ Success!</h3>
              <p className="text-green-700">Question generated and stored successfully!</p>
              <p className="text-green-600 text-sm">Question ID: {result.questionId}</p>
            </div>
          ) : (
            <div className="bg-red-100 p-4 rounded-lg">
              <h3 className="text-red-800 font-bold">✗ Error</h3>
              <p className="text-red-700">{result.error || 'Something went wrong'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIQuestionGenerator;