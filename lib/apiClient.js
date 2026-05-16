import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = {
  // Progress API
  async getProgressData(userId) {
    const response = await axios.get(`${API_BASE_URL}/progress/overall/${userId}`);
    return response.data;
  },
  
  async getWeeklyProgress(userId) {
    const response = await axios.get(`${API_BASE_URL}/progress/weekly/${userId}`);
    return response.data;
  },
  
  // ML Analysis API
  async getMLAnalysis(userId) {
    const response = await axios.get(`${API_BASE_URL}/ml/performance-analysis/${userId}`);
    return response.data;
  },
  
  async getRecommendations(userId) {
    const response = await axios.get(`${API_BASE_URL}/ml/recommendations/${userId}`);
    return response.data;
  },
  
  // Questions API
  async generateQuiz(subject, mode, topic) {
    const response = await axios.post(`${API_BASE_URL}/questions/generate-quiz`, {
      subject, mode, topic
    });
    return response.data;
  }
};