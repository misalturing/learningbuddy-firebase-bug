import React from 'react';

const Auth = ({ onSuccess, onSwitchMode, onGoBack }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="p-8 bg-slate-800 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>
        <p className="text-slate-400 mb-4 text-center">Use a test account to sign in.</p>
        <button 
          onClick={() => onSuccess({ uid: 'test-user-123', email: 'test@example.com', displayName: 'Test User' })}
          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Log in as Test User
        </button>
        <button onClick={onGoBack} className="w-full mt-4 text-sm text-slate-400 hover:text-white">Back</button>
      </div>
    </div>
  );
};

export default Auth;
