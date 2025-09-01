// Utility functions for quiz functionality

// Initialize Lenis smooth scrolling
export const initSmoothScrolling = () => {
    if (typeof window !== 'undefined') {
      import('lenis').then((LenisModule) => {
        const Lenis = LenisModule.default || LenisModule;
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
  
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
  
        requestAnimationFrame(raf);
      }).catch(err => {
        console.error('Failed to load Lenis:', err);
      });
    }
  };
  
  // Format time as MM:SS
  export const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  export const calculateProgress = (currentQuestion, totalQuestions) => {
    return (currentQuestion / totalQuestions) * 100;
  };
  
  // Check if an answer is correct
  export const checkAnswer = (selectedOption, correctAnswer) => {
    return selectedOption === correctAnswer;
  };
  
  // Get option class based on selection state
  export const getOptionClass = (optionText, selectedOption, correctAnswer) => {
    let className = 'option-btn';
    
    if (selectedOption === optionText) {
      className += optionText === correctAnswer ? ' correct' : ' incorrect';
    } else if (selectedOption && optionText === correctAnswer) {
      className += ' correct';
    }
    
    if (selectedOption) {
      className += ' disabled';
    }
    
    return className;
  };
  
  // Shuffle array (for randomizing options)
  export const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Calculate score based on time and correctness
  export const calculateScore = (isCorrect, timeLeft, totalTime) => {
    const baseScore = isCorrect ? 100 : 0;
    const timeBonus = Math.floor((timeLeft / totalTime) * 50);
    return baseScore + timeBonus;
  };