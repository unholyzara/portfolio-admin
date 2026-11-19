import { useRoutes, type RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResourceFormPage } from './pages/ResourceFormPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { SingletonPage } from './pages/SingletonPage';
import { WorkExperienceFormPage } from './pages/WorkExperienceFormPage';
import { COLLECTIONS, RESOURCES } from './resources/definitions';

const collectionRoutes: RouteObject[] = COLLECTIONS.filter(
  (resource) => resource.key !== 'workExperience',
).flatMap((resource) => [
  { path: resource.path, element: <ResourceListPage resource={resource} /> },
  { path: `${resource.path}/new`, element: <ResourceFormPage resource={resource} mode="create" /> },
  { path: `${resource.path}/:uuid`, element: <ResourceFormPage resource={resource} mode="edit" /> },
]);

const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: RESOURCES.personalInfo.path, element: <SingletonPage resource={RESOURCES.personalInfo} /> },
      ...collectionRoutes,
      { path: RESOURCES.workExperience.path, element: <ResourceListPage resource={RESOURCES.workExperience} /> },
      { path: `${RESOURCES.workExperience.path}/new`, element: <WorkExperienceFormPage mode="create" /> },
      { path: `${RESOURCES.workExperience.path}/:uuid`, element: <WorkExperienceFormPage mode="edit" /> },
      { path: 'impostazioni/manutenzione', element: <MaintenancePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function App() {
  return useRoutes(routes);
}
