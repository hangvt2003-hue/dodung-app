import { useState, useEffect } from "react";

/* ─── DEFAULT DATA ─── */
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
  { id: "s1", name: "Dove 500ml", brand: "Dove", groupId: "g_hygiene", typeId: "t_shower", price: 89000, volume: 500, buyDate: "2024-11-01", startDate: "2024-11-01", endDate: null, expireDate: "2026-11-01", notes: "" },
  { id: "s2", name: "Lifebuoy 500ml", brand: "Lifebuoy", groupId: "g_hygiene", typeId: "t_shower", price: 65000, volume: 500, buyDate: "2024-08-01", startDate: "2024-08-01", endDate: "2024-10-28", expireDate: null, notes: "" },
  { id: "s3", name: "Head & Shoulders 400ml", brand: "H&S", groupId: "g_hygiene", typeId: "t_shampoo", price: 115000, volume: 400, buyDate: "2024-10-01", startDate: "2024-10-01", endDate: null, expireDate: "2026-10-01", notes: "" },
  { id: "s4", name: "Neutrogena Hydro Boost", brand: "Neutrogena", groupId: "g_skincare", typeId: "t_moisturizer", price: 320000, volume: 50, buyDate: "2024-10-15", startDate: "2024-10-15", endDate: null, expireDate: "2026-03-01", notes: "" },
  { id: "s5", name: "OMO Matic 2.7kg", brand: "OMO", groupId: "g_laundry", typeId: "t_detergent", price: 125000, volume: 2700, buyDate: "2024-11-10", startDate: "2024-11-10", endDate: null, expireDate: "2026-11-10", notes: "" },
];

/* ─── UTILS ─── */
const todayStr = () => new Date().toISOString().split("T")[0];
const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
const fmt = (n) => { if (n == null || isNaN(n)) return "—"; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(0) + "K"; return Math.round(n).toLocaleString("vi-VN"); };
const fmtDate = (d) => { if (!d) return "—"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const uid = () => Date.now() + "_" + Math.random().toString(36).slice(2, 7);

function calcItem(it) {
  const price = parseFloat(it.price) || 0;
  const notStarted = !it.startDate;

  if (notStarted) {
    const costPerMl = it.volume > 0 ? price / it.volume : null;
    const daysToExp = it.expireDate ? daysBetween(todayStr(), it.expireDate) : null;
    return { perDay: null, perMonth: null, mlPerDay: null, costPerMl, estDays: null, isActive: false, notStarted: true, days: 0, daysToExp, valueScore: null };
  }

  const start = it.startDate;
  const end = it.endDate || todayStr();
  const days = daysBetween(start, end);
  const perDay = price / days;
  const perMonth = perDay * 30;
  let mlPerDay = null, costPerMl = null, estDays = null;
  if (it.volume > 0 && it.endDate) {
    mlPerDay = it.volume / days;
    costPerMl = price / it.volume;
    estDays = days;
  } else if (it.volume > 0) {
    costPerMl = price / it.volume;
  }
  const isActive = !it.endDate;
  const daysToExp = it.expireDate ? daysBetween(todayStr(), it.expireDate) : null;
  const valueScore = it.endDate && price > 0
    ? parseFloat((days / (price / 1000)).toFixed(2))
    : null;
  return { perDay, perMonth, mlPerDay, costPerMl, estDays, isActive, notStarted: false, days, daysToExp, valueScore };
}

/* ─── DESIGN TOKENS ─── */
const C = {
  bg: "#F7F6F3", card: "#FFFFFF", border: "rgba(0,0,0,0.08)",
  text: "#1A1A1A", muted: "#888", faint: "#BBB",
  accent: "#4A3FD4", accentBg: "#EEEDFE", accentText: "#3c34a5",
  green: "#1D9E75", greenBg: "#E1F5EE",
  amber: "#BA7517", amberBg: "#FAEEDA",
  red: "#A32D2D", redBg: "#FCEBEB",
  surface: "#F0EDE8",
};

/* ─── BASE STYLES ─── */
const s = {
  card: { background: C.card, borderRadius: 14, border: `0.5px solid ${C.border}`, padding: "14px 16px", marginBottom: 12 },
  btn: { padding: "8px 14px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "background .15s" },
  btnPrimary: { padding: "8px 16px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
  btnSm: { padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
  btnSmActive: { padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${C.accent}`, background: C.accentBg, color: C.accentText, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 },
  input: { width: "100%", padding: "9px 11px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, boxSizing: "border-box", outline: "none" },
  label: { display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 500 },
  metric: { background: C.surface, borderRadius: 10, padding: "12px 14px" },
  row: { display: "flex", alignItems: "center", gap: 10 },
  sep: { height: "0.5px", background: C.border, margin: "14px 0" },
};

/* ─── MODAL ─── */
function Modal({ open, onClose, title, children, width = 540 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: width, maxHeight: "92vh", overflowY: "auto", padding: "20px 18px 32px" }}>
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

/* ─── BADGE ─── */
function Badge({ color = C.greenBg, text_color = C.green, children }) {
  return <span style={{ background: color, color: text_color, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{children}</span>;
}
function StatusBadge({ c, it }) {
  if (c.notStarted) return <Badge color="#EEF2FF" text_color="#6366F1">Chưa dùng</Badge>;
  if (!c.isActive) return <Badge color={C.surface} text_color={C.muted}>Đã hết</Badge>;
  if (c.daysToExp != null && c.daysToExp < 0) return <Badge color={C.redBg} text_color={C.red}>Hết hạn</Badge>;
  if (c.daysToExp != null && c.daysToExp < 30) return <Badge color={C.amberBg} text_color={C.amber}>Sắp hết hạn</Badge>;
  return <Badge color={C.greenBg} text_color={C.green}>Đang dùng</Badge>;
}

/* ─── ITEM FORM ─── */
function ItemForm({ initial, groups, types, onSave, onClose }) {
  const blank = { name: "", brand: "", groupId: groups[0]?.id || "", typeId: "", price: "", volume: "", buyDate: todayStr(), startDate: "", endDate: "", expireDate: "", notes: "" };
  const [f, setF] = useState(initial ? { ...initial, price: String(initial.price || ""), volume: String(initial.volume || "") } : blank);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const filteredTypes = types.filter(t => t.groupId === f.groupId);

  const save = () => {
    if (!f.name.trim() || !f.price || !f.buyDate) { alert("Vui lòng điền tên, giá và ngày mua"); return; }
    onSave({
      ...f,
      id: initial?.id || uid(),
      price: parseFloat(f.price) || 0,
      volume: parseFloat(f.volume) || 0,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      expireDate: f.expireDate || null,
      typeId: f.typeId || null,
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Tên sản phẩm *</label><input style={s.input} value={f.name} onChange={e => set("name", e.target.value)} placeholder="VD: Dove 500ml" /></div>
        <div><label style={s.label}>Nhãn hiệu</label><input style={s.input} value={f.brand} onChange={e => set("brand", e.target.value)} placeholder="VD: Dove" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={s.label}>Nhóm *</label>
          <select style={s.input} value={f.groupId} onChange={e => set("groupId", e.target.value)}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Giá mua (đ) *</label><input style={s.input} type="number" value={f.price} onChange={e => set("price", e.target.value)} placeholder="0" /></div>
        <div><label style={s.label}>Dung tích/Khối lượng (ml/g)</label><input style={s.input} type="number" value={f.volume} onChange={e => set("volume", e.target.value)} placeholder="Không bắt buộc" /></div>
      </div>
      <div style={s.sep} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Ngày mua *</label><input style={s.input} type="date" value={f.buyDate} onChange={e => set("buyDate", e.target.value)} /></div>
        <div><label style={s.label}>Ngày bắt đầu dùng</label><input style={s.input} type="date" value={f.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        <div><label style={s.label}>Ngày dùng hết</label><input style={s.input} type="date" value={f.endDate || ""} onChange={e => set("endDate", e.target.value)} /></div>
        <div><label style={s.label}>Hạn sử dụng (HSD)</label><input style={s.input} type="date" value={f.expireDate || ""} onChange={e => set("expireDate", e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={s.label}>Ghi chú</label><textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Mua ở đâu, đánh giá..." /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btnPrimary} onClick={save}>{initial ? "Lưu thay đổi" : "Thêm đồ dùng"}</button>
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

  const addGroup = () => {
    if (!newG.name.trim()) return;
    setGs(p => [...p, { id: uid(), name: newG.name.trim(), icon: newG.icon }]);
    setNewG({ name: "", icon: "📦" });
  };
  const delGroup = (id) => {
    if (ts.some(t => t.groupId === id)) { alert("Xoá hết loại sản phẩm trong nhóm này trước"); return; }
    setGs(p => p.filter(g => g.id !== id));
  };
  const addType = () => {
    if (!newT.name.trim() || !newT.groupId) return;
    setTs(p => [...p, { id: uid(), name: newT.name.trim(), groupId: newT.groupId }]);
    setNewT(p => ({ ...p, name: "" }));
  };
  const delType = (id) => setTs(p => p.filter(t => t.id !== id));

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["groups","types"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={tab === t ? s.btnSmActive : s.btnSm}>
            {t === "groups" ? "🗂 Nhóm" : "🏷 Loại sản phẩm"}
          </button>
        ))}
      </div>

      {tab === "groups" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            {gs.map(g => (
              <div key={g.id} style={{ ...s.row, padding: "8px 0", borderBottom: `0.5px solid ${C.border}` }}>
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <span style={{ flex: 1, fontSize: 14 }}>{g.name}</span>
                <button onClick={() => delGroup(g.id)} style={{ ...s.btnSm, color: C.red }}>Xoá</button>
              </div>
            ))}
          </div>
          <div style={s.sep} />
          <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 8 }}>Thêm nhóm mới</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={s.label}>Tên nhóm</label>
              <input style={s.input} value={newG.name} onChange={e => setNewG(p => ({ ...p, name: e.target.value }))} placeholder="VD: Đồ chơi" />
            </div>
            <div>
              <label style={s.label}>Icon</label>
              <select style={{ ...s.input, width: 80 }} value={newG.icon} onChange={e => setNewG(p => ({ ...p, icon: e.target.value }))}>
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <button style={s.btnPrimary} onClick={addGroup}>+ Thêm</button>
          </div>
        </div>
      )}

      {tab === "types" && (
        <div>
          <div style={{ marginBottom: 12 }}>
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
          </div>
          <div style={s.sep} />
          <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 8 }}>Thêm loại sản phẩm</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={s.label}>Tên loại</label>
              <input style={s.input} value={newT.name} onChange={e => setNewT(p => ({ ...p, name: e.target.value }))} placeholder="VD: Xịt khoáng" />
            </div>
            <div style={{ minWidth: 140 }}>
              <label style={s.label}>Thuộc nhóm</label>
              <select style={s.input} value={newT.groupId} onChange={e => setNewT(p => ({ ...p, groupId: e.target.value }))}>
                {gs.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
            </div>
            <button style={s.btnPrimary} onClick={addType}>+ Thêm</button>
          </div>
        </div>
      )}

      <div style={s.sep} />
      <button style={s.btnPrimary} onClick={() => onSave(gs, ts)}>Lưu thay đổi</button>
    </div>
  );
}

/* ─── MINI BAR CHART ─── */
const COLORS = ["#4A3FD4","#1D9E75","#BA7517","#D85A30","#185FA5","#993556","#3B6D11","#534AB7"];
function MiniBar({ rows }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: C.muted }}>{r.label}</span>
            <span style={{ fontWeight: 500 }}>{r.valueLabel || fmt(r.value) + "đ"}</span>
          </div>
          <div style={{ height: 6, background: C.surface, borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${(r.value / max) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── SCORE CARD ─── */
function ScoreCard({ item, rank, score, groups, types, detail = false }) {
  const cat = groups.find(g => g.id === item.groupId);
  const type = types.find(t => t.id === item.typeId);
  const c = calcItem(item);
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  return (
    <div style={{ ...s.card, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ fontSize: rank <= 3 ? 24 : 18, minWidth: 32, textAlign: "center", paddingTop: 2 }}>{medal}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          {cat?.icon} {cat?.name}{type ? ` · ${type.name}` : ""}{item.brand ? ` · ${item.brand}` : ""}
        </div>
        {detail && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
            {[
              ["Chi phí/ngày", fmt(c.perDay) + "đ"],
              ["Chi phí/tháng", fmt(c.perMonth) + "đ"],
              ["Tổng chi", fmt(item.price) + "đ"],
              ["Số ngày dùng", c.days + " ngày"],
              item.volume ? ["Dung tích", fmt(item.volume) + "ml"] : null,
              c.mlPerDay ? ["ml/ngày", c.mlPerDay.toFixed(1)] : null,
            ].filter(Boolean).map(([l, v]) => (
              <div key={l} style={{ background: C.surface, borderRadius: 7, padding: "7px 10px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{score}</div>
        <div style={{ fontSize: 10, color: C.muted }}>điểm</div>
      </div>
    </div>
  );
}

/* ─── PAGES ─── */
function DashboardPage({ items, groups, types }) {
  const active = items.filter(i => !i.endDate);
  const inUse = active.filter(i => i.startDate); // Đang thực sự dùng (đã bắt đầu)
  const totalSpent = items.reduce((s, i) => s + (i.price || 0), 0);
  const dayCost = inUse.reduce((s, i) => s + (calcItem(i).perDay || 0), 0);
  const monthCost = inUse.reduce((s, i) => s + (calcItem(i).perMonth || 0), 0);
  const alerts = items.filter(i => { const c = calcItem(i); return (c.daysToExp != null && c.daysToExp < 30); });
  const catSpend = {};
  items.forEach(i => { catSpend[i.groupId] = (catSpend[i.groupId] || 0) + (i.price || 0); });
  const catRows = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([gid, v]) => {
    const g = groups.find(x => x.id === gid) || { name: gid, icon: "📦" };
    return { label: g.icon + " " + g.name, value: v };
  });
  const recent = [...items].sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate)).slice(0, 4);

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          ["Tổng đã chi", fmt(totalSpent) + "đ", items.length + " sản phẩm"],
          ["Chi phí/ngày", fmt(dayCost) + "đ", inUse.length + " đang dùng · " + (active.length - inUse.length) + " chưa dùng"],
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
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⚠️ Cảnh báo</div>
          {alerts.map(it => {
            const c = calcItem(it);
            const expired = c.daysToExp != null && c.daysToExp < 0;
            return (
              <div key={it.id} style={{ fontSize: 13, padding: "5px 0", borderTop: `0.5px solid ${C.border}` }}>
                <strong>{it.name}</strong> — {expired ? "đã hết hạn" : `còn ${c.daysToExp} ngày hết hạn (${fmtDate(it.expireDate)})`}
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
          const c = calcItem(it); const g = groups.find(x => x.id === it.groupId);
          return (
            <div key={it.id} style={{ ...s.row, padding: "8px 0", borderTop: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 22 }}>{g?.icon || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(it.buyDate)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{fmt(it.price)}đ</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmt(c.perDay)}đ/ngày</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemsPage({ items, groups, types, onEdit, onDelete, onMarkDone, onStartNow }) {
  const [groupFilter, setGroupFilter] = useState(null);
  const [search, setSearch] = useState("");
  let filtered = groupFilter ? items.filter(i => i.groupId === groupFilter) : items;
  if (search) filtered = filtered.filter(i => (i.name + " " + i.brand).toLowerCase().includes(search.toLowerCase()));
  filtered = [...filtered].sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate));

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
        const c = calcItem(it);
        const g = groups.find(x => x.id === it.groupId);
        const t = types.find(x => x.id === it.typeId);
        return (
          <div key={it.id} style={s.card}>
            <div style={s.row}>
              <span style={{ fontSize: 22 }}>{g?.icon || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{it.brand || ""}{t ? ` · ${t.name}` : ""}</div>
              </div>
              <StatusBadge c={c} it={it} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "10px 0" }}>
              {[
                ["Giá mua", fmt(it.price) + "đ"],
                ["Chi phí/ngày", c.notStarted ? "Chưa dùng" : fmt(c.perDay) + "đ"],
                ["Chi phí/tháng", c.notStarted ? "—" : fmt(c.perMonth) + "đ"],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.surface, borderRadius: 7, padding: "7px 9px" }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: c.notStarted && l !== "Giá mua" ? C.faint : "inherit" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              Mua: {fmtDate(it.buyDate)}
              {c.notStarted ? " · Chưa bắt đầu dùng" : it.endDate ? ` · Hết: ${fmtDate(it.endDate)} (${c.days} ngày)` : ` · ${c.days} ngày đã dùng`}
              {it.volume ? ` · ${fmt(it.volume)}ml` : ""}
              {c.mlPerDay ? ` · ${c.mlPerDay.toFixed(1)}ml/ngày` : ""}
              {it.expireDate ? ` · HSD: ${fmtDate(it.expireDate)}` : ""}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => onEdit(it)} style={s.btnSm}>✏️ Sửa</button>
              {c.notStarted && <button onClick={() => onStartNow(it.id)} style={{ ...s.btnSm, color: C.green, borderColor: C.green }}>▶ Bắt đầu dùng</button>}
              {!c.notStarted && !it.endDate && <button onClick={() => onMarkDone(it.id)} style={s.btnSm}>✓ Đánh dấu hết</button>}
              <button onClick={() => onDelete(it.id)} style={{ ...s.btnSm, color: C.red, marginLeft: "auto" }}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparePage({ items, groups, types }) {
  const [mode, setMode] = useState("group"); // "group" or "type"
  const [selGroup, setSelGroup] = useState(null);
  const [selType, setSelType] = useState(null);

  const usedGroups = groups.filter(g => items.some(i => i.groupId === g.id));
  const usedTypes = types.filter(t => items.filter(i => i.typeId === t.id).length >= 1);

  useEffect(() => {
    if (mode === "group" && !selGroup && usedGroups.length) setSelGroup(usedGroups[0].id);
    if (mode === "type" && !selType && usedTypes.length) setSelType(usedTypes[0].id);
  }, [mode, usedGroups.length, usedTypes.length]);

  let compareItems = [];
  if (mode === "group" && selGroup) compareItems = items.filter(i => i.groupId === selGroup);
  if (mode === "type" && selType) compareItems = items.filter(i => i.typeId === selType);

  const best = compareItems.length ? compareItems.reduce((b, i) => calcItem(i).perDay < calcItem(b).perDay ? i : b, compareItems[0]) : null;

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setMode("group")} style={mode === "group" ? s.btnSmActive : s.btnSm}>🗂 So sánh cùng nhóm</button>
        <button onClick={() => setMode("type")} style={mode === "type" ? s.btnSmActive : s.btnSm}>🏷 So sánh cùng loại</button>
      </div>

      <div style={{ ...s.card, padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
          {mode === "group" ? "Chọn nhóm (so sánh tất cả đồ dùng trong nhóm):" : "Chọn loại sản phẩm (so sánh các nhãn hiệu khác nhau):"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {mode === "group" && usedGroups.map(g => (
            <button key={g.id} onClick={() => setSelGroup(g.id)} style={selGroup === g.id ? s.btnSmActive : s.btnSm}>
              {g.icon} {g.name} ({items.filter(i => i.groupId === g.id).length})
            </button>
          ))}
          {mode === "type" && usedTypes.map(t => {
            const g = groups.find(x => x.id === t.groupId);
            return (
              <button key={t.id} onClick={() => setSelType(t.id)} style={selType === t.id ? s.btnSmActive : s.btnSm}>
                {g?.icon} {t.name} ({items.filter(i => i.typeId === t.id).length})
              </button>
            );
          })}
          {((mode === "group" && !usedGroups.length) || (mode === "type" && !usedTypes.length)) && (
            <span style={{ fontSize: 13, color: C.faint }}>Chưa đủ dữ liệu</span>
          )}
        </div>
      </div>

      {compareItems.length < 1 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Chọn {mode === "group" ? "nhóm" : "loại"} để so sánh</div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
            {compareItems.length} sản phẩm · {mode === "group" ? "Nhóm: " + groups.find(g => g.id === selGroup)?.name : "Loại: " + types.find(t => t.id === selType)?.name}
          </div>
          <MiniBar rows={[...compareItems].sort((a, b) => calcItem(a).perDay - calcItem(b).perDay).map((it, i) => ({
            label: it.name + (it.brand ? ` (${it.brand})` : ""),
            value: calcItem(it).perDay,
            valueLabel: fmt(calcItem(it).perDay) + "đ/ngày"
          }))} />
          <div style={{ height: 1, background: C.border, margin: "14px 0" }} />
          {compareItems.map(it => {
            const c = calcItem(it);
            const isBest = it.id === best?.id;
            const type = types.find(t => t.id === it.typeId);
            return (
              <div key={it.id} style={{ ...s.card, borderColor: isBest ? C.accent : C.border, borderWidth: isBest ? 1.5 : 0.5 }}>
                {isBest && <Badge color={C.accentBg} text_color={C.accentText}>✓ Chi phí tốt nhất</Badge>}
                <div style={{ fontWeight: 600, fontSize: 15, marginTop: isBest ? 6 : 0 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{it.brand || "—"}{type ? ` · ${type.name}` : ""}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Giá mua", fmt(it.price) + "đ"],
                    ["Chi phí/ngày", fmt(c.perDay) + "đ"],
                    ["Chi phí/tháng", fmt(c.perMonth) + "đ"],
                    ["Đã dùng", c.days + " ngày"],
                    it.volume ? ["Dung tích", fmt(it.volume) + "ml"] : null,
                    it.volume ? ["Giá/ml", c.costPerMl ? c.costPerMl.toFixed(1) + "đ" : "—"] : null,
                    c.mlPerDay ? ["ml/ngày", c.mlPerDay.toFixed(1)] : null,
                    c.estDays ? ["Tổng ngày dùng", c.estDays + " ngày"] : null,
                  ].filter(Boolean).map(([l, v]) => (
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
  );
}

function OptimizePage({ items, groups, types }) {
  const [view, setView] = useState("all"); // "all" or "bygroup"

  // Score: ngày dùng / (giá / 1000). Chỉ tính với item đã hết (có ngày kết thúc thực tế).
  // Với item đang dùng, dùng số ngày hiện tại (chi phí tạm tính).
  const scored = items.map(it => {
    const c = calcItem(it);
    const score = c.valueScore;
    return { it, c, score };
  }).filter(x => x.score != null).sort((a, b) => b.score - a.score);

  const byGroup = {};
  scored.forEach(x => {
    const gid = x.it.groupId;
    if (!byGroup[gid]) byGroup[gid] = [];
    byGroup[gid].push(x);
  });

  return (
    <div style={{ padding: "14px 14px 80px" }}>
      <div style={{ ...s.card, borderLeft: `3px solid ${C.accent}`, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Cách tính điểm</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          <strong>Điểm = số ngày dùng ÷ (giá / 1.000đ)</strong><br />
          Điểm càng cao = dùng được càng lâu trên mỗi nghìn đồng bỏ ra.<br />
          Với món đang dùng: tính đến hôm nay (tạm thời).<br />
          Với món đã hết: số liệu chính xác.
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setView("all")} style={view === "all" ? s.btnSmActive : s.btnSm}>📊 Tất cả đồ dùng</button>
        <button onClick={() => setView("bygroup")} style={view === "bygroup" ? s.btnSmActive : s.btnSm}>🗂 Theo nhóm</button>
      </div>

      {scored.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Chưa có dữ liệu để tính điểm</div>
      )}

      {view === "all" && scored.map((x, i) => (
        <ScoreCard key={x.it.id} item={x.it} rank={i + 1} score={x.score} groups={groups} types={types} detail />
      ))}

      {view === "bygroup" && Object.entries(byGroup).map(([gid, rows]) => {
        const g = groups.find(x => x.id === gid) || { name: gid, icon: "📦" };
        return (
          <div key={gid} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{g.icon} {g.name}</div>
            {rows.map((x, i) => (
              <ScoreCard key={x.it.id} item={x.it} rank={i + 1} score={x.score} groups={groups} types={types} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ─── WISHLIST ─── */
// Tính chỉ số wishlist dựa trên lịch sử items
function calcWish(wish, items, types) {
  const price = parseFloat(wish.price) || 0;
  const volume = parseFloat(wish.volume) || 0;

  // Tìm lịch sử: ưu tiên cùng typeId, rồi cùng groupId
  const history = items.filter(i => i.endDate && (
    (wish.typeId && i.typeId === wish.typeId) ||
    (!wish.typeId && i.groupId === wish.groupId)
  ));

  let mlPerDay = null, estDays = null, estDaysSource = "—", avgPerDay = null;

  if (history.length > 0) {
    // Trung bình ml/ngày từ lịch sử có volume
    const withVol = history.filter(i => i.volume > 0);
    if (withVol.length > 0) {
      const rates = withVol.map(i => {
        const days = daysBetween(i.startDate || i.buyDate, i.endDate);
        return i.volume / days;
      });
      mlPerDay = rates.reduce((a, b) => a + b, 0) / rates.length;
    }
    // Trung bình chi phí/ngày từ lịch sử
    const perDays = history.map(i => {
      const days = daysBetween(i.startDate || i.buyDate, i.endDate);
      return (parseFloat(i.price) || 0) / days;
    });
    avgPerDay = perDays.reduce((a, b) => a + b, 0) / perDays.length;

    if (volume > 0 && mlPerDay) {
      estDays = Math.round(volume / mlPerDay);
      estDaysSource = "lịch sử (" + withVol.length + " món)";
    } else if (price > 0 && avgPerDay > 0) {
      estDays = Math.round(price / avgPerDay);
      estDaysSource = "giá TB lịch sử";
    }
  }

  // Fallback: dùng HSD nếu có
  if (!estDays && wish.expireDate) {
    estDays = daysBetween(todayStr(), wish.expireDate);
    estDaysSource = "HSD (ước tính)";
  }

  const perDay = estDays ? price / estDays : null;
  const perMonth = perDay ? perDay * 30 : null;
  const costPerMl = volume > 0 && price > 0 ? price / volume : null;
  const valueScore = estDays && price > 0 ? parseFloat((estDays / (price / 1000)).toFixed(2)) : null;

  return { price, volume, mlPerDay, estDays, estDaysSource, perDay, perMonth, costPerMl, valueScore, historyCount: history.length };
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
        <div><label style={s.label}>Tên sản phẩm *</label><input style={s.input} value={f.name} onChange={e => set("name", e.target.value)} placeholder="VD: Cetaphil 500ml" /></div>
        <div><label style={s.label}>Nhãn hiệu</label><input style={s.input} value={f.brand} onChange={e => set("brand", e.target.value)} placeholder="VD: Cetaphil" /></div>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={s.label}>Giá dự kiến (đ) *</label><input style={s.input} type="number" value={f.price} onChange={e => set("price", e.target.value)} placeholder="0" /></div>
        <div><label style={s.label}>Dung tích/Khối lượng (ml/g)</label><input style={s.input} type="number" value={f.volume} onChange={e => set("volume", e.target.value)} placeholder="Không bắt buộc" /></div>
      </div>
      <div style={{ marginBottom: 10 }}><label style={s.label}>HSD (nếu biết — dùng để ước tính khi chưa có lịch sử)</label><input style={s.input} type="date" value={f.expireDate || ""} onChange={e => set("expireDate", e.target.value)} /></div>
      <div style={{ marginBottom: 10 }}><label style={s.label}>Link sản phẩm (tùy chọn)</label><input style={s.input} value={f.url || ""} onChange={e => set("url", e.target.value)} placeholder="https://..." /></div>
      <div style={{ marginBottom: 14 }}><label style={s.label}>Ghi chú</label><textarea style={{ ...s.input, resize: "vertical" }} rows={2} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Lý do muốn mua, nơi bán..." /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btnPrimary} onClick={save}>{initial ? "Lưu thay đổi" : "Thêm vào wishlist"}</button>
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
      {/* Group filter */}
      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 6, marginBottom: 10 }}>
        {[{ id: null, name: "Tất cả", icon: "🛒" }, ...usedGroups].map(g => (
          <button key={g.id || "all"} onClick={() => setGroupFilter(g.id)}
            style={{ ...groupFilter === g.id ? s.btnSmActive : s.btnSm, whiteSpace: "nowrap", flexShrink: 0 }}>
            {g.icon} {g.name} {g.id ? `(${wishes.filter(w => w.groupId === g.id).length})` : `(${wishes.length})`}
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
        const c = calcWish(w, items, types);
        const expanded = expandId === w.id;

        // So sánh với lịch sử cùng loại/nhóm
        const history = items.filter(i => i.endDate && (
          (w.typeId && i.typeId === w.typeId) || (!w.typeId && i.groupId === w.groupId)
        ));
        const bestHistory = history.length > 0 ? history.reduce((b, i) => calcItem(i).perDay < calcItem(b).perDay ? i : b, history[0]) : null;
        const bestPerDay = bestHistory ? calcItem(bestHistory).perDay : null;
        const isBetter = c.perDay && bestPerDay && c.perDay < bestPerDay;
        const isWorse = c.perDay && bestPerDay && c.perDay > bestPerDay * 1.1;

        return (
          <div key={w.id} style={{ ...s.card, borderLeft: isBetter ? `3px solid ${C.green}` : isWorse ? `3px solid ${C.amber}` : `3px solid ${C.border}` }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22, marginTop: 2 }}>{g?.icon || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{w.brand || ""}{t ? ` · ${t.name}` : ""}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(w.price)}đ</div>
                {w.volume ? <div style={{ fontSize: 11, color: C.muted }}>{fmt(w.volume)}ml</div> : null}
              </div>
            </div>

            {/* So sánh nhanh vs lịch sử */}
            {bestHistory && c.perDay && (
              <div style={{ background: isBetter ? C.greenBg : isWorse ? C.amberBg : C.surface, borderRadius: 7, padding: "6px 10px", fontSize: 12, marginBottom: 8 }}>
                {isBetter
                  ? <span style={{ color: C.green }}>✓ Rẻ hơn {bestHistory.name}: tiết kiệm {fmt(bestPerDay - c.perDay)}đ/ngày</span>
                  : isWorse
                  ? <span style={{ color: C.amber }}>⚠ Đắt hơn {bestHistory.name}: thêm {fmt(c.perDay - bestPerDay)}đ/ngày</span>
                  : <span style={{ color: C.muted }}>≈ Tương đương {bestHistory.name}</span>}
              </div>
            )}

            {/* Chỉ số chính */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={{ background: C.surface, borderRadius: 7, padding: "7px 9px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>Chi phí/ngày</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{c.perDay ? fmt(c.perDay) + "đ" : "—"}</div>
              </div>
              <div style={{ background: C.surface, borderRadius: 7, padding: "7px 9px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>Chi phí/tháng</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.perMonth ? fmt(c.perMonth) + "đ" : "—"}</div>
              </div>
              <div style={{ background: C.surface, borderRadius: 7, padding: "7px 9px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>Ước dùng</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.estDays ? c.estDays + " ngày" : "—"}</div>
              </div>
            </div>

            {/* Nguồn ước tính */}
            <div style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>
              📊 Ước tính từ: <strong style={{ color: C.muted }}>{c.estDaysSource}</strong>
              {c.historyCount > 0 ? ` · ${c.historyCount} món lịch sử` : ""}
              {c.costPerMl ? ` · ${c.costPerMl.toFixed(1)}đ/ml` : ""}
              {c.valueScore ? ` · Điểm: ${c.valueScore}` : ""}
            </div>

            {/* Expand: so sánh chi tiết */}
            {expanded && history.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>So sánh với lịch sử cùng loại</div>
                {history.map(hi => {
                  const hc = calcItem(hi);
                  return (
                    <div key={hi.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: `0.5px solid ${C.border}` }}>
                      <div style={{ flex: 1, fontSize: 13 }}>{hi.name} <span style={{ fontSize: 11, color: C.muted }}>{hi.brand || ""}</span></div>
                      <div style={{ fontSize: 12, textAlign: "right" }}>
                        <div style={{ fontWeight: 500 }}>{fmt(hc.perDay)}đ/ngày</div>
                        <div style={{ color: C.muted }}>{fmt(hi.price)}đ · {hc.days}ng</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: `2px solid ${C.accent}`, marginTop: 4 }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.accent }}>{w.name} (wishlist)</div>
                  <div style={{ fontSize: 12, textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: C.accent }}>{c.perDay ? fmt(c.perDay) + "đ/ngày" : "—"}</div>
                    <div style={{ color: C.muted }}>{fmt(w.price)}đ · {c.estDays || "?"}ng</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setExpandId(expanded ? null : w.id)} style={s.btnSm}>
                {expanded ? "Thu gọn" : "So sánh chi tiết"}
              </button>
              <button onClick={() => onMoved(w)} style={s.btnSm}>✓ Đã mua</button>
              <button onClick={() => onEdit(w)} style={s.btnSm}>✏️</button>
              {w.url && <a href={w.url} target="_blank" rel="noreferrer" style={{ ...s.btnSm, textDecoration: "none" }}>🔗 Link</a>}
              <button onClick={() => onDelete(w.id)} style={{ ...s.btnSm, color: C.red, marginLeft: "auto" }}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN APP ─── */
const STORAGE = "dodung_v3";
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function saveState(state) {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch {}
}

/* ─── BACKUP MODAL ─── */
function BackupModal({ groups, types, items, onImport, onClose }) {
  const [importError, setImportError] = useState(null);
  const [importOk, setImportOk] = useState(false);

  const doExport = () => {
    const data = { version: 1, exportedAt: new Date().toISOString(), groups, types, items };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `dodung-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (e) => {
    setImportError(null);
    setImportOk(false);
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.items || !Array.isArray(data.items)) throw new Error("File không hợp lệ");
        if (!confirm(`Tìm thấy ${data.items.length} sản phẩm, ${data.groups?.length || 0} nhóm.\n\nDữ liệu hiện tại sẽ bị GHI ĐÈ. Tiếp tục?`)) return;
        onImport(data);
        setImportOk(true);
      } catch (err) {
        setImportError("File không hợp lệ hoặc bị lỗi: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      {/* Export */}
      <div style={{ background: C.surface, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>📤 Xuất dữ liệu</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
          Tải toàn bộ đồ dùng, nhóm, loại ra file <strong>.json</strong>. Lưu file này vào máy tính, Google Drive, hoặc iCloud để backup.
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Hiện có: <strong>{items.length} sản phẩm</strong> · {groups.length} nhóm · {types.length} loại
        </div>
        <button style={s.btnPrimary} onClick={doExport}>📥 Tải file backup (.json)</button>
      </div>

      {/* Import */}
      <div style={{ background: C.surface, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>📂 Khôi phục dữ liệu</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
          Chọn file <strong>.json</strong> đã backup trước đó để khôi phục. <span style={{ color: C.red, fontWeight: 500 }}>Dữ liệu hiện tại sẽ bị ghi đè.</span>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, ...s.btn, cursor: "pointer" }}>
          📁 Chọn file backup
          <input type="file" accept=".json" onChange={doImport} style={{ display: "none" }} />
        </label>
        {importError && (
          <div style={{ marginTop: 10, background: "#FCEBEB", color: C.red, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
            ❌ {importError}
          </div>
        )}
        {importOk && (
          <div style={{ marginTop: 10, background: C.greenBg, color: C.green, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
            ✅ Khôi phục thành công!
          </div>
        )}
      </div>

      <div style={s.sep} />
      <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.7 }}>
        💡 Gợi ý: Backup mỗi tuần 1 lần, lưu file vào Google Drive hoặc iCloud để không bị mất khi đổi điện thoại.
      </div>
    </div>
  );
}

export default function App() {
  const initial = loadState();
  const [groups, setGroups] = useState(initial?.groups || DEFAULT_GROUPS);
  const [types, setTypes] = useState(initial?.types || DEFAULT_TYPES);
  const [items, setItems] = useState(initial?.items || []);
  const [wishes, setWishes] = useState(initial?.wishes || []);
  const [page, setPage] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editWish, setEditWish] = useState(null);

  useEffect(() => saveState({ groups, types, items, wishes }), [groups, types, items, wishes]);

  const saveItem = it => { setItems(p => editItem ? p.map(x => x.id === it.id ? it : x) : [...p, it]); setModal(null); setEditItem(null); };
  const deleteItem = id => { if (confirm("Xoá sản phẩm này?")) setItems(p => p.filter(i => i.id !== id)); };
  const markDone = id => setItems(p => p.map(i => i.id === id ? { ...i, endDate: todayStr() } : i));
  const startNow = id => setItems(p => p.map(i => i.id === id ? { ...i, startDate: todayStr() } : i));
  const addSample = () => { setItems(p => [...p, ...SAMPLE_ITEMS.filter(s => !p.find(i => i.id === s.id))]); };
  const saveGroups = (gs, ts) => { setGroups(gs); setTypes(ts); setModal(null); };
  const doImport = (data) => {
    if (data.groups) setGroups(data.groups);
    if (data.types) setTypes(data.types);
    setItems(data.items);
    if (data.wishes) setWishes(data.wishes);
  };

  // Wishlist handlers
  const saveWish = w => { setWishes(p => editWish ? p.map(x => x.id === w.id ? w : x) : [...p, w]); setModal(null); setEditWish(null); };
  const deleteWish = id => { if (confirm("Xoá khỏi wishlist?")) setWishes(p => p.filter(w => w.id !== id)); };
  // "Đã mua" → chuyển wishlist item thành item thật, mở form thêm với dữ liệu prefilled
  const moveToItems = w => {
    setEditItem({ name: w.name, brand: w.brand, groupId: w.groupId, typeId: w.typeId, price: w.price, volume: w.volume, buyDate: todayStr(), startDate: todayStr(), endDate: null, expireDate: w.expireDate, notes: w.notes });
    setWishes(p => p.filter(x => x.id !== w.id));
    setModal("add");
  };

  const PAGES = [
    { id: "dashboard", icon: "📊", label: "Tổng quan" },
    { id: "items", icon: "📦", label: "Đồ dùng" },
    { id: "wishlist", icon: "🛒", label: "Wishlist" },
    { id: "compare", icon: "⚖️", label: "So sánh" },
    { id: "optimize", icon: "🏆", label: "Tối ưu" },
  ];
  const PAGE_TITLES = { dashboard: "Tổng quan", items: "Đồ dùng", wishlist: "Wishlist", compare: "So sánh", optimize: "Tối ưu chi phí" };

  const addBtn = page === "wishlist"
    ? <button onClick={() => { setEditWish(null); setModal("addwish"); }} style={s.btnPrimary}>+ Thêm</button>
    : <button onClick={() => { setEditItem(null); setModal("add"); }} style={s.btnPrimary}>+ Thêm</button>;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "system-ui,-apple-system,sans-serif", color: C.text, fontSize: 15, position: "relative" }}>
      {/* Top bar */}
      <div style={{ background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>ĐồDùng.io</div>
          <div style={{ fontSize: 11, color: C.faint }}>{PAGE_TITLES[page]}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setModal("backup")} style={s.btnSm} title="Backup">💾</button>
          <button onClick={() => setModal("groups")} style={s.btnSm}>⚙️</button>
          {addBtn}
        </div>
      </div>

      {/* Content */}
      {items.length === 0 && page !== "wishlist" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bắt đầu theo dõi</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>Thêm đồ dùng để theo dõi chi phí, so sánh sản phẩm và tối ưu chi tiêu.</div>
          <div style={{ display: "flex", gap: 10, flexDirection: "column", width: "100%", maxWidth: 280 }}>
            <button style={s.btnPrimary} onClick={() => setModal("add")}>+ Thêm đồ dùng đầu tiên</button>
            <button style={s.btn} onClick={addSample}>✨ Dùng dữ liệu mẫu</button>
            <button style={s.btn} onClick={() => setModal("backup")}>💾 Khôi phục từ backup</button>
          </div>
        </div>
      ) : page === "dashboard" ? <DashboardPage items={items} groups={groups} types={types} />
        : page === "items" ? <ItemsPage items={items} groups={groups} types={types} onEdit={it => { setEditItem(it); setModal("edit"); }} onDelete={deleteItem} onMarkDone={markDone} onStartNow={startNow} />
        : page === "wishlist" ? <WishlistPage wishes={wishes} items={items} groups={groups} types={types} onAdd={() => { setEditWish(null); setModal("addwish"); }} onEdit={w => { setEditWish(w); setModal("addwish"); }} onDelete={deleteWish} onMoved={moveToItems} />
        : page === "compare" ? <ComparePage items={items} groups={groups} types={types} />
        : page === "optimize" ? <OptimizePage items={items} groups={groups} types={types} />
        : null}

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.card, borderTop: `0.5px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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

      {/* Modals */}
      <Modal open={modal === "add" || modal === "edit"} onClose={() => { setModal(null); setEditItem(null); }} title={editItem ? "Sửa sản phẩm" : "Thêm đồ dùng"}>
        <ItemForm initial={editItem} groups={groups} types={types} onSave={saveItem} onClose={() => { setModal(null); setEditItem(null); }} />
      </Modal>
      <Modal open={modal === "addwish"} onClose={() => { setModal(null); setEditWish(null); }} title={editWish ? "Sửa wishlist" : "Thêm vào Wishlist"}>
        <WishForm initial={editWish} groups={groups} types={types} onSave={saveWish} onClose={() => { setModal(null); setEditWish(null); }} />
      </Modal>
      <Modal open={modal === "groups"} onClose={() => setModal(null)} title="Quản lý nhóm & loại">
        <GroupManager groups={groups} types={types} onSave={saveGroups} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "backup"} onClose={() => setModal(null)} title="💾 Backup & Khôi phục">
        <BackupModal groups={groups} types={types} items={items} onImport={doImport} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
