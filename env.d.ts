import type {Storefront} from '@shopify/hydrogen';

declare module '@shopify/remix-oxygen' {
  export interface AppLoadContext {
    env: Env;
    storefront: Storefront;
    waitUntil: (promise: Promise<unknown>) => void;
  }
}

interface Env {
  PUBLIC_STOREFRONT_API_TOKEN: string;
  PUBLIC_STORE_DOMAIN: string;
}

