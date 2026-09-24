import '@testing-library/jest-dom';

import { clearQueryCache } from './hooks/useCachedQuery';

jest.mock('react-markdown', () => ({ children }) => <div>{children}</div>);
jest.mock('remark-gfm', () => () => {});
jest.mock('rehype-raw', () => () => {});

beforeEach(() => clearQueryCache());

