with open('CheckoutModal.tsx', 'r') as f:
    content = f.read()

# 1. Update state type
target_state = """  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'PayPal'>('Stripe');"""
replacement_state = """  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'PayPal' | 'Square'>('Stripe');"""
content = content.replace(target_state, replacement_state)

# 2. Add Square form fields (we'll just reuse the Stripe ones but maybe add a square-specific token field or just reuse for simplicity of the UI stub)
# Since it's just frontend form capture, we can use the same card details state but just render a different tab.

# 3. Update the grid for buttons from grid-cols-2 to grid-cols-3
target_grid = """                  <div className="grid grid-cols-2 gap-3">"""
replacement_grid = """                  <div className="grid grid-cols-3 gap-3">"""
content = content.replace(target_grid, replacement_grid)

# 4. Add the Square button
target_paypal_btn = """                    </button>
                  </div>"""

square_btn = """                    </button>
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
                  </div>"""
content = content.replace(target_paypal_btn, square_btn)

# 5. Add Square form view
target_paypal_form = """                  <div className="space-y-3 p-4 bg-black/60 border border-slate-900">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                        PAYPAL ACCOUNT ADDRESS
                      </label>
                      <input
                        type="email"
                        required
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
                )}"""

square_form = """                  <div className="space-y-3 p-4 bg-black/60 border border-slate-900">
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
                )}"""
content = content.replace(target_paypal_form, square_form)

# 6. Fix the ternary for the form rendering
target_render_logic = """{paymentMethod === 'Stripe' ? ("""
replacement_render_logic = """{paymentMethod === 'Stripe' ? ("""
# Well, actually the ternary is currently `paymentMethod === 'Stripe' ? (...) : (...)`
# Since I replaced the else branch, it's now `paymentMethod === 'Stripe' ? (...) : paymentMethod === 'PayPal' ? (...) : (...)`
# Let's adjust my patch logic slightly.

# Find the start of the paypal form
paypal_start = content.find("                  <div className=\"space-y-3 p-4 bg-black/60 border border-slate-900\">\n                    <div className=\"space-y-1.5\">\n                      <label className=\"block text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono\">\n                        PAYPAL ACCOUNT ADDRESS")

if paypal_start != -1:
    content = content[:paypal_start] + "paymentMethod === 'PayPal' ? (\n" + content[paypal_start:]

with open('CheckoutModal.tsx', 'w') as f:
    f.write(content)

print("CheckoutModal.tsx patched successfully!")
