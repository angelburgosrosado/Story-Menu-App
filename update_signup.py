import re

with open('SignupPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("interface SignupPageProps {\n  onBack: () => void;\n  onSuccess: () => void;\n}", "interface SignupPageProps {\n  onBack: () => void;\n  onSuccess: () => void;\n  onSwitchToLogin: () => void;\n}")
content = content.replace("export const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSuccess }) => {", "export const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSuccess, onSwitchToLogin }) => {")

bottom_link_target = """              <button onClick={() => window.dispatchEvent(new Event('trigger-auth-dialog'))} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">"""
bottom_link_replacement = """              <button type="button" onClick={onSwitchToLogin} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">"""
content = content.replace(bottom_link_target, bottom_link_replacement)

with open('SignupPage.tsx', 'w') as f:
    f.write(content)
print("Updated SignupPage.tsx")
