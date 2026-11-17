import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar open />
    </MemoryRouter>,
  );

describe('Sidebar', () => {
  it('lists the top level entries in the requested order', () => {
    renderAt('/');
    const labels = [...document.querySelectorAll('.nav__group, .nav__top')].map((node) => node.textContent);
    expect(labels).toEqual(['Persona', 'Education', 'Work', 'Progetti', 'Impostazioni']);
  });

  it('keeps submenus collapsed until opened', async () => {
    renderAt('/');
    const persona = screen.getByRole('button', { name: 'Persona' });
    expect(persona).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Overview' })).not.toBeInTheDocument();
    await userEvent.click(persona);
    expect(persona).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Informazioni Personali' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Overview' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Lingue Parlate' })).toBeVisible();
  });

  it('opens the group that owns the current route', () => {
    renderAt('/work/mansioni');
    expect(screen.getByRole('button', { name: 'Work' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Mansioni' })).toHaveClass('is-active');
  });
});
