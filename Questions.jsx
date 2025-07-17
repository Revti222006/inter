import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTheme from "../hooks/useTheme";

export default function Questions() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { level, domain, interviewId } = state || {};
  const user = JSON.parse(localStorage.getItem("user"));
  const [tabSwitched, setTabSwitched] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 10 minutes = 600 seconds
  const [mediaStream, setMediaStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoRef = useRef(null);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const { theme } = useTheme();
  const backgroundImage = "/images/interview-bg.png";
  const hasImage = !!backgroundImage;

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        window.alert("Interview terminated: You switched tabs or minimized the window.");
        setTabSwitched(true);
        stopRecording();
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
        }
        setInterviewComplete(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [mediaStream]);

  useEffect(() => {
    fetch(`http://localhost:4000/api/questions?level=${level}&domain=${domain}`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(console.error);
  }, [level, domain]);

  // Countdown timer logic
  useEffect(() => {
    if (tabSwitched || interviewComplete) return;
    if (timeLeft === 0) {
      stopRecording();
      setInterviewComplete(true);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, interviewComplete]);

  useEffect(() => {
    if (questions.length > 0 && current < questions.length) {
      const audioPath = questions[current].audio_path;
      if (audioPath) {
        const audio = new Audio(audioPath);
        audio.play().catch(() => {});
      }
    }
  }, [current, questions]);

  useEffect(() => {
    if (tabSwitched || domain === "Quantitative Aptitude") return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  useEffect(() => {
    if (interviewComplete && redirectCountdown > 0) {
      const intervalId = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(intervalId);
    } else if (interviewComplete && redirectCountdown === 0) {
      window.location.replace("/dashboard");
    }
  }, [interviewComplete, redirectCountdown, navigate]);

  const startRecording = () => {
    if (domain === "Quantitative Aptitude") return;
    if (mediaStream) {
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(mediaStream);
      mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    const question = questions[current];
    if (!question) return; // 💥 Fix undefined error

    const isCoding = question.question_type === "coding";

    // For QA questions: Only store text
    if (domain === "Quantitative Aptitude") {
      fetch("http://localhost:4000/api/interviews/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interviewId,
          question_number: current + 1,
          question_text: question.question_text,
          question_type: question.question_type,
          video_path: null,
          code_answer: isCoding ? codeAnswer : textAnswer,
        }),
      }).then(res => res.json()).then(console.log).catch(console.error);
      return;
    }

    // For spoken/coding: Upload video
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}`;
        const fileName = `${user?.name || "user"}_${timestamp}.webm`;
        const formData = new FormData();
        formData.append("video", blob, fileName);

        try {
          const res = await fetch("http://localhost:4000/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          const videoPath = data.path || fileName;

          await fetch("http://localhost:4000/api/interviews/question", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              interview_id: interviewId,
              question_number: current + 1,
              question_text: question.question_text,
              question_type: question.question_type,
              video_path: videoPath,
              code_answer: isCoding ? codeAnswer : null,
            }),
          }).then(res => res.json()).then(console.log).catch(console.error);

        } catch (err) {
          console.error("Upload or DB update failed:", err);
        }
      };

      mediaRecorderRef.current.stop();
    }
  };

  const handleNext = () => {
    if (tabSwitched) return;
    stopRecording();
    setCodeAnswer("");
    setTextAnswer("");

    if (current + 1 >= questions.length) {
      setInterviewComplete(true);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    } else {
      setCurrent(current + 1);
    }
  };

  if (!questions.length) return <div className="text-center py-20 text-lg text-gray-500">Loading questions...</div>;

  if (interviewComplete) return (
    <div className="text-center py-20 text-2xl font-bold text-green-600">
      Interview complete!
      <div className="text-base font-medium text-gray-600 mt-4">
        Redirecting to dashboard in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
      </div>
    </div>
  );

  const question = questions[current];
  const isCoding = question.question_type === "coding";

  return (
    <div
      className="min-h-screen p-6 flex flex-col items-center transition-all duration-300"
      style={{
        backgroundImage: hasImage ? `url('${backgroundImage}')` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: !hasImage ? (theme === "dark" ? "#0f172a" : "#f9fafb") : undefined,
      }}
    >
      <div className="w-full max-w-4xl text-md text-gray-800 dark:text-gray-300 mb-6 font-medium text-center">
        Interview Timer: <span className="font-bold text-indigo-700 dark:text-indigo-400">{formatTime(timeLeft)}</span>
      </div>

      <div className="w-full max-w-4xl backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700 rounded-3xl shadow-2xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center">Question {current + 1}</h2>
        <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed text-center">{question.question_text}</p>

        {isCoding && (
          <textarea
            rows={10}
            className="w-full mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Write your code here..."
            value={codeAnswer}
            onChange={(e) => setCodeAnswer(e.target.value)}
          />
        )}

        {domain === "Quantitative Aptitude" && (
          <textarea
            rows={6}
            className="w-full mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 font-sans text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Type your answer here..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
          />
        )}

        <div className="text-center">
          <button
            onClick={handleNext}
            disabled={tabSwitched}
            className={`mt-4 px-6 py-3 ${tabSwitched ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"} text-white font-semibold rounded-xl shadow-lg transition-all`}
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
}
