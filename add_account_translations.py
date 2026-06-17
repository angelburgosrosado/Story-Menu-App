import re

i18n_path = '/Users/ABGlobalCEO/.gemini/antigravity/scratch/Story-Menu-App/i18n.ts'
with open(i18n_path, 'r') as f:
    content = f.read()

en_account = """
      account: {
        createAuthorEditorial: "Create Author Profile",
        signInEditorial: "Sign In to Journal",
        createAuthorComic: "Create Creator Key",
        signInComic: "Access Studio",
        descEditorial: "Save your manuscripts, character profiles, and story blueprints to the cloud.",
        descComic: "Save your generated comics and custom character bibles to the cloud!",
        successEditorial: "Author profile created! Signing in…",
        successComic: "Creative Portal unlocked! Logging in...",
        errEmailInUseEditorial: "This email is already registered. Please sign in.",
        errEmailInUseComic: "This email key is already registered. Please login.",
        errWrongPasswordEditorial: "Incorrect credentials. Please try again.",
        errWrongPasswordComic: "Invalid credentials. Please recheck security keys.",
        errFallback: "Authentication sequence failed.",
        errPenNameEditorial: "Please enter your pen name.",
        errPenNameComic: "Please project a Creator Name.",
        errEmpty: "Please fill in all credentials.",
        penNameEditorial: "Pen Name",
        penNameComic: "Creator Name",
        emailEditorial: "Email Address",
        emailComic: "Transmission Vector (Email)",
        passwordEditorial: "Password",
        passwordComic: "Security Passkey",
        createBtnEditorial: "Create Profile",
        createBtnComic: "Initiate Sequence",
        signInBtnEditorial: "Sign In",
        signInBtnComic: "Enter Studio",
        googleEditorial: "Continue with Google",
        googleComic: "Authenticate via Google",
        toggleToSignInEditorial: "Already have a profile? Sign In",
        toggleToSignInComic: "Have a key? Login",
        toggleToSignUpEditorial: "No profile? Create one",
        toggleToSignUpComic: "Need a key? Sign Up",
      },
      setup: {"""

es_account = """
      account: {
        createAuthorEditorial: "Crear Perfil de Autor",
        signInEditorial: "Iniciar Sesión en el Diario",
        createAuthorComic: "Crear Clave de Creador",
        signInComic: "Acceder al Estudio",
        descEditorial: "Guarda tus manuscritos, perfiles de personajes y planos de historia en la nube.",
        descComic: "¡Guarda tus cómics generados y biblias de personajes personalizadas en la nube!",
        successEditorial: "¡Perfil de autor creado! Iniciando sesión…",
        successComic: "¡Portal Creativo desbloqueado! Iniciando sesión...",
        errEmailInUseEditorial: "Este correo ya está registrado. Por favor, inicia sesión.",
        errEmailInUseComic: "Esta clave de correo ya está registrada. Por favor, inicia sesión.",
        errWrongPasswordEditorial: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
        errWrongPasswordComic: "Credenciales inválidas. Por favor, revisa las claves de seguridad.",
        errFallback: "La secuencia de autenticación falló.",
        errPenNameEditorial: "Por favor, introduce tu seudónimo.",
        errPenNameComic: "Por favor, proyecta un Nombre de Creador.",
        errEmpty: "Por favor, rellena todas las credenciales.",
        penNameEditorial: "Seudónimo",
        penNameComic: "Nombre de Creador",
        emailEditorial: "Dirección de Correo",
        emailComic: "Vector de Transmisión (Correo)",
        passwordEditorial: "Contraseña",
        passwordComic: "Clave de Seguridad",
        createBtnEditorial: "Crear Perfil",
        createBtnComic: "Iniciar Secuencia",
        signInBtnEditorial: "Iniciar Sesión",
        signInBtnComic: "Entrar al Estudio",
        googleEditorial: "Continuar con Google",
        googleComic: "Autenticar vía Google",
        toggleToSignInEditorial: "¿Ya tienes un perfil? Inicia Sesión",
        toggleToSignInComic: "¿Tienes una clave? Inicia Sesión",
        toggleToSignUpEditorial: "¿No tienes perfil? Crea uno",
        toggleToSignUpComic: "¿Necesitas una clave? Regístrate",
      },
      setup: {"""

ja_account = """
      account: {
        createAuthorEditorial: "著者プロフィールの作成",
        signInEditorial: "ジャーナルにサインイン",
        createAuthorComic: "クリエイターキーの作成",
        signInComic: "スタジオにアクセス",
        descEditorial: "原稿、キャラクタープロフィール、ストーリーブループリントをクラウドに保存します。",
        descComic: "生成されたコミックやカスタムキャラクターバイブルをクラウドに保存しましょう！",
        successEditorial: "著者プロフィールが作成されました！サインイン中…",
        successComic: "クリエイティブポータルがアンロックされました！ログイン中...",
        errEmailInUseEditorial: "このメールは既に登録されています。サインインしてください。",
        errEmailInUseComic: "このメールキーは既に登録されています。ログインしてください。",
        errWrongPasswordEditorial: "認証情報が正しくありません。もう一度お試しください。",
        errWrongPasswordComic: "無効な認証情報です。セキュリティキーを再確認してください。",
        errFallback: "認証シーケンスに失敗しました。",
        errPenNameEditorial: "ペンネームを入力してください。",
        errPenNameComic: "クリエイター名を入力してください。",
        errEmpty: "すべての認証情報を入力してください。",
        penNameEditorial: "ペンネーム",
        penNameComic: "クリエイター名",
        emailEditorial: "メールアドレス",
        emailComic: "伝送ベクトル（メール）",
        passwordEditorial: "パスワード",
        passwordComic: "セキュリティパスキー",
        createBtnEditorial: "プロフィールを作成",
        createBtnComic: "シーケンスを開始",
        signInBtnEditorial: "サインイン",
        signInBtnComic: "スタジオに入る",
        googleEditorial: "Googleで続行",
        googleComic: "Google経由で認証",
        toggleToSignInEditorial: "すでにプロフィールをお持ちですか？ サインイン",
        toggleToSignInComic: "キーをお持ちですか？ ログイン",
        toggleToSignUpEditorial: "プロフィールがない？ 作成する",
        toggleToSignUpComic: "キーが必要ですか？ サインアップ",
      },
      setup: {"""

content = re.sub(r'en:\s*\{\s*translation:\s*\{\s*setup:\s*\{', en_account, content)
content = re.sub(r'es:\s*\{\s*translation:\s*\{\s*setup:\s*\{', es_account, content)
content = re.sub(r'ja:\s*\{\s*translation:\s*\{\s*setup:\s*\{', ja_account, content)

with open(i18n_path, 'w') as f:
    f.write(content)
