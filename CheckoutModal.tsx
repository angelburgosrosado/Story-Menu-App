/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Shield, Lock, CheckCircle2, X, AlertCircle, Sparkles, Send, Globe, Star, ShoppingCart } from 'lucide-react';
import { logAnalyticsEvent } from './firebase';
import { updateUserSubscriptionInFirestore } from './storageFirestore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier: 'Pro' | 'Enterprise';
  currentUser: { id: string; email: string; displayName?: string; isOffline?: boolean } | null;
  onUpgradeSuccessful: (tier: string, paymentMethod: string, subscriptionId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  initialTier,
  currentUser,
  onUpgradeSuccessful,
}) => {
  const { t } = useTranslation();
  const [tier, setTier] = useState<'Pro' | 'Enterprise'>(initialTier);
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'PayPal' | 'Square'>('Stripe');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  // Stripe form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [zipCode, setZipCode] = useState('');

  // PayPal form fields
  const [paypalEmail, setPaypalEmail] = useState('');

  const pricing = {
    Pro: {
      price: '12',
      label: 'Creator Tier',
      features: [
        '1,200 Credits / month (~120 comics)',
        'No Watermarks',
        '10 Custom Characters (Consistency AI)',
        'High-Resolution Exports (PDF, PNG)',
        'Commercial Usage Rights',
      ],
    },
    Enterprise: {
      price: '29',
      label: 'Pro / Publisher Tier',
      features: [
        '4,000 Credits / month (~400 comics)',
        'Unlimited Custom Characters',
        'Priority GPU Processing (Instant)',
        'Premium LLMs (GPT-4o / Claude 3.5)',
        'Vector & Editable Exports',
      ],
    },
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setExpiry(formatted.substring(0, 5));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvc(value.substring(0, 4));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('checkout.errEmail'));
      return;
    }

    setLoading(true);
    setError(null);

    // Track checkout initialization event with Google Analytics
    logAnalyticsEvent('begin_checkout', {
      value: tier === 'Pro' ? 19.0 : 79.0,
      currency: 'USD',
      items: [{ item_name: pricing[tier].label, item_category: 'Subscriptions' }],
    });

    try {
      // Build checkout parameters for Express backend
      const payload: any = {
        email,
        tier: pricing[tier].label,
        paymentMethod,
      };

      if (paymentMethod === 'Stripe') {
        payload.cardDetails = {
          cardNumber,
          expiry,
          cvc,
          zipCode,
        };
      } else {
        payload.paypalEmail = paypalEmail;
      }

      console.info(`📦 Sending subscription checkout API request:`, payload);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected checkout process.');
      }

      console.info(`🚀 [Gateway Approved] Checkout token received:`, data);

      // Track the purchase event to Google Analytics
      logAnalyticsEvent('purchase', {
        transaction_id: data.subscriptionId,
        value: tier === 'Pro' ? 19.0 : 79.0,
        currency: 'USD',
        payment_type: paymentMethod,
        items: [{ item_name: pricing[tier].label, item_category: 'Subscriptions' }],
      });

      // Update in Firestore database for the active logged user
      if (currentUser && !currentUser.isOffline) {
        try {
          await updateUserSubscriptionInFirestore(currentUser.id, {
            tier: pricing[tier].label,
            subscriptionId: data.subscriptionId,
            paymentMethod: data.paymentMethod,
          });
        } catch (dbErr) {
          console.error("Firestore sync subscription soft fail:", dbErr);
        }
      }

      setSuccess(data);

      setTimeout(() => {
        onUpgradeSuccessful(pricing[tier].label, paymentMethod, data.subscriptionId);
      }, 3500);

    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please verify security parameters.');
      logAnalyticsEvent('checkout_error', { error_message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div 
        id="checkout-panel"
        className="w-full max-w-2xl bg-slate-900 border-4 border-black shadow-[12px_12px_0px_#000] text-white overflow-hidden flex flex-col md:flex-row rounded-none relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 border border-slate-800 rounded-none z-10 transition-colors"
          id="btn-checkout-close"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="w-full p-8 text-center flex flex-col items-center justify-center space-y-6 bg-slate-950">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center border-4 border-black relative z-10 animate-bounce">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-yellow-500 uppercase font-black">{t('checkout.auto1', 'TRANSACTION AUTHORIZED')}</span>
              <h2 className="text-3xl font-black font-sans uppercase tracking-wider text-yellow-400">{t('checkout.auto2', 'MULTIVERSE UNLOCKED!')}</h2>
              <p className="text-xs text-slate-300 font-mono max-w-md mx-auto leading-relaxed">
                Your credentials have been authenticated. story.menu subscription for <span className="text-white font-bold">{success.email}</span> is now active.
              </p>
            </div>

            <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-800 p-4 font-mono text-[11px] text-left space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">{t('checkout.auto3', 'SUBSCRIPTION ID:')}</span>
                <span className="text-yellow-400 font-bold">{success.subscriptionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('checkout.auto4', 'UPGRADE TIER:')}</span>
                <span className="text-white font-bold uppercase">{success.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('checkout.auto5', 'PAYMENT PROXY:')}</span>
                <span className="text-cyan-400 font-bold">{success.paymentMethod} Express Sync</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('checkout.auto6', 'AUTOPAY FREQUENCY:')}</span>
                <span className="text-green-400 font-bold">{t('checkout.auto7', 'Monthly $19 recurring')}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono animate-pulse">
              Re-materializing your creative workspace parameters...
            </p>
          </div>
        ) : (
          <>
            {/* Left side: Package parameters */}
            <div className="w-full md:w-5/12 bg-slate-950 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r-4 border-black">
              <div className="space-y-6">
                <div>
                  <span className="inline-flex bg-yellow-950/80 border border-yellow-700 text-yellow-300 px-2 py-0.5 text-[9px] font-mono uppercase font-black rounded-none">
                    STORY.MENU SELECTION
                  </span>
                  <div className="flex justify-between items-baseline mt-2">
                    <h3 className="text-xl font-black font-sans uppercase tracking-wide text-white">
                      {pricing[tier].label.split('(')[0]}
                    </h3>
                    <span className="text-2xl font-black text-yellow-400 font-mono">
                      {pricing[tier].price}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Recurrent monthly subscription. Cancel anytime from keys console.
                  </p>
                </div>

                {/* Plan switcher */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 border border-slate-800">
                  <button
                    onClick={() => setTier('Pro')}
                    className={`py-1.5 text-[10px] font-mono uppercase font-bold text-center border transition-all ${
                      tier === 'Pro'
                        ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Pro Plan ($19)
                  </button>
                  <button
                    onClick={() => setTier('Enterprise')}
                    className={`py-1.5 text-[10px] font-mono uppercase font-bold text-center border transition-all ${
                      tier === 'Enterprise'
                        ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Enterprise ($79)
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">{t('checkout.auto8', 'ACTIVATED INITIATIVES:')}</h4>
                  <ul className="space-y-1.5 text-[11px] font-mono text-slate-300">
                    {pricing[tier].features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-yellow-400 font-bold">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900 mt-6 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                <Lock size={12} className="text-slate-400" />
                <span>{t('checkout.auto9', 'PCI-Compliant 256-bit Encrypted Tunneling')}</span>
              </div>
            </div>

            {/* Right side: Payment selection & form */}
            <form onSubmit={handleCheckoutSubmit} className="w-full md:w-7/12 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-yellow-400">
                    SECURE TRANSACTIONS
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Align your provider coordinates below to unlock the multimodal chassis.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-950/80 border border-red-500 text-red-200 text-[11px] font-mono p-3 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email coordinates entry */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                    Creator Email (for invoice confirmation)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="creator@multiverse.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-2 px-3 text-xs outline-none text-white font-mono"
                  />
                </div>

                {/* Secure Tabs */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                    Select Gateway System
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Stripe')}
                      className={`flex items-center justify-center gap-2 py-2.5 border transition-all text-xs font-mono font-bold ${
                        paymentMethod === 'Stripe'
                          ? 'bg-slate-800 text-white border-yellow-400 shadow-[2px_2px_0px_#000]'
                          : 'bg-black text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard size={14} className={paymentMethod === 'Stripe' ? 'text-yellow-400' : 'text-slate-500'} />
                      <span>{t('checkout.auto10', 'Stripe Link')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PayPal')}
                      className={`flex items-center justify-center gap-2 py-2.5 border transition-all text-xs font-mono font-bold ${
                        paymentMethod === 'PayPal'
                          ? 'bg-slate-850 text-white border-yellow-400 shadow-[2px_2px_0px_#000]'
                          : 'bg-black text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <svg className="h-3.5 w-auto" viewBox="0 0 100 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.4 1H1.2C0.6 1 0 1.6 0 2.2V25.8C0 26.4 0.6 27 1.2 27H12.4C20.4 27 25 22.8 25 14C25 5.2 20.4 1 12.4 1Z" fill="#003087"/>
                        <path d="M57.4 1H46.2C45.6 1 45 1.6 45 2.2V25.8C45 26.4 45.6 27 46.2 27H57.4C65.4 27 70 22.8 70 14C70 5.2 65.4 1 57.4 1Z" fill="#0079C1"/>
                        <path d="M85.4 1H74.2C73.6 1 73 1.6 73 2.2V25.8C73 26.4 73.6 27 74.2 27H85.4C93.4 27 98 22.8 98 14C98 5.2 93.4 1 85.4 1Z" fill="#00457C"/>
                      </svg>
                      <span>{t('checkout.auto11', 'PayPal Sandbox')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Square')}
                      className={`flex items-center justify-center gap-2 py-2.5 border transition-all text-xs font-mono font-bold ${
                        paymentMethod === 'Square'
                          ? 'bg-slate-800 text-white border-yellow-400 shadow-[2px_2px_0px_#000]'
                          : 'bg-black text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <svg className="h-3.5 w-auto" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 5H5V19H19V5ZM21 3V21H3V3H21ZM15 9H9V15H15V9ZM17 7V17H7V7H17Z"/>
                      </svg>
                      <span>Square</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'Stripe' ? (
                  <div className="space-y-3 p-3 bg-black/60 border border-slate-900">
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        CREDIT CARD NUMBER
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono tracking-widest"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-600 font-mono font-bold">{t('checkout.auto12', 'Visa/MC')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                          EXPIRY DATE
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono placeholder-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                          CVC CODE
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="3-4 Digits"
                          value={cvc}
                          onChange={handleCvcChange}
                          className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono placeholder-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        BILLING ZIP / POSTAL CODE
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="90210"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.substring(0, 10))}
                        className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono placeholder-slate-700"
                      />
                    </div>
                  </div>
                ) : paymentMethod === 'PayPal' ? (
                  <div className="space-y-3 p-4 bg-black/60 border border-slate-900">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        PAYPAL ACCOUNT ADDRESS
                      </label>
                      <input
                        type="email"
                        required={paymentMethod === 'PayPal'}
                        placeholder="paypal-collector@sandbox.paypal.com"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-2 px-3 text-xs outline-none text-white font-mono"
                      />
                      <span className="block text-[10px] text-yellow-500 font-mono italic">
                        * Clicking proceed launches safe sandbox credentials verification.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-black/60 border border-slate-900">
                    <div className="flex items-center gap-2 mb-2">
                       <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5H5V19H19V5ZM21 3V21H3V3H21ZM15 9H9V15H15V9ZM17 7V17H7V7H17Z"/></svg>
                       <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Square POS Virtual Terminal</span>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        CARD NUMBER (SQUARE)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required={paymentMethod === 'Square'}
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono tracking-widest"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                          EXPIRY
                        </label>
                        <input
                          type="text"
                          required={paymentMethod === 'Square'}
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono placeholder-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                          CVV
                        </label>
                        <input
                          type="text"
                          required={paymentMethod === 'Square'}
                          placeholder="123"
                          value={cvc}
                          onChange={handleCvcChange}
                          className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono placeholder-slate-700"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        POSTAL CODE
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === 'Square'}
                        placeholder="ZIP"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.substring(0, 10))}
                        className="w-full bg-black border border-slate-800 focus:border-yellow-400 py-1.5 px-3 text-xs outline-none text-white font-mono placeholder-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-sans uppercase text-xs font-black py-3 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center justify-center gap-2 duration-100 disabled:opacity-50"
                  id="btn-checkout-submit"
                >
                  <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
                  <span>{loading ? 'Processing Cryptographic Authorization...' : `PROCEED WITH $${pricing[tier]?.price || '...'} SUBSCRIPTION`}</span>
                </button>

                <div className="flex justify-center items-center gap-4 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1"><Shield size={12} /> {t('checkout.auto13', 'SECURE GATEWAY')}</span>
                  <span className="flex items-center gap-1"><Globe size={12} /> {t('checkout.auto14', 'GLOBAL CURRENCY ACCEPTS')}</span>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
