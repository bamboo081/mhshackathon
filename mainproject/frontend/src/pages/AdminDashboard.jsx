import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [orgUsers, setOrgUsers] = useState([]);
  const [botsHired, setBotsHired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const emailFromStorage = localStorage.getItem("Email");
    if (!emailFromStorage) {
      alert("Missing email. Please login again.");
      navigate("/login");
    } else {
      setUserEmail(emailFromStorage);
    }
  }, [navigate]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/admin-dashboard?email=${userEmail}`);
        setOrgUsers(res.data.users || []);
        setBotsHired(res.data.bots || []);
      } catch (err) {
        console.error("❌ Error loading admin dashboard:", err);
        alert("Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  if (loading) return <div className="p-6">Loading admin dashboard...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📊 Admin Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">👥 Organization Users</h2>
        {orgUsers.length === 0 ? (
          <p className="text-gray-500">No users found in this organization.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgUsers.map((user) => (
              <div key={user.id} className="p-4 border rounded shadow bg-white">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">🤖 Bots Hired</h2>
        {botsHired.length === 0 ? (
          <p className="text-gray-500">No bots hired by this organization yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {botsHired.map((entry, idx) => (
              <div key={idx} className="p-4 border rounded shadow bg-white">
                <p><strong>Bot Name:</strong> {entry.bot.name}</p>
                <p><strong>Hired By:</strong> {entry.user.email}</p>
                <p><strong>Hired At:</strong> {new Date(entry.hiredAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
