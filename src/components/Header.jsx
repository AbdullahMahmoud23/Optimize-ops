import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.jpeg";
import { useAuth } from "../context/AuthContext.jsx";

function Header() {
  const navigate = useNavigate();
  const { logout, role, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/signin", { replace: true });
  };

  const handleLogoClick = () => {
    if (role) {
      navigate(`/${role}/dashboard`);
    } else {
      navigate("/dashboard");
    }
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case "admin":
        return "badge-primary";
      case "supervisor":
        return "badge-Accent";
      case "technician":
        return "badge-Neutral";
      default:
        return "badge-neutral";
    }
  };

  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  return (
    <div className="navbar bg-white/90 backdrop-blur-md border-b border-base-300 shadow-md z-50 relative">
      {/* Left side: Logo + Title */}
      <div
        className="flex items-center gap-3 px-4 cursor-pointer group"
        onClick={handleLogoClick}
      >
        <img
          src={Logo}
          alt="Factory Logo"
          className="w-10 h-10 rounded-lg object-cover shadow"
        />
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm group-hover:brightness-110 group-hover:scale-[1.02] transition-all duration-300">
          Factory Dashboard
        </h1>
      </div>
      <div className="flex-1"></div>

      {/* Right side: Role Badge + User + Logout */}
      <div className="flex items-center gap-4 px-4">
        {role && (
          <div className={`badge ${getRoleBadgeColor()} badge-lg`}>
            {roleTitle}
          </div>
        )}
        {user?.email && (
          <div className="text-sm text-gray-600 hidden sm:block">
            {user.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn bg-gradient-to-r from-blue-600 to-blue-400 text-white border-none shadow-md hover:shadow-blue-500/40 hover:scale-105 transition-transform"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;
