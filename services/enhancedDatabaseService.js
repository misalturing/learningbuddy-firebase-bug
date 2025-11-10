import { doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from './firebase.js';
import { saveUserProgressLocal, getUserProgressLocal } from './localStorageService.js';

const isFirebaseAvailable = () => {
  const forceLocalMode = localStorage.getItem('forceLocalStorageMode') === 'true';
  if (forceLocalMode) return false;
  return db !== null;
};

export const createUserProfile = async (userId, profileData) => {
  console.log('createUserProfile called for user:', userId, profileData);

  const userProfile = {
    profile: {
      createdAt: isFirebaseAvailable() ? serverTimestamp() : new Date().toISOString(),
      lastActive: isFirebaseAvailable() ? serverTimestamp() : new Date().toISOString(),
      email: profileData.email,
      grade: profileData.grade,
      targetExamYear: profileData.targetExamYear,
      onboardingComplete: profileData.onboardingComplete || false,
    },
    subjects: profileData.subjects || {},
    agentInteractions: {},
    studySessions: {},
    learningPath: {},
    gamification: profileData.gamification || { points: 100, streak: 1, badges: ["Welcome Badge"] },
    userName: profileData.userName,
    onboardingComplete: profileData.onboardingComplete || false
  };

  if (!isFirebaseAvailable()) {
    saveUserProgressLocal(userId, userProfile);
    return true;
  }

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, userProfile);
    saveUserProgressLocal(userId, userProfile);
    return true;
  } catch (error) {
    console.error('❌ Error creating user profile in Firebase:', error);
    saveUserProgressLocal(userId, userProfile);
    return false;
  }
};

export const completeOnboarding = async (userId, onboardingData) => {
  const completeOnboardingData = {
    ...onboardingData,
    onboardingComplete: true
  };
  const profileSuccess = await createUserProfile(userId, completeOnboardingData);
  return profileSuccess;
};

export const updateUserData = async (userId, updates) => {
  if (!isFirebaseAvailable()) {
    const existingData = getUserProgressLocal(userId) || {};
    const updatedData = { ...existingData };
    Object.keys(updates).forEach(key => {
      const keys = key.split('.');
      let temp = updatedData;
      keys.slice(0, -1).forEach(k => {
        if (!temp[k]) temp[k] = {};
        temp = temp[k];
      });
      temp[keys[keys.length - 1]] = updates[key];
    });
    saveUserProgressLocal(userId, updatedData);
    return true;
  }

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
    const remoteData = await getDoc(userRef);
    if (remoteData.exists()) saveUserProgressLocal(userId, remoteData.data());
    return true;
  } catch (error) {
    console.error('❌ Error updating user data in Firebase:', error);
    return false;
  }
};

export const getUserAnalytics = async (userId) => {
  const userData = getUserProgressLocal(userId);
  return userData ? { totalStudyTime: 0, subjectsEnrolled: 0, averageProficiency: 0, studyStreak: 0 } : null;
};

export const getTopicsForReview = async (userId) => {
  return [];
};

export const subscribeToUserProgress = (userId, callback) => {
  const userData = getUserProgressLocal(userId);
  if (userData) {
    setTimeout(() => callback(userData), 0);
  }
  return () => {}; // No-op unsubscribe
};

export const saveUserProgress = async (userId, userProgress) => {
  return await updateUserData(userId, userProgress);
};

export const getUserProgress = async (userId) => {
  return getUserProgressLocal(userId);
};
