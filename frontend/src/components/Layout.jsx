import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/purchases", label: "Purchases", icon: ShoppingCart },
    { to: "/transfers", label: "Transfers", icon: ArrowLeftRight },
    {
      to: "/records",
      label: "Assignments & Expenditures",
      icon: ClipboardList,
    },
    ...(user?.role === "ADMIN"
      ? [{ to: "/audit", label: "Audit Logs", icon: ScrollText }]
      : []),
  ];
  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-5">
        <h1 className="text-xl font-bold mb-1">FieldStock</h1>
        <p className="text-xs text-slate-400 mb-8">Asset Management</p>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-emerald-700" : "text-slate-300 hover:bg-slate-800"}`
              }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-10 border-t border-slate-700 pt-4">
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs text-slate-400 mb-3">
            {user?.role?.replaceAll("_", " ")}
          </p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex gap-2 items-center text-sm text-slate-300">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
