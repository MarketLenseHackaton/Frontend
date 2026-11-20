import { useCallback, useEffect, useRef, useState } from "react";
import { friendlyError } from "../api/client";

/**
 * Load data from one api.* call.
 *   const { data, loading, error, reload, setData } = useApi(() => api.places(), []);
 * Ignores answers from older calls if a newer one has started.
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const callId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async ({ quiet = false } = {}) => {
    const id = ++callId.current;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await fnRef.current();
      if (id === callId.current) setState({ data, loading: false, error: "" });
      return data;
    } catch (e) {
      if (id === callId.current) setState((s) => ({ ...s, loading: false, error: friendlyError(e) }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, setData };
}
