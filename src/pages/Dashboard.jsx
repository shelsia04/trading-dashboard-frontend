// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import API from "../services/api.js";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [trades, setTrades] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    pair: "",
    type: "Buy",
    amount: "",
    status: "Completed",
  });

  const statusColors = {
    Completed: "bg-green-500",
    Pending: "bg-yellow-400",
    Cancelled: "bg-red-500",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ===== FETCH DATA =====
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, tradesRes] = await Promise.all([
        API.get("/dashboard/stats"),
        API.get("/dashboard/revenue-trend"),
        API.get("/tasks", { params: { search, status: filterStatus } }),
      ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data);
      setTrades(tradesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ===== SAVE (ADD / EDIT) =====
  const saveTrade = async () => {
    try {
      if (form._id) {
        await API.put(`/tasks/${form._id}`, form);
      } else {
        await API.post("/tasks", form);
      }
      setShowModal(false);
      setForm({ pair: "", type: "Buy", amount: "", status: "Completed" });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // ===== DELETE =====
  const deleteTrade = async (id) => {
    if (!window.confirm("Delete this trade?")) return;
    try {
      await API.delete(`/tasks/${id}`);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // ===== TREND ARROWS =====
  const revenueWithTrend = revenueData.map((r, i) => {
    const diff = i === 0 ? 0 : r.revenue - revenueData[i - 1].revenue;
    return { ...r, diff };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Trade
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Users", value: stats.totalUsers },
          { label: "Total Trades", value: stats.totalTrades },
          { label: "Revenue", value: `$${stats.totalRevenue}` },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* REVENUE */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-2">
          {revenueWithTrend.map((r, i) =>
            i === 0 ? null : (
              <span
                key={i}
                className={r.diff >= 0 ? "text-green-600" : "text-red-600"}
              >
                {r.diff >= 0 ? `▲ +${r.diff.toFixed(2)}` : `▼ ${Math.abs(r.diff).toFixed(2)}`}
              </span>
            )
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search pair..."
          className="px-3 py-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option>Completed</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
        <button
          onClick={fetchAll}
          className="bg-blue-500 text-white px-3 py-2 rounded"
        >
          Filter
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Pair</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t._id} className="border-b">
                <td className="p-2">{t.pair}</td>
                <td>{t.type}</td>
                <td>{t.amount}</td>
                <td>
                  <span className={`px-2 py-1 text-white rounded ${statusColors[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td className="flex gap-2 p-2">
                  <button
                    onClick={() => {
                      setForm(t);
                      setShowModal(true);
                    }}
                    className="bg-yellow-400 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTrade(t._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-xl font-semibold mb-4">
              {form._id ? "Edit Trade" : "Add Trade"}
            </h2>

            <input
              className="w-full border p-2 mb-2"
              placeholder="Pair"
              value={form.pair}
              onChange={(e) => setForm({ ...form, pair: e.target.value })}
            />
            <input
              className="w-full border p-2 mb-2"
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <select
              className="w-full border p-2 mb-4"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Completed</option>
              <option>Pending</option>
              <option>Cancelled</option>
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={saveTrade}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
