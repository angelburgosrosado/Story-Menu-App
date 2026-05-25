import pg from 'pg';
import net from 'net';

const { Pool } = pg;
const connectionString = "postgresql://angelburgosrosado:75727572Ab%21@136.116.100.202:5432/comics-v1";

console.log("🔍 Direct Connection Diagnostics Script Started");
console.log(`📡 URL target: postgresql://angelburgosrosado:******@136.116.100.202:5432/comics-v1`);

async function run() {
    // 1. Parse URL manually
    console.log("\n--- Phase 1: Parsing connection URL ---");
    try {
        const doubleSlashIdx = connectionString.indexOf('://');
        const rest = connectionString.substring(doubleSlashIdx + 3);
        const firstSlashInRest = rest.indexOf('/');
        const authority = firstSlashInRest === -1 ? rest : rest.substring(0, firstSlashInRest);
        const dbName = firstSlashInRest === -1 ? '' : rest.substring(firstSlashInRest + 1);
        
        const lastAtIdx = authority.lastIndexOf('@');
        const credentials = authority.substring(0, lastAtIdx);
        const hostPort = authority.substring(lastAtIdx + 1);
        
        const lastColonInHostPort = hostPort.lastIndexOf(':');
        const host = lastColonInHostPort === -1 ? hostPort : hostPort.substring(0, lastColonInHostPort);
        const port = lastColonInHostPort === -1 ? 5432 : parseInt(hostPort.substring(lastColonInHostPort + 1), 10);
        
        const colonInCreds = credentials.indexOf(':');
        const user = colonInCreds === -1 ? credentials : credentials.substring(0, colonInCreds);
        const password = colonInCreds === -1 ? '' : decodeURIComponent(credentials.substring(colonInCreds + 1));
        const rawPassword = colonInCreds === -1 ? '' : credentials.substring(colonInCreds + 1);

        console.log(`✅ Parsed Host: "${host}"`);
        console.log(`✅ Parsed Port: ${port}`);
        console.log(`✅ Parsed User: "${user}"`);
        console.log(`✅ Parsed DB Name: "${dbName}"`);
        console.log(`✅ Password Decoded Length: ${password.length} characters`);
        console.log(`✅ Password Raw Length: ${rawPassword.length} characters`);

        // 2. Perform TCP socket ping
        console.log("\n--- Phase 2: Testing TCP port reachability (firewall check) ---");
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        const tcpPromise = new Promise<{ ok: boolean; error?: string }>((resolve) => {
            socket.on('connect', () => {
                socket.destroy();
                resolve({ ok: true });
            });
            socket.on('timeout', () => {
                socket.destroy();
                resolve({ ok: false, error: 'TIMEOUT (5000ms) - No reply was received from host. The database port is likely blocked by a firewall or router.' });
            });
            socket.on('error', (err: any) => {
                socket.destroy();
                resolve({ ok: false, error: err.message || 'SOCKET ERROR - Network connection was interrupted.' });
            });
            socket.connect(port, host);
        });

        const tcpResult = await tcpPromise;
        if (!tcpResult.ok) {
            console.error(`❌ TCP connection failed: ${tcpResult.error}`);
            console.error("\n💡 ANALYSIS: This indicates a network or firewall block. The host 136.116.100.202 is either offline, not accepting connection requests on port 5432, or its firewall/security lists have not whitelisted the Cloud Run container.");
            process.exit(1);
        }
        console.log("✅ TCP network socket successfully CONNECTED! Port is open and reachable.");

        // 3. Test pg Authenticity Handshake
        console.log("\n--- Phase 3: Testing database handshake with decoded credentials ---");
        const poolDecoded = new Pool({
            user,
            password,
            host,
            port,
            database: dbName,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            console.log("Trying connection with decoded password...");
            const client = await poolDecoded.connect();
            console.log("✅ Decoded password connected successfully!");
            const res = await client.query('SELECT version();');
            console.log(`💡 PG Database Version: ${res.rows[0].version}`);
            client.release();
            await poolDecoded.end();
            process.exit(0);
        } catch (decodedErr: any) {
            console.warn(`⚠️ Connection with decoded password failed: ${decodedErr.message}`);
            await poolDecoded.end();

            // Attempt raw password
            console.log("\nTrying connection with raw (un-decoded) password...");
            const poolRaw = new Pool({
                user,
                password: rawPassword,
                host,
                port,
                database: dbName,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000
            });

            try {
                const client = await poolRaw.connect();
                console.log("✅ Raw password connected successfully!");
                const res = await client.query('SELECT version();');
                console.log(`💡 PG Database Version: ${res.rows[0].version}`);
                client.release();
                await poolRaw.end();
                process.exit(0);
            } catch (rawErr: any) {
                console.error(`❌ Connection with raw password also failed: ${rawErr.message}`);
                await poolRaw.end();
                console.error("\n💡 ANALYSIS: The host port is open, but PostgreSQL rejected the login credentials. Please check that the username, password, or database name are exactly correct on the database server.");
                process.exit(1);
            }
        }

    } catch (e: any) {
        console.error("\n🚨 Unexpected exception in diagnostic script:");
        console.error(e.stack || e.message || e);
        process.exit(1);
    }
}

run();
