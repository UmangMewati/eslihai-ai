import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';

const API_URL = 'http://127.0.0.1:5000/api/chat';

function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [error, setError] = useState(null);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Apply dark mode class and persist preference
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Scroll to bottom if near bottom
  const scrollToBottom = useCallback(() => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (nearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Fetch chat history once on mount from backend or localStorage fallback
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          const loadedMessages = data.history.map(({ role, content, timestamp }) => ({
            sender: role === 'user' ? 'user' : 'ai',
            text: content,
            time: new Date(timestamp).toLocaleString(),
          }));
          setMessages(loadedMessages);
        } else {
          // fallback to localStorage if backend fails or no data
          const saved = localStorage.getItem('chatHistory');
          if (saved) setMessages(JSON.parse(saved));
        }
      } catch (err) {
        console.warn('Failed to fetch history from backend:', err);
        const saved = localStorage.getItem('chatHistory');
        if (saved) setMessages(JSON.parse(saved));
      }
    }
    fetchHistory();
  }, []);

  // Debounced save chat history to localStorage and sync backend to avoid too frequent writes
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('chatHistory', JSON.stringify(messages));

      // Sync to backend (fire and forget)
      fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      }).catch(() => {
        // silently ignore failures
      });
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages]);

  // Auto scroll on new messages
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (recognitionActive) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition API not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecognitionActive(true);

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' : '') + speechResult);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setRecognitionActive(false);
      if (event.error === 'no-speech' || event.error === 'network') {
        setTimeout(startListening, 1000); // retry listening automatically
      }
    };

    recognition.onend = () => setRecognitionActive(false);

    recognition.start();
    recognitionRef.current = recognition;
  }, [recognitionActive]);

  // Stop speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setRecognitionActive(false);
    }
  }, []);

  // Text-to-speech helper (if enabled)
  const speakText = useCallback(
    (text) => {
      if (!ttsEnabled) return;
      if (!window.speechSynthesis) return;
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled]
  );

  // Send message handler
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Command detection (starts with /)
    if (trimmed.startsWith('/')) {
      if (trimmed === '/clear') {
        setMessages([]);
        setInput('');
        setError(null);
        return;
      }
      // You can add more commands here in future
    }

    const userMessage = {
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP status ${response.status}`);

      const data = await response.json();
      const aiReplyText = data.reply || 'No reply received.';

      const aiMessage = {
        sender: 'ai',
        text: aiReplyText,
        time: new Date().toLocaleString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      speakText(aiReplyText);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to get reply from AI.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, speakText]);

  // Export chat as .txt file
  const exportChat = useCallback(() => {
    if (messages.length === 0) return;
    const text = messages
      .map(
        (msg) =>
          `[${msg.time}] ${msg.sender === 'user' ? 'You' : 'AI'}: ${msg.text}`
      )
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_history.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }, [messages]);

  // Clear input helper
  const clearInput = useCallback(() => setInput(''), []);

  return (
    <div
      className={`${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
      } min-h-screen p-4 transition-colors duration-300`}
      aria-live="polite"
    >
      <div className="max-w-2xl mx-auto flex flex-col h-screen">
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold select-none">Chat with AI</h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1"
              aria-pressed={darkMode}
              aria-label="Toggle dark mode"
              type="button"
            >
              {darkMode ? '☀ Light' : '🌙 Dark'}
            </button>

            <button
              onClick={() => setTtsEnabled((v) => !v)}
              className={`px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                ttsEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              aria-pressed={ttsEnabled}
              aria-label="Toggle speech synthesis"
              type="button"
            >
              {ttsEnabled ? '🔊 TTS On' : '🔇 TTS Off'}
            </button>
          </div>
        </header>

        <main
          ref={chatContainerRef}
          className={`rounded-lg p-4 flex-grow overflow-y-auto mb-4 whitespace-pre-wrap ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          tabIndex={-1}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-3 max-w-[80%] ${
                msg.sender === 'user' ? 'ml-auto text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-xl break-words ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-300 text-black'
                }`}
              >
                <p>{msg.text}</p>
              </div>
              <time
                className="text-xs mt-1 text-gray-400"
                dateTime={new Date(msg.time).toISOString()}
              >
                {msg.time}
              </time>
            </div>
          ))}

          {loading && (
            <p className="text-gray-400 italic flex items-center gap-2" aria-live="assertive">
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              AI is typing...
            </p>
          )}

          {error && (
            <div
              className="text-red-400 my-2 flex justify-between items-center"
              role="alert"
              aria-live="assertive"
            >
              <span>{error}</span>
              <button
                onClick={handleSend}
                className="underline text-red-600 hover:text-red-800 focus:outline-none"
                aria-label="Retry sending message"
                type="button"
              >
                Retry
              </button>
            </div>
          )}
        </main>

        <section className="flex flex-col gap-2" aria-label="Chat input section">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message or use voice"
              className={`w-full p-3 rounded border ${
                darkMode
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-black'
              } resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Chat input"
            />
            {input && (
              <button
                onClick={clearInput}
                type="button"
                aria-label="Clear input"
                className="absolute top-1.5 right-1.5 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={recognitionActive ? stopListening : startListening}
                type="button"
                className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  recognitionActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                aria-pressed={recognitionActive}
                aria-label={recognitionActive ? 'Stop voice input' : 'Start voice input'}
              >
                {recognitionActive ? '🎙️ Stop' : '🎙️ Speak'}
              </button>

              <button
                onClick={exportChat}
                type="button"
                disabled={messages.length === 0}
                className="px-4 py-2 rounded bg-gray-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1"
                aria-disabled={messages.length === 0}
                aria-label="Export chat as text file"
              >
                💾 Export Chat
              </button>
            </div>

            <button
              onClick={handleSend}
              type="button"
              disabled={loading || !input.trim()}
              className="px-6 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1"
              aria-disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Chat;
