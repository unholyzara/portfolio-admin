import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { WorkExperienceFormPage } from './WorkExperienceFormPage';

const experienceEndpoint = '/api/work/work-experience-staff/';
const responsibilityEndpoint = '/api/work/work-responsibility-staff/';

describe('WorkExperienceFormPage', () => {
  const calls: Array<{ method: string; url: string; body?: Record<string, unknown> }> = [];
  let responsibilities: Array<Record<string, unknown>>;
  let includeExperienceUuid: boolean;

  beforeEach(() => {
    calls.length = 0;
    responsibilities = [];
    includeExperienceUuid = true;
    document.cookie = 'csrftoken=test-token';
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = new URL(String(input), 'http://localhost');
      const method = init.method ?? 'GET';
      const body = init.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
      calls.push({ method, url: url.pathname, body });

      if (url.pathname === experienceEndpoint && method === 'POST' && body) {
        const created = {
          ...body,
          company: null,
          technical_skills: [],
          soft_skills: [],
          technologies: [],
        };
        if (includeExperienceUuid) Object.assign(created, { uuid: 'experience-1' });
        return new Response(JSON.stringify(created), { status: 201 });
      }
      if (url.pathname === responsibilityEndpoint && method === 'POST' && body) {
        responsibilities.push({ uuid: `responsibility-${responsibilities.length + 1}`, ...body });
        return new Response(JSON.stringify(responsibilities.at(-1)), { status: 201 });
      }
      if (url.pathname === responsibilityEndpoint && method === 'GET') {
        return new Response(JSON.stringify(responsibilities), { status: 200 });
      }
      if (url.pathname === experienceEndpoint && method === 'GET') {
        return new Response('[]', { status: 200 });
      }
      if (url.pathname.startsWith(experienceEndpoint) && method === 'GET') {
        return new Response(JSON.stringify({
          uuid: 'experience-1',
          title_it: 'Engineer',
          company: null,
          technical_skills: [],
          soft_skills: [],
          technologies: [],
        }), { status: 200 });
      }
      if (method === 'GET') return new Response('[]', { status: 200 });
      return new Response('{}', { status: 200 });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates draft responsibilities after saving and linking the experience', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/work/esperienze-lavorative/new']}>
          <Routes>
            <Route path="/work/esperienze-lavorative/new" element={<WorkExperienceFormPage mode="create" />} />
            <Route path="/work/esperienze-lavorative/:uuid" element={<p>Esperienza salvata</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByLabelText(/Data di inizio/);
    await user.type(document.querySelector('#field-title_it') as HTMLInputElement, 'Engineer');
    await user.type(screen.getByLabelText(/Data di inizio/), '01/2020');
    await user.type(document.querySelector('#new-responsibility-it') as HTMLTextAreaElement, 'Sviluppo prodotto');
    await user.type(document.querySelector('#new-responsibility-en') as HTMLTextAreaElement, 'Product development');
    await user.click(screen.getByRole('button', { name: 'Aggiungi alla WorkExperience' }));
    const responsibilitySection = screen.getByRole('region', { name: 'Mansioni' });
    const footer = screen.getByRole('button', { name: 'Crea' }).closest('.form__footer');
    expect(footer).not.toBeNull();
    expect(responsibilitySection.compareDocumentPosition(footer!) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Crea' }));

    await screen.findByText('Esperienza salvata');
    await waitFor(() => expect(responsibilities).toHaveLength(1));
    const posts = calls.filter((call) => call.method === 'POST');
    expect(posts.map((call) => call.url)).toEqual([experienceEndpoint, responsibilityEndpoint]);
    expect(posts[1].body).toMatchObject({
      active: true,
      work_experience: 'experience-1',
      description_it: 'Sviluppo prodotto',
      description_en: 'Product development',
      order: 0,
    });
  });

  it('keeps unsent responsibility drafts and prevents a duplicate create when no UUID is returned', async () => {
    includeExperienceUuid = false;
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/work/esperienze-lavorative/new']}>
          <Routes>
            <Route path="/work/esperienze-lavorative/new" element={<WorkExperienceFormPage mode="create" />} />
            <Route path="/work/esperienze-lavorative/:uuid" element={<p>Esperienza salvata</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByLabelText(/Data di inizio/);
    await user.type(document.querySelector('#field-title_it') as HTMLInputElement, 'Engineer');
    await user.type(screen.getByLabelText(/Data di inizio/), '01/2020');
    await user.type(document.querySelector('#new-responsibility-it') as HTMLTextAreaElement, 'Bozza da conservare');
    await user.click(screen.getByRole('button', { name: 'Aggiungi alla WorkExperience' }));
    await user.click(screen.getByRole('button', { name: 'Crea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/non è stato possibile recuperarne l'identificativo/i);
    expect(screen.getByText('Bozza da conservare')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crea' })).not.toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'POST').map((call) => call.url))
      .toEqual([experienceEndpoint]);
  });

  it('resets failed responsibility drafts when navigating between experience UUIDs', async () => {
    const draft = {
      id: 'draft-1',
      description_it: 'Mansione da ritentare',
      description_en: '',
    };
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter
          initialEntries={[{
            pathname: '/work/esperienze-lavorative/experience-1',
            state: { failedResponsibilityDrafts: [draft] },
          }]}
        >
          <Routes>
            <Route
              path="/work/esperienze-lavorative/:uuid"
              element={
                <>
                  <WorkExperienceFormPage mode="edit" />
                  <Link to="/work/esperienze-lavorative/experience-2">Vai alla seconda esperienza</Link>
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Mansione da ritentare')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Vai alla seconda esperienza' }));

    await waitFor(() => expect(screen.queryByText('Mansione da ritentare')).not.toBeInTheDocument());
  });
});
