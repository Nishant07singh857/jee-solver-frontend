import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Progress API
  async getProgressData(userId) {
    try {
      const response = await api.get(`/progress/overall/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress data:', error);
      throw error;
    }
  },
  
  async getWeeklyProgress(userId) {
    try {
      const response = await api.get(`/progress/weekly/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      throw error;
    }
  },
  
  async getTopicHeatmap(userId) {
    try {
      const response = await api.get(`/progress/topic-heatmap/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topic heatmap:', error);
      throw error;
    }
  },
  
  async getSubjectProgress(userId) {
    try {
      const response = await api.get(`/progress/subject/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subject progress:', error);
      throw error;
    }
  },

  // ML Analysis API
  async getMLAnalysis(userId) {
    try {
      const response = await api.get(`/ml/performance-analysis/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ML analysis:', error);
      // Return fallback data instead of throwing error
      return {
        success: false,
        data: {
          performance_metrics: {
            predicted_score: 0,
            current_level: "Insufficient Data",
            improvement_potential: 0,
            consistency_score: 0
          },
          weak_areas: [],
          learning_insights: {
            pattern: "insufficient_data",
            suggestion: "Complete more quizzes to get AI insights"
          },
          rank_prediction: {
            predicted_rank_range: "More data needed",
            confidence: "low"
          },
          recommendations: ["Practice more questions to get personalized insights"]
        }
      };
    }
  },
  
  async getRecommendations(userId) {
    try {
      const response = await api.get(`/ml/recommendations/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  // Questions API
  async generateQuiz(subject, mode, topic = null) {
    try {
      const payload = { subject, mode };
      if (topic) payload.topic = topic;
      
      const response = await api.post('/questions/generate-quiz', payload);
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  },

  async getTopics(subject) {
    try {
      const response = await api.get(`/questions/topics?subject=${subject}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  },

  async generateExplanation(questionData) {
    try {
      const response = await api.post('/questions/generate-explanation', questionData);
      return response.data;
    } catch (error) {
      console.error('Error generating explanation:', error);
      throw error;
    }
  },

  async recordProgress(progressData) {
    try {
      const response = await api.post('/questions/record-progress', progressData);
      return response.data;
    } catch (error) {
      console.error('Error recording progress:', error);
      throw error;
    }
  },

  // Solutions API
  async solveImage(formData) {
    try {
      const response = await api.post('/solutions/solve-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error solving image:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

export default api;