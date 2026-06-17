import re
import os

account_tsx_path = '/Users/ABGlobalCEO/.gemini/antigravity/scratch/Story-Menu-App/Account.tsx'
with open(account_tsx_path, 'r') as f:
    content = f.read()

# Replace strings with translation keys

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from 'react-i18next';")

content = content.replace("export const AuthScreen: React.FC<AccountProps> = ({ onUserChange, onClose }) => {", "export const AuthScreen: React.FC<AccountProps> = ({ onUserChange, onClose }) => {\n  const { t } = useTranslation();")

# 1. Heading
content = content.replace(
    'isSignUp ? "Create Author Profile" : "Sign In to Journal"',
    'isSignUp ? t("account.createAuthorEditorial") : t("account.signInEditorial")'
)
content = content.replace(
    'isSignUp ? "Create Creator Key" : "Access Studio"',
    'isSignUp ? t("account.createAuthorComic") : t("account.signInComic")'
)

# 2. Subheading
content = content.replace(
    '"Save your manuscripts, character profiles, and story blueprints to the cloud."',
    't("account.descEditorial")'
)
content = content.replace(
    '"Save your generated comics and custom character bibles to the cloud!"',
    't("account.descComic")'
)

# 3. Success Message
content = content.replace(
    '"Author profile created! Signing in…"',
    't("account.successEditorial")'
)
content = content.replace(
    '"Creative Portal unlocked! Logging in..."',
    't("account.successComic")'
)

# 4. Error Message - Email
content = content.replace(
    '"This email is already registered. Please sign in."',
    't("account.errEmailInUseEditorial")'
)
content = content.replace(
    '"This email key is already registered. Please login."',
    't("account.errEmailInUseComic")'
)

# 5. Error Message - Password
content = content.replace(
    '"Incorrect credentials. Please try again."',
    't("account.errWrongPasswordEditorial")'
)
content = content.replace(
    '"Invalid credentials. Please recheck security keys."',
    't("account.errWrongPasswordComic")'
)

# 6. Fallback Error
content = content.replace(
    '"Authentication sequence failed."',
    't("account.errFallback")'
)

# 7. Pen name empty
content = content.replace(
    '"Please enter your pen name."',
    't("account.errPenNameEditorial")'
)
content = content.replace(
    '"Please project a Creator Name."',
    't("account.errPenNameComic")'
)

# 8. All Credentials Empty
content = content.replace(
    '"Please fill in all credentials."',
    't("account.errEmpty")'
)

# 9. Labels
content = content.replace(
    "isEditorial ? 'Pen Name' : 'Creator Name'",
    "isEditorial ? t('account.penNameEditorial') : t('account.penNameComic')"
)
content = content.replace(
    "isEditorial ? 'Email Address' : 'Transmission Vector (Email)'",
    "isEditorial ? t('account.emailEditorial') : t('account.emailComic')"
)
content = content.replace(
    "isEditorial ? 'Password' : 'Security Passkey'",
    "isEditorial ? t('account.passwordEditorial') : t('account.passwordComic')"
)
content = content.replace(
    "isSignUp ? (isEditorial ? 'Create Profile' : 'Initiate Sequence') : (isEditorial ? 'Sign In' : 'Enter Studio')",
    "isSignUp ? (isEditorial ? t('account.createBtnEditorial') : t('account.createBtnComic')) : (isEditorial ? t('account.signInBtnEditorial') : t('account.signInBtnComic'))"
)
content = content.replace(
    "isEditorial ? 'Continue with Google' : 'Authenticate via Google'",
    "isEditorial ? t('account.googleEditorial') : t('account.googleComic')"
)
content = content.replace(
    "isEditorial ? 'Already have a profile? Sign In' : 'Have a key? Login'",
    "isEditorial ? t('account.toggleToSignInEditorial') : t('account.toggleToSignInComic')"
)
content = content.replace(
    "isEditorial ? 'No profile? Create one' : 'Need a key? Sign Up'",
    "isEditorial ? t('account.toggleToSignUpEditorial') : t('account.toggleToSignUpComic')"
)

with open(account_tsx_path, 'w') as f:
    f.write(content)
