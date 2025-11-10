// Mock Gemini service

export const generateEvaluationQuiz = async (subjects, topics, level, year) => {
  console.log('Generating mock quiz for:', { subjects, topics, level, year });
  const quiz = [
    {
      question: 'What is 2 + 2?',
      questionType: 'MCQ',
      options: ['3', '4', '5'],
      subjectName: subjects[0]?.name,
      topicName: topics[subjects[0]?.id]?.[0]?.name,
      difficulty: 'Easy'
    }
  ];
  return Promise.resolve(quiz);
};

export const evaluateQuizAnswers = async (quiz, answers) => {
  console.log('Evaluating mock answers:', { quiz, answers });
  const evaluation = {
    Mathematics: {
      level: 2,
      analysis: 'You have a basic understanding of the concepts.'
    }
  };
  return Promise.resolve(evaluation);
};

export const generateStudyPlan = async (evaluation, subjects, topics) => {
  console.log('Generating mock study plan for:', { evaluation, subjects, topics });
  const plan = {
    Mathematics: [
      { date: 'Week 1', topic: 'Algebra', activity: 'Practice linear equations.' },
      { date: 'Week 2', topic: 'Geometry', activity: 'Review circle theorems.' },
    ]
  };
  return Promise.resolve(plan);
};
