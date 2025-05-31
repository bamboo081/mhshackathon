/* eslint-disable no-unused-vars */
// 📂 File: frontend/src/components/BCTPurchaseModal.jsx
import { useState } from "react";
import axios from "axios";

export default function BCTPurchaseModal({ onClose }) {
  const [amount, setAmount] = useState(0);
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState(null);

  const purchase = async () => {
    try {
      const res = await axios.post("/api/reward", {
        to: wallet,
        amount,
      });
      setStatus(`✅ Purchased ${amount} BCT! TX: ${res.data.txHash}`);
    } catch (err) {
      setStatus("❌ Purchase failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">💰 Purchase BCT Tokens</h2>

        <input
          type="text"
          placeholder="Your Wallet Address"
          className="w-full border px-3 py-2 mb-3 rounded"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount in BCT"
          className="w-full border px-3 py-2 mb-3 rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          onClick={purchase}
          className="bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
          Buy
        </button>
        <button
          onClick={onClose}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Cancel
        </button>

        {status && <p className="mt-4 text-sm text-center">{status}</p>}
      </div>
    </div>
  );
}
