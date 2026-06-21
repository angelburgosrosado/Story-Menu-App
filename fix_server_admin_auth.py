with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("import * as admin from 'firebase-admin';", "import * as admin from 'firebase-admin';\nimport { getAuth } from 'firebase-admin/auth';")
content = content.replace("admin.auth().verifyIdToken(token)", "getAuth().verifyIdToken(token)")

with open('server.ts', 'w') as f:
    f.write(content)
