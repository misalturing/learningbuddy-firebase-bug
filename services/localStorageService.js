const APP_PREFIX = 'learningBuddy_';
let isDemo = false;

export const setDemoMode = (demo) => {
  isDemo = demo;
};

const getKey = (userId) => {
  if (isDemo || userId === 'demo-user') return `${APP_PREFIX}demo_progress`;
  return `${APP_PREFIX}user_progress_${userId}`;
};

export const saveUserProgressLocal = (userId, progress) => {
  try {
    const key = getKey(userId);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to local storage', e);
  }
};

export const getUserProgressLocal = (userId) => {
  try {
    const key = getKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to get progress from local storage', e);
    return null;
  }
};

export const clearAllLocalData = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(APP_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Cleared all app-related local storage.');
  } catch (e) {
    console.error('Failed to clear local storage', e);
  }
};

export const debugLocalStorage = () => {
  console.log('--- Local Storage Debug ---');
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(APP_PREFIX)) {
      console.log(`[${key}]:`, JSON.parse(localStorage.getItem(key)));
    }
  });
  console.log('---------------------------');
};
