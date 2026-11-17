import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
	const { status, recheck } = useAuth();
	const location = useLocation();

	if (status === "checking") {
		return (
			<div className="screen-note" role="status">
				<p className="screen-note__title">Verifica della sessione</p>
			</div>
		);
	}

	if (status === "unreachable") {
		return (
			<div className="screen-note" role="alert">
				<p className="screen-note__title">API non raggiungibile</p>
				<p>
					Admin non riesce a contattare il container api. Controlla
					che sia avviato e riprova.
				</p>
				<button
					type="button"
					className="btn btn--primary"
					onClick={recheck}>
					Riprova
				</button>
			</div>
		);
	}

	if (status === "anonymous") {
		return (
			<Navigate to="/login" replace state={{ from: location.pathname }} />
		);
	}

	return <>{children}</>;
}
