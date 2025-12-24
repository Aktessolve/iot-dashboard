import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function App() {
  const [devices, setDevices] = useState({});
  const [history, setHistory] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, "sensor_data"),
      orderBy("timestamp", "desc"),
      limit(100)
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

        // latest per device
        if (!latest[d.device_id]) {
          latest[d.device_id] = {
            ...d,
            online: ageSec <= 30,
            age: Math.round(ageSec)
          };
        }

        // history per device
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

  return (
    <div style={{ padding: 20, fontFamily: "Segoe UI, Arial" }}>
      <h2 style={{ marginBottom: 20 }}>🌍 IoT Dashboard</h2>

      {Object.keys(devices).length === 0 && (
        <p>No devices reporting yet…</p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20
      }}>
        {Object.entries(devices).map(([id, d]) => {
          const bg = d.online ? "#ecfdf3" : "#fdecec";
          const status = d.online ? "🟢 ONLINE" : "🔴 OFFLINE";

          return (
            <div key={id} style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              background: bg,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: 8 }}>
                📟 {id} — {status}
              </h3>

              <div style={{ marginBottom: 10 }}>
                🌡 <b>{d.temperature} °C</b> &nbsp;|&nbsp;
                💧 <b>{d.humidity} %</b><br />
                ⚠ Status: <b>{d.status}</b><br />
                ⏱ Last update: {d.age}s ago
              </div>

              {/* Chart */}
              {history[id] && history[id].length > 1 && (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={history[id]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
