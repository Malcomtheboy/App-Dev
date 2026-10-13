"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./api";

type ApiState<T> = { path: string | null; data: T | null; error: string | null; updatedAt: number | null };

function now() {
  return Date.now();
}

// Fetches a Rihla API path, optionally re-fetching on an interval. Data from a
// previous path is never returned for a new one, so switching pages can't
// flash the wrong content.
export function useApi<T>(path: string | null, refreshMs?: number) {
  const [state, setState] = useState<ApiState<T>>({ path: null, data: null, error: null, updatedAt: null });

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();

    async function load() {
      try {
        const data = await apiGet<T>(path!, controller.signal);
        setState({ path, data, error: null, updatedAt: now() });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Request failed";
        setState((previous) => ({ ...previous, path, error: message }));
      }
    }

    void load();
    const timer = refreshMs ? setInterval(load, refreshMs) : null;
    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [path, refreshMs]);

  const current = state.path === path;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    updatedAt: current ? state.updatedAt : null,
    loading: !!path && (!current || (state.data === null && state.error === null)),
  };
}

// A clock that ticks, for "updated 4s ago" style labels.
export function useNow(intervalMs = 1000) {
  const [value, setValue] = useState(now);
  useEffect(() => {
    const timer = setInterval(() => setValue(now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return value;
}
