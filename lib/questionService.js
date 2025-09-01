import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

// Google API से generated question को store करने का function
export const storeGeneratedQuestion = async (questionData, source = 'google_api') => {
  try {
    const questionWithMetadata = {
      questionText: questionData.questionText || '',
      options: questionData.options || ['', '', '', ''],
      correctAnswer: questionData.correctAnswer || '',
      hint: questionData.hint || '',
      explanation: questionData.explanation || '',
      subject: questionData.subject || 'physics',
      difficulty: questionData.difficulty || 'medium',
      tags: questionData.tags || [],
      source,
      isAIEnhanced: false,
      aiModelVersion: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'questions'), questionWithMetadata);
    
    return { 
      success: true, 
      id: docRef.id,
      message: 'Question stored successfully!'
    };
  } catch (error) {
    console.error('Error storing generated question: ', error);
    return { success: false, error: error.message };
  }
};

// Manual question add करने के लिए function
export const addManualQuestion = async (questionData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User must be logged in to add questions' };
    }

    const questionWithMetadata = {
      ...questionData,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'questions'), questionWithMetadata);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding manual question: ', error);
    return { success: false, error: error.message };
  }
};

// Get all questions
export const getAllQuestions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    const questions = [];
    querySnapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error getting questions: ', error);
    return { success: false, error: error.message };
  }
};

// Get questions by subject
export const getQuestionsBySubject = async (subject) => {
  try {
    const q = query(
      collection(db, 'questions'),
      where('subject', '==', subject.toLowerCase())
    );
    
    const querySnapshot = await getDocs(q);
    const questions = [];
    
    querySnapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error getting questions by subject: ', error);
    return { success: false, error: error.message };
  }
};

// Get question by ID
export const getQuestionById = async (id) => {
  try {
    const docRef = doc(db, 'questions', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Question not found' };
    }
  } catch (error) {
    console.error('Error getting question: ', error);
    return { success: false, error: error.message };
  }
};

// Update question
export const updateQuestion = async (id, updatedData) => {
  try {
    const docRef = doc(db, 'questions', id);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating question: ', error);
    return { success: false, error: error.message };
  }
};

// Delete question
export const deleteQuestion = async (id) => {
  try {
    await deleteDoc(doc(db, 'questions', id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting question: ', error);
    return { success: false, error: error.message };
  }
};