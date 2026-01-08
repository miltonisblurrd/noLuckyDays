import {useState} from 'react';

interface GateLockScreenProps {
  onUnlock: () => void;
  storeDomain: string;
  gatePassword?: string;
}

export function GateLockScreen({onUnlock, storeDomain, gatePassword}: GateLockScreenProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !phone) {
      setError('Please enter both email and phone number');
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Submit to our API route which will send to Omnisend
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, phone}),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message - don't unlock yet
        setSuccessMessage('Thank you for signing up! You will receive a text with the password for early access.');
        // Clear form
        setEmail('');
        setPhone('');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a password');
      return;
    }

    // Check if password matches
    if (gatePassword && password === gatePassword) {
      localStorage.setItem('gateUnlocked', 'true');
      localStorage.setItem('gateMethod', 'password');
      onUnlock();
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  return (
    <div className="gate-screen">
      <div className="gate-background"></div>
      <div className="gate-content">
        <div className="gate-logo">
          <img src="/noLuckyDaysLogo.png" alt="noLuckyDays" />
        </div>
        
        <div className="gate-message">
          <h1>Early Access</h1>
          <p>
            {showPasswordForm 
              ? 'Enter your exclusive access password.' 
              : 'Sign up to get exclusive early access to our drop.'}
          </p>
        </div>

        {showPasswordForm ? (
          // Password Form
          <form className="gate-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button 
              type="submit" 
              className="gate-submit-btn"
            >
              Enter
            </button>
          </form>
        ) : (
          // Signup Form
          <form className="gate-form" onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}

            <button 
              type="submit" 
              className="gate-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Get Early Access'}
            </button>
          </form>
        )}

        {/* Toggle between forms */}
        {gatePassword && (
          <button 
            type="button"
            className="gate-toggle-btn"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setError('');
              setSuccessMessage('');
            }}
          >
            {showPasswordForm ? '← Sign up for access instead' : 'I have a password'}
          </button>
        )}

        {!showPasswordForm && (
          <p className="gate-disclaimer">
            By signing up, you agree to receive marketing emails and SMS from noLuckyDays.
          </p>
        )}
      </div>
    </div>
  );
}

