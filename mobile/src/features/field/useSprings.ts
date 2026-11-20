// mobile/src/features/field/useSprings.ts
// Public spring list with a static fallback so the showcase works with no login and no network.

import { useEffect, useState } from 'react';
import { useApi } from '../../auth/AuthProvider';
import { SpringPublic } from '../../api/types';
import { BASELINE_SPRINGS } from '../../demo/demoStore';

export function useSprings() {
  const api = useApi();
  const [springs, setSprings] = useState<SpringPublic[]>(BASELINE_SPRINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listSprings()
      .then((r) => alive && r?.springs?.length && setSprings(r.springs))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [api]);

  return { springs, loading };
}
