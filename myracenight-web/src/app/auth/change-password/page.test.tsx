import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangePasswordPage from './page';
import { useAuth } from '@/lib/auth';

/**
 * Change-password page gate tests.
 *
 * The page adapts to the user's authMethod (EMAIL → password fields,
 * PHONE → 4-digit PIN fields) and to mustChangePassword (first login skips
 * the current-credential field; a voluntary change requires it). Requests
 * are asserted at the fetch boundary so the endpoint, method and payload
 * are what the real backend receives.
 */

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const fetchMock = vi.fn();

function okResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, message: 'Password updated successfully' }),
  };
}

function baseUser(overrides: Partial<any> = {}) {
  return {
    id: 'U1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '',
    role: 'PLAYER',
    authMethod: 'EMAIL',
    ageVerified: true,
    mustChangePassword: false,
    ...overrides,
  };
}

function renderPage(userOverrides: Partial<any> = {}) {
  useAuth.setState({
    user: baseUser(userOverrides) as any,
    isAuthenticated: true,
    isLoading: false,
  });
  return render(<ChangePasswordPage />);
}

function submitForm(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form')!);
}

function lastRequest() {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: url as string, init: init as RequestInit, body: JSON.parse(init!.body as string) };
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  pushMock.mockReset();
  replaceMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('field selection by authMethod', () => {
  it('EMAIL user sees password fields, no PIN fields', () => {
    renderPage({ authMethod: 'EMAIL', mustChangePassword: true });
    expect(screen.getByText('New password')).toBeInTheDocument();
    expect(screen.getByText('Confirm new password')).toBeInTheDocument();
    expect(screen.queryByText(/PIN/)).not.toBeInTheDocument();
  });

  it('PHONE user sees PIN fields, no password fields', () => {
    renderPage({ authMethod: 'PHONE', mustChangePassword: true });
    expect(screen.getByText('New PIN')).toBeInTheDocument();
    expect(screen.getByText('Confirm new PIN')).toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
  });

  it('voluntary visit shows the current-credential field; first login hides it', () => {
    renderPage({ authMethod: 'EMAIL', mustChangePassword: false });
    expect(screen.getByText('Current password')).toBeInTheDocument();
    cleanup();

    renderPage({ authMethod: 'PHONE', mustChangePassword: false });
    expect(screen.getByText('Current PIN')).toBeInTheDocument();
    cleanup();

    renderPage({ authMethod: 'EMAIL', mustChangePassword: true });
    expect(screen.queryByText('Current password')).not.toBeInTheDocument();
  });
});

describe('client-side validation blocks bad input before any request', () => {
  it('rejects a PIN shorter than 4 digits', async () => {
    const { container } = renderPage({ authMethod: 'PHONE', mustChangePassword: true });
    const [newPin, confirmPin] = screen.getAllByPlaceholderText('••••');
    await userEvent.type(newPin, '123');
    await userEvent.type(confirmPin, '123');
    submitForm(container);

    expect(await screen.findByText('PIN must be exactly 4 digits.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('caps typed PIN input at 4 digits and strips non-digits', async () => {
    renderPage({ authMethod: 'PHONE', mustChangePassword: true });
    const [newPin] = screen.getAllByPlaceholderText('••••');
    await userEvent.type(newPin, '12a3456');
    expect((newPin as HTMLInputElement).value).toBe('1234');
  });

  it('rejects a mismatched confirmation', async () => {
    const { container } = renderPage({ authMethod: 'PHONE', mustChangePassword: true });
    const [newPin, confirmPin] = screen.getAllByPlaceholderText('••••');
    await userEvent.type(newPin, '1234');
    await userEvent.type(confirmPin, '4321');
    submitForm(container);

    expect(await screen.findByText('PINs do not match.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched password confirmation', async () => {
    const { container } = renderPage({ authMethod: 'EMAIL', mustChangePassword: true });
    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPassword, 'password-one');
    await userEvent.type(confirmPassword, 'password-two');
    submitForm(container);

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('request shape', () => {
  it('first login sends only the new credential to POST /api/auth/change-password', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const { container } = renderPage({ authMethod: 'PHONE', mustChangePassword: true });
    const [newPin, confirmPin] = screen.getAllByPlaceholderText('••••');
    await userEvent.type(newPin, '1234');
    await userEvent.type(confirmPin, '1234');
    submitForm(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const { url, init, body } = lastRequest();
    expect(url.endsWith('/api/auth/change-password')).toBe(true);
    expect(init.method).toBe('POST');
    expect(body).toEqual({ newPin: '1234' });
    expect(body).not.toHaveProperty('currentPin');
    expect(body).not.toHaveProperty('currentPassword');
  });

  it('voluntary change sends the current credential', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const { container } = renderPage({ authMethod: 'EMAIL', mustChangePassword: false });
    const [current, newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(current, 'old-password');
    await userEvent.type(newPassword, 'new-password');
    await userEvent.type(confirmPassword, 'new-password');
    submitForm(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const { url, init, body } = lastRequest();
    expect(url.endsWith('/api/auth/change-password')).toBe(true);
    expect(init.method).toBe('POST');
    expect(body).toEqual({ currentPassword: 'old-password', newPassword: 'new-password' });
  });

  it('voluntary PHONE change sends currentPin', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const { container } = renderPage({ authMethod: 'PHONE', mustChangePassword: false });
    const [current, newPin, confirmPin] = screen.getAllByPlaceholderText('••••');
    await userEvent.type(current, '1111');
    await userEvent.type(newPin, '4321');
    await userEvent.type(confirmPin, '4321');
    submitForm(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const { body } = lastRequest();
    expect(body).toEqual({ currentPin: '1111', newPin: '4321' });
  });

  it('missing current credential on a voluntary change is blocked before submit', async () => {
    const { container } = renderPage({ authMethod: 'EMAIL', mustChangePassword: false });
    const [, newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPassword, 'new-password');
    await userEvent.type(confirmPassword, 'new-password');
    submitForm(container);

    expect(await screen.findByText('Enter your current password.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('outcomes', () => {
  it('redirects after a successful change', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const { container } = renderPage({ authMethod: 'EMAIL', mustChangePassword: true });
    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPassword, 'new-password');
    await userEvent.type(confirmPassword, 'new-password');
    submitForm(container);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard/player'));
  });

  it('surfaces a backend error and does not redirect', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Current password is incorrect' }),
    });
    const { container } = renderPage({ authMethod: 'EMAIL', mustChangePassword: false });
    const [current, newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(current, 'wrong-password');
    await userEvent.type(newPassword, 'new-password');
    await userEvent.type(confirmPassword, 'new-password');
    submitForm(container);

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('unauthenticated visitors are sent to /auth/login', () => {
    useAuth.setState({ user: null, isAuthenticated: false, isLoading: false });
    render(<ChangePasswordPage />);
    expect(replaceMock).toHaveBeenCalledWith('/auth/login');
  });
});
