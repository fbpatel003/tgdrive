import { HardDrive, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { phone, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-4 gap-3">
      <div className="flex-none flex items-center gap-2">
        <HardDrive size={20} className="text-primary" />
        <span className="font-semibold text-base-content hidden sm:block">TGDrive</span>
      </div>
      <div className="flex-1 flex justify-center">
        <SearchBar />
      </div>
      <div className="flex-none flex items-center gap-3">
        <span className="text-sm text-base-content/50 hidden md:block">{phone}</span>
        <button className="btn btn-ghost btn-sm gap-2" onClick={handleLogout}>
          <LogOut size={15} />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </div>
  );
}