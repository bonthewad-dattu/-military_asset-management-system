import { useEffect, useState } from "react";
import api from "../services/api";

export default function RecordPage({ title, endpoint, extraField }) {
  const [rows, setRows] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({
    baseId: "",
    equipmentTypeId: "",
    quantity: "",
    notes: "",
    assignedTo: "",
  });
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const [r, b, e] = await Promise.all([
        api.get(`/${endpoint}`),
        api.get("/bases"),
        api.get("/equipment"),
      ]);
      setRows(r.data);
      setBases(b.data);
      setEquipment(e.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load records.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post(`/${endpoint}`, form);
      setForm({
        baseId: "",
        equipmentTypeId: "",
        quantity: "",
        notes: "",
        assignedTo: "",
      });
      setMessage("Record saved.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not save record.");
    }
  }
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <form
        onSubmit={submit}
        className="bg-white rounded-xl p-5 shadow-sm grid gap-4 md:grid-cols-2 mb-6"
      >
        <label className="text-sm">
          Base
          <select
            required
            value={form.baseId}
            onChange={(e) => setForm({ ...form, baseId: e.target.value })} >
            <option value="">Choose base</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Equipment
          <select
            required
            value={form.equipmentTypeId}
            onChange={(e) =>
              setForm({ ...form, equipmentTypeId: e.target.value })
            }
          >
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
            required
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </label>
        {extraField && (
          <label className="text-sm">
            Assigned to
            <input
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            />
          </label>
        )}
        <label className="text-sm md:col-span-2">
          Notes
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <div className="md:col-span-2 flex items-center gap-4">
          <button className="bg-emerald-700 text-white rounded-lg px-5 py-2">
            Save record
          </button>
          <span className="text-sm text-slate-600">{message}</span>
        </div>
      </form>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {["Date", "Base", "Equipment", "Quantity", "Notes"].map((x) => (
                <th key={x} className="text-left p-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">{r.base_name || r.base_id}</td>
                <td className="p-3">
                  {r.equipment_name || r.equipment_type_id}
                </td>
                <td className="p-3">{r.quantity}</td>
                <td className="p-3">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-5 text-slate-500">No records yet.</p>
        )}
      </div>
    </section>
  );
}
