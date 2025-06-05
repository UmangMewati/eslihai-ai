import { useState } from "react";

export default function SignupForm({ onSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Signup successful! Now login.");
      onSignup();
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 bg-white p-4 rounded shadow w-80">
      <h2 className="text-xl font-bold">Signup</h2>
      <input className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">Signup</button>
    </form>
  );
}
