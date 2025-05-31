/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [orgUsers, setOrgUsers] = useState([]);
  const [botsHired, setBotsHired] = useState([]);
  const [loading, setLoading] = useState(true);

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/admin-dashboard?email=${userEmail}`);
        setOrgUsers(res.data.users);
        setBotsHired(res.data.bots);
      } catch (err) {
        alert("Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail] );

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📊 Admin Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">👥 Organization Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgUsers.map((user) => (
            <div key={user.id} className="p-4 border rounded shadow bg-white">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">🤖 Bots Hired</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {botsHired.map((entry, idx) => (
            <div key={idx} className="p-4 border rounded shadow bg-white">
              <p><strong>Bot Name:</strong> {entry.bot.name}</p>
              <p><strong>Hired By:</strong> {entry.user.email}</p>
              <p><strong>Hired At:</strong> {new Date(entry.hiredAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
