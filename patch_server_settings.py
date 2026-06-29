import re

with open('server.ts', 'r') as f:
    code = f.read()

# 1. Update GET schema check and query
old_get = r"await pool\.query\(`CREATE TABLE IF NOT EXISTS app_settings \(key_name VARCHAR\(100\) PRIMARY KEY, key_value TEXT NOT NULL, is_secret BOOLEAN DEFAULT false, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\)`\);\n\s*const result = await pool\.query\('SELECT key_name as \"keyName\", key_value as \"keyValue\", is_secret as \"isSecret\" FROM app_settings'\);"
new_get = """await pool.query(`CREATE TABLE IF NOT EXISTS app_settings (key_name VARCHAR(100) PRIMARY KEY, key_value TEXT NOT NULL, is_secret BOOLEAN DEFAULT false, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            await pool.query(`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS description TEXT`);
            const result = await pool.query('SELECT key_name as "keyName", key_value as "keyValue", is_secret as "isSecret", description FROM app_settings');"""
code = re.sub(old_get, new_get, code)

# 2. Update POST parameters and insert query
old_post = r"app\.post\('/api/admin/settings', async \(req, res\): Promise<any> => \{\n\s*const \{ keyName, keyValue, isSecret \} = req\.body;"
new_post = """app.post('/api/admin/settings', async (req, res): Promise<any> => {
        const { keyName, keyValue, isSecret, description } = req.body;"""
code = re.sub(old_post, new_post, code)

old_db_insert = r"await pool\.query\(\n\s*'INSERT INTO app_settings \(key_name, key_value, is_secret\) VALUES \(\$1, \$2, \$3\) ON CONFLICT \(key_name\) DO UPDATE SET key_value = EXCLUDED\.key_value, is_secret = EXCLUDED\.is_secret, updated_at = CURRENT_TIMESTAMP',\n\s*\[keyName, keyValue, isSecret\]\n\s*\);"
new_db_insert = """await pool.query(
                'INSERT INTO app_settings (key_name, key_value, is_secret, description) VALUES ($1, $2, $3, $4) ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value, is_secret = EXCLUDED.is_secret, description = COALESCE(EXCLUDED.description, app_settings.description), updated_at = CURRENT_TIMESTAMP',
                [keyName, keyValue, isSecret, description]
            );"""
code = re.sub(old_db_insert, new_db_insert, code)

with open('server.ts', 'w') as f:
    f.write(code)

print("server.ts patched")
