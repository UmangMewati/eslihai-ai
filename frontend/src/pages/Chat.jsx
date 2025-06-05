import { useEffect, useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setResponse(data.reply);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Chat with AI</h2>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full border p-2 rounded" placeholder="Ask me anything..." />
      <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      <div className="mt-4 p-3 bg-gray-100 rounded">{response}</div>
    </div>
  );
}
