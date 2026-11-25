import { useEffect, useState } from "react";
import api from "../services/api";
export default function Transfers() {
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    sourceBaseId: "",
    destinationBaseId: "",
    equipmentTypeId: "",
    quantity: "",
  });
  const [message, setMessage] = useState("");
  async function load() {
    const [b, e, t] = await Promise.all([
      api.get("/bases"),
      api.get("/equipment"),
      api.get("/transfers"),
    ]);
    setBases(b.data);
    setEquipment(e.data);
    setRows(t.data);
  }
  useEffect(() => {
    load().catch(() => setMessage("Could not load transfer data."));
  }, []);
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/transfers", form);
      setMessage("Transfer completed.");
      setForm({
        sourceBaseId: "",
        destinationBaseId: "",
        equipmentTypeId: "",
        quantity: "",
      });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Transfer failed.");
    }
  }
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Base Transfers</h2>
      <form
        onSubmit={submit}
        className="bg-white rounded-xl p-5 grid md:grid-cols-2 gap-4 shadow-sm mb-6"  >
        {[
          ["Source base", "sourceBaseId"],
          ["Destination base", "destinationBaseId"],
        ].map(([label, key]) => (
          <label key={key} className="text-sm">
            {label}
            <select
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}  >
              <option value="">Choose base</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="text-sm">
          Equipment
          <select
            required
            value={form.equipmentTypeId}
            onChange={(e) =>
              setForm({ ...form, equipmentTypeId: e.target.value })
            }>
            <option value="">Choose equipment</option>
            {equipment.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Quantity
          <input
            type="number"
            min="1"
            step="1"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </label>
        <div className="md:col-span-2">
          <button className="bg-emerald-700 text-white px-5 py-2 rounded-lg">
            Complete transfer
          </button>
          <span className="ml-3 text-sm text-slate-600">{message}</span>
        </div>
      </form>
      <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {["Date", "From", "To", "Equipment", "Quantity", "Status"].map(
                (x) => (
                  <th className="p-3 text-left" key={x}>
                    {x}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr className="border-t" key={r.id}>
                <td className="p-3">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">{r.source_name}</td>
                <td className="p-3">{r.destination_name}</td>
                <td className="p-3">{r.equipment_name}</td>
                <td className="p-3">{r.quantity}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-5 text-slate-500">No transfers yet.</p>
        )}
      </div>

    </section>
    
  );
}
