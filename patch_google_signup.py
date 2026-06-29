import re

with open('SignupPage.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
if "signInWithGoogle" not in content:
    content = content.replace("import { auth, db } from './firebase';", "import { auth, db, signInWithGoogle } from './firebase';")

# 2. Add handleGoogleSignup
google_handler = """  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Store in Firestore for future connections
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || 'Google User',
        createdAt: new Date().toISOString(),
        tier: 'Free',
        tokenBalance: 50
      }, { merge: true });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {"""

content = content.replace("  const handleSignup = async (e: React.FormEvent) => {", google_handler)

# 3. Add UI Button
# We find the button and add a divider + Google button
button_html = """              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
            <span className="text-xs text-center text-gray-400 uppercase">or sign up with email</span>
            <span className="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
          </div>"""

# Let's adjust where the divider goes. Actually "or sign up with" makes sense below the form.
divider_and_google = """              )}
            </button>
            
            <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-white/10 after:mt-0.5 after:flex-1 after:border-t after:border-white/10">
              <p className="mx-4 mb-0 text-center text-sm font-semibold text-gray-400">
                OR
              </p>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg bg-white text-slate-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>
            
          </form>"""

content = content.replace("              )}\n            </button>\n          </form>", divider_and_google)

with open('SignupPage.tsx', 'w') as f:
    f.write(content)
print("Added Google sign up to SignupPage.tsx")
