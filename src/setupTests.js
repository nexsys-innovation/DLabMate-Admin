import '@testing-library/jest-dom';

import { clearQueryCache } from './hooks/useCachedQuery';
beforeEach(() => clearQueryCache());
