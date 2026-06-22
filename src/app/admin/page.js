"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─────────────── Constants ─────────────── */
const LANG_MAP = {
  ta: "Tamil (தமிழ்)", hi: "Hindi (हिन्दी)", te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)", ml: "Malayalam (മലയാളം)", bn: "Bengali (বাংলা)",
  en: "English"
};
const STATUS_OPTIONS = ["Filed", "PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"];
const STATUS_META = {
  PENDING:      { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "🔴" },
  UNDER_REVIEW: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "🟡" },
  RESOLVED:     { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "🟢" },
  REJECTED:     { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: "⚫" },
  Filed:        { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", icon: "🔵" },
};

/* ─────────────── Helpers ─────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META["Filed"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: m.bg, color: m.color,
      border: `1px solid ${m.border}`,
      borderRadius: 20, padding: "4px 12px",
      fontSize: "0.8rem", fontWeight: 700,
    }}>{m.icon} {String(status).replace(/_/g, " ")}</span>
  );
}

/* ─────────────── Section Block ─────────────── */
function Section({ icon, title, children }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(15,23,42,0.07)",
      borderRadius: 12, padding: "20px 20px 16px",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 14, paddingBottom: 10,
        borderBottom: "1px solid rgba(15,23,42,0.06)",
      }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ─────────────── Field Row ─────────────── */
function Field({ label, value, mono }) {
  if (!value || value === "Not mentioned" || value === "Not specified") return (
    <div style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ minWidth: 160, fontSize: "0.82rem", color: "#9ca3af", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.82rem", color: "#d1d5db", fontStyle: "italic" }}>—</span>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ minWidth: 160, fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color: "#111827", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

/* ─────────────── Stats Card ─────────────── */
function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(15,23,42,0.07)",
      borderRadius: 14, padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: "1.6rem" }}>{icon}</div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: accent || "#0d9488", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function AdminPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter]     = useState("all");
  const [activeTab, setActiveTab]       = useState({});  // per-card tab

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/complaints");
      const data = await res.json();
      if (data.success) setComplaints(data.complaints);
    } catch (e) { console.error("Failed to fetch:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const updateStatus = async (id, status) => {
    setStatusUpdatingId(id);
    try {
      const res  = await fetch("/api/admin/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success)
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c));
    } catch (e) { console.error("Update failed:", e); }
    finally { setStatusUpdatingId(null); }
  };

  /* ── Filtering ── */
  const filtered = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      String(c.id).includes(q) ||
      (c.originalTranscript || "").toLowerCase().includes(q) ||
      (c.englishSummary || "").toLowerCase().includes(q) ||
      (c.phoneNumber || "").includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchLang   = langFilter === "all" || c.workerLanguage === langFilter;
    return matchSearch && matchStatus && matchLang;
  });

  /* ── Stats ── */
  const stats = {
    total:       complaints.length,
    filed:       complaints.filter(c => c.status === "Filed").length,
    pending:     complaints.filter(c => c.status === "PENDING").length,
    under_review:complaints.filter(c => c.status === "UNDER_REVIEW").length,
    resolved:    complaints.filter(c => c.status === "RESOLVED").length,
  };

  const getTab = (id) => activeTab[id] || "transcript";
  const setTab = (id, tab) => setActiveTab(prev => ({ ...prev, [id]: tab }));

  /* ══════════════════════════════════════════════════════ RENDER ══ */
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f4f5",
      backgroundImage: "radial-gradient(circle at 100% 0%, rgba(224,242,254,0.4) 0%, transparent 40%), linear-gradient(to bottom, rgba(244,244,245,0) 60%, rgba(226,232,240,0.5) 100%)",
      fontFamily: "var(--font-family, 'Inter', sans-serif)",
      color: "#111827",
    }}>
      {/* ── Top Nav ── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid rgba(15,23,42,0.07)",
        boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.6rem" }}>⚖️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a", letterSpacing: "-0.02em" }}>
              VoiceForJustice - AI <span style={{ color: "#0d9488" }}>Admin</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Complaint Management Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchComplaints} style={{
            background: "#f8fafc", border: "1px solid rgba(15,23,42,0.1)",
            borderRadius: 8, padding: "8px 16px", fontWeight: 600,
            cursor: "pointer", color: "#374151", fontSize: "0.85rem",
          }}>🔄 Refresh</button>
          <Link href="/" style={{
            background: "#0d9488", color: "#fff", textDecoration: "none",
            borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: "0.85rem",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>← Open Kiosk</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px" }}>

        {/* ── Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="Total Complaints" value={stats.total}        icon="📋" accent="#0f172a" />
          <StatCard label="Filed"            value={stats.filed}        icon="🔵" accent="#0284c7" />
          <StatCard label="Pending"          value={stats.pending}      icon="🔴" accent="#dc2626" />
          <StatCard label="Under Review"     value={stats.under_review} icon="🟡" accent="#d97706" />
          <StatCard label="Resolved"         value={stats.resolved}     icon="🟢" accent="#16a34a" />
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: "#fff", border: "1px solid rgba(15,23,42,0.07)",
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
          display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}>
          {[
            { label: "🔍 Search", type: "text",   val: searchQuery, set: setSearchQuery, placeholder: "ID, name, keyword, phone…", flex: "1 1 260px" },
          ].map(f => (
            <div key={f.label} style={{ flex: f.flex, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280" }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{
                  border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px",
                  fontSize: "0.9rem", outline: "none", color: "#111827", background: "#fafafa",
                }} />
            </div>
          ))}
          {[
            { label: "Status", val: statusFilter, set: setStatusFilter, options: [{ v: "all", l: "All Statuses" }, ...STATUS_OPTIONS.map(o => ({ v: o, l: o.replace("_", " ") }))] },
            { label: "Language", val: langFilter, set: setLangFilter, options: [{ v: "all", l: "All Languages" }, ...Object.entries(LANG_MAP).map(([k, v]) => ({ v: k, l: v }))] },
          ].map(f => (
            <div key={f.label} style={{ flex: "0 1 200px", display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280" }}>{f.label}</label>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{
                border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px",
                fontSize: "0.9rem", color: "#111827", background: "#fafafa", outline: "none",
              }}>
                {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* ── Summary line ── */}
        <div style={{ marginBottom: 16, color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
          Showing <strong style={{ color: "#111827" }}>{filtered.length}</strong> of <strong style={{ color: "#111827" }}>{complaints.length}</strong> complaints
        </div>

        {/* ── List ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af", fontSize: "1.1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⏳</div>Loading complaints…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            border: "2px dashed #e5e7eb", borderRadius: 16, color: "#9ca3af",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📂</div>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#6b7280" }}>No complaints found</p>
            <p style={{ marginTop: 6, fontSize: "0.9rem" }}>Adjust your filters or submit a complaint from the kiosk.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(c => {
              const isExpanded = expandedId === c.id;
              const tab = getTab(c.id);
              const sf = c.structuredFields || {};
              const vr = c.validationResult || null;
              const evidence = c.evidenceItems || [];
              const witnesses = c.witnesses || [];
              const cert = c.certificate65B;

              return (
                <div key={c.id} style={{
                  background: "#fff", border: `1px solid ${isExpanded ? "#0d9488" : "rgba(15,23,42,0.07)"}`,
                  borderRadius: 16, overflow: "hidden",
                  boxShadow: isExpanded ? "0 4px 20px rgba(13,148,136,0.1)" : "0 1px 4px rgba(15,23,42,0.04)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}>

                  {/* ── Card Header ── */}
                  <div style={{
                    padding: "16px 20px", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: 12,
                    borderBottom: isExpanded ? "1px solid rgba(15,23,42,0.07)" : "none",
                    background: isExpanded ? "#fafafa" : "#fff",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontWeight: 800, fontSize: "1rem", color: "#0d9488",
                        background: "#f0fdfa", border: "1px solid #99f6e4",
                        borderRadius: 8, padding: "3px 10px",
                      }}>#{c.id}</span>
                      <StatusBadge status={c.status} />
                      <span style={{
                        background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe",
                        borderRadius: 8, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700,
                      }}>🌐 {LANG_MAP[c.workerLanguage] || c.workerLanguage}</span>
                      {c.phoneNumber && (
                        <span style={{
                          background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                          borderRadius: 8, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700,
                        }}>📞 {c.phoneNumber}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>📅 {fmtDate(c.createdAt)}</span>
                      <button onClick={() => setExpandedId(isExpanded ? null : c.id)} style={{
                        background: isExpanded ? "#0d9488" : "#f8fafc",
                        color: isExpanded ? "#fff" : "#374151",
                        border: `1px solid ${isExpanded ? "#0d9488" : "#e5e7eb"}`,
                        borderRadius: 8, padding: "7px 16px",
                        fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                        transition: "all 0.2s",
                      }}>
                        {isExpanded ? "▲ Collapse" : "▼ View Full Details"}
                      </button>
                    </div>
                  </div>

                  {/* ── Collapsed Preview ── */}
                  {!isExpanded && (
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.5 }}>
                        <strong style={{ color: "#374151" }}>English:</strong> {c.englishSummary || "—"}
                      </p>
                    </div>
                  )}

                  {/* ══ EXPANDED DETAILS ══ */}
                  {isExpanded && (
                    <div style={{ padding: "20px" }}>

                      {/* ── Tab Bar ── */}
                      <div style={{
                        display: "flex", gap: 4, marginBottom: 20,
                        background: "#f3f4f6", borderRadius: 10, padding: 4,
                        overflowX: "auto",
                      }}>
                        {[
                          { id: "transcript", label: "📝 Transcripts" },
                          { id: "details",    label: "📋 Extracted Details" },
                          { id: "evidence",   label: `📎 Evidence (${evidence.length})` },
                          { id: "witnesses",  label: `👥 Witnesses (${witnesses.length})` },
                          { id: "legal",      label: "🔏 Legal & Cert" },
                          { id: "status",     label: "🔄 Update Status" },
                        ].map(t => (
                          <button key={t.id} onClick={() => setTab(c.id, t.id)} style={{
                            flex: "0 0 auto",
                            background: tab === t.id ? "#fff" : "transparent",
                            color: tab === t.id ? "#0d9488" : "#6b7280",
                            border: "none",
                            boxShadow: tab === t.id ? "0 1px 3px rgba(15,23,42,0.1)" : "none",
                            borderRadius: 7, padding: "8px 14px",
                            fontWeight: tab === t.id ? 700 : 600,
                            fontSize: "0.82rem", cursor: "pointer",
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}>{t.label}</button>
                        ))}
                      </div>

                      {/* ── TRANSCRIPT TAB ── */}
                      {tab === "transcript" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                          <Section icon="🎤" title="Original Voice Transcript">
                            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, color: "#111827", wordBreak: "break-word" }}>
                              {c.originalTranscript || <span style={{ color: "#9ca3af" }}>No transcript recorded</span>}
                            </p>
                          </Section>
                          <Section icon="🇬🇧" title="English Translation / Summary">
                            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, color: "#374151", wordBreak: "break-word" }}>
                              {c.englishSummary || <span style={{ color: "#9ca3af" }}>No English summary</span>}
                            </p>
                          </Section>
                          {c.workerSummaryLocal && (
                            <div style={{ gridColumn: "1/-1" }}>
                              <Section icon="💬" title="Worker Acknowledgement (Local Language)">
                                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, color: "#374151" }}>
                                  {c.workerSummaryLocal}
                                </p>
                              </Section>
                            </div>
                          )}
                          {c.audioPath && (
                            <div style={{ gridColumn: "1/-1" }}>
                              <Section icon="🔊" title="Audio Recording (Original Voice Complaint)">
                                <audio controls style={{ width: "100%", borderRadius: 8 }} src={c.audioPath}>
                                  Your browser does not support audio playback.
                                </audio>
                              </Section>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── DETAILS TAB ── */}
                      {tab === "details" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                          <Section icon="🏗️" title="Extracted Complaint Fields">
                            <Field label="Worker Name"     value={sf.workerName} />
                            <Field label="Contractor Name" value={sf.contractorName} />
                            <Field label="Company Name"    value={sf.companyName} />
                            <Field label="Work Site"       value={sf.location || sf.siteLocation} />
                            <Field label="Wage Amount"     value={sf.wageAmount} />
                            <Field label="Period Due"      value={sf.duePeriod} />
                            <Field label="Days / Hours Worked" value={sf.daysWorked} />
                            <Field label="Non-payment Type" value={sf.nonPaymentType} />
                            <Field label="Threats Reported" value={sf.threats} />
                          </Section>

                          <Section icon="🤖" title="AI Validation Result">
                            {vr ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {vr.isValid !== undefined && (
                                  <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    background: vr.isValid ? "#f0fdf4" : "#fef2f2",
                                    color: vr.isValid ? "#16a34a" : "#dc2626",
                                    border: `1px solid ${vr.isValid ? "#bbf7d0" : "#fecaca"}`,
                                    borderRadius: 8, padding: "6px 12px",
                                    fontSize: "0.85rem", fontWeight: 700,
                                  }}>
                                    {vr.isValid ? "✅ Complaint Valid" : "⚠️ Issues Found"}
                                  </div>
                                )}
                                {vr.missingFields?.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>MISSING FIELDS</div>
                                    {vr.missingFields.map((f, i) => (
                                      <div key={i} style={{ fontSize: "0.82rem", color: "#dc2626", padding: "3px 0" }}>⚠ {f}</div>
                                    ))}
                                  </div>
                                )}
                                {vr.notes && <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", lineHeight: 1.6 }}>{vr.notes}</p>}
                                {vr.confidence && (
                                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                    Confidence: <strong style={{ color: "#0d9488" }}>{(vr.confidence * 100).toFixed(0)}%</strong>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p style={{ margin: 0, fontSize: "0.88rem", color: "#9ca3af", fontStyle: "italic" }}>No AI validation result available for this complaint.</p>
                            )}
                          </Section>

                          <div style={{ gridColumn: "1/-1" }}>
                            <Section icon="📅" title="Timestamps">
                              <Field label="Submitted At"    value={fmtDate(c.createdAt)} />
                              <Field label="Last Updated At" value={fmtDate(c.updatedAt)} />
                            </Section>
                          </div>
                        </div>
                      )}

                      {/* ── EVIDENCE TAB ── */}
                      {tab === "evidence" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Voice Audio Complaint */}
                          {c.audioPath && (
                            <Section icon="🎙️" title="Original Voice Complaint Recording">
                              <audio controls style={{ width: "100%", borderRadius: 8 }} src={c.audioPath} />
                            </Section>
                          )}

                          {evidence.length === 0 && !c.audioPath ? (
                            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", border: "2px dashed #e5e7eb", borderRadius: 12 }}>
                              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📎</div>
                              <p style={{ margin: 0, fontWeight: 600 }}>No evidence items attached yet</p>
                              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>The worker can add photos and recordings from the kiosk.</p>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                              {evidence.map((item, idx) => (
                                <Section key={idx} icon={item.type === "photo" ? "📷" : item.type === "audio" ? "🎙️" : "📁"}
                                  title={`Evidence #${idx + 1} — ${item.type || "Unknown"}`}>
                                  {/* Photo */}
                                  {item.type === "photo" && item.path && (
                                    <img src={item.path} alt={`Evidence ${idx + 1}`}
                                      style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />
                                  )}
                                  {/* Audio / Call Recording */}
                                  {(item.type === "audio" || item.type === "call_recording" || item.type === "voice_recording") && item.path && (
                                    <audio controls style={{ width: "100%", marginBottom: 10 }} src={item.path} />
                                  )}
                                  {/* GPS location */}
                                  {item.lat && item.lng && (
                                    <a href={`https://maps.google.com/?q=${item.lat},${item.lng}`} target="_blank" rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        color: "#0284c7", fontSize: "0.82rem", fontWeight: 700,
                                        textDecoration: "none", marginBottom: 4,
                                      }}>
                                      📍 {Number(item.lat).toFixed(5)}° N, {Number(item.lng).toFixed(5)}° E → View on Map
                                    </a>
                                  )}
                                  {item.lat && item.gpsError && (
                                    <span style={{ color: "#9ca3af", fontSize: "0.82rem" }}>📍 Location unavailable</span>
                                  )}
                                  <Field label="Uploaded At" value={fmtDate(item.addedAt)} />
                                  {item.label && <Field label="Label" value={item.label} />}
                                </Section>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── WITNESSES TAB ── */}
                      {tab === "witnesses" && (
                        <div>
                          {witnesses.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", border: "2px dashed #e5e7eb", borderRadius: 12 }}>
                              <div style={{ fontSize: "2rem", marginBottom: 8 }}>👥</div>
                              <p style={{ margin: 0, fontWeight: 600 }}>No witnesses registered</p>
                              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Witnesses can be added from the evidence hub in the kiosk.</p>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                              {witnesses.map((w, idx) => (
                                <Section key={idx} icon="👤" title={`Witness ${idx + 1}`}>
                                  <Field label="Full Name"         value={w.name} />
                                  <Field label="Phone Number"      value={w.phone} />
                                  <Field label="Relationship"      value={w.relation} />
                                  <Field label="Known Worker For"  value={w.duration} />
                                  <Field label="Registered At"     value={fmtDate(w.addedAt || w.createdAt)} />
                                  {w.statement && (
                                    <div style={{ marginTop: 8 }}>
                                      <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 700, marginBottom: 4 }}>WITNESS STATEMENT</div>
                                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, fontStyle: "italic" }}>"{w.statement}"</p>
                                    </div>
                                  )}
                                </Section>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── LEGAL TAB ── */}
                      {tab === "legal" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <Section icon="🔏" title="Section 65B Certificate (Indian Evidence Act)">
                            {cert ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{
                                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                                  borderRadius: 8, padding: "10px 14px",
                                  display: "flex", alignItems: "center", gap: 8,
                                }}>
                                  <span style={{ fontSize: "1.4rem" }}>✅</span>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#16a34a", fontSize: "0.9rem" }}>Certificate Generated</div>
                                    <div style={{ fontSize: "0.78rem", color: "#4b7c5c" }}>This complaint is legally certified under Section 65B of the Indian Evidence Act.</div>
                                  </div>
                                </div>
                                {cert.hash && <Field label="Certificate Hash" value={cert.hash} mono />}
                                {cert.generatedAt && <Field label="Generated At" value={fmtDate(cert.generatedAt)} />}
                                {cert.certifiedBy && <Field label="Certified By" value={cert.certifiedBy} />}
                                {cert.description && (
                                  <div>
                                    <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 700, marginBottom: 4 }}>CERTIFICATE DETAILS</div>
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", lineHeight: 1.6 }}>{cert.description}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{
                                background: "#fffbeb", border: "1px solid #fde68a",
                                borderRadius: 8, padding: "12px 14px",
                                display: "flex", alignItems: "center", gap: 8,
                              }}>
                                <span style={{ fontSize: "1.4rem" }}>⚠️</span>
                                <div>
                                  <div style={{ fontWeight: 700, color: "#d97706", fontSize: "0.9rem" }}>Certificate Not Yet Generated</div>
                                  <div style={{ fontSize: "0.78rem", color: "#92400e" }}>A Section 65B certificate will be generated automatically once the complaint is fully processed.</div>
                                </div>
                              </div>
                            )}
                          </Section>

                          <Section icon="📋" title="Complaint Metadata">
                            <Field label="Complaint ID"    value={c.id} mono />
                            <Field label="Worker Language" value={LANG_MAP[c.workerLanguage] || c.workerLanguage} />
                            <Field label="Phone Number"    value={c.phoneNumber} />
                            <Field label="Audio File Path" value={c.audioPath} mono />
                            <Field label="Status"          value={c.status} />
                            <Field label="Submitted At"    value={fmtDate(c.createdAt)} />
                            <Field label="Last Updated"    value={fmtDate(c.updatedAt)} />
                            <Field label="Evidence Count"  value={String(evidence.length)} />
                            <Field label="Witness Count"   value={String(witnesses.length)} />
                          </Section>
                        </div>
                      )}

                      {/* ── STATUS TAB ── */}
                      {tab === "status" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <Section icon="🔄" title="Update Complaint Status">
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 8 }}>Current Status:</div>
                              <StatusBadge status={c.status} />
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 12 }}>Change to:</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                              {STATUS_OPTIONS.map(opt => {
                                const m = STATUS_META[opt];
                                const isCurrent = c.status === opt;
                                return (
                                  <button key={opt}
                                    onClick={() => updateStatus(c.id, opt)}
                                    disabled={isCurrent || statusUpdatingId === c.id}
                                    style={{
                                      padding: "14px 16px", borderRadius: 10, cursor: isCurrent ? "default" : "pointer",
                                      border: `2px solid ${isCurrent ? m.color : m.border}`,
                                      background: isCurrent ? m.bg : "#fff",
                                      color: isCurrent ? m.color : "#374151",
                                      fontWeight: 700, fontSize: "0.88rem",
                                      opacity: statusUpdatingId === c.id && !isCurrent ? 0.5 : 1,
                                      transition: "all 0.15s",
                                      display: "flex", alignItems: "center", gap: 8,
                                    }}>
                                    {m.icon} {opt.replace("_", " ")}
                                    {isCurrent && <span style={{ marginLeft: "auto", fontSize: "0.72rem", opacity: 0.7 }}>Current</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </Section>

                          <Section icon="📝" title="Admin Notes (Coming Soon)">
                            <textarea placeholder="Add internal notes for this complaint…" disabled
                              style={{
                                width: "100%", minHeight: 90, border: "1px solid #e5e7eb",
                                borderRadius: 8, padding: 10, fontSize: "0.9rem",
                                color: "#6b7280", background: "#fafafa", resize: "vertical",
                              }} />
                            <button disabled style={{
                              marginTop: 10, padding: "8px 16px", borderRadius: 8, border: "none",
                              background: "#e5e7eb", color: "#9ca3af", fontWeight: 700, fontSize: "0.85rem",
                            }}>Save Note</button>
                          </Section>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0 16px", color: "#9ca3af", fontSize: "0.78rem" }}>
          VoiceForJustice - AI Admin Dashboard · Data is stored locally in <code>data/db.json</code>
        </div>
      </div>
    </div>
  );
}
