import { useState, useEffect, useRef } from "react";
import "../index.css";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase"; // <- adjust to your actual firebase config
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

export default function ChatPage() {
  // ──────────────── User State (with localStorage) ────────────────
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chatUser"));
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (user) {
      localStorage.setItem("chatUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("chatUser");
    }
  }, [user]);

  // ──────────────── Login State ────────────────

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;

    try {
      let userCredential;
      if (isRegisterMode) {
        userCredential = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput.trim());
        alert("✅ Account created!");
      } else {
        userCredential = await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput.trim());
        alert("✅ Logged in!");
      }

      const newUser = { type: "email", email: userCredential.user.email };
      setUser(newUser);
      setEmailInput("");
      setPasswordInput("");
    } catch (error) {
      alert("❌ Error: " + error.message);
      console.error(error);
    }
  };

	const handleWalletLogin = async () => {
  	if (window.ethereum) {
    	try {
      	const provider = new ethers.BrowserProvider(window.ethereum);
	    	const accounts = await provider.send("eth_requestAccounts", []);
      	const address = accounts[0];

      	const newUser = { type: "wallet", address };
      	setUser(newUser);
      	alert("✅ Logged in with wallet!");
    	} catch (err) {
      	alert("❌ Wallet connection failed");
      	console.error(err);
    	}
  	} else {
    	alert("❗ MetaMask not found. Install it first.");
  	}
	};

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setMessages([
      {
        id: Date.now(),
        from: "bot",
        text: "👋 Hi there! Ask me anything about our business.",
      },
    ]);
    setFeedbackSentIds([]);
    setReportedIds([]);
  };


  // ──────────────── Chat State ────────────────
  const [messages, setMessages] = useState([
    { id: Date.now(), from: "bot", text: "👋 Hi there! Ask me anything about our business." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Track feedback & report states per message ID
  const [feedbackSentIds, setFeedbackSentIds] = useState([]);
  const [reportedIds, setReportedIds] = useState([]);

  // Auto-scroll
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ──────────────── Fetch History on Login ────────────────
  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;

      const queryParam = user.type === "email" ? `email=${user.email}` : `wallet=${user.address}`;
      try {
        const res = await fetch(`http://localhost:3000/api/history?${queryParam}`);
        const data = await res.json();
        if (Array.isArray(data.history) && data.history.length) {
          // Map each record to { id, from, text }
          const formatted = data.history.map((m) => ({
            id: new Date(m.createdAt).getTime() + Math.random(),
            from: m.from,
            text: m.text,
          }));
          setMessages(formatted);
        } else {
          // No history: initialize with greeting
          setMessages([
            { id: Date.now(), from: "bot", text: "👋 Hi there! Ask me anything about our business." },
          ]);
        }
      } catch (err) {
        console.error("❌ Error fetching history:", err);
      }
    }

    fetchHistory();
  }, [user]);

  // ──────────────── Send Message Handler ────────────────
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now() + Math.random(), from: "user", text: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Call backend /api/chat with { user, message }
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, message: trimmed }),
      });
      const data = await res.json();
      const botMsg = { id: Date.now() + Math.random(), from: "bot", text: data.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("❌ Chat error:", err);
      const errMsg = {
        id: Date.now() + Math.random(),
        from: "bot",
        text: "❗ Something went wrong. Please try again later.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ──────────────── Send Feedback Handler ────────────────
  const sendFeedback = async (msgId, msgText, feedbackValue) => {
    try {
      // 1) Record feedback in DB
      await fetch("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, message: msgText, feedback: feedbackValue }),
      });
      setFeedbackSentIds((prev) => [...prev, msgId]);

      // 2) If feedbackValue === "yes" AND user.type === "wallet", call /api/reward
      if (feedbackValue === "yes" && user.type === "wallet") {
        const toAddress = user.address;         // send to the user
        const rewardAmount = "10";              // 10 BCT tokens
        const rewardRes = await fetch("http://localhost:3000/api/reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: toAddress, amount: rewardAmount }),
        });
        const rewardData = await rewardRes.json();
        if (rewardData.status === "success") {
          console.log(`🎉 Rewarded ${rewardAmount} BCT to user ${toAddress}`);
        } else {
          console.error("❌ Reward API error:", rewardData);
        }
      }
    } catch (err) {
      console.error("❌ Feedback/Reward error:", err);
    }
    };

  // ──────────────── Send Report Handler ────────────────
  const sendReport = async (msgId, msgText) => {
    // Take last 5 messages as a snippet
    const snippetArray = messages.slice(-5).map((m) => ({
      from: m.from,
      text: m.text,
    }));

    try {
      await fetch("http://localhost:3000/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          messageId: msgId,
          messageText: msgText,
          history: snippetArray,
        }),
      });
      setReportedIds((prev) => [...prev, msgId]);
      alert("✅ Report submitted. Thank you!");
    } catch (err) {
      console.error("❌ Report error:", err);
      alert("❌ Failed to submit report. Try again.");
    }
  };

  // ──────────────── Render: Login Screen if Not Logged In ────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Login to Chat</h2>

          {/* Email/Password Login Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 border rounded"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="text-center text-sm text-gray-600">
  {isRegisterMode ? (
    <>
      Already have an account?{" "}
      <button className="text-blue-500 hover:underline" onClick={() => setIsRegisterMode(false)}>
        Login here
      </button>
    </>
  ) : (
    <>
      Don’t have an account?{" "}
      <button
        className="text-blue-500 hover:underline"
        type="button"
        onClick={() => navigate("/register")}
    >
        Register here
      </button>
    </>
  )}
</div>

            <div>
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 border rounded"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Login with Email
            </button>
          </form>

          <div className="text-center text-gray-500 mb-4">— OR —</div>

          {/* Wallet Login Placeholder */}
          <button
            onClick={handleWalletLogin}
            className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
          >
            Login with Wallet
          </button>
        </div>
      </div>
    );
  }

  // ──────────────── Render: Chat UI ────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <div className="text-gray-800 flex items-center gap-4">
          {user.type === "email" ? (
            <>
              <span>👤 Logged in as: {user.email}</span>
              {!user.wallet && (
                <button
                  onClick={async () => {
                    const wallet = prompt("Enter your wallet address (must start with 0x):");
                    if (!wallet || !wallet.startsWith("0x")) return alert("❌ Invalid wallet address.");

                    const res = await fetch("http://localhost:3000/api/link-wallet", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email, wallet }),
                    });

                    const data = await res.json();
                    if (data.status === "linked") {
                      alert("✅ Wallet linked!");
                      setUser({ ...user, wallet }); // update local user state
                    } else {
                      alert("❌ Failed to link wallet.");
                    }
                  }}
                  className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                >
                  🔗 Link Wallet
                </button>
              )}
            </>
          ) : (
            <span>🔑 Wallet: {user.address}</span>
          )}
        </div>

        <Link
          to="/dashboard"
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
        >
          Dashboard
        </Link>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col bg-white shadow-md">
        <h1 className="text-2xl font-bold mb-4">🧠 AI Support Bot</h1>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 border rounded-lg">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-lg px-4 py-2 rounded-lg ${
                  msg.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {msg.text}
              </div>

              {/* If it’s a bot message, show feedback & report buttons */}
              {msg.from === "bot" && (
                <div className="flex flex-col ml-4 space-y-2">
                  {/* Feedback Buttons */}
                  {!feedbackSentIds.includes(msg.id) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => sendFeedback(msg.id, msg.text, "yes")}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        👍 Yes
                      </button>
                      <button
                        onClick={() => sendFeedback(msg.id, msg.text, "no")}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        👎 No
                      </button>
                    </div>
                  )}

                  {/* Report Mistake Button */}
                  {!reportedIds.includes(msg.id) && (
                    <button
                      onClick={() => sendReport(msg.id, msg.text)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      ⚠️ Report Mistake
                    </button>
                  )}
                  {reportedIds.includes(msg.id) && (
                    <span className="text-sm text-gray-500">🚩 Reported</span>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Loading Indicator */}
        {loading && <div className="text-center my-2">Bot is typing...</div>}

        {/* Send Message Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none disabled:opacity-50"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg disabled:opacity-50 hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}