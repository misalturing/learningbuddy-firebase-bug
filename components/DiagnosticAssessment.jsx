import React from 'react';

const DiagnosticAssessment = ({ onClose }) => (
  <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
    <div className='bg-slate-800 p-6 rounded-lg'>
      <h2 className='text-white text-lg'>Diagnostic Assessment</h2>
      <p className='text-slate-400'>This is a placeholder for the Diagnostic Assessment.</p>
      <button onClick={onClose} className='mt-4 px-4 py-2 bg-indigo-600 rounded'>Close</button>
    </div>
  </div>
);

export default DiagnosticAssessment;
