import { MaintenanceSwitch } from '../components/MaintenanceSwitch';
import { PageHeader } from '../components/PageHeader';

export function MaintenancePage() {
  return (
    <>
      <PageHeader
        title="Manutenzione"
        description="Decide cosa vedono i visitatori del portfolio. Lo stato vale per tutti gli ambienti serviti da questa API."
      />
      <MaintenanceSwitch variant="full" />
    </>
  );
}
