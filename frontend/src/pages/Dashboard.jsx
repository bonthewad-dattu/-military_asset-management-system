import { useEffect, useState } from "react";
import { Package, TrendingUp, Archive, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setMetrics(r.data))
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load dashboard."),
      );
  }, []);
  const cards = [
    ["Opening balance", metrics.opening_balance, Package],
    ["Net movement", metrics.net_movement, TrendingUp],
    ["Closing balance", metrics.closing_balance, Archive],
    ["Expended", metrics.expended, AlertCircle],
  ];
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-slate-500">Overview</p>
        <h2 className="text-2xl font-bold">Inventory Dashboard</h2>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([label, value, Icon]) => (
          <button
            key={label}
            onClick={() => label === "Net movement" && setShow(!show)}
            className="bg-white rounded-xl p-5 shadow-sm text-left" >


            <div className="flex justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="text-emerald-700" size={20} />
            </div>

            <p className="text-3xl font-bold mt-3">{value ?? 0}</p>


            {label === "Net movement" && (
              <p className="text-xs text-emerald-700 mt-2">
                Click for explanation
              </p>
            )}
          </button>
        ))}
      </div>
      {show && (
        <div className="mt-4 bg-white p-5 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">Net movement</h3>
          <p className="text-sm text-slate-600">
            Purchases + Transfers In − Transfers Out. Assignments and
            expenditures are deducted when calculating the closing balance.
          </p>
        </div>
      )}
      <div className="bg-white rounded-xl p-5 mt-6 shadow-sm">
        <h3 className="font-semibold mb-4">Current stock summary</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: "Opening",
                  value: Number(metrics.opening_balance || 0),
                },
                { name: "Movement", value: Number(metrics.net_movement || 0) },
                {
                  name: "Closing",
                  value: Number(metrics.closing_balance || 0),
                },
                { name: "Expended", value: Number(metrics.expended || 0) },
              ]}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#047857" radius={[5, 5, 0, 0]} />
              
            </BarChart>
          </ResponsiveContainer>

        </div>
      </div>
    </div>
  );
}
