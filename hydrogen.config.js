/**
 * @type {import('@shopify/hydrogen').HydrogenConfig}
 */
export default {
  shopify: {
    storeDomain: process.env.PUBLIC_STORE_DOMAIN,
    storefrontToken: process.env.PUBLIC_STOREFRONT_API_TOKEN,
    storefrontApiVersion: '2024-10',
  },
  storefront: {
    defaultLanguageCode: 'EN',
    defaultCountryCode: 'US',
  },
};
