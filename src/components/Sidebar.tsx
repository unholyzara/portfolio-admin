import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV } from './navigation';

const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav__link is-active' : 'nav__link');

const owningGroups = (pathname: string) =>
  NAV.filter((item) => item.children?.some((child) => pathname.startsWith(child.to))).map((item) => item.label);

export function Sidebar({ open }: { open: boolean }) {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(owningGroups(pathname)));

  useEffect(() => {
    const groups = owningGroups(pathname);
    if (groups.length) {
      setExpanded((current) => new Set([...current, ...groups]));
    }
  }, [pathname]);

  const toggle = (label: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    <nav id="main-navigation" className={open ? "sidebar is-open" : "sidebar"} aria-label="Navigazione principale">
      <ul className="nav">
        {NAV.map((item) => {
          if (!item.children) {
            return (
              <li key={item.label} className="nav__item">
                <NavLink to={item.to!} className={(state) => `nav__top ${linkClass(state)}`}>
                  {item.label}
                </NavLink>
              </li>
            );
          }
          const isOpen = expanded.has(item.label);
          const panelId = `nav-${item.label}`;
          return (
            <li key={item.label} className="nav__item">
              <button
                type="button"
                className="nav__group"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.label)}
              >
                <span>{item.label}</span>
                <span className="nav__sign" aria-hidden="true" />
              </button>
              <ul id={panelId} className="nav__sub" hidden={!isOpen}>
                {item.children.map((child) => (
                  <li key={child.to}>
                    <NavLink to={child.to} className={linkClass}>
                      {child.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
