// File: frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    async function fetchContributions() {
      try {
        const res = await fetch("http://localhost:3000/api/contributions");
        const data = await res.json();
        if (Array.isArray(data)) {
          setContributions(data);
        }
      } catch (err) {
        console.error("Error fetching contributions:", err);
      }
    }

    fetchContributions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">📊 AI Agent Contributions</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {contributions.length === 0 ? (
          <p>No contributions found.</p>
        ) : (
          <ul className="space-y-2">
            {contributions.map((entry) => (
              <li key={entry.id} className="border-b pb-2">
                <div><strong>User:</strong> {entry.userEmail || entry.userWallet}</div>
                <div><strong>Message:</strong> {entry.text}</div>
                <div><strong>From:</strong> {entry.from}</div>
                <div><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
