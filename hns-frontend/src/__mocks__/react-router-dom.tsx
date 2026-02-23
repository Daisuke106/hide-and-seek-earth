import React from 'react';

export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const Route = ({ element }: { element: React.ReactNode }) => <>{element}</>;

export const Link = ({ children, to, ...props }: any) => (
  <a href={to} {...props}>{children}</a>
);

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const MemoryRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const useNavigate = () => jest.fn();

export const useLocation = () => ({ pathname: '/', search: '', hash: '', state: null });

export const useParams = () => ({});
