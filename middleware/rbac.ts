/**
 * RBAC Middleware — Task 2.6
 * Role-Based Access Control with Firestore-backed roles.
 * Roles: viewer, creator, moderator, admin, super_admin
 */

type Role = 'viewer' | 'creator' | 'moderator' | 'admin' | 'super_admin';

const ROLE_HIERARCHY: Record<Role, number> = {
    viewer: 0,
    creator: 1,
    moderator: 2,
    admin: 3,
    super_admin: 4,
};

/**
 * Check if a user's role meets the minimum required level.
 */
export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
    if (!userRole) return false;
    const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999;
    return userLevel >= requiredLevel;
}

/**
 * Express middleware that enforces minimum role requirement.
 * Reads role from Firestore users collection.
 * Usage: app.get('/api/admin/users', requireRole('moderator'), handler)
 */
export function requireRole(minimumRole: Role) {
    return async (req: any, res: any, next: any) => {
        const email = req.adminEmail || req.headers['x-admin-email'] || req.query?.email;
        if (!email) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            const { getFirestore } = await import('firebase-admin/firestore');
            const db = getFirestore();
            const snapshot = await db.collection('users').where('email', '==', email).get();
            
            if (snapshot.empty) {
                // Check bootstrap env
                const bootstrapEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
                if (bootstrapEmails.includes(email.toLowerCase())) {
                    req.userRole = 'super_admin';
                    return next();
                }
                return res.status(403).json({ error: 'User not found' });
            }

            const userData = snapshot.docs[0].data();
            const userRole = userData.role || 'viewer';

            if (!hasRole(userRole, minimumRole)) {
                return res.status(403).json({ 
                    error: `Insufficient permissions. Required: ${minimumRole}, your role: ${userRole}` 
                });
            }

            req.userRole = userRole;
            next();
        } catch (err: any) {
            console.error('[RBAC] Role check failed:', err.message);
            return res.status(500).json({ error: 'Permission check failed' });
        }
    };
}

/**
 * Middleware that requires exact role match (not hierarchical).
 * Usage: app.post('/api/admin/settings', requireExactRole('super_admin'), handler)
 */
export function requireExactRole(exactRole: Role) {
    return async (req: any, res: any, next: any) => {
        const email = req.adminEmail || req.headers['x-admin-email'] || req.query?.email;
        if (!email) return res.status(401).json({ error: 'Authentication required' });

        try {
            const { getFirestore } = await import('firebase-admin/firestore');
            const db = getFirestore();
            const snapshot = await db.collection('users').where('email', '==', email).get();
            
            if (snapshot.empty) return res.status(403).json({ error: 'User not found' });
            
            const userRole = snapshot.docs[0].data().role || 'viewer';
            if (userRole !== exactRole) {
                return res.status(403).json({ error: `Requires exact role: ${exactRole}` });
            }

            req.userRole = userRole;
            next();
        } catch (err: any) {
            return res.status(500).json({ error: 'Permission check failed' });
        }
    };
}
