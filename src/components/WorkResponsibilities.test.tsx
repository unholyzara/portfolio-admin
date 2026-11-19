import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkResponsibilities } from './WorkResponsibilities';

const experienceUuid = 'experience-1';
const endpoint = '/api/work/work-responsibility-staff/';

interface Responsibility {
  uuid: string;
  active: boolean;
  work_experience: string;
  description_it: string;
  description_en: string | null;
  order: number;
}

describe('WorkResponsibilities', () => {
  let items: Responsibility[];
  let calls: Array<{ method: string; url: string; body?: Record<string, unknown> }>;

  beforeEach(() => {
    items = [{
      uuid: 'responsibility-1',
      active: true,
      work_experience: experienceUuid,
      description_it: 'Prima responsabilità',
      description_en: null,
      order: 0,
    }];
    calls = [];
    document.cookie = 'csrftoken=test-token';
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = new URL(String(input), 'http://localhost');
      const method = init.method ?? 'GET';
      const body = init.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
      calls.push({ method, url: `${url.pathname}${url.search}`, body });

      if (url.pathname === endpoint && method === 'GET') {
        return new Response(JSON.stringify(items), { status: 200 });
      }
      if (url.pathname === endpoint && method === 'POST' && body) {
        const created = { ...body, uuid: 'responsibility-2' } as Responsibility;
        items = [...items, created];
        return new Response(JSON.stringify(created), { status: 201 });
      }
      if (url.pathname.startsWith(endpoint) && method === 'DELETE') {
        items = items.filter((item) => item.uuid !== url.pathname.slice(endpoint.length, -1));
        return new Response(null, { status: 204 });
      }
      return new Response('{}', { status: 200 });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderPanel = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <WorkResponsibilities workExperienceUuid={experienceUuid} />
      </QueryClientProvider>,
    );

  it('creates a translated responsibility for the current experience', async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText('Prima responsabilità');
    await user.type(screen.getByLabelText('Italiano'), 'Nuova attività');
    await user.type(screen.getByLabelText('Inglese'), 'New responsibility');
    await user.click(screen.getByRole('button', { name: 'Aggiungi mansione' }));

    await screen.findByText('Nuova attività');
    expect(calls.find((call) => call.method === 'POST')).toMatchObject({
      url: endpoint,
      body: {
        active: true,
        work_experience: experienceUuid,
        description_it: 'Nuova attività',
        description_en: 'New responsibility',
        order: 1,
      },
    });
  });

  it('deletes a responsibility only after confirmation', async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText('Prima responsabilità');
    await user.click(screen.getByRole('button', { name: 'Rimuovi' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('La mansione verrà eliminata definitivamente.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);

    await user.click(within(dialog).getByRole('button', { name: 'Elimina' }));

    await waitFor(() => expect(calls.some((call) => call.method === 'DELETE')).toBe(true));
    await waitFor(() => expect(screen.queryByText('Prima responsabilità')).not.toBeInTheDocument());
  });
});
