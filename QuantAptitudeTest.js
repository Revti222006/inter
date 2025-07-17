import React, { useEffect, useState } from 'react';

const QuantAptitudeTest = () => {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 sec per question

  useEffect(() => {
    // Fetch questions from your backend
    fetch('/api/questions?level=Beginner&domain=Quantitative Aptitude')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 1) {
          handleNext(); // Auto next when time up
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [current]);

  const handleNext = () => {
    setTimeLeft(60); // reset timer
    setCurrent(prev => Math.min(prev + 1, questions.length - 1));
  };

  if (!questions.length) return <div>Loading...</div>;

  return (
    <div>
      <h2>Quantitative Aptitude Test</h2>
      <p><strong>Time Left:</strong> {timeLeft}s</p>
      <h3>Q{current + 1}: {questions[current].question_text}</h3>
      <button onClick={handleNext} disabled={current >= questions.length - 1}>Next</button>
    </div>
  );
};

export default QuantAptitudeTest;
