import { useState } from "react";
import "./App.css";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [quizText, setQuizText] = useState("");
  const [error, setError] = useState("");
  const [userAnswers, setUserAnswers] = useState([]);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Helper: parse AI text to objects
  const parseQuiz = (text) => {
    const rawQs = text.split("\n\n").filter((q) => q.trim());
    return rawQs.map((q) => {
      const lines = q.split("\n");
      const question = lines[0].replace(/Question \d+:\s*/, "").trim();
      const options = lines
        .slice(1, 5)
        .map((l) => l.replace(/^[A-D]\.\s*/, "").trim());
      const answerLine = lines.find((l) => l.startsWith("Answer:"));
      const answer = answerLine?.split(":")[1]?.trim();
      return { question, options, answer };
    });
  };

  const renderAnswerText = (q, letter) => {
    if (!letter) return "No answer";
    const idx = letter.charCodeAt(0) - 65;
    return q.options[idx] ? `${letter}. ${q.options[idx]}` : letter;
  };

  // Generate quiz from AI
  const generateQuiz = async () => {
    setError("");
    setQuestions([]);
    setQuizText("");
    setFinished(false);
    setCurrentIndex(0);
    setScore(0);

    if (!apiKey) return setError("Please paste your OpenAI API key.");
    if (!topic.trim()) return setError("Please enter a topic.");

    setLoading(true);

    const prompt = `
Generate a ${count}-question multiple choice quiz about "${topic}".
Format as plain text:
1) Question line: "Question X: ..."
2) Four options labeled A., B., C., D.
3) Answer line: "Answer: X" (A/B/C/D)
`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      setQuizText(content.trim());
      const parsed = parseQuiz(content);
      setQuestions(parsed);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleNext = () => {
    const updated = [...userAnswers];
    updated[currentIndex] = selectedAnswer;
    setUserAnswers(updated);

    if (selectedAnswer === questions[currentIndex].answer) {
      setScore((s) => s + 1);
    }
    setSelectedAnswer("");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="app">
      <h1>AI Quiz Maker</h1>

      {!questions.length && (
        <>
          <label>OpenAI API Key:</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />

          <label>Topic:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Computer Science"
          />

          <label>Number of Questions:</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>

          {error && <p className="error">{error}</p>}

          <button onClick={generateQuiz} disabled={loading}>
            {loading ? "Generating..." : "Generate Quiz"}
          </button>

          {quizText && (
            <div className="quiz-output">
              <pre>{quizText}</pre>
            </div>
          )}
        </>
      )}

      {questions.length > 0 && !finished && (
        <div className="quiz-question">
          <h2>
            Question {currentIndex + 1}/{questions.length}
          </h2>
          <p>{questions[currentIndex].question}</p>
          {questions[currentIndex].options.map((opt, i) => (
            <button
              key={i}
              className={
                selectedAnswer === String.fromCharCode(65 + i) ? "selected" : ""
              }
              onClick={() => setSelectedAnswer(String.fromCharCode(65 + i))}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
          <button onClick={handleNext} disabled={!selectedAnswer}>
            Next
          </button>
        </div>
      )}

      {finished && (
        <div className="quiz-finished">
          <h2>Quiz Finished!</h2>
          <p>
            Your Score: {score} / {questions.length}
          </p>

          <h3>Review Answers:</h3>
          {questions.map((q, i) => (
            <div key={i} className="result-item">
              <p>
                <strong>Q{i + 1}:</strong> {q.question}
              </p>
              <p>
                <strong>Your answer:</strong>{" "}
                <span
                  style={{
                    color: userAnswers[i] === q.answer ? "green" : "red",
                  }}
                >
                  {renderAnswerText(q, userAnswers[i])}
                </span>
              </p>
              <p>
                <strong>Correct answer:</strong> {renderAnswerText(q, q.answer)}
              </p>
              <hr />
            </div>
          ))}

          <button
            onClick={() => {
              setQuestions([]);
              setFinished(false);
              setQuizText("");
              setUserAnswers([]);
              setScore(0);
            }}
          >
            Start New Quiz
          </button>
        </div>
      )}
    </div>
  );
}
