export default function Navbar({ user, onLogout }) {
  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("user");
    onLogout();
  };

  return (
    <nav className="flex justify-between p-4 bg-gray-900 text-white">
      <span className="font-bold">EsliHai AI</span>
      {user && <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded">Logout</button>}
    </nav>
  );
}
