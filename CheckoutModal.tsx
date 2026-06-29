/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Shield, Lock, CheckCircle2, X, AlertCircle, Sparkles, Send, Globe, Star, ShoppingCart, Zap, ExternalLink, Check } from 'lucide-react';
import { logAnalyticsEvent } from './firebase';
import { updateUserSubscriptionInFirestore } from './storageFirestore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';



interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier: 'Pro' | 'Enterprise';
  currentUser: { id: string; email: string; displayName?: string; isOffline?: boolean } | null;
  onUpgradeSuccessful: (tier: string, paymentMethod: string, subscriptionId: string) => void;
}

export const CheckoutModalContent: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  initialTier,
  currentUser,
  onUpgradeSuccessful,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [purchaseType, setPurchaseType] = useState<'subscription' | 'topup'>('subscription');
  const [tier, setTier] = useState<'Pro' | 'Enterprise'>(initialTier);
  const [topupTier, setTopupTier] = useState<'Starter' | 'Creator' | 'Studio'>('Starter');
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'PayPal'>('Stripe');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);
  
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  // Stripe form fields are handled by Stripe Elements now
  const [zipCode, setZipCode] = useState('');

  // PayPal form fields
  const [paypalEmail, setPaypalEmail] = useState('');

  const pricing = {
    Pro: {
      price: '8',
      label: 'Starter Tier',
      features: [
        '1,000 Credits / month (~100 comics)',
        'Basic Art Styles',
        'Standard Queue',
      ],
      tokensAwarded: 1000
    },
    Enterprise: {
      price: '15',
      label: 'Pro Tier',
      features: [
        '2,500 Credits / month (~250 comics)',
        'Advanced Art Styles',
        'Commercial Rights',
      ],
      tokensAwarded: 2500
    },
  };

  const addons: Record<string, { price: string; label: string; desc: string }> = {
    watermark: { price: '4', label: 'Watermark Removal', desc: 'Remove Story.Menu branding from exports' },
    priorityQueue: { price: '9', label: 'Priority GPU Queue', desc: 'Instant generation bypassing standard wait times' },
    premiumModels: { price: '14', label: 'Premium LLMs', desc: 'Unlock GPT-4o, Claude 3.5, and Gemini 1.5 Pro' }
  };

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const topupPricing = {
    Starter: { price: '5', label: 'Starter Pack', tokens: 500 },
    Creator: { price: '10', label: 'Creator Pack', tokens: 1200 },
    Studio: { price: '25', label: 'Studio Pack', tokens: 3500 },
  };

  // (Removed manual card parsing logic)

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
      items: [{ item_name: pricing[tier]?.label, item_category: 'Subscriptions' }],
    });

    try {
      let finalizeResponse;

      if (paymentMethod === 'Stripe') {
        const basePrice = parseFloat(pricing[tier]?.price);
        const addonTotal = selectedAddons.reduce((sum, key) => sum + parseFloat(addons[key as keyof typeof addons].price), 0);
        const totalSubPrice = basePrice + addonTotal;
        const amountCents = (purchaseType === 'subscription' ? totalSubPrice : parseFloat(topupPricing[topupTier]?.price)) * 100;
        
        // 1. Create PaymentIntent on the backend
        const intentRes = await fetch('/api/checkout/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amountCents })
        });
        const intentData = await intentRes.json();
        
        if (intentData.error) throw new Error(intentData.error);
        if (!stripe || !elements) throw new Error("Stripe Elements not loaded");
        const cardEl = elements.getElement(CardElement);
        if (!cardEl) throw new Error("Card element not found");

        // 2. Confirm the payment with Stripe
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
            payment_method: {
                card: cardEl,
                billing_details: { email }
            }
        });

        if (confirmError) throw new Error(confirmError.message);
        
        // 3. Finalize the subscription on the backend
        const addonLabels = selectedAddons.map(key => addons[key as keyof typeof addons].label).join(', ');
        const tierString = purchaseType === 'subscription' ? `${pricing[tier]?.label}${addonLabels ? ' w/ ' + addonLabels : ''}` : topupPricing[topupTier]?.label;

        const payload: any = {
            email,
            type: purchaseType,
            tier: tierString,
            tokensAwarded: purchaseType === 'subscription' ? pricing[tier]?.tokensAwarded : topupPricing[topupTier]?.tokens,
            paymentMethod,
            paymentIntentId: paymentIntent.id
        };
        console.info(`📦 Sending Stripe checkout API request:`, payload);
        finalizeResponse = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
      } else {
        const addonLabels = selectedAddons.map(key => addons[key as keyof typeof addons].label).join(', ');
        const tierString = purchaseType === 'subscription' ? `${pricing[tier]?.label}${addonLabels ? ' w/ ' + addonLabels : ''}` : topupPricing[topupTier]?.label;

        const payload: any = {
          email,
          type: purchaseType,
          tier: tierString,
          tokensAwarded: purchaseType === 'subscription' ? pricing[tier]?.tokensAwarded : topupPricing[topupTier]?.tokens,
          paymentMethod,
          paypalEmail
        };
        console.info(`📦 Sending alternate checkout API request:`, payload);
        finalizeResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      }
      
      const data = await finalizeResponse.json();

      if (!finalizeResponse.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      console.info(`🚀 [Gateway Approved] Checkout token received:`, data);

      // Track the purchase event to Google Analytics
      logAnalyticsEvent('purchase', {
        transaction_id: data.subscriptionId,
        value: tier === 'Pro' ? 19.0 : 79.0,
        currency: 'USD',
        payment_type: paymentMethod,
        items: [{ item_name: pricing[tier]?.label, item_category: 'Subscriptions' }],
      });

      // Emit event to close modal and refresh state
      window.dispatchEvent(new Event('close-checkout-modal'));
      window.dispatchEvent(new Event('refresh-subscription-status'));
      
      // Fetch latest token balance from backend
      fetch(`/api/user/tokens?email=${encodeURIComponent(currentUser?.email || '')}`)
        .then(res => res.json())
        .then(tokenData => {
            if (tokenData.tokens !== undefined) {
                window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: tokenData.tokens }));
            }
        }).catch(err => console.warn("Could not fetch new token balance", err));

      if (data.type === 'topup') {
        alert('Payment successful. Tokens have been added to your account.');
      } else {
        alert('Payment successful. Welcome to ' + pricing[tier]?.label + '!');
      }

      // Update in Firestore database for the active logged user
      if (currentUser && !currentUser.isOffline) {
        try {
          if (data.type === 'topup' && data.tokensAwarded > 0) {
            // tokens awarded on backend natively
          } else {
            // Give subscription tokens initially as well
            // tokens awarded on backend natively
            await updateUserSubscriptionInFirestore(currentUser.id, {
              tier: pricing[tier]?.label,
              subscriptionId: data.subscriptionId,
              paymentMethod: data.paymentMethod,
            });
          }
        } catch (dbErr) {
          console.error("Firestore sync subscription soft fail:", dbErr);
        }
      }

      setSuccess(data);

      setTimeout(() => {
        onUpgradeSuccessful(
          purchaseType === 'subscription' ? pricing[tier]?.label : topupPricing[topupTier]?.label, 
          paymentMethod, 
          data.subscriptionId
        );
      }, 3500);

    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please verify security parameters.');
      logAnalyticsEvent('checkout_error', { error_message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="native-modal w-full max-w-2xl bg-slate-900 border-4 border-black shadow-[12px_12px_0px_#000] text-white flex-col md:flex-row overflow-hidden"
      id="checkout-panel"
    >
      <div className="flex flex-col md:flex-row w-full h-full relative">
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
                <span className="text-slate-500">{t('checkout.auto3', 'TRANSACTION ID:')}</span>
                <span className="text-yellow-400 font-bold">{success.subscriptionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{success.type === 'topup' ? 'PURCHASED PACKAGE:' : t('checkout.auto4', 'UPGRADE TIER:')}</span>
                <span className="text-white font-bold uppercase">{success.tier}</span>
              </div>
              {success.tokensAwarded > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">TOKENS AWARDED:</span>
                  <span className="text-yellow-400 font-bold">+{success.tokensAwarded}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t('checkout.auto5', 'PAYMENT PROXY:')}</span>
                <span className="text-cyan-400 font-bold">{success.paymentMethod} Express Sync</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('checkout.auto6', 'TYPE:')}</span>
                <span className="text-green-400 font-bold">{success.type === 'topup' ? 'One-time Top-Up' : 'Recurring Subscription'}</span>
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
                
                {/* Purchase Type Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 border border-slate-800">
                  <button
                    onClick={() => setPurchaseType('subscription')}
                    className={`py-1.5 text-[10px] font-mono uppercase font-bold text-center border transition-all ${
                      purchaseType === 'subscription'
                        ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Subscriptions
                  </button>
                  <button
                    onClick={() => setPurchaseType('topup')}
                    className={`py-1.5 text-[10px] font-mono uppercase font-bold text-center border transition-all ${
                      purchaseType === 'topup'
                        ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Token Top-Ups
                  </button>
                </div>

                {purchaseType === 'subscription' ? (
                  <>
                    <div>
                      <span className="inline-flex bg-yellow-950/80 border border-yellow-700 text-yellow-300 px-2 py-0.5 text-[9px] font-mono uppercase font-black rounded-none">
                        STORY.MENU SUBSCRIPTION
                      </span>
                      <div className="flex justify-between items-baseline mt-2">
                        <h3 className="text-xl font-black font-sans uppercase tracking-wide text-white">
                          {pricing[tier]?.label.split('(')[0]}
                        </h3>
                        <span className="text-2xl font-black text-yellow-400 font-mono">
                          ${pricing[tier]?.price}
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
                        Creator ($12)
                      </button>
                      <button
                        onClick={() => setTier('Enterprise')}
                        className={`py-1.5 text-[10px] font-mono uppercase font-bold text-center border transition-all ${
                          tier === 'Enterprise'
                            ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                            : 'text-slate-400 border-transparent hover:text-white'
                        }`}
                      >
                        Pro ($29)
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">{t('checkout.auto8', 'ACTIVATED INITIATIVES:')}</h4>
                      <ul className="space-y-1.5 text-[11px] font-mono text-slate-300">
                        {pricing[tier]?.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-yellow-400 font-bold">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Available Add-ons:</h4>
                      <div className="space-y-2">
                        {Object.entries(addons).map(([key, addon]) => (
                          <label key={key} className={`flex items-start gap-2 p-2 border cursor-pointer transition-colors ${selectedAddons.includes(key) ? 'border-yellow-400 bg-yellow-400/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}`}>
                            <input 
                              type="checkbox" 
                              className="mt-1"
                              checked={selectedAddons.includes(key)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAddons(prev => [...prev, key]);
                                else setSelectedAddons(prev => prev.filter(a => a !== key));
                              }}
                            />
                            <div className="flex flex-col">
                              <div className="flex justify-between w-full gap-2">
                                <span className="text-[11px] font-bold text-white font-mono">{addon?.label}</span>
                                <span className="text-[11px] font-mono text-yellow-400">+${addon.price}/mo</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">{addon.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="inline-flex bg-cyan-950/80 border border-cyan-700 text-cyan-300 px-2 py-0.5 text-[9px] font-mono uppercase font-black rounded-none">
                        ONE-TIME TOP-UP
                      </span>
                      <div className="flex justify-between items-baseline mt-2">
                        <h3 className="text-xl font-black font-sans uppercase tracking-wide text-white">
                          {topupPricing[topupTier]?.label}
                        </h3>
                        <span className="text-2xl font-black text-cyan-400 font-mono">
                          ${topupPricing[topupTier]?.price}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        One-time purchase. Tokens never expire.
                      </p>
                    </div>

                    {/* Topup switcher */}
                    <div className="flex flex-col gap-2 bg-slate-900 p-1 border border-slate-800">
                      {(['Starter', 'Creator', 'Studio'] as const).map((pk) => (
                        <button
                          key={pk}
                          onClick={() => setTopupTier(pk)}
                          className={`py-2 text-[10px] font-mono uppercase font-bold text-center border transition-all flex justify-between px-3 ${
                            topupTier === pk
                              ? 'bg-cyan-400 text-black border-cyan-400 font-black'
                              : 'text-slate-400 border-transparent hover:text-white bg-slate-950/50 hover:bg-slate-800'
                          }`}
                        >
                          <span>{topupPricing[pk]?.label}</span>
                          <span>{topupPricing[pk]?.tokens} Tokens for ${topupPricing[pk]?.price}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">WHY TOP-UPS?</h4>
                      <ul className="space-y-1.5 text-[11px] font-mono text-slate-300">
                         <li className="flex items-start gap-1.5">
                            <Zap className="text-cyan-400" size={14} />
                            <span>Only pay for what you generate</span>
                         </li>
                         <li className="flex items-start gap-1.5">
                            <Check className="text-cyan-400" size={14} />
                            <span>Stackable with active subscriptions</span>
                         </li>
                         <li className="flex items-start gap-1.5">
                            <Lock className="text-cyan-400" size={14} />
                            <span>Tokens securely bound to your account</span>
                         </li>
                      </ul>
                    </div>
                  </>
                )}

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
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                </div>

                {paymentMethod === 'Stripe' ? (
                  <div className="space-y-3 p-3 bg-black/60 border border-slate-900">
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        CREDIT OR DEBIT CARD
                      </label>
                      <div className="relative p-3 bg-black border border-slate-800 focus-within:border-yellow-400">
                        <CardElement options={{
                          style: {
                            base: {
                              fontSize: '14px',
                              color: '#ffffff',
                              fontFamily: 'monospace',
                              '::placeholder': {
                                color: '#475569',
                              },
                            },
                            invalid: {
                              color: '#ef4444',
                            },
                          },
                        }} />
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
                ) : (
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
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-sans uppercase text-xs font-black py-3 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center justify-center gap-2 duration-100 disabled:opacity-50"
                  id="btn-checkout-submit"
                >
                  <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
                  <span>{loading ? 'Processing Cryptographic Authorization...' : `PROCEED WITH $${purchaseType === 'subscription' ? parseFloat(pricing[tier]?.price) + selectedAddons.reduce((sum, key) => sum + parseFloat(addons[key as keyof typeof addons].price), 0) : topupPricing[topupTier]?.price} ${purchaseType === 'subscription' ? 'SUBSCRIPTION' : 'TOP-UP'}`}</span>
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
    </dialog>
  );
};

let stripePromise: Promise<any> | null = null;
const initializeStripe = () => {
    if (!stripePromise) {
        stripePromise = fetch('/api/checkout/config')
            .then(res => res.json())
            .then(data => {
                if (data.publishableKey) {
                    return loadStripe(data.publishableKey);
                }
                return null;
            })
            .catch(() => null);
    }
    return stripePromise;
};

export const CheckoutModal: React.FC<CheckoutModalProps> = (props) => {
    return (
        <Elements stripe={initializeStripe()}>
            <CheckoutModalContent {...props} />
        </Elements>
    );
};
