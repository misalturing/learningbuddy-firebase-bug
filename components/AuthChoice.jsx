import React from 'react';

const AuthChoice = ({ onChoice }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="p-8 bg-slate-800 rounded-lg shadow-lg w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Learning Buddy</h1>
        <p className="text-slate-400 mb-8">Choose your login method</p>
        <div className="space-y-4">
          <button 
            onClick={() => onChoice('login')}
            className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Sign in with Email
          </button>
          <button 
            onClick={() => onChoice('demo')}
            className="w-full px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors"
          >
            Continue in Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthChoice;
