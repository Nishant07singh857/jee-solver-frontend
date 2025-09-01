import { useState } from 'react';
import Head from 'next/head';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import QuestionForm from '../components/QuestionForm';
import QuestionList from '../components/QuestionList';

const QuestionsPage = () => {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <>
      <Head>
        <title>Questions | JEE Solver</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Question Bank Management</h1>
          
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