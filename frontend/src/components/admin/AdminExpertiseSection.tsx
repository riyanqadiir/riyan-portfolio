import React, { useEffect, useState } from "react";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Add from "@mui/icons-material/Add";

interface ExpertiseItem {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  chipsLabel: string;
  chips: string[];
}

interface Props {
  token: string;
  isDark: boolean;
  cardColor: string;
  textColor: string;
  subTextColor: string;
  inputBgColor: string;
  inputBorderColor: string;
  primaryColor: string;
  onAuthError: () => void;
}

const ICON_OPTIONS = ["react", "node-js", "git-alt", "js", "python", "briefcase", "code", "database"];

const inputStyle = (bg: string, border: string, color: string) => ({
  width: "100%",
  padding: "10px 14px",
  borderRadius: "6px",
  border: `2px solid ${border}`,
  backgroundColor: bg,
  color,
  fontSize: "15px",
  outline: "none" as const,
  boxSizing: "border-box" as const,
});

export default function AdminExpertiseSection({
  token,
  isDark,
  cardColor,
  textColor,
  subTextColor,
  inputBgColor,
  inputBorderColor,
  primaryColor,
  onAuthError,
}: Props) {
  const [items, setItems] = useState<ExpertiseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("code");
  const [chipsLabel, setChipsLabel] = useState("Tech stack:");
  const [chipsText, setChipsText] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expertise");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setIcon("code");
    setChipsLabel("Tech stack:");
    setChipsText("");
    setFormError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: ExpertiseItem) => {
    setEditingId(item._id || null);
    setTitle(item.title);
    setDescription(item.description);
    setIcon(item.icon);
    setChipsLabel(item.chipsLabel);
    setChipsText(item.chips.join(", "));
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const chips = chipsText.split(",").map((c) => c.trim()).filter(Boolean);
    if (!title || !description || chips.length === 0) {
      setFormError("Title, description, and at least one chip are required.");
      return;
    }
    setFormLoading(true);
    const url = editingId ? `/api/expertise/${editingId}` : "/api/expertise";
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, icon, chipsLabel, chips }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        fetchItems();
      } else if (res.status === 401) {
        onAuthError();
      } else {
        setFormError(data.message || "Save failed.");
      }
    } catch {
      setFormError("Server error.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this expertise section?")) return;
    const res = await fetch(`/api/expertise/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) onAuthError();
    else if (res.ok) fetchItems();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <p style={{ color: subTextColor, margin: 0 }}>Manage expertise cards on the homepage</p>
        {!showForm && (
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: primaryColor, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>
            <Add fontSize="small" /> Add Expertise
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: cardColor, padding: 24, borderRadius: 12, marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {formError && <div style={{ color: "#f87171", fontSize: 14 }}>{formError}</div>}
          <input placeholder="Title*" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)} required />
          <textarea placeholder="Description*" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle(inputBgColor, inputBorderColor, textColor), resize: "vertical" }} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <select value={icon} onChange={(e) => setIcon(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)}>
              {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input placeholder="Chips label (e.g. Tech stack:)" value={chipsLabel} onChange={(e) => setChipsLabel(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)} required />
          </div>
          <input placeholder="Chips (comma-separated)*" value={chipsText} onChange={(e) => setChipsText(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)} required />
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", borderRadius: 6, border: `1px solid ${inputBorderColor}`, background: "none", color: textColor, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={formLoading} style={{ padding: "10px 24px", borderRadius: 6, border: "none", backgroundColor: primaryColor, color: "#fff", fontWeight: 600, cursor: "pointer" }}>{formLoading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: subTextColor }}>Loading...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => (
            <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: cardColor, padding: 16, borderRadius: 12, gap: 16 }}>
              <div>
                <strong>{item.title}</strong>
                <p style={{ color: subTextColor, fontSize: 14, margin: "4px 0" }}>{item.chips.length} chips · icon: {item.icon}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(item)} style={{ width: 40, height: 40, border: "none", borderRadius: 6, cursor: "pointer", backgroundColor: isDark ? "#334155" : "#e2e8f0" }} aria-label="Edit"><Edit fontSize="small" /></button>
                <button onClick={() => item._id && handleDelete(item._id)} style={{ width: 40, height: 40, border: "none", borderRadius: 6, cursor: "pointer", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }} aria-label="Delete"><Delete fontSize="small" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
