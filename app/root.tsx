import {
  Links,
  Meta,
  Outlet,
  Scripts,
  LiveReload,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';

import styles from './styles/app.css?url';

export const links = () => {
  return [{rel: 'stylesheet', href: styles}];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <html>
        <head>
          <title>Error</title>
          <Meta />
          <Links />
        </head>
        <body>
          <h1>{error.status} {error.statusText}</h1>
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html>
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Error</h1>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Scripts />
      </body>
    </html>
  );
}

