import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { clearQueryCache, useCachedQuery } from './useCachedQuery';

const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function Page({ name = 'cases', load, focus = true }) {
  const query = useCachedQuery([name], load, { refreshOnFocus: focus });
  return <><span>{query.loading ? 'Loading' : query.data || 'Empty'}</span>{query.error && <span>Refresh failed</span>}<button onClick={query.refresh}>Refresh</button><button onClick={() => query.setData('Saved')}>Save</button></>;
}
beforeEach(() => { localStorage.clear(); clearQueryCache(); });

test('remount shows cached records immediately and refreshes silently', async () => {
  const next = deferred();
  const load = jest.fn().mockResolvedValueOnce('Existing records').mockReturnValueOnce(next.promise);
  const first = render(<Page load={load} />);
  await screen.findByText('Existing records');
  first.unmount();
  render(<Page load={load} />);
  expect(screen.getByText('Existing records')).toBeInTheDocument();
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  await act(async () => next.resolve('New records'));
  expect(screen.getByText('New records')).toBeInTheDocument();
});

test('failed background refresh preserves records and allows retry', async () => {
  const load = jest.fn().mockResolvedValueOnce('Existing records').mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce('Updated');
  render(<Page load={load} />);
  await screen.findByText('Existing records');
  fireEvent.click(screen.getByText('Refresh'));
  await screen.findByText('Refresh failed');
  expect(screen.getByText('Existing records')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Refresh'));
  await screen.findByText('Updated');
  expect(screen.queryByText('Refresh failed')).not.toBeInTheDocument();
});

test('filter changes isolate records and ignore late responses for the previous filter', async () => {
  const old = deferred();
  const page = render(<Page name="old" load={() => old.promise} />);
  await act(async () => {});
  page.rerender(<Page name="new" load={() => Promise.resolve('New filter')} />);
  await screen.findByText('New filter');
  await act(async () => old.resolve('Old filter'));
  expect(screen.queryByText('Old filter')).not.toBeInTheDocument();
});

test('account changes cannot reuse cached data or an in-flight response', async () => {
  localStorage.setItem('token', 'account-a');
  const old = deferred();
  const page = render(<Page load={() => old.promise} />);
  await act(async () => {});
  localStorage.setItem('token', 'account-b');
  page.rerender(<Page load={() => Promise.resolve('Account B')} />);
  await screen.findByText('Account B');
  await act(async () => old.resolve('Account A'));
  expect(screen.queryByText('Account A')).not.toBeInTheDocument();
});

test('concurrent subscribers share one request', async () => {
  const next = deferred(); const load = jest.fn(() => next.promise);
  render(<><Page load={load} /><Page load={load} /></>);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  await act(async () => next.resolve('Shared'));
  expect(screen.getAllByText('Shared')).toHaveLength(2);
});

test('focus refresh is throttled and retains data', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(100000);
  const next = deferred(); const load = jest.fn().mockResolvedValueOnce('Existing').mockReturnValueOnce(next.promise);
  render(<Page load={load} />);
  await screen.findByText('Existing');
  fireEvent.focus(window);
  expect(load).toHaveBeenCalledTimes(1);
  clock.mockReturnValue(116000);
  fireEvent.focus(window);
  fireEvent(document, new Event('visibilitychange'));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  expect(screen.getByText('Existing')).toBeInTheDocument();
  await act(async () => next.resolve('Updated'));
  clock.mockRestore();
});

test('an older refresh cannot overwrite a saved change', async () => {
  const next = deferred(); const load = jest.fn().mockResolvedValueOnce('Existing').mockReturnValueOnce(next.promise);
  render(<Page load={load} />);
  await screen.findByText('Existing');
  fireEvent.click(screen.getByText('Refresh'));
  fireEvent.click(screen.getByText('Save'));
  await act(async () => next.resolve('Old server result'));
  expect(screen.getByText('Saved')).toBeInTheDocument();
});

test('revoked access removes cached records', async () => {
  const load = jest.fn().mockResolvedValueOnce('Private records').mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }));
  render(<Page load={load} />);
  await screen.findByText('Private records');
  fireEvent.click(screen.getByText('Refresh'));
  await screen.findByText('Refresh failed');
  expect(screen.queryByText('Private records')).not.toBeInTheDocument();
});
