import React, { useCallback, useEffect, useReducer, useRef } from 'react';

// Memory only: never persist account or patient data to browser storage.
const cache = new Map();
const MAX_ENTRIES = 100;
const MAX_AGE = 5 * 60 * 1000;
const FOCUS_INTERVAL = 15000;
let session = '';
const currentSession = () => JSON.stringify([localStorage.getItem('token'), localStorage.getItem('adminToken'), localStorage.getItem('role')]);
export const clearQueryCache = () => {
  cache.clear();
  session = currentSession();
};
export function useCachedQuery(queryKey, loader, {
  enabled = true,
  refreshOnFocus = true
} = {}) {
  const identity = currentSession();
  if (identity !== session) {
    cache.clear();
    session = identity;
  }
  const key = JSON.stringify([identity, queryKey]);
  let entry = cache.get(key);
  if (!entry || !entry.listeners.size && Date.now() - entry.touched > MAX_AGE) {
    entry = {
      data: undefined,
      error: null,
      promise: null,
      listeners: new Set(),
      touched: Date.now(),
      attempted: 0,
      version: 0
    };
    cache.set(key, entry);
    for (const [oldKey, oldEntry] of cache) {
      if (cache.size <= MAX_ENTRIES) break;
      if (oldKey !== key && !oldEntry.listeners.size && !oldEntry.promise) cache.delete(oldKey);
    }
  }
  entry.touched = Date.now();
  const focusRef = useRef(refreshOnFocus);
  focusRef.current = refreshOnFocus;
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [, render] = useReducer(value => value + 1, 0);
  const refresh = useCallback(() => {
    if (!enabled || currentSession() !== identity) return Promise.resolve();
    if (entry.promise) return entry.promise;
    const version = entry.version;
    entry.attempted = Date.now();
    const load = loaderRef.current;
    entry.promise = Promise.resolve().then(load).then(data => {
      if (currentSession() === identity && version === entry.version) {
        entry.data = data;
        entry.error = null;
      }
    }).catch(error => {
      if (currentSession() === identity && version === entry.version) {
        entry.error = error;
        // Revoked access must not leave previously authorized data visible.
        if ([401, 403].includes(error.status || error.response?.status)) entry.data = undefined;
      }
    }).finally(() => {
      entry.promise = null;
      entry.touched = Date.now();
      entry.listeners.forEach(notify => notify());
    });
    entry.listeners.forEach(notify => notify());
    return entry.promise;
  }, [enabled, entry, identity]);
  useEffect(() => {
    entry.listeners.add(render);
    refresh();
    const onFocus = () => {
      if (focusRef.current && document.visibilityState !== 'hidden' && Date.now() - entry.attempted >= FOCUS_INTERVAL) refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      entry.listeners.delete(render);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [entry, refresh]);
  const setData = useCallback(value => {
    if (currentSession() !== identity) return;
    entry.version += 1;
    entry.data = typeof value === 'function' ? value(entry.data) : value;
    entry.listeners.forEach(notify => notify());
  }, [entry, identity]);
  return {
    data: entry.data,
    loading: enabled && entry.data === undefined && !entry.error,
    error: entry.error,
    refresh,
    setData
  };
}
export async function queryFetch(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (response.ok === false || data.success === false) {
    const error = new Error(data.message || 'Unable to refresh data. Please try again.');
    error.status = response.status;
    throw error;
  }
  return {
    ...response,
    json: async () => data
  };
}
export function QueryNotice({
  error,
  refresh,
  hasData
}) {
  if (!error) return null;
  return <div role="status" style={{
    padding: '12px 20px',
    background: '#fff4df',
    color: '#654600'
  }}>
    {hasData ? 'Could not refresh. Showing previously loaded data.' : 'Could not load data.'}
    {' '}<button type="button" onClick={refresh}>Retry</button>
  </div>;
}
