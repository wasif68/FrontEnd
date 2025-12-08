import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Outlet />
        </main>
        <aside className="app-right">
          <div className="tip-card">
            <h4>Tips</h4>
            <p>Update your profile for better matches!</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
