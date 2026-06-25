import React, { useEffect, useState } from "react";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Add from "@mui/icons-material/Add";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";

interface TimelineItem {
  _id?: string;
  title: string;
  subtitle: string;
  description?: string;
  date: string;
  type: "work" | "education";
  order?: number;
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

const iconBtn = (isDark: boolean) => ({
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: isDark ? "#334155" : "#e2e8f0",
  color: "inherit",
});

export default function AdminTimelineSection({
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
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"work" | "education">("work");
  const [order, setOrder] = useState<string>("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data: TimelineItem[] = await res.json();
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setItems(data);
      }
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
    setSubtitle("");
    setDescription("");
    setDate("");
    setType("work");
    setOrder("");
    setFormError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: TimelineItem) => {
    setEditingId(item._id || null);
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setDescription(item.description || "");
    setDate(item.date);
    setType(item.type);
    setOrder(item.order !== undefined ? String(item.order) : "");
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!title || !subtitle || !date) {
      setFormError("Title, subtitle, and date are required.");
      return;
    }
    setFormLoading(true);
    const url = editingId ? `/api/timeline/${editingId}` : "/api/timeline";
    const method = editingId ? "PUT" : "POST";
    const payload: Record<string, unknown> = { title, subtitle, description, date, type };
    // Only send order when editing — new entries are pushed to top automatically
    if (editingId && order.trim() !== "") {
      payload.order = Number(order);
    }
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
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

  const handleMove = async (id: string, direction: "up" | "down") => {
    const res = await fetch(`/api/timeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ direction }),
    });
    if (res.status === 401) onAuthError();
    else if (res.ok) fetchItems();
  };

  const handleNormalize = async () => {
    const res = await fetch("/api/timeline/normalize", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) onAuthError();
    else if (res.ok) fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this timeline entry?")) return;
    const res = await fetch(`/api/timeline/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) onAuthError();
    else if (res.ok) fetchItems();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: 12 }}>
        <p style={{ color: subTextColor, margin: 0 }}>
          New entries appear at the <strong>top</strong>. Use ↑ ↓ to reorder.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleNormalize}
            style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${inputBorderColor}`, background: "none", color: textColor, cursor: "pointer", fontSize: 13 }}
          >
            Fix positions
          </button>
          {!showForm && (
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: primaryColor, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>
              <Add fontSize="small" /> Add Entry
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: cardColor, padding: 24, borderRadius: 12, marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {formError && <div style={{ color: "#f87171", fontSize: 14 }}>{formError}</div>}
          {!editingId && (
            <p style={{ color: subTextColor, fontSize: 13, margin: 0 }}>
              This entry will be added at the <strong>top</strong> of your career timeline.
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input placeholder="Title (e.g. Web Developer)*" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)} required />
            <input placeholder="Subtitle (company/school)*" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input placeholder="Date (e.g. Apr 2024 – Apr 2025)*" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle(inputBgColor, inputBorderColor, textColor)} required />
            <select value={type} onChange={(e) => setType(e.target.value as "work" | "education")} style={inputStyle(inputBgColor, inputBorderColor, textColor)}>
              <option value="work">Work</option>
              <option value="education">Education</option>
            </select>
          </div>
          <textarea placeholder="Description (optional)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle(inputBgColor, inputBorderColor, textColor), resize: "vertical" }} />
          {editingId && (
            <>
              <input
                type="number"
                min={0}
                placeholder="Position (0 = top)"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                style={inputStyle(inputBgColor, inputBorderColor, textColor)}
              />
              <p style={{ color: subTextColor, fontSize: 12, margin: 0 }}>
                Or use ↑ ↓ buttons in the list to move this entry.
              </p>
            </>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", borderRadius: 6, border: `1px solid ${inputBorderColor}`, background: "none", color: textColor, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={formLoading} style={{ padding: "10px 24px", borderRadius: 6, border: "none", backgroundColor: primaryColor, color: "#fff", fontWeight: 600, cursor: "pointer" }}>{formLoading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: subTextColor }}>Loading...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, index) => (
            <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: cardColor, padding: 16, borderRadius: 12, gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{item.title}</strong>
                <p style={{ color: subTextColor, fontSize: 14, margin: "4px 0" }}>
                  {item.subtitle} · {item.date} · position {item.order ?? index}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => item._id && handleMove(item._id, "up")}
                  disabled={index === 0}
                  style={{ ...iconBtn(isDark), opacity: index === 0 ? 0.35 : 1 }}
                  aria-label="Move up"
                  title="Move up"
                >
                  <KeyboardArrowUp fontSize="small" />
                </button>
                <button
                  type="button"
                  onClick={() => item._id && handleMove(item._id, "down")}
                  disabled={index === items.length - 1}
                  style={{ ...iconBtn(isDark), opacity: index === items.length - 1 ? 0.35 : 1 }}
                  aria-label="Move down"
                  title="Move down"
                >
                  <KeyboardArrowDown fontSize="small" />
                </button>
                <button onClick={() => openEdit(item)} style={iconBtn(isDark)} aria-label="Edit"><Edit fontSize="small" /></button>
                <button onClick={() => item._id && handleDelete(item._id)} style={{ ...iconBtn(isDark), backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }} aria-label="Delete"><Delete fontSize="small" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
