#!/bin/bash

echo "🚀 noLuckyDays Setup Helper"
echo "=========================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env file from example..."
    echo "PUBLIC_STOREFRONT_API_TOKEN=your_storefront_api_token_here" > .env
    echo "PUBLIC_STORE_DOMAIN=your-store.myshopify.com" >> .env
    echo "✅ Created .env file - please update it with your credentials"
fi

echo ""
echo "📋 Next steps:"
echo "1. Update .env with your Shopify Storefront API credentials"
echo "2. Update the product handle in app/routes/_index.tsx"
echo "3. Run: npm run dev"
echo ""
echo "For detailed instructions, see SETUP.md"

