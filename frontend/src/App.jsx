import React, { useState, useEffect, useRef } from "react";

function LoginForm({ onLogin, setError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(username);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Login request failed");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Login
      </h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

function SignupForm({ onSwitch, setError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        onSwitch(); // go back to login after signup success
      } else {
        setError(data.message || "Signup failed");
      }
    } catch {
      setError("Signup request failed");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Signup
      </h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Signing up..." : "Signup"}
      </button>
      <p className="mt-3 text-center text-gray-600 dark:text-gray-300">
        Already have an account?{" "}
        <button
          onClick={onSwitch}
          type="button"
          className="text-blue-600 hover:underline"
        >
          Login
        </button>
      </p>
    </form>
  );
}

function App() {
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Setup dark mode toggle on mount and on change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Fetch chat history on user login
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    } else {
      setChatHistory([]);
    }
  }, [user]);

  // Scroll to bottom when chatHistory changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Auto clear error after 3 seconds
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(id);
  }, [error]);

  // Initialize speech recognition if available
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setError("Speech recognition error: " + event.error);
      setListening(false);
    };
    recognition.onresult = (event) => {
      if (event.results[0] && event.results[0][0]) {
        setInput(event.results[0][0].transcript);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const fetchChatHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await fetch("http://localhost:5000/api/chat/history", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(data.history);
      } else {
        setError("Failed to load chat history");
      }
    } catch {
      setError("Failed to load chat history");
    }
    setFetchingHistory(false);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setLoading(true);
    setInput("");

    // Handle special commands
    if (trimmedInput.toLowerCase() === "clear chat") {
      clearChat();
      setLoading(false);
      return;
    }
    if (trimmedInput.toLowerCase() === "logout") {
      handleLogout();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory((prev) => [...prev, { user_message: trimmedInput, assistant_reply: data.reply, timestamp: new Date().toISOString() }]);
      } else {
        setError(data.message || "Failed to get response");
      }
    } catch {
      setError("Request failed");
    }
    setLoading(false);
  };

  const clearChat = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/chat/clear", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory([]);
      } else {
        setError("Failed to clear chat");
      }
    } catch {
      setError("Clear chat request failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("user");
    setUser(null);
    setChatHistory([]);
  };

  const exportChat = () => {
    const text = chatHistory
      .map(
        (msg) =>
          `You: ${msg.user_message}\nAssistant: ${msg.assistant_reply}\nTime: ${new Date(
            msg.timestamp
          ).toLocaleString()}\n\n`
      )
      .join("");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "chat_history.txt";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-600 text-white rounded w-full max-w-xl flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {user ? (
        <main className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow max-w-xl w-full flex flex-col h-[90vh]">
          <header className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🧠 EsliHai AI
            </h1>
            <div className="space-x-2">
              <button
                onClick={exportChat}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Export
              </button>
              <button
                onClick={clearChat}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Clear
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </header>

          <section className="flex-1 overflow-auto space-y-4 p-2 border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-900">
            {fetchingHistory ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Loading chat history...
              </div>
            ) : chatHistory.length === 0 ? (
              <p className="text-center text-gray-500">No messages yet</p>
            ) : (
              [...chatHistory].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div>
                    <strong>You:</strong> {item.user_message}
                  </div>
                  <div>
                    <strong>Assistant:</strong> {item.assistant_reply}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex space-x-2 mt-4"
          >
            <textarea
              rows={2}
              className="flex-grow p-2 rounded border resize-none dark:bg-gray-700 dark:text-white"
              placeholder="Type your message or command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              onClick={startListening}
              className={`bg-yellow-500 px-4 py-2 rounded ${
                listening ? "animate-pulse" : ""
              }`}
              title="Start/Stop Voice Recognition"
            >
              🎤
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading || !input.trim()}
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
        </main>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center space-y-4">
          {showSignup ? (
            <>
              <SignupForm onSwitch={() => setShowSignup(false)} setError={setError} />
              <p className="text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
                <button
                  onClick={() => setShowSignup(false)}
                  className="text-blue-600 hover:underline"
                >
                  Login
                </button>
              </p>
            </>
          ) : (
            <>
              <LoginForm onLogin={(username) => {
                setUser(username);
                localStorage.setItem("user", username);
              }} setError={setError} />
              <p className="text-gray-600 dark:text-gray-300">
                Don’t have an account?{" "}
                <button
                  onClick={() => setShowSignup(true)}
                  className="text-blue-600 hover:underline"
                >
                  Signup
                </button>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
