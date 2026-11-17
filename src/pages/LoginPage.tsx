import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
	const { status, login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const from = (location.state as { from?: string } | null)?.from ?? "/";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	if (status === "authenticated") {
		return <Navigate to={from} replace />;
	}

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setError(null);
		setBusy(true);
		try {
			await login(email.trim(), password);
			navigate(from, { replace: true });
		} catch (caught) {
			const rejected =
				caught instanceof ApiError &&
				[400, 401, 403].includes(caught.status);
			setError(
				rejected
					? "Email o password non corrette."
					: "Impossibile contattare il server. Controlla la connessione e riprova.",
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="login">
			<div className="login__lead">
				<p className="login__site">unholyzara.dev</p>
				<h1 className="login__title">Back office</h1>
			</div>
			<form
				className="login__panel"
				onSubmit={(event) => void onSubmit(event)}>
				<h2 className="login__heading">Accedi</h2>
				<div className="login__field">
					<label htmlFor="login-email" className="login__label">
						Email
					</label>
					<input
						id="login-email"
						className="input"
						type="email"
						autoComplete="username"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</div>
				<div className="login__field">
					<label htmlFor="login-password" className="login__label">
						Password
					</label>
					<input
						id="login-password"
						className="input"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</div>
				{error && (
					<p className="notice notice--error" role="alert">
						{error}
					</p>
				)}
				<button
					type="submit"
					className="btn btn--primary login__submit"
					disabled={busy}>
					{busy ? "Accesso in corso" : "Entra in admin"}
				</button>
			</form>
		</div>
	);
}
