import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => mockReact.Children.toArray(children).find((route) => route.props.path === '/login').props.element,
    Route: () => null,
    Navigate: () => null,
    NavLink: ({ children }) => mockReact.createElement('span', null, children),
    Link: ({ children }) => mockReact.createElement('span', null, children),
    useLocation: () => ({ state: null, pathname: '/login' }),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
  };
}, { virtual: true });
import App from './App';

test('renders the dedicated admin login', async () => {
  localStorage.clear();
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'DLabMate Admin' })).toBeInTheDocument();
});
