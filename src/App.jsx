import { useState, useEffect } from "react";

/* ─── CONSTANTS ─── */
const DEFAULT_GROUPS = [
  { id: "g_hygiene", name: "Vệ sinh cá nhân", icon: "🧴" },
  { id: "g_skincare", name: "Chăm sóc da", icon: "✨" },
  { id: "g_laundry", name: "Giặt giũ", icon: "🧺" },
  { id: "g_cleaning", name: "Vệ sinh nhà", icon: "🧹" },
  { id: "g_food", name: "Thực phẩm", icon: "🍚" },
  { id: "g_health", name: "Sức khoẻ", icon: "💊" },
  { id: "g_appliance", name: "Thiết bị điện", icon: "🏠" },
  { id: "g_other", name: "Khác", icon: "📦" },
];
const DEFAULT_TYPES = [
  { id: "t_shower", name: "Sữa tắm", groupId: "g_hygiene" },
  { id: "t_shampoo", name: "Dầu gội", groupId: "g_hygiene" },
  { id: "t_toothpaste", name: "Kem đánh răng", groupId: "g_hygiene" },
  { id: "t_moisturizer", name: "Kem dưỡng ẩm", groupId: "g_skincare" },
  { id: "t_sunscreen", name: "Kem chống nắng", groupId: "g_skincare" },
  { id: "t_detergent", name: "Nước giặt", groupId: "g_laundry" },
  { id: "t_softener", name: "Nước xả vải", groupId: "g_laundry" },
  { id: "t_floor", name: "Nước lau sàn", groupId: "g_cleaning" },
  { id: "t_dish", name: "Nước rửa chén", groupId: "g_cleaning" },
];
const SAMPLE_ITEMS = [
  { id: "s1", name: "Dove", brand: "Dove", groupId: "g_hygiene", typeId: "t_shower", notes: "",
    purchases: [
      { id: "p1a", price: 65000, volume: 500, buyDate: "2024-05-01", startDate: "2024-05-01", endDate: "2024-07-18", expireDate: null, notes: "" },
      { id: "p1b", price: 68000, volume: 500, buyDate: "2024-07-18", startDate: "2024-07-18", endDate: "2024-10-02", expireDate: null, notes: "Tăng giá nhẹ" },
      { id: "p1c", price: 89000, volume: 500, buyDate: "2024-11-01", startDate: "2024-11-01", endDate: null, expireDate: "2026-11-01", notes: "" },
    ]
  },
  { id: "s2", name: "Lifebuoy", brand: "Lifebuoy", groupId: "g_hygiene", typeId: "t_shower", notes: "",
    purchases: [
      { id: "p2a", price: 55000, volume: 500, buyDate: "2024-08-01", startDate: "2024-08-01", endDate: "2024-10-28", expireDate: null, notes: "" },
    ]
  },
  { id: "s3", name: "Head & Shoulders", brand: "H&S", groupId: "g_hygiene", typeId: "t_shampoo", notes: "",
    purchases: [
      { id: "p3a", price: 115000, volume: 400, buyDate: "2024-10-01", startDate: "2024-10-01", endDate: null, expireDate: "2026-10-01", notes: "" },
    ]
  },
  { id: "s4", name: "OMO Matic", brand: "OMO", groupId: "g_laundry", typeId: "t_detergent", notes: "",
    purchases: [
      { id: "p4a", price: 120000, volume: 2700, buyDate: "2024-06-01", startDate: "2024-06-01", endDate: "2024-10-15", expireDate: null, notes: "" },
      { id: "p4b", price: 125000, volume: 2700, buyDate: "2024-11-10", startDate: "2024-11-10", endDate: null, expireDate: "2026-11-10", notes: "" },
    ]
  },
];

/* ─── UTILS ─── */
const todayStr = () => new Date().toISOString().split("T")[0];
const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
const fmt = (n) => { if (n == null || isNaN(n)) return "—"; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(0) + "K"; return Math.round(n).toLocaleString("vi-VN"); };
const fmtDate = (d) => { if (!d) return "—"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const uid = () => Date.now() + "_" + Math.random().toString(36).slice(2, 7);

/* ─── CALC PURCHASE ─── */
function calcPurchase(p) {
  const price = parseFloat(p.price) || 0;
  const notStarted = !p.startDate;
  if (notStarted) {
    return { perDay: null, perMonth: null, mlPerDay: null, costPerMl: p.volume > 0 ? price / p.volume : null, days: 0, notStarted: true, isActive: false, isFinished: false, valueScore: null, daysToExp: p.expireDate ? daysBetween(todayStr(), p.expireDate) : null };
  }
  const end = p.endDate || todayStr();
  const days = daysBetween(p.startDate, end);
  const perDay = price / days;
  const perMonth = perDay * 30;
  const isFinished = !!p.endDate;
  const mlPerDay = p.volume > 0 && isFinished ? p.volume / days : null;
  const costPerMl = p.volume > 0 ? price / p.volume : null;
  const valueScore = isFinished && price > 0 ? parseFloat((days / (price / 1000)).toFixed(2)) : null;
  const daysToExp = p.expireDate ? daysBetween(todayStr(), p.expireDate) : null;
  return { perDay, perMonth, mlPerDay, costPerMl, days, notStarted: false, isActive: !p.endDate, isFinished, valueScore, daysToExp };
}

/* ─── CALC ITEM (aggregate across purchases) ─── */
function calcItem(item) {
  const purchases = item.purchases || [];
  const finished = purchases.filter(p => p.endDate && p.startDate);
  const active = purchases.find(p => !p.endDate);
  const activePc = active ? calcPurchase(active) : null;

  // Long-term avg: over all finished purchases
  const totalDays = finished.reduce((s, p) => s + daysBetween(p.startDate, p.endDate), 0);
  const totalPrice = finished.reduce((s, p) => s + (parseFloat(p.price) || 0), 0);
  const avgPerDay = totalDays > 0 ? totalPrice / totalDays : null;
  const avgPerMonth = avgPerDay ? avgPerDay * 30 : null;

  // ml/day avg from finished with volume
  const finWithVol = finished.filter(p => p.volume > 0);
  const avgMlPerDay = finWithVol.length > 0
    ? finWithVol.reduce((s, p) => s + p.volume / daysBetween(p.startDate, p.endDate), 0) / finWithVol.length
    : null;

  // Value score: avg days per 1000đ
  const avgValueScore = finished.length > 0 && totalPrice > 0
    ? parseFloat((totalDays / (totalPrice / 1000)).toFixed(2))
    : null;

  return { activePc, active, finished, avgPerDay, avgPerMonth, avgMlPerDay, avgValueScore, totalDays, totalPrice, purchaseCount: purchases.length };
}

/* ─── MIGRATION: old flat items → new purchase structure ─── */
function migrateItems(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(item => {
    if (item.purchases) return item; // already new format
    // Old format: has price/buyDate at top level
    const { price, volume, buyDate, startDate, endDate, expireDate, notes: pnotes, ...rest } = item;
    return {
      ...rest,
      notes: item.notes || "",
      purchases: [{
        id: uid(),
        price: price || 0, volume: volume || 0,
        buyDate: buyDate || todayStr(),
        startDate: startDate || null,
        endDate: endDate || null,
        expireDate: expireDate || null,
        notes: "",
      }]
    };
  });
}

/* ─── DESIGN ─── */
const C = {
  bg: "#F7F6F3", card: "#FFFFFF", border: "rgba(0,0,0,0.08)",
  text: "#1A1A1A", muted: "#888", faint: "#BBB",
  accent: "#4A3FD4", accentBg: "#EEEDFE", accentText: "#3c34a5",
  green: "#1D9E75", greenBg: "#E1F5EE",
  amber: "#BA7517", amberBg: "#FAEEDA",
  red: "#A32D2D", redBg: "#FCEBEB",
  surface: "#F0EDE8",
  indigo: "#6366F1", indigoBg: "#EEF2FF",
};
const s = {
  card: { background: C.card, borderRadius: 14, border: `0.5px solid ${C.border}`, padding: "14px 16px", marginBottom: 12 },
  btn: { padding: "8px 14px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
  btnPrimary: { padding: "8px 16px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
  btnSm: { padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
  btnSmActive: { padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${C.accent}`, background: C.accentBg, color: C.accentText, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 },
  input: { width: "100%", padding: "9px 11px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, boxSizing: "border-box", outline: "none" },
  label: { display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 500 },
  metric: { background: C.surface, borderRadius: 10, padding: "12px 14px" },
  row: { display: "flex", alignItems: "center", gap: 10 },
  sep: { height: "0.5px", background: C.border, margin: "14px 0" },
};

/* ─── COMPONENTS ─── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 430, maxHeight: "92vh", overflowY: "auto", padding: "20px 18px 32px" }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ ...s.btnSm, padding: "4px 8px", fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ bg = C.greenBg, color = C.green, children }) {
  return <span style={{ background: bg, color, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{children}</span>;
}

function MiniBar({ rows }) {
  const COLORS = ["#4A3FD4", "#1D9E75", "#BA7517", "#D85A30", "#185FA5", "#993556", "#3B6D11", "#534AB7"];
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: C.muted }}>{r.label}</span>
            <span style={{ fontWeight: 500 }}>{r.valueLabel || (fmt(r.value) + "đ")}</span>
          </div>
          <div style={{ height: 6, background: C.surface, borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${(r.value / max) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── DATE FIELD ─── */
function DateField({ label, value, onChange, required }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ ...s.label, marginBottom: 0 }}>{label}{required ? " *" : ""}</label>
        {value && !required && <button type="button" onClick={() => onChange("")} style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕ Xoá</button>}
      </div>
      <input style={s.input} type="date" value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

/* ─── PURCHASE FORM (single purchase row) ─── */
function PurchaseForm({ initial, onSave, onClose, title = "Thêm lần mua", prefill }) {
  const blank = { price: "", volume: prefill?.volume || "", buyDate: todayStr(), startDate: "", endDate: "", expireDate: "", notes: "" };
  const init = initial
    ? { ...initial, price: String(initial.price || ""), volume: String(initial.volume || "") }
    : prefill
    ? { ...blank, price: String(prefill.price || ""), volume: String(prefill.volume || "") }
    : blank;
  const [f, setF] = useState(init);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.price || !f.buyDate) { alert("Cần điền giá và ngày mua"); return; }
    onSave({ ...f, id: initial?.id || uid(), price: parseFloat(f.price) || 0, volume: parseFloat(f.volume) || 0, startDate: f.startDate || null, endDate: f.endDate || null, expireDate: f.expireDate || null });
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Giá mua (đ) *</label><input style={s.input} type="number" value={f.price} onChange={e => set("price", e.target.value)} placeholder="0" /></div>
        <div><label style={s.label}>Dung tích/KL (ml/g)</label><input style={s.input} type="number" value={f.volume} onChange={e => set("volume", e.target.value)} placeholder="Tuỳ chọn" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <DateField label="Ngày mua" value={f.buyDate} onChange={v => set("buyDate", v)} required />
        <DateField label="Ngày bắt đầu dùng" value={f.startDate} onChange={v => set("startDate", v)} />
        <DateField label="Ngày dùng hết" value={f.endDate} onChange={v => set("endDate", v)} />
        <DateField label="Hạn sử dụng (HSD)" value={f.expireDate} onChange={v => set("expireDate", v)} />
      </div>
      <div style={{ marginBottom: 14 }}><label style={s.label}>Ghi chú lần mua này</label><input style={s.input} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="VD: Sale 20%, mua ở đâu..." /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btnPrimary} onClick={save}>{initial ? "Lưu" : title}</button>
        <button style={s.btn} onClick={onClose}>Huỷ</button>
      </div>
    </div>
  );
}

/* ─── ITEM FORM ─── */
function ItemForm({ initial, groups, types, onSave, onClose }) {
  const blank = { name: "", brand: "", groupId: groups[0]?.id || "", typeId: "", notes: "" };
  const [f, setF] = useState(initial ? { name: initial.name, brand: initial.brand || "", groupId: initial.groupId, typeId: initial.typeId || "", notes: initial.notes || "" } : blank);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const filteredTypes = types.filter(t => t.groupId === f.groupId);

  // First purchase (only when creating new)
  const [p, setP] = useState({ price: "", volume: "", buyDate: todayStr(), startDate: "", endDate: "", expireDate: "", notes: "" });
  const setP_ = (k, v) => setP(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!f.name.trim()) { alert("Vui lòng điền tên sản phẩm"); return; }
    if (!initial && (!p.price || !p.buyDate)) { alert("Vui lòng điền giá và ngày mua"); return; }
    const item = {
      ...f,
      id: initial?.id || uid(),
      typeId: f.typeId || null,
      purchases: initial
        ? initial.purchases // keep existing purchases when editing meta
        : [{ id: uid(), price: parseFloat(p.price) || 0, volume: parseFloat(p.volume) || 0, buyDate: p.buyDate, startDate: p.startDate || null, endDate: p.endDate || null, expireDate: p.expireDate || null, notes: p.notes }]
    };
    onSave(item);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Tên sản phẩm *</label><input style={s.input} value={f.name} onChange={e => set("name", e.target.value)} placeholder="VD: Dove" /></div>
        <div><label style={s.label}>Nhãn hiệu</label><input style={s.input} value={f.brand} onChange={e => set("brand", e.target.value)} placeholder="VD: Dove" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={s.label}>Nhóm *</label>
          <select style={s.input} value={f.groupId} onChange={e => { set("groupId", e.target.value); set("typeId", ""); }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Loại sản phẩm</label>
          <select style={s.input} value={f.typeId} onChange={e => set("typeId", e.target.value)}>
            <option value="">— Không phân loại —</option>
            {filteredTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: initial ? 14 : 0 }}>
        <label style={s.label}>Ghi chú sản phẩm</label>
        <input style={s.input} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Nhận xét chung về sản phẩm..." />
      </div>

      {!initial && (
        <>
          <div style={s.sep} />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Lần mua đầu tiên</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={s.label}>Giá mua (đ) *</label><input style={s.input} type="number" value={p.price} onChange={e => setP_("price", e.target.value)} placeholder="0" /></div>
            <div><label style={s.label}>Dung tích/KL (ml/g)</label><input style={s.input} type="number" value={p.volume} onChange={e => setP_("volume", e.target.value)} placeholder="Tuỳ chọn" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <DateField label="Ngày mua" value={p.buyDate} onChange={v => setP_("buyDate", v)} required />
            <DateField label="Ngày bắt đầu dùng" value={p.startDate} onChange={v => setP_("startDate", v)} />
            <DateField label="Ngày dùng hết" value={p.endDate} onChange={v => setP_("endDate", v)} />
            <DateField label="Hạn sử dụng (HSD)" value={p.expireDate} onChange={v => setP_("expireDate", v)} />
          </div>
          <div style={{ marginBottom: 14 }}><label style={s.label}>Ghi chú lần mua này</label><input style={s.input} value={p.notes} onChange={e => setP_("notes", e.target.value)} placeholder="VD: Sale 20%..." /></div>
        </>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btnPrimary} onClick={save}>{initial ? "Lưu thay đổi" : "Thêm đồ dùng"}</button>
        <button style={s.btn} onClick={onClose}>Huỷ</button>
      </div>
    </div>
  );
}

/* ─── ITEM DETAIL (purchases history + rebuy) ─── */
function ItemDetail({ item, groups, types, onClose, onEditMeta, onAddPurchase, onEditPurchase, onDeletePurchase, onMarkDone }) {
  const g = groups.find(x => x.id === item.groupId);
  const t = types.find(x => x.id === item.typeId);
  const agg = calcItem(item);
  const [subModal, setSubModal] = useState(null); // "add" | "edit" | "done"
  const [editPc, setEditPc] = useState(null);

  const activePc = item.purchases.find(p => !p.endDate);
  const activeCp = activePc ? calcPurchase(activePc) : null;

  const sortedPurchases = [...item.purchases].sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate));

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.row, marginBottom: 14 }}>
        <span style={{ fontSize: 30 }}>{g?.icon || "📦"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{item.brand || ""}{t ? ` · ${t.name}` : ""}</div>
        </div>
        <button onClick={onEditMeta} style={s.btnSm}>✏️ Sửa</button>
      </div>

      {/* Aggregate stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          ["Tổng đã chi", fmt(agg.totalPrice) + "đ", item.purchases.length + " lần mua"],
          ["TB chi phí/ngày", agg.avgPerDay ? fmt(agg.avgPerDay) + "đ" : "—", agg.finished.length + " chu kỳ hoàn thành"],
          ["TB chi phí/tháng", agg.avgPerMonth ? fmt(agg.avgPerMonth) + "đ" : "—", "Trung bình dài hạn"],
          ["Tổng ngày đã dùng", agg.totalDays + " ngày", agg.avgMlPerDay ? `TB ${agg.avgMlPerDay.toFixed(1)}đv/ngày` : ""],
        ].map(([l, v, sub]) => (
          <div key={l} style={s.metric}>
            <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
            <div style={{ fontSize: 17, fontWeight: 700, margin: "3px 0" }}>{v}</div>
            <div style={{ fontSize: 10, color: C.faint }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Active purchase */}
      {activePc && (
        <div style={{ background: C.greenBg, borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: `1px solid ${C.green}20` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 6 }}>🟢 Đang dùng — lần mua #{item.purchases.indexOf(activePc) + 1}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              ["Giá", fmt(activePc.price) + "đ"],
              ["Chi phí/ngày", activeCp?.notStarted ? "Chưa dùng" : fmt(activeCp?.perDay) + "đ"],
              ["Đã dùng", activeCp?.notStarted ? "—" : activeCp?.days + " ngày"],
            ].map(([l, v]) => (
              <div key={l} style={{ background: "rgba(255,255,255,.6)", borderRadius: 7, padding: "6px 8px" }}>
                <div style={{ fontSize: 10, color: C.green }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {activeCp?.notStarted
              ? <button onClick={() => onMarkDone(item.id, activePc.id, "start")} style={{ ...s.btnSm, color: C.green, borderColor: C.green }}>▶ Bắt đầu dùng</button>
              : <button onClick={() => { setSubModal("done"); }} style={s.btnSm}>✓ Đánh dấu hết</button>
            }
            <button onClick={() => { setEditPc(activePc); setSubModal("edit"); }} style={s.btnSm}>✏️</button>
          </div>
        </div>
      )}

      {/* Rebuy button */}
      <button onClick={() => setSubModal("add")} style={{ ...s.btnPrimary, width: "100%", justifyContent: "center", marginBottom: 14 }}>
        🔄 Mua lại / Thêm lần mua mới
      </button>

      {/* Purchase history timeline */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Lịch sử {item.purchases.length} lần mua</div>
      {sortedPurchases.map((p, i) => {
        const pc = calcPurchase(p);
        const isActive = !p.endDate;
        const label = isActive ? "Đang dùng" : `Lần ${item.purchases.length - i}`;
        const trend = i < sortedPurchases.length - 1 ? sortedPurchases[i + 1] : null;
        const trendDiff = trend ? p.price - trend.price : null;
        return (
          <div key={p.id} style={{ position: "relative", paddingLeft: 22, marginBottom: 10 }}>
            {/* Timeline line */}
            <div style={{ position: "absolute", left: 7, top: 20, bottom: -10, width: 1, background: i < sortedPurchases.length - 1 ? C.border : "transparent" }} />
            <div style={{ position: "absolute", left: 2, top: 4, width: 12, height: 12, borderRadius: "50%", background: isActive ? C.green : C.surface, border: `2px solid ${isActive ? C.green : C.border}` }} />
            <div style={{ background: C.surface, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                  {trendDiff !== null && (
                    <span style={{ fontSize: 10, marginLeft: 6, color: trendDiff > 0 ? C.red : C.green }}>
                      {trendDiff > 0 ? `▲${fmt(trendDiff)}đ` : `▼${fmt(Math.abs(trendDiff))}đ`}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { setEditPc(p); setSubModal("edit"); }} style={{ ...s.btnSm, padding: "2px 6px" }}>✏️</button>
                  {!isActive && <button onClick={() => onDeletePurchase(item.id, p.id)} style={{ ...s.btnSm, padding: "2px 6px", color: C.red }}>🗑</button>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                {fmtDate(p.buyDate)} {p.startDate ? `→ ${p.endDate ? fmtDate(p.endDate) : "nay"}` : "(chưa dùng)"}
                {p.volume ? ` · ${fmt(p.volume)}đv` : ""}
                {p.expireDate ? ` · HSD: ${fmtDate(p.expireDate)}` : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                {[
                  ["Giá", fmt(p.price) + "đ"],
                  ["Chi phí/ngày", pc.notStarted ? "Chưa dùng" : pc.perDay ? fmt(pc.perDay) + "đ" : "—"],
                  ["Số ngày", pc.notStarted ? "—" : pc.days + "ng"],
                  pc.costPerMl ? ["Giá/đv", pc.costPerMl.toFixed(1) + "đ"] : null,
                  pc.mlPerDay ? ["đv/ngày", pc.mlPerDay.toFixed(1) + "đv"] : null,
                  pc.valueScore ? ["Điểm", pc.valueScore] : null,
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l} style={{ background: C.card, borderRadius: 6, padding: "5px 7px" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              {p.notes ? <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontStyle: "italic" }}>"{p.notes}"</div> : null}
            </div>
          </div>
        );
      })}

      {/* Sub-modals */}
      <Modal open={subModal === "add"} onClose={() => setSubModal(null)} title="🔄 Mua lại">
        <PurchaseForm
          prefill={activePc || (item.purchases[item.purchases.length - 1])}
          onSave={pc => { onAddPurchase(item.id, pc); setSubModal(null); }}
          onClose={() => setSubModal(null)}
          title="Thêm lần mua"
        />
      </Modal>
      <Modal open={subModal === "edit"} onClose={() => setSubModal(null)} title="Sửa lần mua">
        <PurchaseForm
          initial={editPc}
          onSave={pc => { onEditPurchase(item.id, pc); setSubModal(null); setEditPc(null); }}
          onClose={() => { setSubModal(null); setEditPc(null); }}
        />
      </Modal>
      <Modal open={subModal === "done"} onClose={() => setSubModal(null)} title="✓ Đánh dấu đã hết">
        <MarkDoneForm
          purchase={activePc}
          onSave={(endDate, rebuy) => {
            onMarkDone(item.id, activePc.id, "end", endDate);
            setSubModal(null);
            if (rebuy) setTimeout(() => setSubModal("add"), 200);
          }}
          onClose={() => setSubModal(null)}
        />
      </Modal>
    </div>
  );
}

/* ─── MARK DONE FORM ─── */
function MarkDoneForm({ purchase, onSave, onClose }) {
  const [endDate, setEndDate] = useState(todayStr());
  const [rebuy, setRebuy] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
        Xác nhận đã dùng hết lần mua ngày {fmtDate(purchase?.buyDate)} ({fmt(purchase?.price)}đ)?
      </div>
      <DateField label="Ngày dùng hết" value={endDate} onChange={setEndDate} required />
      <div style={{ ...s.row, background: C.surface, borderRadius: 8, padding: "10px 12px", margin: "12px 0", cursor: "pointer" }} onClick={() => setRebuy(r => !r)}>
        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${rebuy ? C.accent : C.border}`, background: rebuy ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {rebuy && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>🔄 Mua lại ngay</div>
          <div style={{ fontSize: 11, color: C.muted }}>Mở form thêm lần mua mới sau khi lưu</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btnPrimary} onClick={() => { if (endDate) onSave(endDate, rebuy); }}>Xác nhận</button>
        <button style={s.btn} onClick={onClose}>Huỷ</button>
      </div>
    </div>
  );
}

/* ─── GROUP MANAGER ─── */
function GroupManager({ groups, types, onSave, onClose }) {
  const [gs, setGs] = useState(groups.map(g => ({ ...g })));
  const [ts, setTs] = useState(types.map(t => ({ ...t })));
  const [tab, setTab] = useState("groups");
  const [newG, setNewG] = useState({ name: "", icon: "📦" });
  const [newT, setNewT] = useState({ name: "", groupId: groups[0]?.id || "" });
  const ICONS = ["🧴","✨","🧺","🧹","🍚","💊","🏠","📦","🛒","🎯","🌿","🔧","🖊️","🎽","🛁","🪥","🧃","🧼"];
  const addGroup = () => { if (!newG.name.trim()) return; setGs(p => [...p, { id: uid(), name: newG.name.trim(), icon: newG.icon }]); setNewG({ name: "", icon: "📦" }); };
  const delGroup = (id) => { if (ts.some(t => t.groupId === id)) { alert("Xoá hết loại trong nhóm này trước"); return; } setGs(p => p.filter(g => g.id !== id)); };
  const addType = () => { if (!newT.name.trim()) return; setTs(p => [...p, { id: uid(), name: newT.name.trim(), groupId: newT.groupId }]); setNewT(p => ({ ...p, name: "" })); };
  const delType = (id) => setTs(p => p.filter(t => t.id !== id));
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["groups", "types"].map(tab2 => (
          <button key={tab2} onClick={() => setTab(tab2)} style={tab === tab2 ? s.btnSmActive : s.btnSm}>
            {tab2 === "groups" ? "🗂 Nhóm" : "🏷 Loại sản phẩm"}
          </button>
        ))}
      </div>
      {tab === "groups" && (
        <div>
          {gs.map(g => (
            <div key={g.id} style={{ ...s.row, padding: "8px 0", borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 20 }}>{g.icon}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{g.name}</span>
              <button onClick={() => delGroup(g.id)} style={{ ...s.btnSm, color: C.red }}>Xoá</button>
            </div>
          ))}
          <div style={s.sep} />
          <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 8 }}>Thêm nhóm mới</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}><label style={s.label}>Tên nhóm</label><input style={s.input} value={newG.name} onChange={e => setNewG(p => ({ ...p, name: e.target.value }))} placeholder="VD: Đồ chơi" /></div>
            <div><label style={s.label}>Icon</label><select style={{ ...s.input, width: 80 }} value={newG.icon} onChange={e => setNewG(p => ({ ...p, icon: e.target.value }))}>{ICONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            <button style={s.btnPrimary} onClick={addGroup}>+ Thêm</button>
          </div>
        </div>
      )}
      {tab === "types" && (
        <div>
          {gs.map(g => {
            const gTypes = ts.filter(t => t.groupId === g.id);
            if (!gTypes.length) return null;
            return (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{g.icon} {g.name}</div>
                {gTypes.map(t => (
                  <div key={t.id} style={{ ...s.row, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ flex: 1, fontSize: 14 }}>{t.name}</span>
                    <button onClick={() => delType(t.id)} style={{ ...s.btnSm, color: C.red }}>Xoá</button>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={s.sep} />
          <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 8 }}>Thêm loại sản phẩm</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}><label style={s.label}>Tên loại</label><input style={s.input} value={newT.name} onChange={e => setNewT(p => ({ ...p, name: e.target.value }))} placeholder="VD: Xịt khoáng" /></div>
            <div style={{ minWidth: 140 }}><label style={s.label}>Thuộc nhóm</label><select style={s.input} value={newT.groupId} onChange={e => setNewT(p => ({ ...p, groupId: e.target.value }))}>{gs.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}</select></div>
            <button style={s.btnPrimary} onClick={addType}>+ Thêm</button>
          </div>
        </div>
      )}
      <div style={s.sep} />
      <button style={s.btnPrimary} onClick={() => onSave(gs, ts)}>Lưu thay đổi</button>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function DashboardPage({ items, groups, types }) {
  const aggs = items.map(it => ({ it, agg: calcItem(it) }));
  const activeItems = aggs.filter(({ agg }) => agg.active);
  const inUseItems = activeItems.filter(({ agg }) => agg.activePc && !calcPurchase(agg.activePc).notStarted);
  const totalSpent = aggs.reduce((s, { agg }) => s + agg.totalPrice, 0);
  const dayCost = inUseItems.reduce((s, { agg }) => s + (agg.activePc ? calcPurchase(agg.activePc).perDay || 0 : 0), 0);
  const monthCost = dayCost * 30;
  const alerts = items.flatMap(it => it.purchases.filter(p => {
    const pc = calcPurchase(p);
    return pc.daysToExp != null && pc.daysToExp < 30;
  }).map(p => ({ it, p })));
  const catSpend = {};
  items.forEach(it => { catSpend[it.groupId] = (catSpend[it.groupId] || 0) + calcItem(it).totalPrice; });
  const catRows = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([gid, v]) => {
    const g = groups.find(x => x.id === gid) || { name: gid, icon: "📦" };
    return { label: g.icon + " " + g.name, value: v };
  });
  const recent = [...items].sort((a, b) => {
    const la = a.purchases[a.purchases.length - 1]?.buyDate || "";
    const lb = b.purchases[b.purchases.length - 1]?.buyDate || "";
    return lb.localeCompare(la);
  }).slice(0, 4);

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          ["Tổng đã chi", fmt(totalSpent) + "đ", items.length + " sản phẩm"],
          ["Chi phí/ngày", fmt(dayCost) + "đ", inUseItems.length + " đang dùng"],
          ["Chi phí/tháng", fmt(monthCost) + "đ", "Ước tính"],
          ["Cần chú ý", alerts.length + " món", "Sắp/đã hết hạn"],
        ].map(([l, v, sub]) => (
          <div key={l} style={s.metric}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
      {alerts.length > 0 && (
        <div style={{ ...s.card, borderLeft: `3px solid ${C.amber}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⚠️ Cảnh báo HSD</div>
          {alerts.map(({ it, p }) => {
            const pc = calcPurchase(p);
            return (
              <div key={p.id} style={{ fontSize: 13, padding: "5px 0", borderTop: `0.5px solid ${C.border}` }}>
                <strong>{it.name}</strong> — {pc.daysToExp < 0 ? "đã hết hạn" : `còn ${pc.daysToExp} ngày (${fmtDate(p.expireDate)})`}
              </div>
            );
          })}
        </div>
      )}
      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Chi phí theo nhóm</div>
        {catRows.length ? <MiniBar rows={catRows} /> : <div style={{ color: C.faint, fontSize: 13 }}>Chưa có dữ liệu</div>}
      </div>
      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10 }}>Gần đây</div>
        {recent.map(it => {
          const agg = calcItem(it);
          const g = groups.find(x => x.id === it.groupId);
          const lastP = it.purchases[it.purchases.length - 1];
          return (
            <div key={it.id} style={{ ...s.row, padding: "8px 0", borderTop: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 22 }}>{g?.icon || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{it.purchases.length} lần mua · {fmtDate(lastP?.buyDate)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{fmt(agg.totalPrice)}đ</div>
                <div style={{ fontSize: 11, color: C.muted }}>{agg.avgPerDay ? fmt(agg.avgPerDay) + "đ TB/ngày" : "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ITEMS PAGE ─── */
function ItemsPage({ items, groups, types, onOpenDetail, onEdit, onDelete }) {
  const [groupFilter, setGroupFilter] = useState(null);
  const [search, setSearch] = useState("");
  let filtered = groupFilter ? items.filter(i => i.groupId === groupFilter) : items;
  if (search) filtered = filtered.filter(i => (i.name + " " + (i.brand || "")).toLowerCase().includes(search.toLowerCase()));
  filtered = [...filtered].sort((a, b) => {
    const la = a.purchases[a.purchases.length - 1]?.buyDate || "";
    const lb = b.purchases[b.purchases.length - 1]?.buyDate || "";
    return lb.localeCompare(la);
  });

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 6, marginBottom: 10 }}>
        {[{ id: null, name: "Tất cả", icon: "📋" }, ...groups].map(g => (
          <button key={g.id || "all"} onClick={() => setGroupFilter(g.id)}
            style={{ ...groupFilter === g.id ? s.btnSmActive : s.btnSm, whiteSpace: "nowrap", flexShrink: 0 }}>
            {g.icon} {g.name} {g.id ? `(${items.filter(i => i.groupId === g.id).length})` : `(${items.length})`}
          </button>
        ))}
      </div>
      <div style={{ ...s.row, background: C.surface, borderRadius: 8, padding: "8px 10px", marginBottom: 12, border: `0.5px solid ${C.border}` }}>
        <span style={{ color: C.faint }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." style={{ border: "none", background: "transparent", fontSize: 14, color: C.text, flex: 1, outline: "none", fontFamily: "inherit" }} />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Không có sản phẩm nào</div>
      ) : filtered.map(it => {
        const agg = calcItem(it);
        const g = groups.find(x => x.id === it.groupId);
        const t = types.find(x => x.id === it.typeId);
        const activePc = agg.active;
        const activeCp = activePc ? calcPurchase(activePc) : null;
        const statusColor = activePc ? C.green : C.muted;
        const statusText = activePc ? (activeCp?.notStarted ? "Chưa dùng" : "Đang dùng") : "Đã hết";
        return (
          <div key={it.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => onOpenDetail(it)}>
            <div style={{ ...s.row, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{g?.icon || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{it.brand || ""}{t ? ` · ${t.name}` : ""}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <Badge bg={activePc ? (activeCp?.notStarted ? C.indigoBg : C.greenBg) : C.surface} color={activePc ? (activeCp?.notStarted ? C.indigo : C.green) : C.muted}>{statusText}</Badge>
                <div style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{it.purchases.length} lần mua</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                ["Tổng đã chi", fmt(agg.totalPrice) + "đ"],
                ["TB/ngày", agg.avgPerDay ? fmt(agg.avgPerDay) + "đ" : "—"],
                ["Hiện tại", activeCp && !activeCp.notStarted ? fmt(activeCp.perDay) + "đ" : "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.surface, borderRadius: 7, padding: "6px 8px" }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Nhấn để xem lịch sử & quản lý →</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── ANALYSIS PAGE ─── */

// ── Scoring ──
function scoreItem(it, allItems) {
  const agg = calcItem(it);
  if (!agg.finished.length) return null;

  const totalDays = agg.totalDays;
  const totalPrice = agg.totalPrice;
  const totalVol = agg.finished.reduce((s, p) => s + (p.volume || 0), 0);
  if (!totalDays || !totalPrice) return null;

  // A: ngày / 1000đ
  const A = totalDays / (totalPrice / 1000);

  // B: ngày / 100đv (chỉ khi có đv)
  const hasVol = totalVol > 0;
  const B = hasVol ? (totalDays / totalVol) * 100 : null;

  // C: chuẩn hoá chi phí/ngày trong nhóm (0-1, cao hơn = rẻ hơn)
  const sameGroup = allItems.filter(i => i.groupId === it.groupId && calcItem(i).finished.length > 0);
  const groupPerDays = sameGroup.map(i => calcItem(i).avgPerDay).filter(Boolean);
  const maxPD = Math.max(...groupPerDays);
  const minPD = Math.min(...groupPerDays);
  const C = maxPD === minPD ? 1 : 1 - (agg.avgPerDay - minPD) / (maxPD - minPD);

  let score;
  if (hasVol) {
    score = A * 0.5 + B * 0.3 + C * 10 * 0.2;
  } else {
    score = A * 0.7 + C * 10 * 0.3;
  }

  return { score: parseFloat(score.toFixed(2)), A: parseFloat(A.toFixed(2)), B: B ? parseFloat(B.toFixed(2)) : null, C: parseFloat((C * 10).toFixed(2)), hasVol, totalDays, totalPrice, totalVol };
}

// ── Insights ──
function generateInsights(items, groups, types, wishes) {
  const insights = [];

  items.forEach(it => {
    const agg = calcItem(it);
    const g = groups.find(x => x.id === it.groupId);
    const icon = g?.icon || "📦";

    // 🔺 Giá tăng qua các lần mua
    if (it.purchases.length >= 2) {
      const sorted = [...it.purchases].sort((a, b) => new Date(a.buyDate) - new Date(b.buyDate));
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      if (last.price > prev.price * 1.1) {
        const pct = Math.round((last.price - prev.price) / prev.price * 100);
        insights.push({ type: "warn", icon: "🔺", text: `${icon} ${it.name} tăng giá ${pct}% so với lần trước (${fmt(prev.price)}đ → ${fmt(last.price)}đ)` });
      }
    }

    // ⚠️ Lần mua hiện tại đắt hơn TB lịch sử >20%
    if (agg.activePc && agg.finished.length >= 1) {
      const activeCp = calcPurchase(agg.activePc);
      if (activeCp.perDay && agg.avgPerDay && activeCp.perDay > agg.avgPerDay * 1.2) {
        const pct = Math.round((activeCp.perDay - agg.avgPerDay) / agg.avgPerDay * 100);
        insights.push({ type: "warn", icon: "⚠️", text: `${icon} ${it.name} đang tốn hơn TB lịch sử ${pct}% (${fmt(activeCp.perDay)}đ/ngày vs TB ${fmt(agg.avgPerDay)}đ/ngày)` });
      }
    }

    // 📉 Lần gần nhất dùng lâu hơn / ngắn hơn kỳ vọng
    if (agg.finished.length >= 2) {
      const last = agg.finished[agg.finished.length - 1];
      const prevFinished = agg.finished.slice(0, -1);
      const avgDays = prevFinished.reduce((s, p) => s + daysBetween(p.startDate, p.endDate), 0) / prevFinished.length;
      const lastDays = daysBetween(last.startDate, last.endDate);
      if (lastDays < avgDays * 0.75) {
        insights.push({ type: "warn", icon: "📉", text: `${icon} ${it.name} lần trước dùng chỉ ${lastDays} ngày, ngắn hơn TB ${Math.round(avgDays)} ngày` });
      } else if (lastDays > avgDays * 1.25) {
        insights.push({ type: "good", icon: "📈", text: `${icon} ${it.name} lần trước dùng ${lastDays} ngày, lâu hơn TB ${Math.round(avgDays)} ngày` });
      }
    }

    // 🔄 Sắp hết dựa trên tốc độ dùng TB
    if (agg.activePc && agg.avgMlPerDay && agg.activePc.volume > 0 && !calcPurchase(agg.activePc).notStarted) {
      const startDate = agg.activePc.startDate;
      const daysUsed = daysBetween(startDate, todayStr());
      const volUsed = daysUsed * agg.avgMlPerDay;
      const volLeft = agg.activePc.volume - volUsed;
      const daysLeft = volLeft > 0 ? Math.round(volLeft / agg.avgMlPerDay) : 0;
      if (daysLeft > 0 && daysLeft <= 14) {
        insights.push({ type: "warn", icon: "🔄", text: `${icon} ${it.name} ước còn ~${daysLeft} ngày nữa là hết (dựa trên tốc độ dùng TB)` });
      }
    }
  });

  // 🏆 Món tối ưu nhất mỗi nhóm
  const byGroup = {};
  items.forEach(it => {
    const sc = scoreItem(it, items);
    if (!sc) return;
    const gid = it.groupId;
    if (!byGroup[gid] || sc.score > byGroup[gid].score) byGroup[gid] = { it, score: sc.score };
  });
  Object.values(byGroup).forEach(({ it, score }) => {
    const g = groups.find(x => x.id === it.groupId);
    insights.push({ type: "good", icon: "🏆", text: `${g?.icon} Tối ưu nhất trong nhóm "${g?.name}": ${it.name} (điểm ${score})` });
  });

  // 🏆 Món tối ưu nhất mỗi loại (chỉ khi có ≥2 món cùng loại)
  const byType = {};
  items.forEach(it => {
    if (!it.typeId) return;
    const sc = scoreItem(it, items);
    if (!sc) return;
    if (!byType[it.typeId]) byType[it.typeId] = [];
    byType[it.typeId].push({ it, score: sc.score });
  });
  Object.entries(byType).forEach(([tid, rows]) => {
    if (rows.length < 2) return;
    const best = rows.reduce((b, x) => x.score > b.score ? x : b, rows[0]);
    const t = types.find(x => x.id === tid);
    const g = groups.find(x => x.id === best.it.groupId);
    insights.push({ type: "good", icon: "🥇", text: `${g?.icon} Tối ưu nhất loại "${t?.name}": ${best.it.name}${best.it.brand ? " (" + best.it.brand + ")" : ""} (điểm ${best.score})` });
  });

  // 💡 Wishlist rẻ hơn món đang dùng cùng loại
  wishes.forEach(w => {
    const c = calcWish(w, items);
    if (!c.perDay) return;
    const current = items.find(i => (w.typeId && i.typeId === w.typeId || !w.typeId && i.groupId === w.groupId) && !calcItem(i).active === false && calcItem(i).activePc);
    if (!current) return;
    const curCp = calcPurchase(calcItem(current).activePc);
    if (curCp.perDay && c.perDay < curCp.perDay * 0.9) {
      const save = Math.round(curCp.perDay - c.perDay);
      insights.push({ type: "tip", icon: "💡", text: `Wishlist "${w.name}" rẻ hơn ${current.name} đang dùng ~${fmt(save)}đ/ngày — đáng cân nhắc mua thử` });
    }
  });

  return insights;
}

function AnalysisPage({ items, groups, types, wishes }) {
  const [section, setSection] = useState("insights"); // insights | rank | compare
  const [rankMode, setRankMode] = useState("score"); // score | pml
  const [rankView, setRankView] = useState("all"); // all | bygroup
  const [compareMode, setCompareMode] = useState("group"); // group | type
  const [selGroup, setSelGroup] = useState(null);
  const [selType, setSelType] = useState(null);

  const usedGroups = groups.filter(g => items.some(i => i.groupId === g.id));
  const usedTypes = types.filter(t => items.some(i => i.typeId === t.id));

  useEffect(() => {
    if (compareMode === "group" && !selGroup && usedGroups.length) setSelGroup(usedGroups[0].id);
    if (compareMode === "type" && !selType && usedTypes.length) setSelType(usedTypes[0].id);
  }, [compareMode]);

  // Scoring
  const scoredItems = items
    .map(it => ({ it, sc: scoreItem(it, items), agg: calcItem(it) }))
    .filter(x => x.sc)
    .sort((a, b) => b.sc.score - a.sc.score);

  // Price/đv ranking
  const pmlRanked = items
    .map(it => {
      const vols = it.purchases.filter(p => p.volume > 0 && p.price > 0);
      if (!vols.length) return null;
      const avgPml = vols.reduce((s, p) => s + (parseFloat(p.price) || 0) / p.volume, 0) / vols.length;
      return { it, avgPml, agg: calcItem(it) };
    })
    .filter(Boolean)
    .sort((a, b) => a.avgPml - b.avgPml);

  const ranked = rankMode === "score" ? scoredItems : pmlRanked;

  const byGroup = {};
  ranked.forEach(x => {
    const gid = x.it.groupId;
    if (!byGroup[gid]) byGroup[gid] = [];
    byGroup[gid].push(x);
  });

  // Compare
  let compareItems = compareMode === "group" && selGroup
    ? items.filter(i => i.groupId === selGroup)
    : compareMode === "type" && selType
    ? items.filter(i => i.typeId === selType) : [];
  const comparable = compareItems.filter(it => calcItem(it).avgPerDay != null);
  const notReady = compareItems.filter(it => calcItem(it).avgPerDay == null);
  const best = comparable.length ? comparable.reduce((b, i) => calcItem(i).avgPerDay < calcItem(b).avgPerDay ? i : b, comparable[0]) : null;

  // Insights
  const insights = generateInsights(items, groups, types, wishes);
  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      {/* Section tabs */}
      <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {[["insights", "💡 Insights"], ["rank", "🏆 Xếp hạng"], ["compare", "⚖️ So sánh"]].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", background: section === id ? C.card : "transparent", color: section === id ? C.text : C.muted, fontSize: 12, fontWeight: section === id ? 600 : 400, cursor: "pointer", fontFamily: "inherit", boxShadow: section === id ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── INSIGHTS ── */}
      {section === "insights" && (
        <div>
          {insights.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💡</div>
              <div>Cần thêm dữ liệu để phát hiện insights</div>
            </div>
          ) : (
            <>
              {[
                { key: "warn", label: "⚠️ Cần chú ý", bg: C.amberBg, border: C.amber, color: "#5A3500" },
                { key: "good", label: "✅ Tín hiệu tốt", bg: C.greenBg, border: C.green, color: "#0A4A2E" },
                { key: "tip", label: "💡 Gợi ý", bg: C.accentBg, border: C.accent, color: C.accentText },
              ].map(({ key, label, bg, border, color }) => {
                const group = insights.filter(i => i.type === key);
                if (!group.length) return null;
                return (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{label}</div>
                    {group.map((ins, i) => (
                      <div key={i} style={{ background: bg, borderLeft: `3px solid ${border}`, borderRadius: "0 8px 8px 0", padding: "10px 12px", marginBottom: 8, fontSize: 13, color, lineHeight: 1.5 }}>
                        {ins.text}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── XẾPHẠNG ── */}
      {section === "rank" && (
        <div>
          {/* Mode selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div onClick={() => setRankMode("score")} style={{ background: rankMode === "score" ? C.accentBg : C.surface, border: `1px solid ${rankMode === "score" ? C.accent : "transparent"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: rankMode === "score" ? C.accent : C.text }}>⭐ Điểm tổng hợp</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>Kết hợp chi phí/ngày (50%), hiệu quả đv (30%), so nhóm (20%)</div>
            </div>
            <div onClick={() => setRankMode("pml")} style={{ background: rankMode === "pml" ? C.accentBg : C.surface, border: `1px solid ${rankMode === "pml" ? C.accent : "transparent"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: rankMode === "pml" ? C.accent : C.text }}>💧 Giá/đv</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>Đồng/đv trung bình. Thấp hơn = mua được nhiều hơn</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <button onClick={() => setRankView("all")} style={rankView === "all" ? s.btnSmActive : s.btnSm}>📊 Tất cả</button>
            <button onClick={() => setRankView("bygroup")} style={rankView === "bygroup" ? s.btnSmActive : s.btnSm}>🗂 Theo nhóm</button>
            <button onClick={() => setRankView("bytype")} style={rankView === "bytype" ? s.btnSmActive : s.btnSm}>🏷 Theo loại</button>
          </div>

          {ranked.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              {rankMode === "score" ? "Cần ít nhất 1 chu kỳ hoàn thành" : "Cần nhập dung tích để xếp hạng giá/đv"}
            </div>
          )}

          {rankView === "all" && ranked.map((x, i) => {
            const { it } = x;
            const agg = calcItem(it);
            const g = groups.find(g2 => g2.id === it.groupId);
            const t = types.find(t2 => t2.id === it.typeId);
            const sc = x.sc;
            return (
              <div key={it.id} style={{ ...s.card, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: i < 3 ? 24 : 16, minWidth: 28, paddingTop: 2, textAlign: "center" }}>{MEDAL[i] || `#${i + 1}`}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name} {it.brand ? <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>({it.brand})</span> : ""}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{g?.icon} {g?.name}{t ? ` · ${t.name}` : ""} · {agg.finished.length} chu kỳ</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                    {[
                      ["TB/ngày", fmt(agg.avgPerDay) + "đ"],
                      ["TB/tháng", fmt(agg.avgPerMonth) + "đ"],
                      ["Tổng chi", fmt(agg.totalPrice) + "đ"],
                      ["Tổng ngày", agg.totalDays + "ng"],
                      ["TB đv/ngày", agg.avgMlPerDay ? agg.avgMlPerDay.toFixed(1) : "—"],
                      ["Giá/đv", (() => { const vols = it.purchases.filter(p => p.volume > 0); return vols.length ? (vols.reduce((s, p) => s + p.price / p.volume, 0) / vols.length).toFixed(2) + "đ" : "—"; })()],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: C.surface, borderRadius: 6, padding: "5px 7px" }}>
                        <div style={{ fontSize: 9, color: C.muted }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {rankMode === "score" && sc && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                      A={sc.A} {sc.B != null ? `· B=${sc.B}` : ""} · So nhóm={sc.C}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: rankMode === "score" ? C.accent : C.green }}>
                    {rankMode === "score" ? (x.sc?.score ?? "—") : x.avgPml?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted }}>{rankMode === "score" ? "điểm" : "đ/đv"}</div>
                </div>
              </div>
            );
          })}

          {rankView === "bygroup" && Object.entries(byGroup).map(([gid, rows]) => {
            const g = groups.find(x => x.id === gid) || { name: gid, icon: "📦" };
            return (
              <div key={gid} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{g.icon} {g.name}</div>
                {rows.map((x, i) => {
                  const { it } = x;
                  const agg = calcItem(it);
                  const t = types.find(t2 => t2.id === it.typeId);
                  return (
                    <div key={it.id} style={{ ...s.card, display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ fontSize: i < 3 ? 20 : 14, minWidth: 24, textAlign: "center" }}>{MEDAL[i] || `#${i + 1}`}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name} {it.brand ? <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>({it.brand})</span> : ""}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {t?.name || ""} · {agg.finished.length} chu kỳ
                          {rankMode === "score" ? ` · TB ${fmt(agg.avgPerDay)}đ/ngày` : ` · ${x.avgPml?.toFixed(2)}đ/đv`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: rankMode === "score" ? C.accent : C.green }}>
                          {rankMode === "score" ? (x.sc?.score ?? "—") : x.avgPml?.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted }}>{rankMode === "score" ? "điểm" : "đ/đv"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {rankView === "bytype" && (() => {
            // Group ranked items by typeId, skip items with no typeId
            const byType = {};
            ranked.forEach(x => {
              const tid = x.it.typeId;
              if (!tid) return;
              if (!byType[tid]) byType[tid] = [];
              byType[tid].push(x);
            });
            // Also collect items with no type under each group
            const noType = ranked.filter(x => !x.it.typeId);
            return (
              <>
                {Object.entries(byType).map(([tid, rows]) => {
                  const t = types.find(x => x.id === tid);
                  const g = groups.find(x => x.id === rows[0]?.it.groupId);
                  return (
                    <div key={tid} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{g?.icon} {t?.name || tid}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Nhóm: {g?.name} · {rows.length} sản phẩm</div>
                      {rows.map((x, i) => {
                        const { it } = x;
                        const agg = calcItem(it);
                        return (
                          <div key={it.id} style={{ ...s.card, display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={{ fontSize: i < 3 ? 20 : 14, minWidth: 24, textAlign: "center" }}>{MEDAL[i] || `#${i + 1}`}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name} {it.brand ? <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>({it.brand})</span> : ""}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>
                                {agg.finished.length} chu kỳ
                                {rankMode === "score" ? ` · TB ${fmt(agg.avgPerDay)}đ/ngày` : ` · ${x.avgPml?.toFixed(2)}đ/đv`}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: rankMode === "score" ? C.accent : C.green }}>
                                {rankMode === "score" ? (x.sc?.score ?? "—") : x.avgPml?.toFixed(2)}
                              </div>
                              <div style={{ fontSize: 10, color: C.muted }}>{rankMode === "score" ? "điểm" : "đ/đv"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {noType.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📦 Chưa phân loại</div>
                    {noType.map((x, i) => {
                      const { it } = x;
                      const agg = calcItem(it);
                      const g = groups.find(g2 => g2.id === it.groupId);
                      return (
                        <div key={it.id} style={{ ...s.card, display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ fontSize: 14, minWidth: 24, textAlign: "center" }}>{g?.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name} {it.brand ? <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>({it.brand})</span> : ""}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{g?.name} · {agg.finished.length} chu kỳ · TB {fmt(agg.avgPerDay)}đ/ngày</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: rankMode === "score" ? C.accent : C.green }}>
                              {rankMode === "score" ? (x.sc?.score ?? "—") : x.avgPml?.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 10, color: C.muted }}>{rankMode === "score" ? "điểm" : "đ/đv"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── SO SÁNH ── */}
      {section === "compare" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setCompareMode("group")} style={compareMode === "group" ? s.btnSmActive : s.btnSm}>🗂 Cùng nhóm</button>
            <button onClick={() => setCompareMode("type")} style={compareMode === "type" ? s.btnSmActive : s.btnSm}>🏷 Cùng loại</button>
          </div>

          <div style={{ ...s.card, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{compareMode === "group" ? "Chọn nhóm:" : "Chọn loại:"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {compareMode === "group" && usedGroups.map(g => (
                <button key={g.id} onClick={() => setSelGroup(g.id)} style={selGroup === g.id ? s.btnSmActive : s.btnSm}>{g.icon} {g.name}</button>
              ))}
              {compareMode === "type" && usedTypes.map(t => {
                const g = groups.find(x => x.id === t.groupId);
                return <button key={t.id} onClick={() => setSelType(t.id)} style={selType === t.id ? s.btnSmActive : s.btnSm}>{g?.icon} {t.name}</button>;
              })}
            </div>
          </div>

          {compareItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: C.muted }}>Chọn để so sánh</div>
          ) : (
            <>
              {notReady.length > 0 && (
                <div style={{ fontSize: 12, color: C.amber, marginBottom: 8, padding: "6px 10px", background: C.amberBg, borderRadius: 7 }}>
                  ⚠️ {notReady.map(i => i.name).join(", ")} — chưa có chu kỳ hoàn thành
                </div>
              )}
              {comparable.length > 0 && (
                <MiniBar rows={[...comparable].sort((a, b) => calcItem(a).avgPerDay - calcItem(b).avgPerDay).map(it => ({
                  label: it.name + (it.brand ? ` (${it.brand})` : ""),
                  value: calcItem(it).avgPerDay,
                  valueLabel: fmt(calcItem(it).avgPerDay) + "đ/ngày TB"
                }))} />
              )}
              <div style={s.sep} />
              {compareItems.map(it => {
                const agg = calcItem(it);
                const isBest = it.id === best?.id;
                const noData = !agg.avgPerDay;
                const t = types.find(x => x.id === it.typeId);
                const sc = scoreItem(it, items);
                const avgPml = (() => { const vols = it.purchases.filter(p => p.volume > 0); return vols.length ? vols.reduce((s, p) => s + p.price / p.volume, 0) / vols.length : null; })();
                return (
                  <div key={it.id} style={{ ...s.card, borderColor: isBest ? C.accent : C.border, borderWidth: isBest ? 1.5 : 0.5, opacity: noData ? 0.6 : 1 }}>
                    {isBest && <Badge bg={C.accentBg} color={C.accentText}>✓ Chi phí TB tốt nhất</Badge>}
                    {noData && <Badge bg={C.indigoBg} color={C.indigo}>Chưa đủ dữ liệu</Badge>}
                    <div style={{ fontWeight: 600, fontSize: 15, marginTop: 6 }}>{it.name} {it.brand ? <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>({it.brand})</span> : ""}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{t ? t.name : ""} · {agg.purchaseCount} lần mua · {agg.finished.length} chu kỳ</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 }}>
                      {[
                        ["TB chi phí/ngày", agg.avgPerDay ? fmt(agg.avgPerDay) + "đ" : "—"],
                        ["TB chi phí/tháng", agg.avgPerMonth ? fmt(agg.avgPerMonth) + "đ" : "—"],
                        ["Tổng đã chi", fmt(agg.totalPrice) + "đ"],
                        ["Tổng ngày dùng", agg.totalDays + " ngày"],
                        ["TB đv/ngày", agg.avgMlPerDay ? agg.avgMlPerDay.toFixed(1) : "—"],
                        ["TB giá/đv", avgPml ? avgPml.toFixed(2) + "đ" : "—"],
                        ["Điểm tổng hợp", sc ? sc.score : "—"],
                        ["A/B/C", sc ? `${sc.A}/${sc.B ?? "—"}/${sc.C}` : "—"],
                      ].map(([l, v]) => (
                        <div key={l} style={{ background: C.surface, borderRadius: 7, padding: "7px 9px" }}>
                          <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}


/* ─── WISHLIST ─── */
function calcWish(wish, items) {
  const price = parseFloat(wish.price) || 0;
  const volume = parseFloat(wish.volume) || 0;
  const history = items.filter(i =>
    (wish.typeId && i.typeId === wish.typeId) || (!wish.typeId && i.groupId === wish.groupId)
  );
  const historyFinished = history.flatMap(i => i.purchases.filter(p => p.endDate && p.startDate));
  let mlPerDay = null, estDays = null, estDaysSource = "—", avgPerDay = null;
  if (historyFinished.length > 0) {
    const withVol = historyFinished.filter(p => p.volume > 0);
    if (withVol.length > 0) {
      const rates = withVol.map(p => p.volume / daysBetween(p.startDate, p.endDate));
      mlPerDay = rates.reduce((a, b) => a + b, 0) / rates.length;
    }
    const perDays = historyFinished.map(p => (parseFloat(p.price) || 0) / daysBetween(p.startDate, p.endDate));
    avgPerDay = perDays.reduce((a, b) => a + b, 0) / perDays.length;
    if (volume > 0 && mlPerDay) {
      estDays = Math.round(volume / mlPerDay);
      estDaysSource = `lịch sử (${withVol.length} chu kỳ)`;
    } else if (price > 0 && avgPerDay > 0) {
      estDays = Math.round(price / avgPerDay);
      estDaysSource = "giá TB lịch sử";
    }
  }
  if (!estDays && wish.expireDate) {
    estDays = daysBetween(todayStr(), wish.expireDate);
    estDaysSource = "HSD (ước tính)";
  }
  const perDay = estDays ? price / estDays : null;
  const perMonth = perDay ? perDay * 30 : null;
  const costPerMl = volume > 0 && price > 0 ? price / volume : null;
  const valueScore = estDays && price > 0 ? parseFloat((estDays / (price / 1000)).toFixed(2)) : null;
  return { price, volume, mlPerDay, estDays, estDaysSource, perDay, perMonth, costPerMl, valueScore, historyCount: historyFinished.length };
}

function WishForm({ initial, groups, types, onSave, onClose }) {
  const blank = { name: "", brand: "", groupId: groups[0]?.id || "", typeId: "", price: "", volume: "", expireDate: "", notes: "", url: "" };
  const [f, setF] = useState(initial ? { ...initial, price: String(initial.price || ""), volume: String(initial.volume || "") } : blank);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const filteredTypes = types.filter(t => t.groupId === f.groupId);
  const save = () => {
    if (!f.name.trim() || !f.price) { alert("Vui lòng điền tên và giá"); return; }
    onSave({ ...f, id: initial?.id || uid(), price: parseFloat(f.price) || 0, volume: parseFloat(f.volume) || 0, expireDate: f.expireDate || null, typeId: f.typeId || null });
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Tên sản phẩm *</label><input style={s.input} value={f.name} onChange={e => set("name", e.target.value)} placeholder="VD: Cetaphil" /></div>
        <div><label style={s.label}>Nhãn hiệu</label><input style={s.input} value={f.brand} onChange={e => set("brand", e.target.value)} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Nhóm *</label>
          <select style={s.input} value={f.groupId} onChange={e => { set("groupId", e.target.value); set("typeId", ""); }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </div>
        <div><label style={s.label}>Loại sản phẩm</label>
          <select style={s.input} value={f.typeId} onChange={e => set("typeId", e.target.value)}>
            <option value="">— Không phân loại —</option>
            {filteredTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Giá dự kiến (đ) *</label><input style={s.input} type="number" value={f.price} onChange={e => set("price", e.target.value)} /></div>
        <div><label style={s.label}>Dung tích/KL (ml/g)</label><input style={s.input} type="number" value={f.volume} onChange={e => set("volume", e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 10 }}><label style={s.label}>HSD (tuỳ chọn)</label><input style={s.input} type="date" value={f.expireDate || ""} onChange={e => set("expireDate", e.target.value)} /></div>
      <div style={{ marginBottom: 10 }}><label style={s.label}>Link sản phẩm</label><input style={s.input} value={f.url || ""} onChange={e => set("url", e.target.value)} placeholder="https://..." /></div>
      <div style={{ marginBottom: 14 }}><label style={s.label}>Ghi chú</label><textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={f.notes} onChange={e => set("notes", e.target.value)} /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btnPrimary} onClick={save}>{initial ? "Lưu" : "Thêm vào wishlist"}</button>
        <button style={s.btn} onClick={onClose}>Huỷ</button>
      </div>
    </div>
  );
}

function WishlistPage({ wishes, items, groups, types, onAdd, onEdit, onDelete, onMoved }) {
  const [groupFilter, setGroupFilter] = useState(null);
  const [expandId, setExpandId] = useState(null);
  const filtered = groupFilter ? wishes.filter(w => w.groupId === groupFilter) : wishes;
  const usedGroups = groups.filter(g => wishes.some(w => w.groupId === g.id));

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 6, marginBottom: 10 }}>
        {[{ id: null, name: "Tất cả", icon: "🛒" }, ...usedGroups].map(g => (
          <button key={g.id || "all"} onClick={() => setGroupFilter(g.id)}
            style={{ ...groupFilter === g.id ? s.btnSmActive : s.btnSm, whiteSpace: "nowrap", flexShrink: 0 }}>
            {g.icon} {g.name}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <div style={{ marginBottom: 16 }}>Wishlist trống</div>
          <button style={s.btnPrimary} onClick={onAdd}>+ Thêm món muốn mua</button>
        </div>
      ) : filtered.map(w => {
        const g = groups.find(x => x.id === w.groupId);
        const t = types.find(x => x.id === w.typeId);
        const c = calcWish(w, items);
        const expanded = expandId === w.id;
        const history = items.filter(i => (w.typeId && i.typeId === w.typeId) || (!w.typeId && i.groupId === w.groupId));
        const historyFinished = history.flatMap(i => i.purchases.filter(p => p.endDate && p.startDate));
        const bestHistPc = historyFinished.length > 0 ? historyFinished.reduce((b, p) => {
          const pd = (parseFloat(p.price) || 0) / daysBetween(p.startDate, p.endDate);
          const bd = (parseFloat(b.price) || 0) / daysBetween(b.startDate, b.endDate);
          return pd < bd ? p : b;
        }, historyFinished[0]) : null;
        const bestPerDay = bestHistPc ? (parseFloat(bestHistPc.price) || 0) / daysBetween(bestHistPc.startDate, bestHistPc.endDate) : null;
        const isBetter = c.perDay && bestPerDay && c.perDay < bestPerDay;
        const isWorse = c.perDay && bestPerDay && c.perDay > bestPerDay * 1.1;

        return (
          <div key={w.id} style={{ ...s.card, borderLeft: `3px solid ${isBetter ? C.green : isWorse ? C.amber : C.border}` }}>
            <div style={{ ...s.row, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{g?.icon || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{w.brand || ""}{t ? ` · ${t.name}` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(w.price)}đ</div>
                {w.volume ? <div style={{ fontSize: 11, color: C.muted }}>{fmt(w.volume)}đv</div> : null}
              </div>
            </div>
            {bestHistPc && c.perDay && (
              <div style={{ background: isBetter ? C.greenBg : isWorse ? C.amberBg : C.surface, borderRadius: 7, padding: "6px 10px", fontSize: 12, marginBottom: 8 }}>
                {isBetter ? <span style={{ color: C.green }}>✓ Rẻ hơn tốt nhất hiện có: -{fmt(bestPerDay - c.perDay)}đ/ngày</span>
                  : isWorse ? <span style={{ color: C.amber }}>⚠ Đắt hơn tốt nhất hiện có: +{fmt(c.perDay - bestPerDay)}đ/ngày</span>
                  : <span style={{ color: C.muted }}>≈ Tương đương</span>}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[["Chi phí/ngày", c.perDay ? fmt(c.perDay) + "đ" : "—"], ["Chi phí/tháng", c.perMonth ? fmt(c.perMonth) + "đ" : "—"], ["Ước dùng", c.estDays ? c.estDays + " ngày" : "—"]].map(([l, v]) => (
                <div key={l} style={{ background: C.surface, borderRadius: 7, padding: "7px 9px" }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>
              📊 Ước tính từ: <strong style={{ color: C.muted }}>{c.estDaysSource}</strong>
              {c.costPerMl ? ` · ${c.costPerMl.toFixed(1)}đ/ml` : ""}
              {c.valueScore ? ` · Điểm: ${c.valueScore}` : ""}
            </div>
            {/* Expanded compare */}
            {expanded && history.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>So sánh chi tiết</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 60px 56px", gap: 4, padding: "4px 0 6px", borderBottom: `1px solid ${C.border}` }}>
                  {["Sản phẩm", "đ/ngày", "đ/đv", "Ngày"].map(h => (
                    <div key={h} style={{ fontSize: 10, color: C.faint, fontWeight: 600, textAlign: h === "Sản phẩm" ? "left" : "right" }}>{h}</div>
                  ))}
                </div>
                {history.flatMap(it => it.purchases.filter(p => p.endDate && p.startDate).map(p => {
                  const days = daysBetween(p.startDate, p.endDate);
                  const pd = (parseFloat(p.price) || 0) / days;
                  const pml = p.volume > 0 ? parseFloat(p.price) / p.volume : null;
                  return (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 72px 60px 56px", gap: 4, padding: "5px 0", borderTop: `0.5px solid ${C.border}` }}>
                      <div style={{ fontSize: 11 }}>{it.name} <span style={{ color: C.muted }}>{it.brand || ""}</span></div>
                      <div style={{ fontSize: 11, textAlign: "right", fontWeight: 500 }}>{fmt(pd)}đ</div>
                      <div style={{ fontSize: 11, textAlign: "right", color: C.muted }}>{pml ? pml.toFixed(1) + "đ" : "—"}</div>
                      <div style={{ fontSize: 11, textAlign: "right", color: C.muted }}>{days}ng</div>
                    </div>
                  );
                }))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 60px 56px", gap: 4, padding: "7px 0 2px", borderTop: `2px solid ${C.accent}`, marginTop: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>{w.name} <span style={{ fontSize: 10 }}>wishlist</span></div>
                  <div style={{ fontSize: 11, textAlign: "right", fontWeight: 700, color: C.accent }}>{c.perDay ? fmt(c.perDay) + "đ" : "—"}</div>
                  <div style={{ fontSize: 11, textAlign: "right", color: C.accentText, fontWeight: 600 }}>{c.costPerMl ? c.costPerMl.toFixed(1) + "đ" : "—"}</div>
                  <div style={{ fontSize: 11, textAlign: "right", color: C.muted }}>{c.estDays ? c.estDays + "ng" : "—"}</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {history.length > 0 && <button onClick={() => setExpandId(expanded ? null : w.id)} style={s.btnSm}>{expanded ? "Thu gọn" : "So sánh chi tiết"}</button>}
              <button onClick={() => onMoved(w)} style={s.btnSm}>✓ Đã mua</button>
              <button onClick={() => onEdit(w)} style={s.btnSm}>✏️</button>
              {w.url && <a href={w.url} target="_blank" rel="noreferrer" style={{ ...s.btnSm, textDecoration: "none" }}>🔗</a>}
              <button onClick={() => onDelete(w.id)} style={{ ...s.btnSm, color: C.red, marginLeft: "auto" }}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── BACKUP ─── */
function BackupModal({ groups, types, items, wishes, onImport, onClose }) {
  const [importError, setImportError] = useState(null);
  const [importOk, setImportOk] = useState(false);
  const doExport = () => {
    const data = { version: 2, exportedAt: new Date().toISOString(), groups, types, items, wishes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dodung-backup-${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = (e) => {
    setImportError(null); setImportOk(false);
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.items || !Array.isArray(data.items)) throw new Error("File không hợp lệ");
        if (!confirm(`Tìm thấy ${data.items.length} sản phẩm, ${data.wishes?.length || 0} wishlist.\nDữ liệu hiện tại sẽ bị GHI ĐÈ. Tiếp tục?`)) return;
        onImport(data); setImportOk(true);
      } catch (err) { setImportError("Lỗi: " + err.message); }
    };
    reader.readAsText(file); e.target.value = "";
  };
  return (
    <div>
      <div style={{ background: C.surface, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>📤 Xuất dữ liệu</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
          {items.length} sản phẩm · {items.reduce((s, i) => s + i.purchases.length, 0)} lần mua · {wishes.length} wishlist
        </div>
        <button style={s.btnPrimary} onClick={doExport}>📥 Tải file backup (.json)</button>
      </div>
      <div style={{ background: C.surface, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>📂 Khôi phục dữ liệu</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Chọn file .json — <span style={{ color: C.red }}>dữ liệu hiện tại sẽ bị ghi đè.</span></div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, ...s.btn, cursor: "pointer" }}>
          📁 Chọn file backup<input type="file" accept=".json" onChange={doImport} style={{ display: "none" }} />
        </label>
        {importError && <div style={{ marginTop: 10, background: C.redBg, color: C.red, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>❌ {importError}</div>}
        {importOk && <div style={{ marginTop: 10, background: C.greenBg, color: C.green, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>✅ Khôi phục thành công!</div>}
      </div>
      <div style={{ fontSize: 12, color: C.faint, marginTop: 12, lineHeight: 1.7 }}>💡 Gợi ý: Backup mỗi tuần 1 lần, lưu vào Google Drive hoặc iCloud.</div>
    </div>
  );
}

/* ─── STORAGE ─── */
const STORAGE = "dodung_v4";
function loadState() { try { const r = localStorage.getItem(STORAGE); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveState(s) { try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch {} }

/* ─── MAIN APP ─── */
export default function App() {
  const initial = loadState();
  const [groups, setGroups] = useState(initial?.groups || DEFAULT_GROUPS);
  const [types, setTypes] = useState(initial?.types || DEFAULT_TYPES);
  const [items, setItems] = useState(() => migrateItems(initial?.items || []));
  const [wishes, setWishes] = useState(initial?.wishes || []);
  const [page, setPage] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editWish, setEditWish] = useState(null);

  useEffect(() => saveState({ groups, types, items, wishes }), [groups, types, items, wishes]);

  // Item handlers
  const saveItem = it => { setItems(p => editItem ? p.map(x => x.id === it.id ? it : x) : [...p, it]); setModal(null); setEditItem(null); };
  const deleteItem = id => { if (confirm("Xoá sản phẩm này?")) { setItems(p => p.filter(i => i.id !== id)); setDetailItem(null); } };

  // Purchase handlers
  const addPurchase = (itemId, pc) => setItems(p => p.map(it => it.id === itemId ? { ...it, purchases: [...it.purchases, pc] } : it));
  const editPurchase = (itemId, pc) => setItems(p => p.map(it => it.id === itemId ? { ...it, purchases: it.purchases.map(x => x.id === pc.id ? pc : x) } : it));
  const deletePurchase = (itemId, pcId) => { if (confirm("Xoá lần mua này?")) setItems(p => p.map(it => it.id === itemId ? { ...it, purchases: it.purchases.filter(x => x.id !== pcId) } : it)); };
  const markDone = (itemId, pcId, action, endDate) => {
    setItems(p => p.map(it => it.id !== itemId ? it : {
      ...it, purchases: it.purchases.map(pc => pc.id !== pcId ? pc : {
        ...pc,
        ...(action === "start" ? { startDate: todayStr() } : { endDate })
      })
    }));
    // Update detailItem reference
    setDetailItem(prev => prev?.id === itemId ? { ...prev, purchases: prev.purchases.map(pc => pc.id !== pcId ? pc : { ...pc, ...(action === "start" ? { startDate: todayStr() } : { endDate }) }) } : prev);
  };

  // Wishlist handlers
  const saveWish = w => { setWishes(p => editWish ? p.map(x => x.id === w.id ? w : x) : [...p, w]); setModal(null); setEditWish(null); };
  const deleteWish = id => { if (confirm("Xoá khỏi wishlist?")) setWishes(p => p.filter(w => w.id !== id)); };
  const moveToItems = w => {
    const newItem = { id: uid(), name: w.name, brand: w.brand, groupId: w.groupId, typeId: w.typeId, notes: w.notes || "", purchases: [{ id: uid(), price: w.price, volume: w.volume || 0, buyDate: todayStr(), startDate: null, endDate: null, expireDate: w.expireDate, notes: "" }] };
    setItems(p => [...p, newItem]);
    setWishes(p => p.filter(x => x.id !== w.id));
  };

  // Groups
  const saveGroups = (gs, ts) => { setGroups(gs); setTypes(ts); setModal(null); };

  // Import
  const doImport = (data) => {
    if (data.groups) setGroups(data.groups);
    if (data.types) setTypes(data.types);
    setItems(migrateItems(data.items || []));
    if (data.wishes) setWishes(data.wishes);
  };

  // Sample data
  const addSample = () => setItems(p => [...p, ...SAMPLE_ITEMS.filter(s => !p.find(i => i.id === s.id))]);

  const PAGES = [
    { id: "dashboard", icon: "📊", label: "Tổng quan" },
    { id: "items", icon: "📦", label: "Đồ dùng" },
    { id: "wishlist", icon: "🛒", label: "Wishlist" },
    { id: "analysis", icon: "📈", label: "Phân tích" },
  ];
  const PAGE_TITLES = { dashboard: "Tổng quan", items: "Đồ dùng", wishlist: "Wishlist", analysis: "Phân tích" };
  const addBtn = page === "wishlist"
    ? <button onClick={() => { setEditWish(null); setModal("addwish"); }} style={s.btnPrimary}>+ Thêm</button>
    : page === "analysis" ? null
    : <button onClick={() => { setEditItem(null); setModal("add"); }} style={s.btnPrimary}>+ Thêm</button>;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "system-ui,-apple-system,sans-serif", color: C.text, fontSize: 15, position: "relative" }}>
      <div style={{ background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>ĐồDùng.io</div>
          <div style={{ fontSize: 11, color: C.faint }}>{PAGE_TITLES[page]}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setModal("backup")} style={s.btnSm}>💾</button>
          <button onClick={() => setModal("groups")} style={s.btnSm}>⚙️</button>
          {addBtn}
        </div>
      </div>

      {items.length === 0 && page !== "wishlist" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bắt đầu theo dõi</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>Thêm đồ dùng để theo dõi chi phí, so sánh và tối ưu chi tiêu.</div>
          <div style={{ display: "flex", gap: 10, flexDirection: "column", width: "100%", maxWidth: 280 }}>
            <button style={s.btnPrimary} onClick={() => setModal("add")}>+ Thêm đồ dùng đầu tiên</button>
            <button style={s.btn} onClick={addSample}>✨ Dùng dữ liệu mẫu</button>
            <button style={s.btn} onClick={() => setModal("backup")}>💾 Khôi phục từ backup</button>
          </div>
        </div>
      ) : page === "dashboard" ? <DashboardPage items={items} groups={groups} types={types} />
        : page === "items" ? <ItemsPage items={items} groups={groups} types={types} onOpenDetail={it => { setDetailItem(it); setModal("detail"); }} onEdit={it => { setEditItem(it); setModal("add"); }} onDelete={deleteItem} />
        : page === "wishlist" ? <WishlistPage wishes={wishes} items={items} groups={groups} types={types} onAdd={() => { setEditWish(null); setModal("addwish"); }} onEdit={w => { setEditWish(w); setModal("addwish"); }} onDelete={deleteWish} onMoved={moveToItems} />
        : page === "analysis" ? <AnalysisPage items={items} groups={groups} types={types} wishes={wishes} />
        : null}

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.card, borderTop: `0.5px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{ flex: 1, padding: "10px 2px 8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: page === p.id ? C.accent : C.faint, fontFamily: "inherit", position: "relative" }}>
            <span style={{ fontSize: 18 }}>{p.icon}</span>
            <span style={{ fontSize: 9, fontWeight: page === p.id ? 600 : 400 }}>{p.label}</span>
            {p.id === "wishlist" && wishes.length > 0 && (
              <span style={{ position: "absolute", top: 6, right: "50%", transform: "translateX(10px)", background: C.accent, color: "#fff", borderRadius: 10, fontSize: 9, padding: "1px 5px", fontWeight: 700 }}>{wishes.length}</span>
            )}
          </button>
        ))}
      </div>

      <Modal open={modal === "add"} onClose={() => { setModal(null); setEditItem(null); }} title={editItem ? "Sửa sản phẩm" : "Thêm đồ dùng"}>
        <ItemForm initial={editItem} groups={groups} types={types} onSave={saveItem} onClose={() => { setModal(null); setEditItem(null); }} />
      </Modal>
      <Modal open={modal === "detail"} onClose={() => { setModal(null); setDetailItem(null); }} title="Chi tiết sản phẩm">
        {detailItem && (
          <ItemDetail
            item={items.find(i => i.id === detailItem.id) || detailItem}
            groups={groups} types={types}
            onClose={() => { setModal(null); setDetailItem(null); }}
            onEditMeta={() => { setEditItem(items.find(i => i.id === detailItem.id)); setModal("add"); }}
            onAddPurchase={addPurchase}
            onEditPurchase={editPurchase}
            onDeletePurchase={deletePurchase}
            onMarkDone={markDone}
          />
        )}
      </Modal>
      <Modal open={modal === "addwish"} onClose={() => { setModal(null); setEditWish(null); }} title={editWish ? "Sửa wishlist" : "Thêm vào Wishlist"}>
        <WishForm initial={editWish} groups={groups} types={types} onSave={saveWish} onClose={() => { setModal(null); setEditWish(null); }} />
      </Modal>
      <Modal open={modal === "groups"} onClose={() => setModal(null)} title="Quản lý nhóm & loại">
        <GroupManager groups={groups} types={types} onSave={saveGroups} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "backup"} onClose={() => setModal(null)} title="💾 Backup & Khôi phục">
        <BackupModal groups={groups} types={types} items={items} wishes={wishes} onImport={doImport} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
