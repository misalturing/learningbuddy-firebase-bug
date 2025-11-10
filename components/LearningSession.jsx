import React from 'react';

const LearningSession = ({ onExit }) => (
  <div className='p-8'>
    <h2 className='text-white text-xl'>Learning Session</h2>
    <p className='text-slate-400'>This is a placeholder for the Learning Session.</p>
    <button onClick={onExit} className='mt-4 px-4 py-2 bg-indigo-600 rounded'>Exit Session</button>
  </div>
);

export default LearningSession;
