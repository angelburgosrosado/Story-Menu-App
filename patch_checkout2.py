with open('CheckoutModal.tsx', 'r') as f:
    content = f.read()

# Replace hardcoded pricing object with a dynamically fetched one
# Look for where `pricing` is defined.
target_pricing = """  const pricing: Record<string, any> = {
    Pro: { price: "19", period: "month", desc: t('checkout.auto5', 'Advanced generation algorithms'), features: [t('checkout.auto6', '7,000 Generation Tokens/mo'), t('checkout.auto7', 'Priority render queue'), t('checkout.auto8', 'Basic generative models')] },
    Enterprise: { price: "79", period: "month", desc: t('checkout.auto9', 'Unlimited commercial use'), features: [t('checkout.auto10', 'Unlimited Generation Tokens'), t('checkout.auto11', 'Instant VIP render queue'), 'Custom fine-tuned models'] }
  };"""

replacement_pricing = """  const [pricing, setPricing] = useState<Record<string, any>>({});
  
  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
            const dynamicPricing: Record<string, any> = {};
            data.forEach((p: any) => {
                dynamicPricing[p.name] = {
                    price: p.price,
                    period: p.billingCycle || 'month',
                    desc: '', // Can be extended in DB later
                    features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
                };
            });
            setPricing(dynamicPricing);
        } else {
            // Fallback to sandbox defaults
            setPricing({
                Pro: { price: "19", period: "month", desc: t('checkout.auto5', 'Advanced generation algorithms'), features: [t('checkout.auto6', '7,000 Generation Tokens/mo'), t('checkout.auto7', 'Priority render queue'), t('checkout.auto8', 'Basic generative models')] },
                Enterprise: { price: "79", period: "month", desc: t('checkout.auto9', 'Unlimited commercial use'), features: [t('checkout.auto10', 'Unlimited Generation Tokens'), t('checkout.auto11', 'Instant VIP render queue'), 'Custom fine-tuned models'] }
            });
        }
      })
      .catch(() => {
         // Fallback
         setPricing({
            Pro: { price: "19", period: "month", desc: t('checkout.auto5', 'Advanced generation algorithms'), features: [t('checkout.auto6', '7,000 Generation Tokens/mo'), t('checkout.auto7', 'Priority render queue'), t('checkout.auto8', 'Basic generative models')] },
            Enterprise: { price: "79", period: "month", desc: t('checkout.auto9', 'Unlimited commercial use'), features: [t('checkout.auto10', 'Unlimited Generation Tokens'), t('checkout.auto11', 'Instant VIP render queue'), 'Custom fine-tuned models'] }
        });
      });
  }, [t]);"""

content = content.replace(target_pricing, replacement_pricing)

# Also need to make sure we don't crash before pricing is loaded.
# Change `{pricing[tier].label}` or `{pricing[tier].price}` to be safe.
# Actually it just uses `pricing[tier]?.price` or similar. Let's see how it's used.
# "PROCEED WITH ${tier === 'Pro' ? '19' : '79'} SUBSCRIPTION"
# Replace:
# `PROCEED WITH $${tier === 'Pro' ? '19' : '79'} SUBSCRIPTION`
# With:
# `PROCEED WITH $${pricing[tier]?.price || '...'} SUBSCRIPTION`

content = content.replace("`PROCEED WITH $$", "`PROCEED WITH $${pricing[tier]?.price || '...'} SUBSCRIPTION` // ")
# Actually the exact line is:
# <span>{loading ? 'Processing Cryptographic Authorization...' : `PROCEED WITH $${tier === 'Pro' ? '19' : '79'} SUBSCRIPTION`}</span>

# Let's do a strict replace
strict_target = " : `PROCEED WITH $$" + "{tier === 'Pro' ? '19' : '79'} SUBSCRIPTION`}"
strict_replace = " : `PROCEED WITH $$" + "{pricing[tier]?.price || '...'} SUBSCRIPTION`}"
content = content.replace(strict_target, strict_replace)


with open('CheckoutModal.tsx', 'w') as f:
    f.write(content)
print("Patched CheckoutModal.tsx dynamic pricing")
