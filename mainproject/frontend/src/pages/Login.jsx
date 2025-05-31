 
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (email, method = "password") => {
    try {
      let userCred;
      if (method === "password") {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await signInWithPopup(auth, googleProvider);
        email = userCred.user.email;
      }

      // Call backend login to get userId and accountType
      const res = await axios.post("/api/login", {
        type: "email",
        email,
      });

      const { userId, accountType } = res.data;
      localStorage.setItem("userId", userId);
      localStorage.setItem("accountType", accountType);

      if (accountType === "BUSINESS") {
        navigate("/dashboard/org");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Login failed. Please check your credentials or try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">🔐 Sign In</h2>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email);
          }}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full border px-4 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border px-4 py-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <div className="text-center my-4 text-gray-500">or</div>

        <button
          onClick={() => handleLogin(null, "google")}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
