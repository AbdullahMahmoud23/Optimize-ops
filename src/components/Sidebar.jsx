import { NavLink } from "react-router-dom";
import Logo from "../assets/Logo.jpeg";
import { useAuth } from "../context/AuthContext.jsx";

function Sidebar() {
  const { role, user } = useAuth();
  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  const getMenuItems = () => {
    switch (role) {
      case "admin":
        return [
          { to: "/admin/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { to: "/admin/supervisors", label: "Supervisors", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
        ];
      case "supervisor":
        return [
          { to: "/supervisor/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { to: "/supervisor/team", label: "My Team", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
          { to: "/supervisor/tasks", label: "Tasks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
        ];
      case "technician":
        return [
          { to: "/technician/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { to: "/technician/assignments", label: "My Assignments", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
          { to: "/technician/reports", label: "Reports", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
        ];
      default:
        return [
          { to: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
        ];
    }
  };

  const menuItems = getMenuItems();
  const colorClass = role === "admin" ? "blue" : role === "supervisor" ? "green" : role === "technician" ? "purple" : "blue";

  return (
    <aside className="w-64 min-h-screen bg-base-200">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-base-300">
        <img
          src={Logo}
          alt="Factory Logo"
          className="w-26 h-20 rounded-full object-cover"
        />
        <div>
          <h2 className="text-m font-bold">{roleTitle} Panel</h2>
          <p className="text-xs text-base-content/60">{user?.email || "User"}</p>
        </div>
      </div>

      {/* Menu Items */}
      <ul className="menu p-4 gap-2">
        {menuItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  isActive
                    ? `bg-${colorClass}-700 text-white shadow-md`
                    : `hover:bg-${colorClass}-100 text-gray-700`
                }`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={item.icon}
                />
              </svg>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
