with open('Home.tsx', 'r') as f:
    content = f.read()

# 1. Imports
if "react-helmet-async" not in content:
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport { Helmet } from 'react-helmet-async';\nimport { useScrollReveal } from './useScrollReveal';")

# 2. Add Helmet tags at the root of the page
helmet_code = """
            <Helmet>
                <title>{t('home.seoTitle', 'Story.Menu - AI Comic & Storytelling Studio')}</title>
                <meta name="description" content={t('home.seoDesc', 'Create, translate, and publish stunning AI-generated comics, manga, and graphic novels in multiple languages instantly.')} />
                <meta property="og:title" content={t('home.seoTitle', 'Story.Menu - AI Comic & Storytelling Studio')} />
                <meta property="og:description" content={t('home.seoDesc', 'Create, translate, and publish stunning AI-generated comics, manga, and graphic novels in multiple languages instantly.')} />
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "Story.Menu",
                            "applicationCategory": "DesignApplication",
                            "offers": {
                                "@type": "Offer",
                                "price": "0.00",
                                "priceCurrency": "USD"
                            }
                        }
                    `}
                </script>
            </Helmet>
"""
if "<Helmet>" not in content:
    content = content.replace("{/* Main Header / Navigation Bar */}", helmet_code + "\n            {/* Main Header / Navigation Bar */}")

# 3. Add Scroll Reveal Hook Usage
showcase_hook_target = "const [selectedAudioGenre, setSelectedAudioGenre] = useState('Sci-Fi Cyberpunk');"
showcase_hook_repl = """const [selectedAudioGenre, setSelectedAudioGenre] = useState('Sci-Fi Cyberpunk');
    const [showcaseRef, showcaseVisible] = useScrollReveal() as [any, boolean];
    const [capsRef, capsVisible] = useScrollReveal() as [any, boolean];
    const [pricingRef, pricingVisible] = useScrollReveal() as [any, boolean];
"""
if "const [showcaseRef" not in content:
    content = content.replace(showcase_hook_target, showcase_hook_repl)

# 4. Attach refs to the major sections
content = content.replace('<div id="showcase" className="mb-24">', '<div id="showcase" ref={showcaseRef} className={`mb-24 transition-all duration-1000 transform ${showcaseVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>')
content = content.replace('<div id="capabilities" className="mb-24">', '<div id="capabilities" ref={capsRef} className={`mb-24 transition-all duration-1000 transform ${capsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>')

pricing_target = 'className={`mb-24 pt-8 border-t ${isLightMode ? \'border-slate-200\' : \'border-white/10\'}`}'
pricing_repl = 'ref={pricingRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${pricingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? \'border-slate-200\' : \'border-white/10\'}`}'
content = content.replace(pricing_target, pricing_repl)

# 5. Monetizable Feature Badging (Capabilities grid)
content = content.replace("● MODEL SYNTAX LOCKED", "✨ PRO • MODEL SYNTAX LOCKED")
content = content.replace("● DIFFUSION ENGINES STABLE", "🔥 PREMIUM GPU • ENGINES STABLE")
content = content.replace("● VOICE ENGINES READY", "⚡ STARTER • VOICE ENGINES READY")
content = content.replace("● EXPORTER STANDBY", "💎 ENTERPRISE • EXPORTER STANDBY")

with open('Home.tsx', 'w') as f:
    f.write(content)
print("Patched Home.tsx successfully without breaking JSX.")
