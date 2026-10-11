import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationSwitcher from '@/components/LocationSwitcher';

function setCookie(value: string) {
  document.cookie = `panel_location=${value}`;
}

beforeEach(() => {
  document.cookie = 'panel_location=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('LocationSwitcher', () => {
  it('renders both location buttons', () => {
    render(<LocationSwitcher />);
    expect(screen.getByRole('button', { name: 'Guacuco' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'La Marina' })).toBeInTheDocument();
  });

  it('defaults to Guacuco as active when no cookie is set', () => {
    render(<LocationSwitcher />);
    expect(screen.getByRole('button', { name: 'Guacuco' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reflects an existing la_marina cookie as active', () => {
    setCookie('la_marina');
    render(<LocationSwitcher />);
    expect(screen.getByRole('button', { name: 'La Marina' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('writes the cookie and reloads when a location is clicked', () => {
    // jsdom's Location object is non-configurable in the installed jsdom version, so
    // window.location.reload cannot be replaced with a jest.fn(). Calling the real
    // (stub) reload() routes through jsdom's "not implemented: navigation" jsdomError,
    // which is forwarded to console.error — used here as the observable proxy that
    // reload() was actually invoked.
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<LocationSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'La Marina' }));
    expect(document.cookie).toContain('panel_location=la_marina');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'not implemented' })
    );
    consoleErrorSpy.mockRestore();
  });

  it('renders nothing when collapsed', () => {
    render(<LocationSwitcher collapsed />);
    expect(screen.queryByRole('button', { name: 'Guacuco' })).not.toBeInTheDocument();
  });
});
