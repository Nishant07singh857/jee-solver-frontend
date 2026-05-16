import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import QuestionForm from '../components/QuestionForm';

const QuestionsPage = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Questions | JEE Solver</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center mb-8">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex-1 text-center pr-24">Question Bank Management</h1>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'generate' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('generate')}
            >
              AI Generate
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('add')}
            >
              Add Manual
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'browse' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Questions
            </button>
          </div>
          
          {/* Content */}
          {activeTab === 'generate' && <AIQuestionGenerator />}
          {activeTab === 'add' && <QuestionForm />}
          {activeTab === 'browse' && <QuestionList />}
        </div>
      </div>
    </>
  );
};

export default QuestionsPage;