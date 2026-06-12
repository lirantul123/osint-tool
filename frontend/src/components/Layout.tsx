import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: "⬡" },
  { to: "/investigate", label: "Investigate", icon: "◎" },
  { to: "/statistics", label: "Statistics", icon: "▥" },
];

export default function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/apple-touch-icon.png" alt="" className="brand-icon" />
          <div>
            <h1>OSINT Toolkit</h1>
            <p>Open Source Intelligence</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>Ethical use only</p>
          <p>(you understood amit?)</p>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
