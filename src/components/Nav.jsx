import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DarkModeToggle from "@/components/DarkModeToggle";
import {
  BookOpenText,
  Compass,
  GraduationCap,
  MagnifyingGlass,
  UploadSimple,
  User,
  SignOut,
  House,
  List,
  X,
} from "@phosphor-icons/react";

const NavItem = ({ to, label, icon: Icon, testId, onClick }) => {
  const loc = useLocation();
  const active =
    loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 rounded-md transition-all ${
        active
          ? "bg-[#F4FF47] text-black border-black brutal-shadow-sm"
          : "bg-white text-black border-black hover:bg-[#F4FF47] dark:bg-[#1b1b1b] dark:text-white dark:border-white dark:hover:bg-[#F4FF47] dark:hover:text-black"
      }`}
    >
      <Icon size={18} weight="bold" />
      <span>{label}</span>
    </Link>
  );
};

export default function Nav() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#111111] border-b-2 border-black dark:border-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-3">
        <Link
          to={user ? "/home" : "/"}
          data-testid="nav-logo"
          onClick={closeMenu}
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="w-10 h-10 bg-[#F4FF47] text-black border-2 border-black rounded-md flex items-center justify-center brutal-shadow-sm group-hover:rotate-[-4deg] transition-transform">
            <BookOpenText size={22} weight="fill" />
          </div>

          <div className="font-display text-2xl tracking-tight text-black dark:text-white">
            notezy<span className="text-[#4C7BF4]">.</span>
          </div>
        </Link>

        <nav className="hidden lg:flex ml-auto items-center gap-2">
          {user && (
            <NavItem to="/home" label="Home" icon={House} testId="nav-home" />
          )}

          <NavItem
            to="/browse"
            label="Browse"
            icon={MagnifyingGlass}
            testId="nav-browse"
          />

          <NavItem
            to="/explore"
            label="Explore"
            icon={Compass}
            testId="nav-explore"
          />

          {user && (
            <NavItem
              to="/library"
              label="Library"
              icon={BookOpenText}
              testId="nav-library"
            />
          )}

          {user && (
            <NavItem
              to="/dashboard"
              label="Dashboard"
              icon={GraduationCap}
              testId="nav-dashboard"
            />
          )}

          {user && (
            <Link
              to="/upload"
              data-testid="nav-upload"
              className="notezy-blue-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm uppercase"
            >
              <UploadSimple size={16} weight="bold" />
              Upload
            </Link>
          )}

          <DarkModeToggle />

          {!user ? (
            <Link
              to="/auth"
              data-testid="nav-login"
              className="notezy-yellow-btn px-4 py-2 rounded-md text-sm uppercase"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                to="/profile"
                data-testid="nav-profile"
                className="w-10 h-10 bg-[#FF6B9E] text-black border-2 border-black dark:border-white rounded-md flex items-center justify-center brutal-shadow-sm font-display"
              >
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || (
                  <User size={18} />
                )}
              </Link>

              <button
                data-testid="nav-logout"
                onClick={onLogout}
                className="notezy-icon-btn"
                title="Logout"
              >
                <SignOut size={18} weight="bold" />
              </button>
            </>
          )}
        </nav>

        <div className="ml-auto flex lg:hidden items-center gap-2">
          <DarkModeToggle />

          {user ? (
            <Link
              to="/profile"
              onClick={closeMenu}
              data-testid="nav-profile-mobile"
              className="notezy-icon-btn bg-[#FF6B9E] text-black"
              title="Profile"
            >
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || (
                <User size={18} weight="bold" />
              )}
            </Link>
          ) : (
            <Link
              to="/auth"
              onClick={closeMenu}
              data-testid="nav-login-mobile"
              className="notezy-icon-btn bg-[#F4FF47] text-black"
              title="Login"
            >
              <User size={18} weight="bold" />
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="notezy-icon-btn"
            aria-label="Open menu"
          >
            {menuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t-2 border-black dark:border-white bg-white dark:bg-[#111111] px-3 py-3">
          <div className="space-y-2">
            {user && (
              <NavItem
                to="/home"
                label="Home"
                icon={House}
                testId="mobile-nav-home"
                onClick={closeMenu}
              />
            )}

            <NavItem
              to="/browse"
              label="Browse"
              icon={MagnifyingGlass}
              testId="mobile-nav-browse"
              onClick={closeMenu}
            />

            <NavItem
              to="/explore"
              label="Explore"
              icon={Compass}
              testId="mobile-nav-explore"
              onClick={closeMenu}
            />

            {user && (
              <>
                <NavItem
                  to="/library"
                  label="Library"
                  icon={BookOpenText}
                  testId="mobile-nav-library"
                  onClick={closeMenu}
                />

                <NavItem
                  to="/dashboard"
                  label="Dashboard"
                  icon={GraduationCap}
                  testId="mobile-nav-dashboard"
                  onClick={closeMenu}
                />

                <Link
                  to="/upload"
                  onClick={closeMenu}
                  data-testid="mobile-nav-upload"
                  className="notezy-blue-btn flex items-center gap-3 px-3 py-2 rounded-md text-sm uppercase"
                >
                  <UploadSimple size={18} weight="bold" />
                  Upload
                </Link>

                <button
                  onClick={onLogout}
                  data-testid="mobile-nav-logout"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase border-2 border-black dark:border-white rounded-md bg-white dark:bg-[#1b1b1b] text-black dark:text-white"
                >
                  <SignOut size={18} weight="bold" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}