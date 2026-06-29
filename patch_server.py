with open("server.ts", "r") as f:
    code = f.read()

create_query = """
                    await pool.query(`
                        CREATE TABLE IF NOT EXISTS admin_users (
                            username VARCHAR(255) PRIMARY KEY,
                            password_hash TEXT NOT NULL,
                            salt TEXT NOT NULL,
                            role VARCHAR(50) DEFAULT 'admin',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
"""

# Inject before SELECT in GET
code = code.replace(
    "const { rows } = await pool.query('SELECT username, role, created_at FROM admin_users');",
    create_query + "\n                    const { rows } = await pool.query('SELECT username, role, created_at FROM admin_users');"
)

# Inject before SELECT in auth
code = code.replace(
    "const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);",
    create_query + "\n                    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);"
)

# Inject before INSERT in POST
code = code.replace(
    "await pool.query('INSERT INTO admin_users",
    create_query + "\n                    await pool.query('INSERT INTO admin_users"
)

with open("server.ts", "w") as f:
    f.write(code)

print("server.ts patched to create admin_users table dynamically.")
