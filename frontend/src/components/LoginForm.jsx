import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", username);
      onLogin(username);
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 bg-white p-4 rounded shadow w-80">
      <h2 className="text-xl font-bold">Login</h2>
      <input className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Login</button>
    </form>
  );
}
