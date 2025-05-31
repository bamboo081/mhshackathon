import { useEffect, useState } from "react";
import axios from "axios";

export default function Marketplace() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    axios
      .get("/api/bots")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBots(res.data);
        } else if (Array.isArray(res.data.bots)) {
          setBots(res.data.bots);
        } else {
          setBots([]);
          console.error("Unexpected bot data:", res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load bots:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const hireBot = async (botId) => {
    if (!userId) return alert("⚠️ Please log in to hire a bot.");
    try {
      await axios.post("/api/bots/hire", {
        userId: parseInt(userId),
        botId,
      });
      alert("✅ Bot successfully hired!");
    } catch (err) {
      console.error("Error hiring bot:", err);
      alert("❌ Failed to hire bot.");
    }
  };

  const rateBot = async (botId, score) => {
    if (!userId) return alert("⚠️ Please log in to rate bots.");
    try {
      await axios.post("/api/bots/rate", {
        userId: parseInt(userId),
        botId,
        score,
      });
      alert("⭐ Thanks for rating!");
    } catch (err) {
      console.error("Error rating bot:", err);
      alert("❌ Failed to rate bot.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        🤖 AI Bot Marketplace
      </h1>

      {loading ? (
        <div className="text-center text-gray-600 text-lg">Loading bots...</div>
      ) : bots.length === 0 ? (
        <div className="text-center text-red-500 text-lg">
          No bots available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all duration-300"
            >
              <div className="mb-3">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {bot.name}
                </h2>
                <p className="text-sm text-gray-500 mb-1">
                  Type: {bot.type}
                </p>
                <p className="text-gray-700">{bot.description}</p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-yellow-500 text-lg font-medium">
                  ⭐ {bot.averageRating?.toFixed(1) || "0.0"} (
                  {bot._count?.ratings || 0} ratings)
                </div>
                <div className="mt-2 sm:mt-0 flex gap-2 items-center">
                  <button
                    onClick={() => hireBot(bot.id)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                  >
                    Hire
                  </button>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => rateBot(bot.id, n)}
                      title={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      className="text-yellow-400 hover:scale-110 transition text-xl"
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
