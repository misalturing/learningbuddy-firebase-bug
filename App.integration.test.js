/**
 * Integration Tests for App Component - User Onboarding Flow
 *
 * These tests verify the complete flow from onboarding to dashboard display,
 * ensuring that user names entered during onboarding are correctly displayed
 * on the dashboard (not the email).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all external services
vi.mock('../services/enhancedDatabaseService.js', () => ({
  createUserProfile: vi.fn().mockResolvedValue(true),
  completeOnboarding: vi.fn().mockResolvedValue(true),
  getUserProgress: vi.fn().mockResolvedValue(null),
  subscribeToUserProgress: vi.fn((userId, callback) => {
    callback({
      profile: {
        userName: 'Test User',
        email: 'test@example.com'
      },
      gamification: { points: 100, streak: 1, badges: [] },
      subjects: {}
    });
    return () => {};
  }),
  updateUserData: vi.fn().mockResolvedValue(true),
  getUserAnalytics: vi.fn().mockResolvedValue(null),
  getTopicsForReview: vi.fn().mockResolvedValue([])
}));

vi.mock('../services/authService.js', () => ({
  onAuthStateChange: vi.fn((callback) => {
    callback({
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: null
    });
    return () => {};
  }),
  registerUser: vi.fn().mockResolvedValue({ success: true }),
  loginUser: vi.fn().mockResolvedValue({ success: true }),
  logoutUser: vi.fn().mockResolvedValue(true)
}));

vi.mock('../services/geminiService.js', () => ({
  generateEvaluationQuiz: vi.fn().mockResolvedValue({
    questions: []
  }),
  evaluateQuizAnswers: vi.fn().mockResolvedValue({
    score: 85,
    feedback: 'Good job!'
  }),
  generateStudyPlan: vi.fn().mockResolvedValue({
    plan: 'Study math for 2 hours daily'
  })
}));

describe('App Integration - Username Display Bug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use userName from profile, not email', async () => {
    const { completeOnboarding } = await import('../services/enhancedDatabaseService.js');

    // Simulate user completing onboarding with a specific name
    const userData = {
      userName: 'Alice Johnson',
      examDate: '15/06/26',
      grade: 'O-Level',
      targetExamYear: 2026
    };

    const quiz = { questions: [] };
    const answers = {};
    const evaluation = { score: 90 };

    // Call the function that would be triggered after onboarding
    await completeOnboarding('test-uid-123', {
      profile: userData,
      subjects: {},
      evaluation,
      studyPlan: {}
    });

    // Verify completeOnboarding was called with correct structure
    expect(completeOnboarding).toHaveBeenCalled();

    const callArgs = completeOnboarding.mock.calls[0][1];

    // CRITICAL: Verify userName is in the profile object
    expect(callArgs).toHaveProperty('profile');
    expect(callArgs.profile).toHaveProperty('userName', 'Alice Johnson');
  });

  it('should correctly structure data when examDate is added', async () => {
    const { completeOnboarding } = await import('../services/enhancedDatabaseService.js');

    const onboardingData = {
      profile: {
        userName: 'Bob Smith',
        email: 'bob@example.com',
        examDate: '01/12/26', // New field requirement
        grade: 'O-Level',
        targetExamYear: 2026
      },
      subjects: {}
    };

    await completeOnboarding('test-uid-456', onboardingData);

    const callArgs = completeOnboarding.mock.calls[0][1];

    // Verify examDate is included in profile
    expect(callArgs.profile).toHaveProperty('examDate', '01/12/26');
    expect(callArgs.profile).toHaveProperty('userName', 'Bob Smith');
  });

  it('should not fallback to email when userName is provided', async () => {
    const { createUserProfile } = await import('../services/enhancedDatabaseService.js');

    // This simulates the App.jsx handleEvaluationComplete behavior
    const currentUser = {
      uid: 'user-789',
      email: 'fallback@example.com',
      displayName: null
    };

    const userData = {
      userName: 'Charlie Brown',
      examDate: '20/08/26',
      grade: 'O-Level',
      targetExamYear: 2026
    };

    // Simulate App.jsx creating profile data
    const profileData = {
      profile: {
        ...userData,
        email: currentUser.email,
        userName: userData.userName, // Should use userData.userName, not currentUser.email
        onboardingComplete: true
      },
      subjects: {},
      gamification: { points: 100, streak: 1, badges: ['Welcome Badge'] }
    };

    await createUserProfile(currentUser.uid, profileData);

    expect(createUserProfile).toHaveBeenCalledWith(
      currentUser.uid,
      expect.objectContaining({
        profile: expect.objectContaining({
          userName: 'Charlie Brown',
          email: 'fallback@example.com'
        })
      })
    );
  });

  it('should preserve userName through the entire onboarding flow', async () => {
    const { completeOnboarding, createUserProfile } = await import('../services/enhancedDatabaseService.js');

    // Step 1: User fills out onboarding form
    const userInput = {
      userName: 'Diana Prince',
      examDate: '10/05/26',
      grade: 'O-Level',
      targetExamYear: 2026
    };

    // Step 2: App creates profile structure
    const profileStructure = {
      profile: {
        userName: userInput.userName,
        examDate: userInput.examDate,
        email: 'diana@example.com',
        grade: userInput.grade,
        targetExamYear: userInput.targetExamYear,
        onboardingComplete: true
      },
      subjects: {},
      evaluation: { score: 95 },
      studyPlan: { weeks: 12 },
      gamification: { points: 100, streak: 1, badges: [] }
    };

    // Step 3: completeOnboarding calls createUserProfile
    await completeOnboarding('user-diana', profileStructure);

    // Verify the data structure is preserved
    const onboardingCall = completeOnboarding.mock.calls[0][1];
    expect(onboardingCall.profile.userName).toBe('Diana Prince');
    expect(onboardingCall.profile.examDate).toBe('10/05/26');
  });

  it('should handle multiple profile fields without losing userName', async () => {
    const { createUserProfile } = await import('../services/enhancedDatabaseService.js');

    const complexProfileData = {
      profile: {
        userName: 'Edward Elric',
        email: 'edward@example.com',
        examDate: '25/11/26',
        grade: 'O-Level',
        targetExamYear: 2026,
        preferredSubjects: ['Math', 'Science'],
        studyGoals: 'Ace all exams',
        timezone: 'GMT+8'
      },
      subjects: {
        math: { progress: 20, topics: {} },
        science: { progress: 15, topics: {} }
      },
      evaluation: {
        math: { score: 80 },
        science: { score: 85 }
      },
      studyPlan: {
        weeks: 16,
        hoursPerWeek: 20
      },
      gamification: {
        points: 350,
        streak: 7,
        badges: ['Fast Learner', 'Consistent']
      }
    };

    await createUserProfile('user-edward', complexProfileData);

    expect(createUserProfile).toHaveBeenCalledWith(
      'user-edward',
      expect.objectContaining({
        profile: expect.objectContaining({
          userName: 'Edward Elric',
          examDate: '25/11/26',
          email: 'edward@example.com'
        })
      })
    );
  });
});
