import { useState } from 'react';
import { useSiteSettings, useToggleMaintenance } from '../api/hooks';
import { ConfirmDialog } from './ConfirmDialog';

export function MaintenanceSwitch({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const { data: settings, isLoading, isError, refetch } = useSiteSettings();
  const toggle = useToggleMaintenance();
  const [confirming, setConfirming] = useState(false);

  if (isLoading) {
    return <span className="muted">Stato manutenzione in caricamento</span>;
  }

  if (isError || !settings) {
    return (
      <button type="button" className="btn btn--small" onClick={() => void refetch()}>
        Stato manutenzione non disponibile, riprova
      </button>
    );
  }

  const active = settings.maintenance === true;

  const apply = (maintenance: boolean) => {
    toggle.mutate({ uuid: settings.uuid, maintenance });
    setConfirming(false);
  };

  const onClick = () => (active ? apply(false) : setConfirming(true));

  const button = (
    <button
      type="button"
      className={active ? 'btn btn--danger' : 'btn'}
      onClick={onClick}
      disabled={toggle.isPending}
      aria-pressed={active}
    >
      {toggle.isPending ? 'Aggiornamento in corso' : active ? 'Riapri il portfolio' : 'Metti in manutenzione'}
    </button>
  );

  const dialog = confirming && (
    <ConfirmDialog
      title="Mettere il portfolio in manutenzione?"
      message="I visitatori vedranno la pagina di manutenzione finché non lo riapri. Tu continui a vedere il sito normalmente."
      confirmLabel="Attiva la manutenzione"
      onConfirm={() => apply(true)}
      onCancel={() => setConfirming(false)}
    />
  );

  if (variant === 'compact') {
    return (
      <>
        {active && <span className="maint-flag">In manutenzione</span>}
        {button}
        {dialog}
      </>
    );
  }

  return (
    <div className={active ? 'maint maint--on' : 'maint'}>
      <p className="maint__state">{active ? 'Il portfolio è in manutenzione' : 'Il portfolio è online'}</p>
      <p className="maint__text">
        {active
          ? 'I visitatori non loggati vedono la pagina di manutenzione. Gli utenti staff continuano a vedere il sito.'
          : 'Tutti i visitatori vedono il portfolio. Attiva la manutenzione prima di fare modifiche importanti.'}
      </p>
      {button}
      {toggle.isError && (
        <p className="notice notice--error" role="alert">
          Impossibile aggiornare lo stato. Riprova.
        </p>
      )}
      {dialog}
    </div>
  );
}
