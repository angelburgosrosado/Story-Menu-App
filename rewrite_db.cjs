const fs = require('fs');

let content = fs.readFileSync('db.ts', 'utf8');

// Replace setDoc
content = content.replace(/setDoc\(doc\(db,\s*([^,]+),\s*([^)]+)\),\s*([^,)]+)(?:,\s*([^)]+))?\)/g, (match, p1, p2, p3, p4) => {
    let res = `db.collection(${p1}).doc(${p2}).set(${p3}`;
    if (p4) res += `, ${p4}`;
    res += `)`;
    return res;
});

// Replace collection(db, 'users', userId, 'characters') -> this is harder, let's just do manual string replace
content = content.replace(/setDoc\(doc\(db,\s*'users',\s*user_id,\s*'characters',\s*id\),\s*([^)]+)\)/g, `db.collection('users').doc(user_id).collection('characters').doc(id).set($1)`);

content = content.replace(/getDocs\(collection\(db,\s*'users',\s*userId,\s*'characters'\)\)/g, `db.collection('users').doc(userId).collection('characters').get()`);
content = content.replace(/getDocs\(collection\(db,\s*'users',\s*userId,\s*'projects'\)\)/g, `db.collection('users').doc(userId).collection('projects').get()`);
content = content.replace(/setDoc\(doc\(db,\s*'users',\s*user_id,\s*'projects',\s*id\),\s*([^)]+)\)/g, `db.collection('users').doc(user_id).collection('projects').doc(id).set($1)`);


// Replace updateDoc
content = content.replace(/updateDoc\(doc\(db,\s*([^,]+),\s*([^)]+)\),\s*([^)]+)\)/g, `db.collection($1).doc($2).update($3)`);

// Replace getDocs(collection(db, X))
content = content.replace(/getDocs\(collection\(db,\s*([^)]+)\)\)/g, `db.collection($1).get()`);

// Replace getDocs(query(collection(db, X), where(Y, '==', Z)))
content = content.replace(/getDocs\(query\(collection\(db,\s*([^)]+)\),\s*where\(([^,]+),\s*'==',\s*([^)]+)\)\)\)/g, `db.collection($1).where($2, '==', $3).get()`);

// Replace deleteDoc(d.ref)
content = content.replace(/deleteDoc\(([^)]+)\)/g, `$1.delete()`);

// FieldValue.increment
content = content.replace(/increment\(/g, `FieldValue.increment(`);


fs.writeFileSync('db.ts', content);
console.log('Done rewriting db.ts');
