import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/hooks/useAuth";
import { sendPrompt } from "../../utils/sendPrompt";
import "./index.css";
import { getIntro } from "../../utils/ai";

const User = () => {
  const auth = useAuth();
  if (!auth) return <div>Loading...</div>;

  const { login, isAuthenticated, principal } = auth;
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; content: string }[]>([]);

  // 🔹 Fetch Intro Message once on mount
  useEffect(() => {
    const fetchIntro = async () => {
      try {
        const res = await getIntro();
        setMessages([{ role: "ai", content: res }]); // intro as first AI message
      } catch (error) {
        console.error("Error fetching intro:", error);
      }
    };
    fetchIntro();
  }, []);

  // 🔹 Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() === "") return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);

    try {
      const aiResponse = await sendPrompt(prompt, principal?.toText?.());
      type AIResponseItem = { Text?: string; PairList?: [string, string][] };
      const firstItem = aiResponse ? (aiResponse[0] as AIResponseItem) : null;

      let reply = "";
      if (firstItem?.Text) {
        reply = firstItem.Text;
      } else if (firstItem?.PairList) {
        reply = firstItem.PairList.map(([k, v]) => `${k}: ${v}`).join("\n");
      } else {
        reply = JSON.stringify(aiResponse);
      }

      // Add AI message
      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }

    setPrompt(""); // clear input
  };

  return (
    <section className="hero">
      <div>User Dashboard</div>

      {/* 🔹 Chat UI */}
      <div className="chat-container">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.role === "ai" ? "ai-message" : "user-message"}`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* 🔹 Prompt Form */}
      <form className="hero-prompt-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="hero-prompt-input"
          placeholder="Ask Mintfinity... e.g., 'Create a new token called MyToken with 1M supply'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        {isAuthenticated ? (
          <button type="submit" className="hero-prompt-button">
            Ask AI
          </button>
        ) : (
          <button onClick={() => login()} className="hero-prompt-button">
            Login First
          </button>
        )}
      </form>
    </section>
  );
};

export default User;
