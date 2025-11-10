import React, { useState, useEffect } from 'react';
import LearningSession from './LearningSession.jsx';
import DiagnosticAssessment from './DiagnosticAssessment.jsx';
import StudySessionTracker from './StudySessionTracker.jsx';
import SpacedRepetitionSystem from './SpacedRepetitionSystem.jsx';
import { CompanionIcon } from './icons/AgentIcons.jsx';
import { getUserAnalytics, getTopicsForReview } from '../services/enhancedDatabaseService.js';

const EnhancedDashboard = ({ 
  userProgress, 
  subjects, 
  updateProgress, 
  updateGamification, 
  userId, 
  onLogout 
}) => {
  const [activeTopic, setActiveTopic] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(null);
  const [showSpacedRepetition, setShowSpacedRepetition] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [reviewTopics, setReviewTopics] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'subjects', 'analytics', 'review'

  useEffect(() => {
    loadAnalytics();
    loadReviewTopics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      const data = await getUserAnalytics(userId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadReviewTopics = async () => {
    try {
      const topics = await getTopicsForReview(userId);
      setReviewTopics(topics);
    } catch (error) {
      console.error('Error loading review topics:', error);
    }
  };

  const getOverallProgress = () => {
    if (!userProgress?.subjects) return 0;
    
    let totalTopics = 0;
    let totalMastery = 0;
    
    Object.values(userProgress.subjects).forEach(subject => {
      if (subject.topics) {
        Object.values(subject.topics).forEach(topic => {
          totalTopics++;
          totalMastery += topic.progress || 0;
        });
      }
    });
    
    return totalTopics > 0 ? Math.round(totalMastery / totalTopics) : 0;
  };

  if (activeTopic) {
    return (
      <StudySessionTracker 
        userId={userId}
        subjectCode={activeTopic.subject.id}
        initialTopic={activeTopic.topic.id}
      >
        <LearningSession 
          subject={activeTopic.subject} 
          topic={activeTopic.topic} 
          onExit={() => setActiveTopic(null)} 
          userName={userProgress.userName || userProgress.profile?.userName}
          updateGamification={updateGamification}
          userId={userId}
        />
      </StudySessionTracker>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800/50 p-6 border-r border-slate-700 flex-shrink-0 flex flex-col">
        {/* User Profile */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 ring-4 ring-indigo-500/30">
            <span className="text-2xl font-bold text-white">
              {(userProgress.userName || userProgress.profile?.userName || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white">
            {userProgress.userName || userProgress.profile?.userName || 'Student'}
          </h2>
          <div className="text-sm text-slate-400">
            {userProgress.profile?.grade || 'O-Level Student'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="text-sm text-slate-400 mb-1">Overall Progress</div>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-white mr-2">
                {getOverallProgress()}%
              </div>
              <div className="flex-1 bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${getOverallProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          <GamificationWidget progress={userProgress.gamification} />
        </div>

        {/* Logout */}
        <div className="mt-auto pt-6">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
         <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {userProgress.userName || userProgress.profile?.userName}! 👋
        </h1>
      </main>

      {showDiagnostic && (
        <DiagnosticAssessment
          userId={userId}
          subjectCode={showDiagnostic}
          onClose={() => setShowDiagnostic(null)}
        />
      )}

      {showSpacedRepetition && (
        <SpacedRepetitionSystem
          userId={userId}
          onClose={() => setShowSpacedRepetition(false)}
        />
      )}
    </div>
  );
};

const GamificationWidget = ({ progress }) => {
  if (!progress) return null;

  return (
    <div className="bg-slate-700/50 rounded-lg p-4">
      <div className="text-sm text-slate-400 mb-3">Progress</div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-yellow-400">🏆 Points</span>
          <span className="font-bold text-white">{progress.points || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-orange-400">🔥 Streak</span>
          <span className="font-bold text-white">{progress.streak || 0} days</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-purple-400">🏅 Badges</span>
          <span className="font-bold text-white">{progress.badges?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
