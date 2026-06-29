import re

with open('LoginPage.tsx', 'r') as f:
    content = f.read()

# 1. Rename Component and Props
content = content.replace("SignupPage", "LoginPage")
content = content.replace("interface LoginPageProps {\n  onBack: () => void;\n  onSuccess: () => void;\n}", "interface LoginPageProps {\n  onBack: () => void;\n  onSuccess: () => void;\n  onSwitchToSignup: () => void;\n}")
content = content.replace("export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSuccess }) => {", "export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSuccess, onSwitchToSignup }) => {")

# 2. Update Firebase Imports
content = content.replace("createUserWithEmailAndPassword", "signInWithEmailAndPassword")

# 3. Rename handleSignup -> handleLogin
content = content.replace("handleSignup", "handleLogin")
content = content.replace("handleGoogleSignup", "handleGoogleLogin")

# 4. Remove 'name' state
content = re.sub(r"  const \[name, setName\] = useState\(''\);\n", "", content)

# 5. Fix handleLogin for email
login_handler_target = """    try {
      // Create user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(userCredential.user, { displayName: name });
      
      // Store in Firestore for future connections
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        displayName: name,
        createdAt: new Date().toISOString(),
        tier: 'Free',
        tokenBalance: 50
      }, { merge: true });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.');
    }"""

login_handler_replacement = """    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }"""
content = content.replace(login_handler_target, login_handler_replacement)

# Fix Google error text
content = content.replace("'An error occurred during Google signup.'", "'An error occurred during Google login.'")
# Remove Name input field
name_input_target = """            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('signup.auto5', 'Full Name')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-500" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Alex Carter"
                  required
                />
              </div>
            </div>

"""
content = content.replace(name_input_target, "")

# 6. Change Text
content = content.replace("{t('signup.auto3', 'Create your account')}", "{t('login.auto3', 'Welcome back')}")
content = content.replace("{t('signup.auto4', 'Start crafting your first story today.')}", "{t('login.auto4', 'Log in to continue your creative journey.')}")
content = content.replace("{t('signup.submitBtn', 'Sign Up Free')}", "{t('login.submitBtn', 'Log In')}")

# Google button
content = content.replace("Sign up with Google", "Log in with Google")

# Bottom link
bottom_link_target = """              {t('signup.haveAccount', 'Already have an account?')} {' '}
              <button onClick={() => window.dispatchEvent(new Event('trigger-auth-dialog'))} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                {t('signup.logIn', 'Log In')}
              </button>"""

bottom_link_replacement = """              {t('login.noAccount', 'Don\\'t have an account?')} {' '}
              <button type="button" onClick={onSwitchToSignup} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                {t('login.signUp', 'Sign Up')}
              </button>"""
content = content.replace(bottom_link_target, bottom_link_replacement)

content = content.replace("or sign up with email", "or log in with email")

with open('LoginPage.tsx', 'w') as f:
    f.write(content)
print("LoginPage.tsx created and updated.")
