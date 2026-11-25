import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in.");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <form
        onSubmit={submit}
        className="bg-white w-full max-w-md rounded-2xl p-8 shadow-xl"
      >
        <p className="text-emerald-700 font-semibold text-sm">FIELDSTOCK</p>
        <h1 className="text-2xl font-bold mt-2">Sign in to your account</h1>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          Military Asset Management System
        </p>


        <label className="text-sm">
          Username
          <input
            className="mt-1 mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required/>
        </label>


        <label className="text-sm">
          Password
          <input
            className="mt-1 mb-4"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required/>
        </label>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button className="w-full bg-emerald-700 text-white rounded-lg py-3">
          Sign in
        </button>


        
      </form>
    </div>
  );
}
