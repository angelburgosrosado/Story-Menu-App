const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function addAdmin(email) {
    const defaultPassword = "AdminUser123!"; // Temporary secure password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(defaultPassword, salt);
    
    try {
        await pool.query('INSERT INTO admin_users (username, password_hash, salt, role) VALUES ($1, $2, $3, $4)', [email, hash, salt, 'admin']);
        console.log(`Added admin: ${email}`);
    } catch(e) {
        if (e.code === '23505') { // Unique violation
            console.log(`Admin ${email} already exists.`);
        } else {
            console.error(`Error adding ${email}:`, e);
        }
    }
}

async function run() {
    await addAdmin('abglco@protonmail.com');
    await addAdmin('angelburgosrosado@gmail.com');
    pool.end();
}

run();
