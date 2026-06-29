with open("server.ts", "r") as f:
    code = f.read()

alter_queries = """
                    await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT');
                    await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS salt TEXT');
                    await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \\'admin\\'');
"""

# The CREATE TABLE block was:
create_block = """                    await pool.query(`
                        CREATE TABLE IF NOT EXISTS admin_users (
                            username VARCHAR(255) PRIMARY KEY,
                            password_hash TEXT NOT NULL,
                            salt TEXT NOT NULL,
                            role VARCHAR(50) DEFAULT 'admin',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);"""

# Replace it with CREATE + ALTER
new_block = create_block + alter_queries

code = code.replace(create_block, new_block)

with open("server.ts", "w") as f:
    f.write(code)

print("server.ts patched to alter admin_users table dynamically.")
