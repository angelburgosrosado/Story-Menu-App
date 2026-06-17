import re

i18n_path = '/Users/ABGlobalCEO/.gemini/antigravity/scratch/Story-Menu-App/i18n.ts'
with open(i18n_path, 'r') as f:
    content = f.read()

en_checkout = """
      checkout: {
        proLabel: "The Full Course (Pro)",
        proFeature1: "Secure Web Cloud Firestore database backing",
        proFeature2: "Dynamic 10-chapter Story Blueprints",
        proFeature3: "Priority Gemini-3 Image style anchors",
        proFeature4: "Limitless character biometric vault cards",
        proFeature5: "Multi-language custom voice output synthesis",
        entLabel: "The Multi-Course (Enterprise)",
        entFeature1: "Everything in Pro plan details",
        entFeature2: "UHD 4K Vector generation exports",
        entFeature3: "Custom model tuning weights",
        entFeature4: "Collaborative publishing workspaces",
        entFeature5: "Dedicated GCP priority endpoints",
        errEmail: "Please provide your emails coordinates for checkout registration.",
        errCard: "Please fill out all active credential requirements for card payment.",
        errPaypal: "Please fill out the secondary portal authorization requirement (PayPal Email).",
        successMsg: "Security simulation complete! Cloud architecture is upgrading your tier...",
        titleEditorial: "Upgrade Workspace",
        titleComic: "Upgrade Studio Tier",
        subtitleEditorial: "Unlock limitless generative tools and robust cloud integrations for your novel writing experience.",
        subtitleComic: "Unlock limitless generative tools and robust cloud integrations for your next epic comic series!",
        tabPro: "Pro",
        tabEnt: "Enterprise",
        paymentTitleEditorial: "Secure Checkout",
        paymentTitleComic: "Secure Transaction",
      },
      account: {"""

es_checkout = """
      checkout: {
        proLabel: "El Plato Principal (Pro)",
        proFeature1: "Respaldo seguro en base de datos Cloud Firestore",
        proFeature2: "Planos dinámicos de historia de 10 capítulos",
        proFeature3: "Anclas de estilo de imagen Gemini-3 prioritarias",
        proFeature4: "Tarjetas de bóveda biométrica de personajes ilimitadas",
        proFeature5: "Síntesis de salida de voz personalizada multilingüe",
        entLabel: "El Menú Degustación (Enterprise)",
        entFeature1: "Todo lo incluido en el plan Pro",
        entFeature2: "Exportaciones de generación vectorial UHD 4K",
        entFeature3: "Pesos de ajuste de modelo personalizados",
        entFeature4: "Espacios de trabajo de publicación colaborativa",
        entFeature5: "Endpoints prioritarios dedicados de GCP",
        errEmail: "Por favor, proporciona tus coordenadas de correo para el registro.",
        errCard: "Por favor, completa todos los requisitos para el pago con tarjeta.",
        errPaypal: "Por favor, completa el requisito de autorización del portal secundario (Correo de PayPal).",
        successMsg: "¡Simulación de seguridad completa! La arquitectura en la nube está actualizando tu nivel...",
        titleEditorial: "Actualizar Espacio de Trabajo",
        titleComic: "Actualizar Nivel del Estudio",
        subtitleEditorial: "Desbloquea herramientas generativas ilimitadas y robustas integraciones en la nube para tu experiencia de escritura.",
        subtitleComic: "¡Desbloquea herramientas generativas ilimitadas e integraciones en la nube para tu próxima serie de cómics!",
        tabPro: "Pro",
        tabEnt: "Enterprise",
        paymentTitleEditorial: "Pago Seguro",
        paymentTitleComic: "Transacción Segura",
      },
      account: {"""

ja_checkout = """
      checkout: {
        proLabel: "フルコース (Pro)",
        proFeature1: "セキュアなCloud Firestoreデータベースのバックアップ",
        proFeature2: "ダイナミックな10章のストーリーブループリント",
        proFeature3: "優先的なGemini-3イメージスタイルアンカー",
        proFeature4: "無制限のキャラクターバイオメトリック保管カード",
        proFeature5: "多言語カスタム音声出力合成",
        entLabel: "マルチコース (Enterprise)",
        entFeature1: "Proプランの詳細のすべて",
        entFeature2: "UHD 4K ベクター生成エクスポート",
        entFeature3: "カスタムモデルチューニングの重み付け",
        entFeature4: "コラボレーション出版ワークスペース",
        entFeature5: "専用のGCP優先エンドポイント",
        errEmail: "チェックアウト登録用のメールアドレスを入力してください。",
        errCard: "カード支払いの必須情報をすべて入力してください。",
        errPaypal: "セカンダリポータルの承認要件（PayPalメール）を入力してください。",
        successMsg: "セキュリティシミュレーション完了！クラウドアーキテクチャがあなたのティアをアップグレードしています...",
        titleEditorial: "ワークスペースをアップグレード",
        titleComic: "スタジオティアをアップグレード",
        subtitleEditorial: "小説執筆のための無限の生成ツールと堅牢なクラウド統合をアンロックしましょう。",
        subtitleComic: "次の壮大なコミックシリーズのために、無限の生成ツールとクラウド統合をアンロックしましょう！",
        tabPro: "Pro",
        tabEnt: "Enterprise",
        paymentTitleEditorial: "安全なチェックアウト",
        paymentTitleComic: "安全なトランザクション",
      },
      account: {"""

content = re.sub(r'en:\s*\{\s*translation:\s*\{\s*account:\s*\{', en_checkout, content)
content = re.sub(r'es:\s*\{\s*translation:\s*\{\s*account:\s*\{', es_checkout, content)
content = re.sub(r'ja:\s*\{\s*translation:\s*\{\s*account:\s*\{', ja_checkout, content)

with open(i18n_path, 'w') as f:
    f.write(content)
