import { useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

export default function Home({ onLogin }) {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="flex flex-col items-center mt-10 space-y-4">
      {showSignup ? (
        <>
          <SignupForm onSignup={() => setShowSignup(false)} />
          <p className="text-sm">Already have an account? <button onClick={() => setShowSignup(false)} className="text-blue-600">Login</button></p>
        </>
      ) : (
        <>
          <LoginForm onLogin={onLogin} />
          <p className="text-sm">Don't have an account? <button onClick={() => setShowSignup(true)} className="text-blue-600">Signup</button></p>
        </>
      )}
    </div>
  );
}
