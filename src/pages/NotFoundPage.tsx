import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function NotFoundPage() {
	return (
		<>
			<PageHeader
				title="Pagina non trovata"
				description="L'indirizzo non corrisponde a nessuna sezione di admin."
			/>
			<Link to="/" className="btn btn--primary">
				Torna ai contenuti
			</Link>
		</>
	);
}
