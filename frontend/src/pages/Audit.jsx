import { useEffect, useState } from "react";
import api from "../services/api";
export default function Audit() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api
      .get("/audit-logs")
      .then((r) => setRows(r.data))
      .catch(() => {});
  }, []);
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {["Time", "User", "Action", "Details"].map((x) => (
                <th className="text-left p-3" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr className="border-t" key={r.id}>
                <td className="p-3">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="p-3">{r.username}</td>
                <td className="p-3">{r.action}</td>
                <td className="p-3">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-5 text-slate-500">No audit records available.</p>
        )}
      </div>
    </section>
  );
}
