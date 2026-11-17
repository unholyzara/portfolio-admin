import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFormPage } from '../../pages/ResourceFormPage';
import { RESOURCES } from '../../resources/definitions';

interface Call {
  method: string;
  url: string;
  body: any;
}

describe('quick create inside a form', () => {
  const calls: Call[] = [];
  let companies: any[];

  beforeEach(() => {
    calls.length = 0;
    companies = [{ uuid: 'c1', name: 'Acme', website: null }];
    document.cookie = 'csrftoken=tok';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit = {}) => {
        const method = init.method ?? 'GET';
        const body = init.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ method, url, body });
        if (url === '/api/work/company-staff/' && method === 'POST') {
          companies = [...companies, { uuid: 'c2', name: body.name, website: body.website }];
          return new Response(JSON.stringify({ name: body.name, website: body.website }), { status: 201 });
        }
        if (url === '/api/work/company-staff/') return new Response(JSON.stringify(companies), { status: 200 });
        if (url === '/api/work/skill-staff/') {
          return new Response(
            JSON.stringify([
              { uuid: 'k1', typology: 'technical', name_it: 'Backend' },
              { uuid: 'k2', typology: 'soft', name_it: 'Teamwork' },
            ]),
            { status: 200 },
          );
        }
        if (url === '/api/work/technology-staff/') return new Response('[]', { status: 200 });
        return new Response('{}', { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderForm = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <ResourceFormPage resource={RESOURCES.workExperience} mode="create" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('creates the related object in a drawer and selects it without submitting the outer form', async () => {
    const user = userEvent.setup();
    renderForm();

    await screen.findByRole('option', { name: 'Acme' });
    await user.click(screen.getByRole('button', { name: 'Nuova società' }));

    const drawer = await screen.findByRole('dialog');
    await user.type(within(drawer).getByLabelText(/Nome/), 'Globex');
    await user.click(within(drawer).getByRole('button', { name: 'Crea e seleziona' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const posts = calls.filter((call) => call.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toBe('/api/work/company-staff/');
    expect(posts[0].body).toEqual({ name: 'Globex', website: null });

    const select = screen.getByLabelText(/^Società/) as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe('c2'));
  });

  it('presets and hides the typology when creating a skill from the technical skills field', async () => {
    const user = userEvent.setup();
    renderForm();

    await screen.findByRole('button', { name: 'Backend' });
    expect(screen.queryByRole('button', { name: 'Teamwork' })).toBeInTheDocument();

    const group = screen.getByRole('group', { name: /Skills tecniche/ });
    const container = group.parentElement as HTMLElement;
    await user.click(within(container).getByRole('button', { name: 'Nuova skill' }));

    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).queryByLabelText(/Tipologia/)).not.toBeInTheDocument();
  });
});
