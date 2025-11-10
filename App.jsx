import React, { useState, useEffect } from 'react';
import AuthChoice from './components/AuthChoice.jsx';
import Auth from './components/Auth.jsx';
import EvaluationQuiz from './components/EvaluationQuiz.jsx';
import EnhancedDashboard from './components/EnhancedDashboard.jsx';
import { SUBJECTS } from './constants.js';
import { saveUserProgress, getUserProgress, subscribeToUserProgress, completeOnboarding } from './services/enhancedDatabaseService.js';
import { evaluateQuizAnswers, generateStudyPlan } from './services/geminiService.js';
import { onAuthStateChange, logoutUser } from './services/authService.js';
import { saveUserProgressLocal, getUserProgressLocal, setDemoMode, clearAllLocalData, debugLocalStorage } from './services/localStorageService.js';

const App = () => {
  // Authentication states
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'choice', 'login', 'register'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [allowAutoLogin, setAllowAutoLogin] = useState(false); // Prevent automatic login
  
  // App states
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication flow handlers
  const handleAuthChoice = (choice) => {
    setAllowAutoLogin(true); // User has interacted, allow login
    if (choice === 'demo') {
      const demoUser = {
        uid: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User'
      };
      setCurrentUser(demoUser);
      setIsAuthenticated(true);
      setDemoMode(true);
      
      const existingProgress = getUserProgressLocal('demo-user');
      if (existingProgress) {
        setUserProgress(existingProgress);
        setIsOnboardingComplete(true);
      }
      
      setIsLoading(false);
    } else if (choice === 'login' || choice === 'register') {
      setAuthMode(choice);
    }
  };

  const handleAuthSuccess = async (user) => {
    console.log('=== AUTH SUCCESS START ===');
    try {
      console.log('User authenticated:', user.uid, user.email, 'Role:', user.role);
      
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      const localProgress = getUserProgressLocal(user.uid);
      console.log('Local progress check:', {
        found: !!localProgress,
        hasOnboardingComplete: localProgress?.onboardingComplete,
        hasProfileOnboardingComplete: localProgress?.profile?.onboardingComplete
      });
      
      const isOnboardingCompleteLocal = localProgress && (
        localProgress.onboardingComplete === true || 
        localProgress.profile?.onboardingComplete === true
      );
      
      if (localProgress && isOnboardingCompleteLocal) {
        console.log('✅ Found complete local progress, loading immediately');
        setUserProgress(localProgress);
        setIsOnboardingComplete(true);
      } else if (localProgress) {
        console.log('⚠️ Found local progress but onboarding not marked complete');
        console.log('Local progress:', localProgress);
      }
      
      try {
        console.log('Checking Firebase for user data...');
        const userData = await getUserProgress(user.uid);
        console.log('Firebase data check:', {
          found: !!userData,
          hasProfile: !!userData?.profile,
          profileOnboardingComplete: userData?.profile?.onboardingComplete,
          topLevelOnboardingComplete: userData?.onboardingComplete
        });
        
        if (userData) {
          const hasCompleteOnboarding = userData.onboardingComplete === true || 
                                       userData.profile?.onboardingComplete === true;
          
          if (hasCompleteOnboarding) {
            console.log('✅ Firebase shows onboarding complete, loading data');
            setUserProgress(userData);
            setIsOnboardingComplete(true);
            saveUserProgressLocal(user.uid, userData);
          } else {
            console.log('❌ Firebase data exists but onboarding not complete');
          }
        } else {
          console.log('❌ No Firebase data found');
        }
      } catch (error) {
        console.error('❌ Error checking Firebase user data:', error);
      }
    } finally {
      setIsLoading(false);
      console.log('=== AUTH SUCCESS END ===');
    }
  };

  const handleAuthModeSwitch = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  const handleGoBackToChoice = () => {
    setAuthMode('choice');
  };

  const handleEvaluationComplete = async (userData, answers, quiz, evaluation) => {
    if (!currentUser) {
      console.error('No current user for evaluation completion');
      return;
    }

    const studyPlan = await generateStudyPlan(evaluation, userData.subjects, userData.topics);

    const initialProgress = {
      profile: {
        ...userData,
        email: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      },
      subjects: {},
      evaluation: evaluation,
      studyPlan: studyPlan,
      gamification: { points: 100, streak: 1, badges: ["Early Adopter"] }
    };

    saveUserProgressLocal(currentUser.uid, initialProgress);

    setUserProgress(initialProgress);
    setIsOnboardingComplete(true);

    try {
      const success = await completeOnboarding(currentUser.uid, initialProgress);
      if (success) {
        console.log("✅ User profile created and evaluation completed in Firebase");
      } else {
        console.warn("⚠️ Firebase operation failed, but local save successful");
      }
    } catch (error) {
      console.error("❌ Error saving to Firebase:", error);
    }
  };


  useEffect(() => {
    const checkFirebaseAndSetup = async () => {
      try {
        const { auth } = await import('./services/firebase.js');
        
        if (!auth) {
          setIsLoading(false);
          setAuthMode('choice');
          return;
        }

        const loadingTimeout = setTimeout(() => {
          setIsLoading(false);
          setAuthMode('choice');
        }, 5000);

        const unsubscribe = onAuthStateChange(async (user) => {
          clearTimeout(loadingTimeout);
          
          if (user && allowAutoLogin) {
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            };
            await handleAuthSuccess(userData);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setIsOnboardingComplete(false);
            setUserProgress(null);
            setAuthMode('choice');
            setIsLoading(false);
          }
        });

        return () => {
          clearTimeout(loadingTimeout);
          unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up Firebase auth:', error);
        setIsLoading(false);
        setAuthMode('choice');
      }
    };

    const cleanup = checkFirebaseAndSetup();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser && isOnboardingComplete) {
      const unsubscribe = subscribeToUserProgress(currentUser.uid, (data) => {
        if (data) {
          setUserProgress(data);
        }
      });
      
      return () => unsubscribe();
    }
  }, [currentUser, isOnboardingComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading your learning journey...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'choice' || !authMode) {
      return <AuthChoice onChoice={handleAuthChoice} />;
    }
    
    return (
      <Auth 
        mode={authMode} 
        onSuccess={handleAuthSuccess} 
        onSwitchMode={handleAuthModeSwitch}
        onGoBack={handleGoBackToChoice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-200">
      {!isOnboardingComplete || !userProgress ? (
        <EvaluationQuiz 
          onComplete={handleEvaluationComplete} 
        />
      ) : (
        <EnhancedDashboard
          userProgress={userProgress}
          subjects={SUBJECTS}
          userId={currentUser.uid}
          onLogout={async () => { await logoutUser(); setCurrentUser(null); setIsAuthenticated(false); setAuthMode('choice'); clearAllLocalData(); }}
        />
      )}
    </div>
  );
};

export default App;
