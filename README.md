# noLuckyDays

A minimal Hydrogen e-commerce site built with Shopify Hydrogen and Oxygen.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the root directory (or use the Shopify CLI):
   
   ```env
   PUBLIC_STOREFRONT_API_TOKEN=your_storefront_api_token_here
   PUBLIC_STORE_DOMAIN=your-store.myshopify.com
   ```

   To get your Storefront API credentials:
   - Go to your Shopify Admin
   - Navigate to Settings > Apps and sales channels
   - Click "Develop apps" > "Create an app"
   - Configure Storefront API scopes
   - Install the app and copy your Storefront API access token

3. **Update product handle:**
   
   In `app/routes/_index.tsx`, replace `'your-product-handle'` with your actual product handle from Shopify:
   
   ```typescript
   const {product} = await storefront.query(PRODUCT_QUERY, {
     variables: {
       handle: 'your-actual-product-handle', // Update this
     },
   });
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Deploy:**
   Use Shopify CLI to deploy to Oxygen:
   ```bash
   shopify hydrogen deploy
   ```

## Features

- Single product page design
- Image gallery with thumbnails
- Variant selection
- Quantity selector
- Responsive design
- Minimal, clean UI inspired by modern e-commerce

## Tech Stack

- **Shopify Hydrogen** - React framework for Shopify storefronts
- **Remix** - Full stack web framework
- **Oxygen** - Shopify's global hosting platform
- **TypeScript** - Type-safe code
- **Shopify Storefront API** - GraphQL API for products and cart

## Project Structure

```
/app
  /routes
    _index.tsx          # Main product page
  /styles
    app.css            # Global styles
  /lib
    context.ts         # Storefront client setup
  root.tsx             # App root layout
  entry.server.tsx     # Server entry point
  entry.client.tsx     # Client entry point
```

## Customization

- Edit `app/styles/app.css` to customize styling
- Modify `app/routes/_index.tsx` to change layout or add features
- Update color scheme in CSS variables in `app.css`:
  ```css
  :root {
    --bg-color: #ffffff;
    --text-color: #000000;
    --border-color: #e5e5e5;
    --accent-color: #000000;
  }
  ```

## Need Help?

- [Hydrogen Documentation](https://shopify.dev/docs/custom-storefronts/hydrogen)
- [Storefront API Reference](https://shopify.dev/docs/api/storefront)
- [Remix Documentation](https://remix.run/docs)

