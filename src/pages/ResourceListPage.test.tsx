import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ResourceListPage } from './ResourceListPage';
import { RESOURCES } from '../resources/definitions';

describe('WorkResponsibility list', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the nested work experience and localized responsibility description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify([
        {
          uuid: 'responsibility-1',
          active: true,
          work_experience: {
            uuid: 'experience-1',
            active: true,
            title_it: 'Web Developer / IT Manager',
            title_en: 'Web Developer / IT Manager',
            company: { uuid: 'company-1', name: 'MADE SRL', website: null },
          },
          description: 'Design of solutions and web applications.',
          order: 1,
        },
      ]), { status: 200 })),
    );

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <ResourceListPage resource={RESOURCES.workResponsibility} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Design of solutions and web applications.')).toBeInTheDocument();
    expect(screen.getByText('Web Developer / IT Manager (MADE SRL)')).toBeInTheDocument();
  });
});
