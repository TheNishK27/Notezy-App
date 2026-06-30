import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { BookOpenText, Compass, GraduationCap, MagnifyingGlass, UploadSimple, User, SignOut, House } from "@phosphor-icons/react";

const NavItem = ({ to, label, icon: Icon, testId }) => {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
  return (
    <Link
      to={to}
      data-testid={testId}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 border-transparent transition-all ${active ? "bg-[#F4FF47] border-black brutal-shadow-sm" : "hover:bg-white hover:border-black"} rounded-md`}
    >
      <Icon size={18} weight="bold" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
};

export default function Nav() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

React.useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);

const onLogout = async () => {
  await supabase.auth.signOut();
  navigate("/");
};

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link to={user ? "/home" : "/"} data-testid="nav-logo" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-[#F4FF47] border-2 border-black rounded-md flex items-center justify-center brutal-shadow-sm group-hover:rotate-[-4deg] transition-transform">
            <BookOpenText size={22} weight="fill" />
          </div>
          <div className="font-display text-2xl tracking-tight">notezy<span className="text-[#4C7BF4]">.</span></div>
        </Link>

        <nav className="ml-auto flex items-center gap-2">
          {user && <NavItem to="/home" label="Home" icon={House} testId="nav-home" />}
          <NavItem to="/browse" label="Browse" icon={MagnifyingGlass} testId="nav-browse" />
          <NavItem to="/explore" label="Explore" icon={Compass} testId="nav-explore" />
          {user && <NavItem to="/library" label="Library" icon={BookOpenText} testId="nav-library" />}
          {user && <NavItem to="/dashboard" label="Sell" icon={GraduationCap} testId="nav-dashboard" />}
          {user && (
            <Link to="/upload" data-testid="nav-upload" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md bg-[#4C7BF4] text-white border-2 border-black brutal-btn text-sm uppercase">
              <UploadSimple size={16} weight="bold" /> Upload
            </Link>
          )}
          {!user ? (
            <Link to="/auth" data-testid="nav-login" className="px-4 py-2 rounded-md bg-[#F4FF47] border-2 border-black brutal-btn text-sm uppercase font-bold">
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/profile" data-testid="nav-profile" className="w-10 h-10 bg-[#FF6B9E] border-2 border-black rounded-md flex items-center justify-center brutal-shadow-sm font-display">
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || <User size={18} />}
              </Link>
              <button data-testid="nav-logout" onClick={onLogout} className="hidden md:flex items-center gap-1 px-2 py-2 text-xs font-bold uppercase hover:text-red-600">
                <SignOut size={16} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
