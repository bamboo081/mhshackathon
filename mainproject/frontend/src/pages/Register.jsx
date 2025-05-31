import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BCTPurchaseModal from "../components/BCTPurchaseModal";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("PERSONAL");
  const [orgMode, setOrgMode] = useState(null); // "create" or "join"
  const [orgName, setOrgName] = useState("");
  const [registrationKey, setRegistrationKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userPayload = {
      email,
      password,
      type: "email",
      accountType,
    };

    try {
      const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });
      const data = await res.json();
      localStorage.setItem("registrationKey", data.registrationKey);

      if (accountType === "BUSINESS") {
        if (orgMode === "create") {
          await fetch("http://localhost:3000/api/register-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail: email, orgName }),
          });
        } else if (orgMode === "join") {
          await fetch("http://localhost:3000/api/join-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail: email, registrationKey }),
          });
        }
      }

      alert("✅ Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center mb-4">🚀 Register</h2>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
        >
          💸 Buy BCT Tokens
        </button>

        {showModal && <BCTPurchaseModal onClose={() => setShowModal(false)} />}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded mt-1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded mt-1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setAccountType("PERSONAL");
                setOrgMode(null);
              }}
              className={`flex-1 px-4 py-2 rounded border ${
                accountType === "PERSONAL" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              👤 Personal
            </button>
            <button
              type="button"
              onClick={() => setAccountType("BUSINESS")}
              className={`flex-1 px-4 py-2 rounded border ${
                accountType === "BUSINESS" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              🏢 Business
            </button>
          </div>
        </div>

        {accountType === "BUSINESS" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Mode
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setOrgMode("create")}
                  className={`flex-1 px-4 py-2 rounded border ${
                    orgMode === "create" ? "bg-green-600 text-white" : "bg-white"
                  }`}
                >
                  🏗️ Create New
                </button>
                <button
                  type="button"
                  onClick={() => setOrgMode("join")}
                  className={`flex-1 px-4 py-2 rounded border ${
                    orgMode === "join" ? "bg-yellow-500 text-white" : "bg-white"
                  }`}
                >
                  🔑 Join Existing
                </button>
              </div>
            </div>

            {orgMode === "create" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mt-3">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2 border rounded mt-1"
                  required
                />
              </div>
            )}

            {orgMode === "join" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mt-3">
                  Registration Key
                </label>
                <input
                  type="text"
                  value={registrationKey}
                  onChange={(e) => setRegistrationKey(e.target.value)}
                  className="w-full px-4 py-2 border rounded mt-1"
                  required
                />
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          ✅ Register Account
        </button>
      </form>
    </div>
  );
}
