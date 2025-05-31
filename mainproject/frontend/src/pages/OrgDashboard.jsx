// File: OrgDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OrgDashboard({ user }) {
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate("/");

    async function fetchOrgData() {
      try {
        const res = await fetch("http://localhost:3000/api/org-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user }),
        });
        const data = await res.json();
        if (data.org) {
          setOrg(data.org);
          setMembers(data.members);
        }
      } catch (err) {
        console.error("Error fetching org info:", err);
      }
    }

    fetchOrgData();
  }, [user, navigate]);

  if (!org) return <div className="p-6">Loading org data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏢 {org.name} Dashboard</h1>
      <p className="mb-2">🆔 Registration Key: <code>{org.registrationKey}</code></p>
      <h2 className="text-xl font-semibold mt-6 mb-2">👥 Team Members</h2>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="border p-3 rounded bg-gray-50">
            {member.email || member.wallet} — <strong>{member.role}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
