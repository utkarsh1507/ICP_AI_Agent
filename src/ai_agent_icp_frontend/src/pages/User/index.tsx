import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/hooks/useAuth";
import { sendPrompt } from "../../utils/sendPrompt";
import { getIntro } from "../../utils/ai";
import "./index.css";
import Header from "../../components/pages/Landing/Header";

const User = () => {
  const auth = useAuth();
  if (!auth) return <div className="loading">Loading...</div>;

  const { login, isAuthenticated, principal } = auth;
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([]);
  const [displayedMessages, setDisplayedMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([]);

  // Typing effect hook
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "ai") {
      setDisplayedMessages(messages);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedMessages((prev) => [
        ...messages.slice(0, -1),
        { ...lastMsg, content: lastMsg.content.slice(0, i + 1) },
      ]);
      i++;
      if (i >= lastMsg.content.length) clearInterval(interval);
    }, 30); // typing speed (ms per char)

    return () => clearInterval(interval);
  }, [messages]);

  useEffect(() => {
    const fetchIntro = async () => {
      try {
        const res = await getIntro();
        setMessages([{ role: "ai", content: res }]);
      } catch (error) {
        console.error("Error fetching intro:", error);
      }
    };
    fetchIntro();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

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

      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }

    setPrompt("");
  };

  return (
    <section className="dashboard">
      <Header />
      <h1 className="dashboard-title">{principal?.toText?.()}</h1>

      <div className="chat-container">
        {displayedMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.role === "ai" ? "ai-message" : "user-message"}`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask Mintfinity... e.g., 'Create a token with 1M supply'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        {isAuthenticated ? (
          <button type="submit" className="chat-button">Ask AI</button>
        ) : (
          <button onClick={() => login()} className="chat-button">Login First</button>
        )}
      </form>
    </section>
  );
};

export default User;
