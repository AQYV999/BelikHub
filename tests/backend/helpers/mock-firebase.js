// tests/backend/helpers/mock-firebase.js
// In-memory test doubles for Firebase Admin SDK and HTTP req/res

let idCounter = 1;
function generateId(prefix = 'doc') {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

function getField(obj, path) {
  if (!obj || !path) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr == null) return undefined;
    curr = curr[part];
  }
  return curr;
}

export const FieldValue = {
  increment(n) {
    return { _methodName: 'FieldValue.increment', operand: n };
  },
  serverTimestamp() {
    const now = new Date();
    return {
      _methodName: 'FieldValue.serverTimestamp',
      toDate: () => now,
      toMillis: () => now.getTime(),
      toISOString: () => now.toISOString()
    };
  }
};

export function createMockRes() {
  const headers = {};
  const res = {
    statusCode: 200,
    headers,
    body: null,
    ended: false,
    setHeader(name, value) {
      headers[name] = value;
      headers[name.toLowerCase()] = value;
      return res;
    },
    getHeader(name) {
      return headers[name] ?? headers[name.toLowerCase()];
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      res.ended = true;
      return res;
    },
    send(data) {
      res.body = data;
      res.ended = true;
      return res;
    },
    end(data) {
      if (data !== undefined) res.body = data;
      res.ended = true;
      return res;
    }
  };
  return res;
}

export function createMockReq(opts = {}) {
  const rawHeaders = opts.headers || {};
  const headers = new Proxy(rawHeaders, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop];
      const lower = prop.toLowerCase();
      for (const key of Object.keys(target)) {
        if (key.toLowerCase() === lower) {
          return target[key];
        }
      }
      return undefined;
    }
  });

  return {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? opts.body : {},
    query: opts.query || {},
    url: opts.url || '/',
    ...opts
  };
}

export function createMockAuth(initialUsers = {}) {
  const users = new Map();

  function registerUser(u) {
    users.set(u.uid, {
      uid: u.uid,
      email: u.email || `${u.uid}@example.com`,
      displayName: u.displayName || u.name || null,
      emailVerified: u.emailVerified ?? false,
      phoneNumber: u.phoneNumber || null,
      customClaims: u.customClaims || {},
      metadata: u.metadata || {
        creationTime: '2026-01-01T00:00:00.000Z',
        lastSignInTime: '2026-01-02T00:00:00.000Z'
      }
    });
  }

  if (Array.isArray(initialUsers)) {
    for (const u of initialUsers) registerUser(u);
  } else if (initialUsers && typeof initialUsers === 'object') {
    for (const [uid, u] of Object.entries(initialUsers)) {
      registerUser({ uid, ...u });
    }
  }

  return {
    async verifyIdToken(idToken, _checkRevoked) {
      if (!idToken || typeof idToken !== 'string') {
        const err = new Error('Missing or invalid token');
        err.code = 'auth/invalid-id-token';
        throw err;
      }
      if (idToken.startsWith('invalid') || idToken === 'expired') {
        const err = new Error('Invalid or expired authentication token');
        err.code = 'auth/id-token-expired';
        throw err;
      }
      if (idToken.startsWith('{')) {
        try {
          return JSON.parse(idToken);
        } catch {
          // continue
        }
      }

      const uid = idToken.startsWith('mock-token-') ? idToken.slice(11) : idToken;
      const user = users.get(uid);
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          email_verified: user.emailVerified,
          ...user.customClaims
        };
      }

      return {
        uid,
        email: `${uid}@example.com`,
        email_verified: true
      };
    },

    async getUser(uid) {
      const user = users.get(uid);
      if (!user) {
        const err = new Error(`User with uid ${uid} not found`);
        err.code = 'auth/user-not-found';
        throw err;
      }
      return structuredClone(user);
    },

    async setCustomUserClaims(uid, claims) {
      const user = users.get(uid);
      if (user) {
        user.customClaims = { ...(claims || {}) };
      } else {
        registerUser({ uid, customClaims: { ...(claims || {}) } });
      }
    },

    async listUsers(maxResults = 1000, _pageToken) {
      return {
        users: Array.from(users.values()).slice(0, maxResults).map((u) => structuredClone(u)),
        pageToken: undefined
      };
    }
  };
}

export function createMockStorage() {
  const buckets = new Map();

  return {
    bucket(name = 'default-bucket') {
      if (!buckets.has(name)) {
        buckets.set(name, new Map());
      }
      const files = buckets.get(name);

      return {
        name,
        file(objectPath) {
          return {
            name: objectPath,
            async save(content, options = {}) {
              files.set(objectPath, {
                content: Buffer.isBuffer(content) ? content : Buffer.from(content),
                metadata: options.metadata || {},
                contentType: options.contentType || 'application/octet-stream',
                updatedAt: new Date().toISOString()
              });
            },
            async getSignedUrl(options = {}) {
              return [
                `https://storage.googleapis.com/${name}/${encodeURI(objectPath)}?mock-signed=true&expires=${options.expires || ''}`
              ];
            },
            async exists() {
              return [files.has(objectPath)];
            },
            async download() {
              const file = files.get(objectPath);
              if (!file) throw new Error(`File ${objectPath} not found`);
              return [file.content];
            },
            async delete() {
              files.delete(objectPath);
            }
          };
        }
      };
    }
  };
}

export function createMockDb(seedCollections = {}) {
  // Map<collectionName, Map<docId, data>>
  const store = new Map();

  function getCollMap(collName) {
    if (!store.has(collName)) {
      store.set(collName, new Map());
    }
    return store.get(collName);
  }

  // Populate seeds
  for (const [collName, docs] of Object.entries(seedCollections)) {
    const collMap = getCollMap(collName);
    if (Array.isArray(docs)) {
      for (const d of docs) {
        const id = d.id || generateId(collName);
        collMap.set(id, structuredClone(d));
      }
    } else if (docs && typeof docs === 'object') {
      for (const [id, d] of Object.entries(docs)) {
        collMap.set(id, structuredClone({ id, ...d }));
      }
    }
  }

  function applyValue(target, key, val) {
    if (val && val._methodName === 'FieldValue.increment') {
      target[key] = (Number(target[key]) || 0) + val.operand;
    } else if (val && val._methodName === 'FieldValue.serverTimestamp') {
      const now = new Date();
      target[key] = {
        toDate: () => now,
        toMillis: () => now.getTime(),
        toISOString: () => now.toISOString()
      };
    } else {
      target[key] = structuredClone(val);
    }
  }

  function createDocRef(collName, id) {
    return {
      id,
      path: `${collName}/${id}`,
      parent: { id: collName },
      async get() {
        const coll = getCollMap(collName);
        const data = coll.get(id);
        const exists = data !== undefined;
        return {
          id,
          exists,
          data: () => (exists ? structuredClone(data) : undefined)
        };
      },
      async set(newData, options = {}) {
        const coll = getCollMap(collName);
        if (options.merge && coll.has(id)) {
          const existing = coll.get(id);
          for (const [k, v] of Object.entries(newData)) {
            applyValue(existing, k, v);
          }
        } else {
          const docData = { id };
          for (const [k, v] of Object.entries(newData)) {
            applyValue(docData, k, v);
          }
          coll.set(id, docData);
        }
      },
      async update(updateData) {
        const coll = getCollMap(collName);
        if (!coll.has(id)) {
          const err = new Error(`No document to update: ${collName}/${id}`);
          err.code = 5;
          throw err;
        }
        const existing = coll.get(id);
        for (const [k, v] of Object.entries(updateData)) {
          applyValue(existing, k, v);
        }
      },
      async delete() {
        const coll = getCollMap(collName);
        coll.delete(id);
      }
    };
  }

  function createQuery(collName, wheres = [], orderBys = [], limitCount = null) {
    return {
      where(fieldPath, opStr, value) {
        return createQuery(collName, [...wheres, { fieldPath, opStr, value }], orderBys, limitCount);
      },
      orderBy(fieldPath, direction = 'asc') {
        return createQuery(collName, wheres, [...orderBys, { fieldPath, direction }], limitCount);
      },
      limit(n) {
        return createQuery(collName, wheres, orderBys, n);
      },
      doc(id) {
        const docId = id || generateId(collName);
        return createDocRef(collName, docId);
      },
      async add(data) {
        const id = data.id || generateId(collName);
        const ref = createDocRef(collName, id);
        await ref.set(data);
        return ref;
      },
      async get() {
        const coll = getCollMap(collName);
        let items = Array.from(coll.entries()).map(([id, data]) => ({ id, ...structuredClone(data) }));

        // Filter
        for (const w of wheres) {
          items = items.filter((item) => {
            const actual = getField(item, w.fieldPath);
            if (w.opStr === '==' || w.opStr === '=') {
              return actual === w.value;
            }
            if (w.opStr === 'in') {
              return Array.isArray(w.value) && w.value.includes(actual);
            }
            if (w.opStr === '!=') {
              return actual !== w.value;
            }
            if (w.opStr === 'array-contains') {
              return Array.isArray(actual) && actual.includes(w.value);
            }
            return true;
          });
        }

        // Sort
        if (orderBys.length > 0) {
          items.sort((a, b) => {
            for (const ob of orderBys) {
              const valA = getField(a, ob.fieldPath);
              const valB = getField(b, ob.fieldPath);
              const dir = ob.direction?.toLowerCase() === 'desc' ? -1 : 1;
              if (valA === valB) continue;
              if (valA == null) return 1;
              if (valB == null) return -1;
              if (valA > valB) return dir;
              if (valA < valB) return -dir;
            }
            return 0;
          });
        }

        // Limit
        if (typeof limitCount === 'number' && limitCount >= 0) {
          items = items.slice(0, limitCount);
        }

        const docs = items.map((item) => ({
          id: item.id,
          ref: createDocRef(collName, item.id),
          exists: true,
          data: () => structuredClone(item)
        }));

        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          forEach(cb) {
            docs.forEach(cb);
          }
        };
      }
    };
  }

  const db = {
    collection(name) {
      return createQuery(name);
    },
    async runTransaction(updateFn) {
      const stagedWrites = [];

      const tx = {
        async get(docRef) {
          return await docRef.get();
        },
        set(docRef, data, options) {
          stagedWrites.push(async () => {
            await docRef.set(data, options);
          });
        },
        update(docRef, data) {
          stagedWrites.push(async () => {
            await docRef.update(data);
          });
        },
        delete(docRef) {
          stagedWrites.push(async () => {
            await docRef.delete();
          });
        }
      };

      const result = await updateFn(tx);
      for (const write of stagedWrites) {
        await write();
      }
      return result;
    }
  };

  return db;
}
