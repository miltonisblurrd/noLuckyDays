# Quick Setup Guide for noLuckyDays

## ✅ What's Done
Your Hydrogen project is set up and dependencies are installed!

## 🔧 What You Need to Do

### 1. Add Your Shopify Credentials
Create a `.env` file in the root directory with your Shopify Storefront API credentials:

```env
PUBLIC_STOREFRONT_API_TOKEN=your_storefront_api_token_here
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
```

**Where to find these:**
- Go to Shopify Admin → Settings → Apps and sales channels
- Click "Develop apps" → "Create an app" (or select existing)
- Configure Storefront API scopes (at minimum: `unauthenticated_read_product_listings`)
- Install the app and copy the **Storefront API access token**

### 2. Update Your Product Handle
In `app/routes/_index.tsx`, line 42, replace `'your-product-handle'` with your actual product handle:

```typescript
const {product} = await storefront.query(PRODUCT_QUERY, {
  variables: {
    handle: 'your-actual-product-handle', // ← Change this!
  },
});
```

**How to find your product handle:**
- Go to your product in Shopify Admin
- The handle is in the URL: `admin.shopify.com/.../products/THIS-IS-THE-HANDLE`
- Or check the "Search engine listing" section at the bottom of the product page

### 3. Run the Development Server
```bash
npm run dev
```

Your site will be available at `http://localhost:3000`

### 4. Deploy to Oxygen (When Ready)
```bash
npx shopify hydrogen deploy
```

## 🎨 Design Features
- Clean, minimal design inspired by KidSuper
- Full-width product images with thumbnail gallery
- Variant selector for sizes/options
- Quantity controls
- Responsive mobile design
- Sticky header with cart

## 🛠️ Customization Tips

**Change Colors:** Edit CSS variables in `app/styles/app.css`:
```css
:root {
  --bg-color: #ffffff;
  --text-color: #000000;
  --border-color: #e5e5e5;
  --accent-color: #000000;
}
```

**Update Site Name:** Replace "noLuckyDays" in `app/routes/_index.tsx` (line 70)

**Modify Layout:** All styling is in `app/styles/app.css`

## 📝 Next Steps
1. Add cart functionality (using Hydrogen's cart components)
2. Add checkout flow
3. Customize styling to match your brand
4. Add analytics
5. Set up custom domain in Shopify

## 🚨 Common Issues

**"Product not found" error:**
- Double-check your product handle
- Ensure your Storefront API token has the right permissions
- Verify the product is active and available

**Build errors:**
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Styling not loading:**
- Check that `app/styles/app.css` exists
- Verify the import in `app/root.tsx`

Need help? Check the [Hydrogen docs](https://shopify.dev/docs/custom-storefronts/hydrogen)

