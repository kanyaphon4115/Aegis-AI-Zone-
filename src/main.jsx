import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("AEGIS ORBIT frontend render error", error, info); }
  render() {
    if (this.state.error) return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", margin: 0, padding: 24, background: "#050608", color: "#f5f5f7", fontFamily: "system-ui, sans-serif" }}>
        <section style={{ maxWidth: 420, padding: 24, borderRadius: 16, background: "#141519" }}>
          <h1 style={{ marginTop: 0 }}>AEGIS ORBIT</h1>
          <p>หน้าเว็บเกิดข้อผิดพลาดชั่วคราว กรุณารีเฟรชหรือลองใหม่อีกครั้ง</p>
        </section>
      </main>
    );
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root mount element");
createRoot(rootElement).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
