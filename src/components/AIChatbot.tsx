import React, { useState, useRef, useEffect } from "react";
import { Card, Input, Button, Avatar, Typography } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";

const { Title } = Typography;

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hello! I am your AI cat care assistant. Ask me anything about kitten health, behavior, or care!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Sorry, I encountered an error answering your question.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Network error. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="AI Cat Care Assistant"
      className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col"
    >
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 mb-4"
        style={{ height: "calc(80vh - 140px)" }}
      >
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar
                  icon={
                    msg.role === "user" ? <UserOutlined /> : <RobotOutlined />
                  }
                  className={`flex-shrink-0 ${msg.role === "user" ? "ml-3 bg-blue-500" : "mr-3 bg-green-500"}`}
                />
                <div
                  className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-800"}`}
                >
                  {msg.role === "ai" ? (
                    <div className="markdown-body text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-sm">{msg.content}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {loading && (
          <div className="flex justify-start">
            <Avatar icon={<RobotOutlined />} className="mr-3 bg-green-500" />
            <div className="p-3 rounded-lg bg-gray-100 text-gray-500 text-sm italic">
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 mt-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Ask about cat food, strange behaviors, etc..."
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}
