import { useState } from 'react';
import './App.css'

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quizText, setQuizText] = useState("");
  const [error, setError] = useState("");

  async function generateQuiz() {
    setError("");
    if (!apiKey) return setError("Please paste your OpenAI API key.");
    if (!topic.trim()) return setError("Please enter a topic.");

    setLoading(true);
    setQuizText("");

    const prompt = `
Generate a ${count}-question multiple choice quiz about "${topic}".
Format the output as plain text. For each question:
1) Show the question text
2) Provide four options labeled A., B., C., D.
3) On a new line after the options show "Answer: X" (where X is A/B/C/D).
Make questions clear and concise.
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
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className  = "app">
      <h1>AI Quiz Maker</h1>
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
        placeholder="e.g. Photosynthesis, WWII"
      />

      <label>Number of Questions:</label>
      <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
        <option value={3}>3</option>
        <option value={5}>5</option>
        <option value={10}>10</option>
      </select>

      {error && <p className="error">{error}</p>}

      <button onClick={generateQuiz} disabled={loading}>
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      <div className="quiz-output">
        <pre>{quizText || "Your quiz will appear here."}</pre>
      </div>
    </div>
  );
}