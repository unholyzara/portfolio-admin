import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="shell">
      <Navbar navOpen={navOpen} onToggleNav={() => setNavOpen((value) => !value)} />
      <Sidebar open={navOpen} />
      {navOpen && <div className="shell__scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <main className="shell__main" id="main">
        <Outlet />
      </main>
    </div>
  );
}
