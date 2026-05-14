import { useState, useEffect, useRef, useCallback } from "react";

// ─── PALETTE & FONTS ────────────────────────────────────────────────────────
const C = {
  bg: "#07090f",
  panel: "#0d1117",
  border: "#1c2333",
  borderBright: "#2d3f5c",
  amber: "#f59e0b",
  amberDim: "#92600a",
  amberGlow: "rgba(245,158,11,0.12)",
  blue: "#38bdf8",
  blueDim: "#1e4a6b",
  green: "#34d399",
  greenDim: "#0d4a30",
  red: "#f87171",
  purple: "#a78bfa",
  text: "#e2e8f0",
  textDim: "#64748b",
  textMid: "#94a3b8",
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const SCHEMA = {
  tables: [
    { name: "properties", desc: "Real estate listings", rows: 18420, cols: ["id","price","suburb","bedrooms","agent_id","listed_date","status"] },
    { name: "transactions", desc: "Completed sales", rows: 6230, cols: ["id","property_id","sale_price","date","buyer_id","agent_id"] },
    { name: "agents", desc: "Sales agents", rows: 84, cols: ["id","name","email","branch","commission_rate","joined_date"] },
    { name: "suburbs", desc: "Suburb metadata", rows: 312, cols: ["id","name","city","avg_price","growth_rate","population"] },
  ]
};

const AGENT_TYPES = [
  { id: "discovery",  label: "Data Discovery",  icon: "◎", color: C.blue,   desc: "Identifies relevant tables & schema" },
  { id: "planner",    label: "Query Planner",    icon: "⊞", color: C.amber,  desc: "Breaks question into query steps" },
  { id: "generator",  label: "SQL Generator",    icon: "⌥", color: C.purple, desc: "Converts plan into SQL queries" },
  { id: "executor",   label: "Execution Agent",  icon: "▶", color: C.green,  desc: "Runs queries & handles errors" },
  { id: "insight",    label: "Insight Agent",    icon: "◈", color: C.amber,  desc: "Explains results in natural language" },
];

const EXAMPLE_QUERIES = [
  "Which agent sold the most houses last year?",
  "Average property price by suburb in Harare?",
  "Which suburb has the fastest price growth?",
  "Top 5 most expensive listings this month?",
  "How many transactions closed in Q1?",
];

const QUERY_HISTORY = [
  { q: "Which suburb has highest avg price?", time: "2m ago",  rows: 12, ms: 84  },
  { q: "Top agents by commission earned",     time: "8m ago",  rows: 5,  ms: 127 },
  { q: "Properties sold in Borrowdale",       time: "15m ago", rows: 38, ms: 61  },
  { q: "Monthly transaction volume Q1-Q4",    time: "1h ago",  rows: 12, ms: 93  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: "monospace", letterSpacing: 1,
      padding: "2px 7px", borderRadius: 2,
      background: color + "18", color, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

function Panel({ children, style, glow }) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${glow ? C.amberDim : C.border}`,
      borderRadius: 6,
      boxShadow: glow ? `0 0 24px ${C.amberGlow}` : "none",
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 3, color: C.amber,
      fontFamily: "monospace", opacity: 0.7, marginBottom: 12,
      textTransform: "uppercase",
    }}>{children}</div>
  );
}

// ─── PIPELINE VISUALIZER ─────────────────────────────────────────────────────
function PipelineVisualizer({ activeStep, running }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "4px 0" }}>
      {AGENT_TYPES.map((a, i) => {
        const isActive = i === activeStep && running;
        const isDone = running && i < activeStep;
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, minWidth: 90, padding: "10px 8px",
              borderRadius: 6,
              background: isActive ? a.color + "18" : isDone ? C.greenDim + "44" : "transparent",
              border: `1px solid ${isActive ? a.color : isDone ? C.green + "55" : C.border}`,
              transition: "all 0.4s ease",
              boxShadow: isActive ? `0 0 18px ${a.color}33` : "none",
            }}>
              <div style={{
                fontSize: 20,
                color: isActive ? a.color : isDone ? C.green : C.textDim,
                transition: "color 0.3s",
              }}>{isDone ? "✓" : a.icon}</div>
              <div style={{ fontSize: 10, color: isActive ? a.color : isDone ? C.green : C.textDim, textAlign: "center", fontFamily: "monospace", lineHeight: 1.3 }}>
                {a.label}
              </div>
            </div>
            {i < AGENT_TYPES.length - 1 && (
              <div style={{
                width: 28, height: 2,
                background: isDone ? C.green : C.border,
                position: "relative", flexShrink: 0,
              }}>
                {isDone && <div style={{ position: "absolute", right: -4, top: -3, color: C.green, fontSize: 8 }}>▶</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── ARCHITECTURE DIAGRAM ─────────────────────────────────────────────────────
function ArchDiagram() {
  const layers = [
    { label: "User Interface",       sub: "Chat · Dashboard · API",         color: C.blue   },
    { label: "AI Gateway",           sub: "Prompt routing · Auth · Rate limit", color: C.amber  },
    { label: "Agent Orchestrator",   sub: "5-agent pipeline coordination",   color: C.purple },
    { label: "Tool Registry",        sub: "get_tables · run_sql · visualize", color: C.amber  },
    { label: "Query Engine",         sub: "SQL validator · Executor · Cache", color: C.green  },
    { label: "Data Sources",         sub: "PostgreSQL · SQLite · APIs · CSV", color: C.blue   },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div style={{
            width: "90%", padding: "10px 16px", borderRadius: 5,
            background: l.color + "12", border: `1px solid ${l.color}44`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: l.color, fontFamily: "monospace", fontWeight: 700 }}>{l.label}</span>
            <span style={{ fontSize: 10, color: C.textDim, fontFamily: "monospace" }}>{l.sub}</span>
          </div>
          {i < layers.length - 1 && (
            <div style={{ color: C.textDim, fontSize: 16, lineHeight: 1.2 }}>↓</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── LOG TERMINAL ──────────────────────────────────────────────────────────────
function LogLine({ line, delay }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const colors = { info: C.textMid, sql: C.amber, result: C.green, step: C.blue, error: C.red };
  return (
    <div style={{
      fontFamily: "monospace", fontSize: 11, lineHeight: "1.8",
      color: colors[line.type] || C.textMid,
      opacity: vis ? 1 : 0, transition: "opacity 0.2s",
      whiteSpace: "pre",
    }}>
      <span style={{ color: C.textDim, marginRight: 8 }}>{line.ts}</span>
      {line.text}
    </div>
  );
}

// ─── SCHEMA BROWSER ──────────────────────────────────────────────────────────
function SchemaBrowser() {
  const [open, setOpen] = useState("properties");
  return (
    <div>
      {SCHEMA.tables.map(t => (
        <div key={t.name} style={{ marginBottom: 4 }}>
          <div
            onClick={() => setOpen(open === t.name ? null : t.name)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 10px", borderRadius: 4, cursor: "pointer",
              background: open === t.name ? C.amberGlow : "transparent",
              border: `1px solid ${open === t.name ? C.amberDim : C.border}`,
            }}
          >
            <span style={{ fontSize: 12, fontFamily: "monospace", color: open === t.name ? C.amber : C.textMid }}>
              📋 {t.name}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.textDim, fontFamily: "monospace" }}>{t.rows.toLocaleString()} rows</span>
              <span style={{ color: C.textDim, fontSize: 10 }}>{open === t.name ? "▲" : "▼"}</span>
            </div>
          </div>
          {open === t.name && (
            <div style={{ padding: "6px 10px 8px 20px", borderLeft: `2px solid ${C.amberDim}`, marginLeft: 10 }}>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 5, fontFamily: "monospace" }}>{t.desc}</div>
              {t.cols.map(c => (
                <div key={c} style={{ fontSize: 11, color: C.textMid, fontFamily: "monospace", lineHeight: "1.9" }}>
                  <span style={{ color: C.amberDim }}>·</span> {c}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("query");
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [queryCount, setQueryCount] = useState(127);
  const [agentStatus, setAgentStatus] = useState(AGENT_TYPES.map(() => "idle"));
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Inject Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const simulateQuery = useCallback((question) => {
    if (running || !question.trim()) return;
    setRunning(true);
    setResult(null);
    setLogs([]);
    setActiveStep(0);

    const ts = () => new Date().toLocaleTimeString("en", { hour12: false });

    const steps = [
      // Discovery
      [
        { type: "step",   ts: ts(), text: "[ DISCOVERY AGENT ] Scanning schema for relevant tables..." },
        { type: "info",   ts: ts(), text: "  → Matched: properties, transactions, agents" },
        { type: "info",   ts: ts(), text: "  → Loading column metadata for 3 tables" },
      ],
      // Planner
      [
        { type: "step",   ts: ts(), text: "[ QUERY PLANNER  ] Building execution plan..." },
        { type: "info",   ts: ts(), text: "  Step 1: Join agents → transactions → properties" },
        { type: "info",   ts: ts(), text: "  Step 2: COUNT sales grouped by agent_id" },
        { type: "info",   ts: ts(), text: "  Step 3: ORDER DESC, LIMIT 1" },
      ],
      // Generator
      [
        { type: "step",   ts: ts(), text: "[ SQL GENERATOR  ] Synthesizing query..." },
        { type: "sql",    ts: ts(), text: "  SELECT a.name, COUNT(t.id) AS total_sales" },
        { type: "sql",    ts: ts(), text: "  FROM agents a JOIN transactions t ON a.id = t.agent_id" },
        { type: "sql",    ts: ts(), text: "  JOIN properties p ON t.property_id = p.id" },
        { type: "sql",    ts: ts(), text: "  WHERE YEAR(t.date) = YEAR(CURDATE()) - 1" },
        { type: "sql",    ts: ts(), text: "  GROUP BY a.id ORDER BY total_sales DESC LIMIT 5;" },
      ],
      // Executor
      [
        { type: "step",   ts: ts(), text: "[ EXEC AGENT     ] Validating SQL safety..." },
        { type: "info",   ts: ts(), text: "  ✓ No DDL/DML detected — read-only safe" },
        { type: "step",   ts: ts(), text: "[ EXEC AGENT     ] Running query against DB..." },
        { type: "result", ts: ts(), text: "  ✓ 5 rows returned in 94ms" },
      ],
      // Insight
      [
        { type: "step",   ts: ts(), text: "[ INSIGHT AGENT  ] Generating natural language summary..." },
        { type: "result", ts: ts(), text: "  ✓ Response ready" },
      ],
    ];

    let stepIdx = 0;
    const runStep = () => {
      if (stepIdx >= steps.length) {
        setResult({
          question,
          sql: `SELECT a.name, COUNT(t.id) AS total_sales\nFROM agents a\nJOIN transactions t ON a.id = t.agent_id\nWHERE YEAR(t.date) = YEAR(CURDATE()) - 1\nGROUP BY a.id\nORDER BY total_sales DESC LIMIT 5;`,
          rows: [
            { name: "Grace Mutasa",   total_sales: 47, revenue: "$8.4M"  },
            { name: "David Ncube",    total_sales: 43, revenue: "$7.1M"  },
            { name: "Chipo Dube",     total_sales: 38, revenue: "$6.8M"  },
            { name: "Farai Mlambo",   total_sales: 35, revenue: "$5.9M"  },
            { name: "Tinashe Moyo",   total_sales: 31, revenue: "$4.7M"  },
          ],
          insight: "Grace Mutasa led all agents last year with 47 closed transactions totalling $8.4M in sales — 9% above the second-ranked agent. The top 5 agents collectively accounted for 62% of total transaction volume.",
          ms: 94,
        });
        setRunning(false);
        setActiveStep(-1);
        setQueryCount(q => q + 1);
        return;
      }
      setActiveStep(stepIdx);
      const stepLogs = steps[stepIdx];
      stepLogs.forEach((log, i) => {
        setTimeout(() => {
          setLogs(prev => [...prev, log]);
        }, i * 180);
      });
      stepIdx++;
      setTimeout(runStep, stepLogs.length * 180 + 600);
    };
    setTimeout(runStep, 200);
  }, [running]);

  const TABS = [
    { id: "query", label: "Query Interface" },
    { id: "arch",  label: "Architecture"    },
    { id: "schema",label: "Data Map"        },
    { id: "agents",label: "Agent Registry"  },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'IBM Plex Mono', monospace",
      backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(56,189,248,0.04) 0%, transparent 60%)",
    }}>
      {/* ── TOP BAR ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52,
        borderBottom: `1px solid ${C.border}`,
        background: "rgba(7,9,15,0.9)",
        backdropFilter: "blur(8px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 28, height: 28, background: C.amber,
            borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900,
          }}>⬡</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, letterSpacing: 1, fontFamily: "'Syne', sans-serif" }}>
              AI DATA AGENT SYSTEM
            </div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>COMMAND CENTER v1.0</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "QUERIES", value: queryCount },
            { label: "AGENTS",  value: "5/5 LIVE" },
            { label: "DB",      value: "CONNECTED" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: C.amber }}>{s.value}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 10, color: C.green }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{
        display: "flex", gap: 0, padding: "0 24px",
        borderBottom: `1px solid ${C.border}`,
        background: C.panel,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 20px", background: "transparent",
            border: "none", borderBottom: `2px solid ${tab === t.id ? C.amber : "transparent"}`,
            color: tab === t.id ? C.amber : C.textDim,
            cursor: "pointer", fontSize: 11, fontFamily: "inherit",
            letterSpacing: 1, transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── QUERY TAB ── */}
      {tab === "query" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, padding: 24, maxWidth: 1400 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Input */}
            <Panel glow={running}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
                <SectionLabel>Natural Language Query</SectionLabel>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && simulateQuery(input)}
                    placeholder="Ask anything about your data..."
                    style={{
                      flex: 1, background: "#0a0f1a", border: `1px solid ${C.borderBright}`,
                      borderRadius: 4, padding: "10px 14px", color: C.text,
                      fontFamily: "monospace", fontSize: 13, outline: "none",
                    }}
                  />
                  <button
                    onClick={() => simulateQuery(input)}
                    disabled={running}
                    style={{
                      background: running ? C.amberDim : C.amber,
                      border: "none", borderRadius: 4, color: "#000",
                      padding: "10px 20px", cursor: running ? "not-allowed" : "pointer",
                      fontFamily: "monospace", fontWeight: 700, fontSize: 12,
                      transition: "all 0.2s",
                    }}
                  >{running ? "RUNNING..." : "RUN AGENTS →"}</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {EXAMPLE_QUERIES.map(q => (
                    <button key={q} onClick={() => { setInput(q); simulateQuery(q); }}
                      style={{
                        background: "transparent", border: `1px solid ${C.border}`,
                        color: C.textDim, padding: "4px 10px", borderRadius: 3,
                        cursor: "pointer", fontSize: 10, fontFamily: "monospace",
                      }}>{q}</button>
                  ))}
                </div>
              </div>
              {/* Pipeline */}
              <div style={{ padding: "14px 18px" }}>
                <SectionLabel>Agent Pipeline</SectionLabel>
                <PipelineVisualizer activeStep={activeStep} running={running} />
              </div>
            </Panel>

            {/* Log Terminal */}
            <Panel>
              <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                <SectionLabel>Execution Log</SectionLabel>
                <span style={{ fontSize: 10, color: C.textDim }}>{logs.length} events</span>
              </div>
              <div ref={logRef} style={{
                padding: "12px 18px", height: 180, overflowY: "auto",
                background: "#050710",
              }}>
                {logs.length === 0 && (
                  <div style={{ color: C.textDim, fontSize: 11, fontFamily: "monospace" }}>
                    // Awaiting query execution...
                  </div>
                )}
                {logs.map((l, i) => <LogLine key={i} line={l} delay={0} />)}
                {running && logs.length > 0 && (
                  <div style={{ color: C.amber, fontSize: 11, fontFamily: "monospace" }}>
                    <span style={{ animation: "blink 1s infinite" }}>▌</span>
                  </div>
                )}
              </div>
            </Panel>

            {/* Result */}
            {result && (
              <Panel>
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
                  <SectionLabel>Query Result</SectionLabel>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <Tag color={C.green}>✓ SUCCESS</Tag>
                    <Tag color={C.blue}>{result.ms}ms</Tag>
                    <Tag color={C.amber}>{result.rows.length} rows</Tag>
                  </div>
                  {/* SQL */}
                  <pre style={{
                    background: "#050710", border: `1px solid ${C.border}`,
                    borderRadius: 4, padding: 12, fontSize: 11, color: C.amber,
                    overflowX: "auto", margin: "0 0 14px 0",
                  }}>{result.sql}</pre>
                  {/* Table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{Object.keys(result.rows[0]).map(k => (
                        <th key={k} style={{ padding: "6px 14px", background: "#111827", color: C.amber, textAlign: "left", fontFamily: "monospace", fontSize: 10, letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>{k.toUpperCase()}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} style={{ padding: "7px 14px", color: C.textMid, borderBottom: `1px solid ${C.border}22`, fontFamily: "monospace" }}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Insight */}
                <div style={{ padding: "14px 18px", background: C.amberGlow }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ color: C.amber, fontSize: 18, flexShrink: 0 }}>◈</div>
                    <div>
                      <div style={{ fontSize: 10, color: C.amber, letterSpacing: 2, marginBottom: 6 }}>INSIGHT AGENT</div>
                      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>{result.insight}</div>
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Panel style={{ padding: 16 }}>
              <SectionLabel>Query History</SectionLabel>
              {QUERY_HISTORY.map((q, i) => (
                <div key={i} onClick={() => { setInput(q.q); simulateQuery(q.q); }}
                  style={{
                    padding: "8px 10px", borderRadius: 4, marginBottom: 4,
                    border: `1px solid ${C.border}`, cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}>
                  <div style={{ fontSize: 11, color: C.textMid, marginBottom: 4, lineHeight: 1.4 }}>{q.q}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 10, color: C.textDim }}>{q.time}</span>
                    <span style={{ fontSize: 10, color: C.blue }}>{q.rows} rows</span>
                    <span style={{ fontSize: 10, color: C.textDim }}>{q.ms}ms</span>
                  </div>
                </div>
              ))}
            </Panel>

            <Panel style={{ padding: 16 }}>
              <SectionLabel>Agent Status</SectionLabel>
              {AGENT_TYPES.map((a, i) => (
                <div key={a.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 10px", marginBottom: 4, borderRadius: 4,
                  border: `1px solid ${running && activeStep === i ? a.color + "55" : C.border}`,
                  background: running && activeStep === i ? a.color + "0d" : "transparent",
                  transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: running && activeStep === i ? a.color : C.textDim }}>{a.icon}</span>
                    <span style={{ fontSize: 11, color: running && activeStep === i ? a.color : C.textMid }}>{a.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: running && activeStep === i ? a.color : (running && i < activeStep ? C.green : C.textDim),
                      boxShadow: running && activeStep === i ? `0 0 6px ${a.color}` : "none",
                    }} />
                    <span style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>
                      {running && activeStep === i ? "ACTIVE" : running && i < activeStep ? "DONE" : "IDLE"}
                    </span>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}

      {/* ── ARCH TAB ── */}
      {tab === "arch" && (
        <div style={{ padding: 24, maxWidth: 900 }}>
          <Panel style={{ padding: 24 }}>
            <SectionLabel>System Architecture</SectionLabel>
            <ArchDiagram />
            <div style={{ marginTop: 28 }}>
              <SectionLabel>API Endpoints</SectionLabel>
              {[
                { method: "POST", path: "/ask-data",      desc: "Submit natural language question"  },
                { method: "GET",  path: "/schema",         desc: "Get full data map"                 },
                { method: "GET",  path: "/query-history",  desc: "Recent query log"                  },
                { method: "GET",  path: "/agent-status",   desc: "Live agent health check"           },
              ].map(e => (
                <div key={e.path} style={{
                  display: "flex", gap: 14, alignItems: "center",
                  padding: "8px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <Tag color={e.method === "POST" ? C.amber : C.blue}>{e.method}</Tag>
                  <span style={{ fontSize: 12, color: C.amber, fontFamily: "monospace", minWidth: 180 }}>{e.path}</span>
                  <span style={{ fontSize: 11, color: C.textDim }}>{e.desc}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <SectionLabel>Free Tech Stack</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "LLM Runtime",  items: ["Ollama", "LM Studio", "Groq API"] },
                  { label: "Agent Framework", items: ["LangChain", "CrewAI", "LlamaIndex"] },
                  { label: "Database",     items: ["PostgreSQL", "SQLite", "MySQL"] },
                ].map(g => (
                  <div key={g.label} style={{ background: "#0d1117", border: `1px solid ${C.border}`, borderRadius: 5, padding: 14 }}>
                    <div style={{ fontSize: 10, color: C.amber, letterSpacing: 2, marginBottom: 8 }}>{g.label.toUpperCase()}</div>
                    {g.items.map(i => <div key={i} style={{ fontSize: 11, color: C.textMid, lineHeight: "2" }}>· {i}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ── SCHEMA TAB ── */}
      {tab === "schema" && (
        <div style={{ padding: 24, maxWidth: 900 }}>
          <Panel style={{ padding: 24 }}>
            <SectionLabel>AI Data Map — Table Registry</SectionLabel>
            <SchemaBrowser />
            <div style={{ marginTop: 24 }}>
              <SectionLabel>Available Tools</SectionLabel>
              {[
                { name: "get_tables",         desc: "List all available tables",         color: C.blue   },
                { name: "get_table_schema",   desc: "Fetch columns & types for a table", color: C.blue   },
                { name: "run_sql_query",      desc: "Execute SQL against database",       color: C.amber  },
                { name: "get_sample_data",    desc: "Retrieve sample rows from a table", color: C.green  },
                { name: "create_visualization", desc: "Generate chart from query result",  color: C.purple },
              ].map(t => (
                <div key={t.name} style={{
                  display: "flex", gap: 14, padding: "9px 12px", marginBottom: 4,
                  borderRadius: 4, border: `1px solid ${C.border}`,
                  alignItems: "center",
                }}>
                  <Tag color={t.color}>{t.name}</Tag>
                  <span style={{ fontSize: 11, color: C.textDim }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ── AGENTS TAB ── */}
      {tab === "agents" && (
        <div style={{ padding: 24, maxWidth: 1000 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {AGENT_TYPES.map(a => (
              <Panel key={a.id} style={{ padding: 20, border: `1px solid ${a.color}33` }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 6,
                    background: a.color + "18", border: `1px solid ${a.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, color: a.color, flexShrink: 0,
                  }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: a.color, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10, lineHeight: 1.6 }}>{a.desc}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Tag color={C.green}>ACTIVE</Tag>
                      <Tag color={a.color}>v1.0</Tag>
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
            {/* Future agents */}
            {["Finance Agent", "Market Analysis Agent", "Fraud Detection Agent"].map(n => (
              <Panel key={n} style={{ padding: 20, opacity: 0.45 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 6,
                    background: C.border, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18, color: C.textDim, flexShrink: 0,
                  }}>+</div>
                  <div>
                    <div style={{ fontSize: 12, color: C.textMid, marginBottom: 4, fontFamily: "monospace" }}>{n}</div>
                    <Tag color={C.textDim}>PLANNED</Tag>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        input::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #1c2333; border-radius: 3px; }
      `}</style>
    </div>
  );
}
