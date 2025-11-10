/**
 * Unit Tests for Firebase Profile Creation Bug
 *
 * These tests verify that the createUserProfile function correctly handles
 * the nested profile data structure when saving to Firestore.
 *
 * The bug: createUserProfile tries to access profileData.userName instead of
 * profileData.profile.userName, causing usernames to not be saved.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUserProfile, completeOnboarding } from '../services/enhancedDatabaseService.js';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ collection, id })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
  arrayUnion: vi.fn((val) => val),
  increment: vi.fn((val) => val)
}));

vi.mock('../services/firebase.js', () => ({
  db: { type: 'mock-db' }
}));

// Mock localStorage
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  clear() {
    this.data = {};
  }
};

global.localStorage = mockLocalStorage;

describe('Firebase Profile Creation - userName Bug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('createUserProfile', () => {
    it('should correctly extract userName from nested profile object', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'test-user-123';
      const profileData = {
        profile: {
          userName: 'John Doe',
          email: 'john@example.com',
          grade: 'O-Level',
          targetExamYear: 2026
        },
        subjects: {},
        gamification: {
          points: 100,
          streak: 1,
          badges: ['Welcome Badge']
        }
      };

      await createUserProfile(userId, profileData);

      // Verify setDoc was called
      expect(setDoc).toHaveBeenCalled();

      // Get the actual data that was passed to setDoc
      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // CRITICAL TEST: Verify userName is saved at the top level
      // This is the bug - it should be extracted from profileData.profile.userName
      expect(savedData).toHaveProperty('userName');
      expect(savedData.userName).toBe('John Doe');

      // Verify it's not undefined (the bug causes this)
      expect(savedData.userName).not.toBeUndefined();
      expect(savedData.userName).not.toBeNull();
    });

    it('should correctly extract examDate from nested profile object', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'test-user-456';
      const profileData = {
        profile: {
          userName: 'Jane Smith',
          email: 'jane@example.com',
          examDate: '15/06/26',
          grade: 'O-Level',
          targetExamYear: 2026
        },
        subjects: {}
      };

      await createUserProfile(userId, profileData);

      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // Verify examDate is correctly saved
      expect(savedData).toHaveProperty('examDate');
      expect(savedData.examDate).toBe('15/06/26');
    });

    it('should preserve nested profile structure', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'test-user-789';
      const profileData = {
        profile: {
          userName: 'Test User',
          email: 'test@example.com',
          grade: 'O-Level',
          targetExamYear: 2026
        },
        subjects: {},
        gamification: { points: 100, streak: 1, badges: [] }
      };

      await createUserProfile(userId, profileData);

      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // Verify profile object exists and has correct structure
      expect(savedData).toHaveProperty('profile');
      expect(savedData.profile).toHaveProperty('email', 'test@example.com');
      expect(savedData.profile).toHaveProperty('grade', 'O-Level');
    });

    it('should handle completeOnboarding with correct data extraction', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'onboarding-user-123';
      const onboardingData = {
        profile: {
          userName: 'Sarah Connor',
          email: 'sarah@example.com',
          examDate: '01/12/26',
          grade: 'O-Level',
          targetExamYear: 2026
        },
        subjects: {
          math: { progress: 0 }
        }
      };

      await completeOnboarding(userId, onboardingData);

      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // Verify all critical fields are saved correctly
      expect(savedData.userName).toBe('Sarah Connor');
      expect(savedData.examDate).toBe('01/12/26');
      expect(savedData.onboardingComplete).toBe(true);
    });

    it('should not lose userName when other fields are present', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'test-user-complex';
      const profileData = {
        profile: {
          userName: 'Complex User',
          email: 'complex@example.com',
          grade: 'O-Level',
          targetExamYear: 2026,
          examDate: '20/08/26',
          subjects: ['Math', 'Science'],
          additionalInfo: 'Some extra data'
        },
        subjects: {
          math: { topics: {} },
          science: { topics: {} }
        },
        evaluation: { score: 85 },
        studyPlan: { weeks: 12 },
        gamification: { points: 500, streak: 10, badges: ['Early Bird'] }
      };

      await createUserProfile(userId, profileData);

      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // The bug causes userName to be undefined when the structure is complex
      // This test ensures it's correctly extracted regardless of complexity
      expect(savedData.userName).toBe('Complex User');
      expect(savedData.examDate).toBe('20/08/26');
      expect(savedData.subjects).toBeDefined();
      expect(savedData.evaluation).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing userName gracefully', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'test-user-no-name';
      const profileData = {
        profile: {
          email: 'noname@example.com',
          grade: 'O-Level'
        },
        subjects: {}
      };

      await createUserProfile(userId, profileData);

      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // Should handle missing userName without crashing
      // May be undefined, but should not throw error
      expect(setDocCall).toBeDefined();
    });

    it('should handle flat structure for backward compatibility', async () => {
      const { setDoc } = await import('firebase/firestore');

      const userId = 'test-user-flat';
      const profileData = {
        userName: 'Flat Structure User',
        email: 'flat@example.com',
        grade: 'O-Level',
        subjects: {}
      };

      await createUserProfile(userId, profileData);

      const setDocCall = setDoc.mock.calls[0];
      const savedData = setDocCall[1];

      // Should still work if data is already flat
      expect(savedData.userName).toBeDefined();
    });
  });
});
