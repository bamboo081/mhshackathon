// File: OrgDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrgDashboard() {
  const [orgInfo, setOrgInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [copySuccess, setCopySuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return navigate("/");
    

    axios
      .post("http://localhost:3000/api/org-info", { email })
      .then((res) => {
        setOrgInfo(res.data.org);
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.error("Error loading org info:", err);
        alert("Failed to load organization data.");
      });
  }, [navigate]);

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(orgInfo.registrationKey).then(() => {
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    });
  };

  if (!orgInfo)
    return <div className="p-6 text-center text-gray-600">Loading organization data...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🏢 {orgInfo.name} Dashboard</h1>
      <div className="mb-4 text-sm text-gray-700 flex items-center gap-2">
        🔐 <code className="bg-gray-100 px-2 py-1 rounded">{orgInfo.registrationKey}</code>
        <button
          onClick={copyKeyToClipboard}
          className="text-blue-600 hover:underline text-xs"
        >
          📋 Copy
        </button>
        {copySuccess && <span className="text-green-600 text-xs">{copySuccess}</span>}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">👥 Team Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Email / Wallet</th>
                <th className="border px-4 py-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{user.email || user.wallet}</td>
                  <td className="border px-4 py-2 capitalize">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">🛠️ Admin Tools</h3>
        <ul className="space-y-2 text-gray-700">
          <li>✅ View all employees in your organization</li>
          <li>✅ Share your registration key</li>
          <li>📋 <strong>Coming Soon:</strong> Assign roles or remove members</li>
          <li>📊 <strong>Coming Soon:</strong> Bot usage stats & token allocations</li>
        </ul>
      </div>
    </div>
  );
}
