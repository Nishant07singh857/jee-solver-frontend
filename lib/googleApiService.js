// Google API से questions generate करने के लिए service
export const generateQuestionWithGoogleAPI = async (topic, subject, difficulty = 'medium') => {
  try {
    // यहां आपका actual Google API call होगा
    // For now, we'll mock the response
    const mockQuestion = {
      questionText: `Explain the concept of ${topic} in ${subject}`,
      options: [
        `Option A related to ${topic}`,
        `Option B related to ${topic}`,
        `Option C related to ${topic}`,
        `Option D related to ${topic}`
      ],
      correctAnswer: 'A',
      hint: `Consider the fundamental principles of ${topic} in ${subject}`,
      explanation: `This question focuses on ${topic} in the context of ${subject}. The correct answer is A because...`,
      subject: subject.toLowerCase(),
      difficulty: difficulty.toLowerCase(),
      tags: [topic.toLowerCase(), subject.toLowerCase(), difficulty.toLowerCase()]
    };

    return {
      success: true,
      data: mockQuestion
    };
  } catch (error) {
    console.error('Error generating question with Google API:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate और store एक साथ करने के लिए function
export const generateAndStoreQuestion = async (topic, subject, difficulty = 'medium') => {
  try {
    // Google API से question generate करें
    const generationResult = await generateQuestionWithGoogleAPI(topic, subject, difficulty);
    
    if (!generationResult.success) {
      throw new Error(generationResult.error);
    }

    // Question को Firebase में store करें
    const storeResult = await storeGeneratedQuestion(generationResult.data);
    
    return {
      generationSuccess: true,
      storageSuccess: storeResult.success,
      questionId: storeResult.id,
      questionData: generationResult.data
    };
    
  } catch (error) {
    console.error('Error in generateAndStoreQuestion:', error);
    return {
      generationSuccess: false,
      storageSuccess: false,
      error: error.message
    };
  }
};