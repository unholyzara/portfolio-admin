import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MaintenanceSwitch } from "./MaintenanceSwitch";

interface Props {
	navOpen: boolean;
	onToggleNav: () => void;
}

export function Navbar({ navOpen, onToggleNav }: Props) {
	const { email, logout } = useAuth();
	const { pathname } = useLocation();
	const [expanded, setExpanded] = useState(false);
	const environment = import.meta.env.VITE_ENV_LABEL;

	useEffect(() => {
		setExpanded(false);
	}, [pathname]);

	const toggleMenu = () => {
		if (expanded) setExpanded(false);
		onToggleNav();
	};

	const toggleActions = () => {
		if (!expanded && navOpen) onToggleNav();
		setExpanded((value) => !value);
	};

	return (
		<header className={expanded ? "navbar is-expanded" : "navbar"}>
			<div className="navbar__bar">
				<button
					type="button"
					className="btn btn--small navbar__menu"
					aria-expanded={navOpen}
					aria-controls="main-navigation"
					onClick={toggleMenu}>
					Menu
				</button>
				{environment && (
					<span className="navbar__env">{environment}</span>
				)}
				<Link to="/" className="navbar__brand">
					<span className="navbar__name">admin.unholyzara.dev</span>
				</Link>
				<div className="navbar__spacer" />
				<button
					type="button"
					className="btn btn--small navbar__toggle"
					aria-expanded={expanded}
					aria-controls="navbar-actions"
					onClick={toggleActions}>
					Opzioni
				</button>
			</div>
			<div id="navbar-actions" className="navbar__actions">
				<MaintenanceSwitch />
				{email && (
					<span className="navbar__user" title={email}>
						{email}
					</span>
				)}
				<button
					type="button"
					className="btn btn--small"
					onClick={() => void logout()}>
					Esci
				</button>
			</div>
		</header>
	);
}
