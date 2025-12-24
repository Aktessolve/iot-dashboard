import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { useEffect, useState } from "react";
import "./App.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function App() {
  const [devices, setDevices] = useState({});
  const [history, setHistory] = useState({});
  const [ai, setAi] = useState({});

  // ================= SENSOR DATA + HISTORY =================
  useEffect(() => {
    const q = query(
      collection(db, "sensor_data"),
      orderBy("timestamp", "desc"),
      limit(120)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const latest = {};
      const hist = {};

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (!d.device_id || !d.timestamp?.seconds) return;

        const ts = d.timestamp.seconds * 1000;
        const ageSec = (now - ts) / 1000;

        if (!latest[d.device_id] || latest[d.device_id].ts < ts) {
          latest[d.device_id] = {
            ...d,
            online: ageSec <= 30,
            age: Math.round(ageSec),
            ts
          };
        }

        if (!hist[d.device_id]) hist[d.device_id] = [];
        hist[d.device_id].push({
          time: new Date(ts).toLocaleTimeString(),
          temperature: d.temperature,
          humidity: d.humidity
        });
      });

      Object.keys(hist).forEach(id => hist[id].reverse());

      setDevices(latest);
      setHistory(hist);
    });

    return () => unsub();
  }, []);

  // ================= AI ANALYSIS =================
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "ai_analysis"),
      (snapshot) => {
        const latestAi = {};
        snapshot.docs.forEach(doc => {
          const d = doc.data();
          if (!d.device_id) return;
          latestAi[d.device_id] = d;
        });
        setAi(latestAi);
      }
    );

    return () => unsub();
  }, []);

  // ================= UI =================
  return (
    <div className="dashboard">
      <h2>🌍 IPCC – Environmental Monitoring Dashboard</h2>
      <p style={{ marginTop: -10, marginBottom: 20, color: "#6b7280" }}>
        Univison Technology • IoT + AI Proof of Concept
      </p>

      {Object.keys(devices).length === 0 && (
        <p>No devices reporting yet…</p>
      )}

      <div className="device-grid">
        {Object.entries(devices).map(([id, d]) => {
          const aiData = ai[id];
          const highRisk =
            aiData?.risk?.includes("HIGH") ||
            aiData?.risk?.includes("HEAT");

          return (
            <div key={id} className="device-card">
              {/* HEADER */}
              <div className="device-header">
                <div className="device-title">📟 {id}</div>
                <div className="device-status">
                  {d.online ? "🟢 ONLINE" : "🔴 OFFLINE"}
                </div>
              </div>

              {/* AI STATUS */}
              <div className={`ai-box ${highRisk ? "high" : ""}`}>
                🤖 <b>{aiData?.risk || "PENDING"}</b><br />
                {aiData?.reason || "Waiting for AI analysis"}
              </div>

              {/* TEMPERATURE GRAPH */}
              {history[id] && history[id].length > 1 && (
                <>
                  <div className="chart-title">🌡 Temperature (°C)</div>
                  <div style={{ width: "100%", height: 160 }}>
                    <ResponsiveContainer>
                      <LineChart data={history[id]}>
                        <XAxis dataKey="time" hide />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-title">💧 Humidity (%)</div>
                  <div style={{ width: "100%", height: 160 }}>
                    <ResponsiveContainer>
                      <LineChart data={history[id]}>
                        <XAxis dataKey="time" hide />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="humidity"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* LIVE METRICS */}
              <div className="metrics">
                <div>🌡 {d.temperature} °C</div>
                <div>💧 {d.humidity} %</div>
                <div>⏱ {d.age}s ago</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
