import re

with open('MainLayout.tsx', 'r') as f:
    content = f.read()

# Import LoginPage
if "LoginPage" not in content:
    content = content.replace("import { SignupPage } from './SignupPage';", "import { SignupPage } from './SignupPage';\nimport { LoginPage } from './LoginPage';")

# Add to render block
signup_render_target = "{currentView === 'signup' && <SignupPage onBack={() => handleNavigate('home')} onSuccess={() => handleNavigate('studio')} />}"
signup_render_replacement = """{currentView === 'signup' && <SignupPage onBack={() => handleNavigate('home')} onSuccess={() => handleNavigate('studio')} onSwitchToLogin={() => handleNavigate('login')} />}
                {currentView === 'login' && <LoginPage onBack={() => handleNavigate('home')} onSuccess={() => handleNavigate('studio')} onSwitchToSignup={() => handleNavigate('signup')} />}"""

content = content.replace(signup_render_target, signup_render_replacement)

# We might also need to ensure that 'login' is a valid ViewState.
# Let's check ViewState definition.
# Wait, ViewState might be in a different file or at the top of MainLayout.tsx.
with open('MainLayout.tsx', 'w') as f:
    f.write(content)
print("Updated MainLayout.tsx")
