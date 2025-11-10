// Mock Authentication service

export const onAuthStateChange = (callback) => {
  // Simulate that the user is always logged out initially.
  const timeoutId = setTimeout(() => callback(null), 100);
  // Return an unsubscribe function.
  return () => clearTimeout(timeoutId);
};

export const logoutUser = async () => {
  console.log('User logged out');
  return Promise.resolve();
};

export const registerUser = async (email, password) => {
    const user = { uid: `registered-${Date.now()}`, email, displayName: email };
    return Promise.resolve({ user });
}

export const loginUser = async (email, password) => {
    const user = { uid: `loggedin-${Date.now()}`, email, displayName: email };
    return Promise.resolve({ user });
}