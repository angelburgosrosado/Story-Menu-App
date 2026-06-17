import re

checkout_tsx_path = '/Users/ABGlobalCEO/.gemini/antigravity/scratch/Story-Menu-App/CheckoutModal.tsx'
with open(checkout_tsx_path, 'r') as f:
    content = f.read()

# Replace strings with translation keys

content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useTranslation } from 'react-i18next';")

content = content.replace("}) => {", "}) => {\n  const { t } = useTranslation();")

content = content.replace(
    "'The Full Course (Pro)'",
    "t('checkout.proLabel')"
)
content = content.replace(
    "'Secure Web Cloud Firestore database backing'",
    "t('checkout.proFeature1')"
)
content = content.replace(
    "'Dynamic 10-chapter Story Blueprints'",
    "t('checkout.proFeature2')"
)
content = content.replace(
    "'Priority Gemini-3 Image style anchors'",
    "t('checkout.proFeature3')"
)
content = content.replace(
    "'Limitless character biometric vault cards'",
    "t('checkout.proFeature4')"
)
content = content.replace(
    "'Multi-language custom voice output synthesis'",
    "t('checkout.proFeature5')"
)

content = content.replace(
    "'The Multi-Course (Enterprise)'",
    "t('checkout.entLabel')"
)
content = content.replace(
    "'Everything in Pro plan details'",
    "t('checkout.entFeature1')"
)
content = content.replace(
    "'UHD 4K Vector generation exports'",
    "t('checkout.entFeature2')"
)
content = content.replace(
    "'Custom model tuning weights'",
    "t('checkout.entFeature3')"
)
content = content.replace(
    "'Collaborative publishing workspaces'",
    "t('checkout.entFeature4')"
)
content = content.replace(
    "'Dedicated GCP priority endpoints'",
    "t('checkout.entFeature5')"
)

content = content.replace(
    "'Please provide your emails coordinates for checkout registration.'",
    "t('checkout.errEmail')"
)
content = content.replace(
    '"Please fill out all active credential requirements for card payment."',
    "t('checkout.errCard')"
)
content = content.replace(
    '"Please fill out the secondary portal authorization requirement (PayPal Email)."',
    "t('checkout.errPaypal')"
)
content = content.replace(
    '"Security simulation complete! Cloud architecture is upgrading your tier..."',
    "t('checkout.successMsg')"
)

content = content.replace(
    "isEditorial ? 'Upgrade Workspace' : 'Upgrade Studio Tier'",
    "isEditorial ? t('checkout.titleEditorial') : t('checkout.titleComic')"
)
content = content.replace(
    "isEditorial ? 'Unlock limitless generative tools and robust cloud integrations for your novel writing experience.' : 'Unlock limitless generative tools and robust cloud integrations for your next epic comic series!'",
    "isEditorial ? t('checkout.subtitleEditorial') : t('checkout.subtitleComic')"
)

content = content.replace(
    ">Pro<",
    ">{t('checkout.tabPro')}<"
)
content = content.replace(
    ">Enterprise<",
    ">{t('checkout.tabEnt')}<"
)

content = content.replace(
    "isEditorial ? 'Secure Checkout' : 'Secure Transaction'",
    "isEditorial ? t('checkout.paymentTitleEditorial') : t('checkout.paymentTitleComic')"
)

with open(checkout_tsx_path, 'w') as f:
    f.write(content)
