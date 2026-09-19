import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { FiClock, FiFilePlus, FiLogIn, FiLogOut, FiMenu, FiTrash2, FiUserPlus, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Head = () => {
  const { user, logOut } = useAuth();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    menuRef.current?.querySelector("a, button")?.focus();
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menu]);

  const itemClass = (path) => `flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors ${
    pathname === path
      ? "bg-[#c9ff4a] text-[#10120d]"
      : "text-[#c6ccc1] hover:bg-white/[.055] hover:text-white"
  }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0b0a]/88 backdrop-blur-xl">
      <nav className="relative flex h-[62px] items-center justify-between px-[22px]" aria-label="Primary navigation">
        <Link to="/" onClick={() => setMenu(false)} className="group flex items-center gap-3" aria-label="SmartApply home">
          <span className="grid h-8 w-8 place-items-center rounded-[4px] bg-[#c9ff4a] text-[12px] font-black tracking-[-.08em] text-[#10120d] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">SA</span>
          <span>
            <span className="block text-[15px] font-semibold leading-none tracking-[-.035em] text-[#f5f7f1]">SmartApply</span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.14em] text-[#687066]">Career intelligence</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMenu((open) => !open)}
          className="icon-btn h-9 w-9 flex-[0_0_36px]"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          aria-controls="extension-menu"
        >
          {menu ? <FiX size={17} /> : <FiMenu size={17} />}
        </button>

        {menu && (
          <div id="extension-menu" ref={menuRef} className="absolute right-[14px] top-[54px] z-50 w-[244px] overflow-hidden rounded-[8px] border border-white/10 bg-[#151715] shadow-2xl shadow-black/60">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#71786e]">Current workspace</p>
              <p className="mt-1 truncate text-xs text-[#eef1ea]">{user?.email || "Guest session"}</p>
            </div>
            <Link to="/add-details" onClick={() => setMenu(false)} className={itemClass("/add-details")}><FiFilePlus size={16} /> Resume setup</Link>
            <Link to="/history" onClick={() => setMenu(false)} className={itemClass("/history")}><FiClock size={16} /> Scan history</Link>
            <div className="h-px bg-white/10" />
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMenu(false)} className={itemClass("/login")}><FiLogIn size={16} /> Sign in</Link>
                <Link to="/signup" onClick={() => setMenu(false)} className={itemClass("/signup")}><FiUserPlus size={16} /> Create account</Link>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setMenu(false); logOut(); }} className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-[#c6ccc1] transition-colors hover:bg-white/[.055] hover:text-white"><FiLogOut size={16} /> Sign out</button>
                <Link to="/delete-account" onClick={() => setMenu(false)} className="flex min-h-11 items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#ff9e99] transition-colors hover:bg-[#ff706a]/10 hover:text-white"><FiTrash2 size={16} /> Delete account</Link>
              </>
            )}
          </div>
        )}
      </nav>
      {menu && <button type="button" className="fixed inset-0 top-[62px] z-40 cursor-default bg-black/45" onClick={() => setMenu(false)} aria-label="Close menu" />}
    </header>
  );
};

export default Head;
