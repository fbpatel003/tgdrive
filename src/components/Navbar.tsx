import { HardDrive, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { phone, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-4">
      <div className="flex-1 flex items-center gap-2">
        <HardDrive size={20} className="text-primary" />
        <span className="font-semibold text-base-content">TGDrive</span>
      </div>
      <div className="flex-none flex items-center gap-3">
        <span className="text-sm text-base-content/50 hidden sm:block">{phone}</span>
        <button
          className="btn btn-ghost btn-sm gap-2"
          onClick={handleLogout}
        >
          <LogOut size={15} />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </div>
  );
}
