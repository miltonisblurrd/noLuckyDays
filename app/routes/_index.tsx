import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {useState, useEffect} from 'react';
import {GateLockScreen} from '../components/GateLockScreen';

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      variants(first: 10) {
        nodes {
          id
          title
          price {
            amount
            currencyCode
          }
          availableForSale
          selectedOptions {
            name
            value
          }
        }
      }
      images(first: 10) {
        nodes {
          url
          altText
          width
          height
        }
      }
    }
    shop {
      paymentSettings {
        currencyCode
        acceptedCardBrands
        enabledPresentmentCurrencies
      }
      gateEnabled: metafield(namespace: "drops", key: "gate_enabled") {
        value
      }
      gatePassword: metafield(namespace: "custom", key: "gate_password") {
        value
      }
    }
  }
`;

const CREATE_CART_MUTATION = `#graphql
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 10) {
          nodes {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    nodes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = `#graphql
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 10) {
          nodes {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    nodes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const UPDATE_CART_MUTATION = `#graphql
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 10) {
          nodes {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    nodes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const REMOVE_FROM_CART_MUTATION = `#graphql
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 10) {
          nodes {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  images(first: 1) {
                    nodes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export async function loader({context}: {context: {env: Record<string, string>}}) {
  const STORE_DOMAIN = context.env.PUBLIC_STORE_DOMAIN;
  const STOREFRONT_TOKEN = context.env.PRIVATE_STOREFRONT_API_TOKEN;
  
  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error('Missing Shopify credentials in environment variables');
  }

  const response = await fetch(`https://${STORE_DOMAIN}/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({
      query: PRODUCT_QUERY,
      variables: {
        handle: 'no-lucky-days-black-beanie',
      },
    }),
  });

  const {data, errors} = await response.json();
  
  if (errors) {
    console.error('Shopify API errors:', errors);
    throw new Error('Failed to fetch product');
  }

  if (!data?.product) {
    throw new Response('Product not found', {status: 404});
  }

  // Check if gate is enabled from shop metafield
  const gateEnabled = data.shop?.gateEnabled?.value === 'true';
  const gatePassword = data.shop?.gatePassword?.value || '';

  return json({
    product: data.product,
    shop: data.shop,
    gateEnabled,
    gatePassword,
    shopifyConfig: {
      storeDomain: STORE_DOMAIN,
      storefrontToken: STOREFRONT_TOKEN,
    },
  });
}

// Shopify API helper
async function shopifyFetch(storeDomain: string, token: string, query: string, variables: any) {
  const response = await fetch(`https://${storeDomain}/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

export default function Index() {
  const {product, shopifyConfig, gateEnabled, gatePassword} = useLoaderData<typeof loader>();
  const [selectedVariant, setSelectedVariant] = useState(product.variants.nodes[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShopPayLoading, setIsShopPayLoading] = useState(false);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);
  const [isCheckingGate, setIsCheckingGate] = useState(true);

  // Check if user has already unlocked the gate
  useEffect(() => {
    const unlocked = localStorage.getItem('gateUnlocked') === 'true';
    setIsGateUnlocked(unlocked);
    setIsCheckingGate(false);
  }, []);

  // Calculate installment price (4 payments for Klarna style)
  const price = parseFloat(selectedVariant.price.amount);
  const installmentPrice = (price / 4).toFixed(2);

  // Show gate if enabled and user hasn't unlocked
  if (gateEnabled && !isGateUnlocked && !isCheckingGate) {
    return (
      <GateLockScreen 
        onUnlock={() => setIsGateUnlocked(true)} 
        storeDomain={shopifyConfig.storeDomain}
        gatePassword={gatePassword}
      />
    );
  }

  // Show loading while checking gate status
  if (isCheckingGate) {
    return (
      <div className="gate-loading">
        <div className="gate-loading-spinner"></div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      let result;
      
      if (cart?.id) {
        result = await shopifyFetch(
          shopifyConfig.storeDomain,
          shopifyConfig.storefrontToken,
          ADD_TO_CART_MUTATION,
          {
            cartId: cart.id,
            lines: [{ merchandiseId: selectedVariant.id, quantity }],
          }
        );
        setCart(result.data.cartLinesAdd.cart);
      } else {
        result = await shopifyFetch(
          shopifyConfig.storeDomain,
          shopifyConfig.storefrontToken,
          CREATE_CART_MUTATION,
          {
            input: {
              lines: [{ merchandiseId: selectedVariant.id, quantity }],
            },
          }
        );
        const newCart = result.data.cartCreate.cart;
        setCart(newCart);
        localStorage.setItem('cartId', newCart.id);
      }
      
      setIsCartOpen(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setIsShopPayLoading(true);
    
    try {
      // Create a new cart and redirect immediately to checkout
      const result = await shopifyFetch(
        shopifyConfig.storeDomain,
        shopifyConfig.storefrontToken,
        CREATE_CART_MUTATION,
        {
          input: {
            lines: [{ merchandiseId: selectedVariant.id, quantity }],
          },
        }
      );
      
      const newCart = result.data.cartCreate.cart;
      
      // Redirect to Shopify checkout (Shop Pay will be available there)
      window.location.href = newCart.checkoutUrl;
    } catch (error) {
      console.error('Error:', error);
      setIsShopPayLoading(false);
    }
  };

  const updateCartItemQuantity = async (lineId: string, newQuantity: number) => {
    if (!cart?.id) return;
    
    try {
      if (newQuantity <= 0) {
        const result = await shopifyFetch(
          shopifyConfig.storeDomain,
          shopifyConfig.storefrontToken,
          REMOVE_FROM_CART_MUTATION,
          {
            cartId: cart.id,
            lineIds: [lineId],
          }
        );
        setCart(result.data.cartLinesRemove.cart);
      } else {
        const result = await shopifyFetch(
          shopifyConfig.storeDomain,
          shopifyConfig.storefrontToken,
          UPDATE_CART_MUTATION,
          {
            cartId: cart.id,
            lines: [{ id: lineId, quantity: newQuantity }],
          }
        );
        setCart(result.data.cartLinesUpdate.cart);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const cartItemsCount = cart?.lines?.nodes?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;

  return (
    <div className="product-page">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      
      {/* Header */}
      <header className="header">
        <div className="container">
          <a href="/" className="logo">
            <img src="/noLuckyDaysLogo.png" alt="noLuckyDays" />
          </a>
          <nav className="nav">
            <button 
              className={`cart-btn ${cartItemsCount > 0 ? 'has-items' : ''}`}
              onClick={() => setIsCartOpen(true)}
            >
              Cart({cartItemsCount})
            </button>
          </nav>
        </div>
      </header>

      {/* Product Section */}
      <main className="product-container">
        <div className="container">
          <div className="product-grid">
            {/* Image Gallery */}
            <div className="product-images">
              <div className="main-image">
                {product.images.nodes[selectedImage] && (
                  <img
                    src={product.images.nodes[selectedImage].url}
                    alt={product.images.nodes[selectedImage].altText || product.title}
                  />
                )}
                <div className="image-badge">NEW</div>
              </div>
              {product.images.nodes.length > 1 && (
                <div className="thumbnail-grid">
                  {product.images.nodes.map((image: any, index: number) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `${product.title} ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="product-info">
              <div className="product-header">
                <span className="product-tag">Limited Edition</span>
                <h1 className="product-title">{product.title}</h1>
              </div>
              
              <div className="price-section">
                <div className="product-price">
                  ${price.toFixed(2)} <span className="currency">{selectedVariant.price.currencyCode}</span>
                </div>
                <div className="installment-info">
                  <span className="installment-text">
                    or 4 interest-free payments of <strong>${installmentPrice}</strong> with
                  </span>
                  <span className="klarna-badge">Klarna</span>
                </div>
              </div>

              {product.description && (
                <div className="product-description">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Variant Selector */}
              {product.variants.nodes.length > 1 && (
                <div className="variant-selector">
                  <label>
                    {product.variants.nodes[0].selectedOptions[0]?.name || 'Option'}
                  </label>
                  <div className="variant-options">
                    {product.variants.nodes.map((variant: any) => (
                      <button
                        key={variant.id}
                        className={`variant-option ${
                          selectedVariant.id === variant.id ? 'active' : ''
                        } ${!variant.availableForSale ? 'disabled' : ''}`}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={!variant.availableForSale}
                      >
                        {variant.selectedOptions[0]?.value || variant.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="quantity-selector">
                <label>Quantity</label>
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {/* Add to Cart */}
                <button
                  className={`add-to-cart-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!selectedVariant.availableForSale || isLoading}
                >
                  {isLoading ? 'Adding...' : selectedVariant.availableForSale ? 'Add to Cart' : 'Sold Out'}
                </button>

                {/* Buy with Shop Pay */}
                <button
                  className={`shop-pay-btn ${isShopPayLoading ? 'loading' : ''}`}
                  onClick={handleBuyNow}
                  disabled={!selectedVariant.availableForSale || isShopPayLoading}
                >
                  {isShopPayLoading ? (
                    'Redirecting...'
                  ) : (
                    <>
                      Buy with <span className="shop-pay-logo">shop</span><span className="pay-text">Pay</span>
                    </>
                  )}
                </button>

                {/* More Payment Options */}
                <button className="more-options-btn" onClick={handleBuyNow}>
                  More payment options
                </button>
              </div>

              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Secure Checkout</span>
                </div>
                <div className="badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <span>Free Shipping</span>
                </div>
                <div className="badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cart Overlay */}
      <div 
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Cart Drawer */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-cart" onClick={() => setIsCartOpen(false)}>×</button>
        </div>
        
        <div className="cart-items">
          {!cart?.lines?.nodes?.length ? (
            <div className="cart-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Your cart is empty</p>
              <button className="continue-shopping" onClick={() => setIsCartOpen(false)}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.lines.nodes.map((item: any) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.merchandise.product.images.nodes[0] && (
                    <img 
                      src={item.merchandise.product.images.nodes[0].url} 
                      alt={item.merchandise.product.title}
                    />
                  )}
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-title">{item.merchandise.product.title}</div>
                  {item.merchandise.title !== 'Default Title' && (
                    <div className="cart-item-variant">{item.merchandise.title}</div>
                  )}
                  <div className="cart-item-price">
                    ${parseFloat(item.merchandise.price.amount).toFixed(2)}
                  </div>
                  <div className="cart-item-quantity">
                    <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>+</button>
                    <button 
                      className="remove-item"
                      onClick={() => updateCartItemQuantity(item.id, 0)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart?.lines?.nodes?.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span>${parseFloat(cart.cost.subtotalAmount.amount).toFixed(2)} {cart.cost.subtotalAmount.currencyCode}</span>
            </div>
            <p className="cart-note">Shipping & taxes calculated at checkout</p>
            <a 
              href={cart.checkoutUrl}
              className="checkout-btn"
            >
              Checkout
            </a>
            <a 
              href={cart.checkoutUrl}
              className="shop-pay-checkout"
            >
              <span className="shop-pay-logo">shop</span><span className="pay-text">Pay</span>
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>noLuckyDays</h3>
              <p>Premium streetwear for the bold.</p>
            </div>
            <div className="footer-columns">
              <div className="footer-column">
                <h4>Follow Us</h4>
                <div className="footer-links">
                  <a href="#">Instagram</a>
                  <a href="#">Twitter</a>
                  <a href="#">TikTok</a>
                </div>
              </div>
              <div className="footer-column">
                <h4>Policies</h4>
                <div className="footer-links">
                  <a href="/policies/privacy">Privacy Policy</a>
                  <a href="/policies/terms">Terms of Service</a>
                  <a href="/policies/refund">Refund Policy</a>
                  <a href="/policies/shipping">Shipping Policy</a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>©2025 noLuckyDays. All rights reserved.</p>
            <div className="payment-icons">
              <span>💳</span>
              <span>Apple Pay</span>
              <span>Google Pay</span>
              <span>Shop Pay</span>
              <span>Klarna</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
