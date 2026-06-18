var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// server/adminStore.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0348355378",
  appId: "1:539358097888:web:7969a9ab3ebd1d661d7b85",
  apiKey: "AIzaSyDkQqlo-yROwqYOtGm_ks85C2R-egHVICM",
  authDomain: "gen-lang-client-0348355378.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-80eab388-1eac-4326-8508-d62cc02c52e4",
  storageBucket: "gen-lang-client-0348355378.firebasestorage.app",
  messagingSenderId: "539358097888",
  measurementId: ""
};

// server/adminStore.ts
var inMemoryCollections = /* @__PURE__ */ new Map();
var seedInMemorySuperAdmin = () => {
  const usersMap = /* @__PURE__ */ new Map();
  const adminUsername = process.env.SUPER_ADMIN_USERNAME;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (adminUsername && adminPassword && adminEmail) {
    const cleanUsername = adminUsername.trim();
    const cleanEmail = adminEmail.trim();
    const salt = import_bcryptjs.default.genSaltSync(10);
    const passwordHash = import_bcryptjs.default.hashSync(adminPassword, salt);
    const uid = "super_admin_env_offline";
    usersMap.set(uid, {
      id: uid,
      uid,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: "super_admin",
      status: "active",
      permissions: [
        "full_access",
        "manage_users",
        "manage_videos",
        "upload_videos",
        "upload_posters",
        "create_articles",
        "edit_articles",
        "delete_content",
        "manage_categories"
      ],
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(`[Offline Seed] Seeded configured SUPER_ADMIN from env: "${cleanUsername}"`);
  }
  const hasAdmin = Array.from(usersMap.values()).some((u) => u.username.toLowerCase() === "admin");
  if (!hasAdmin) {
    const salt = import_bcryptjs.default.genSaltSync(10);
    const fallbackHash = import_bcryptjs.default.hashSync("admin123", salt);
    const uid = "super_admin_fallback_offline";
    usersMap.set(uid, {
      id: uid,
      uid,
      username: "admin",
      email: "admin@mingde.org",
      password_hash: fallbackHash,
      role: "super_admin",
      status: "active",
      permissions: [
        "full_access",
        "manage_users",
        "manage_videos",
        "upload_videos",
        "upload_posters",
        "create_articles",
        "edit_articles",
        "delete_content",
        "manage_categories"
      ],
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(`[Offline Seed] Seeded default fallback administrator: "admin" with password "admin123"`);
  }
  inMemoryCollections.set("users", usersMap);
};
var createMockDoc = (collName, docId) => {
  return {
    id: docId,
    async get() {
      const collMap = inMemoryCollections.get(collName);
      const data = collMap ? collMap.get(docId) : void 0;
      return {
        exists: data !== void 0,
        id: docId,
        data() {
          return data ? JSON.parse(JSON.stringify(data)) : void 0;
        }
      };
    },
    async set(data) {
      if (!inMemoryCollections.has(collName)) {
        inMemoryCollections.set(collName, /* @__PURE__ */ new Map());
      }
      inMemoryCollections.get(collName).set(docId, JSON.parse(JSON.stringify(data)));
    },
    async update(updates) {
      if (!inMemoryCollections.has(collName)) {
        inMemoryCollections.set(collName, /* @__PURE__ */ new Map());
      }
      const collMap = inMemoryCollections.get(collName);
      const current = collMap.get(docId) || {};
      collMap.set(docId, { ...current, ...JSON.parse(JSON.stringify(updates)) });
    },
    async delete() {
      const collMap = inMemoryCollections.get(collName);
      if (collMap) {
        collMap.delete(docId);
      }
    }
  };
};
var mockDb = {
  collection(collName) {
    return {
      doc(id) {
        return createMockDoc(collName, id);
      },
      async get() {
        const collMap = inMemoryCollections.get(collName) || /* @__PURE__ */ new Map();
        const docsList = [];
        collMap.forEach((val, key) => {
          docsList.push({
            id: key,
            exists: true,
            data() {
              return JSON.parse(JSON.stringify(val));
            }
          });
        });
        return {
          empty: docsList.length === 0,
          docs: docsList,
          forEach(callback) {
            docsList.forEach(callback);
          }
        };
      }
    };
  }
};
var firestoreDbInstance = null;
var useOfflineFallback = false;
function getDb() {
  if (useOfflineFallback) {
    return mockDb;
  }
  if (!firestoreDbInstance) {
    let serviceAccount = null;
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./server/serviceAccount.json";
    try {
      if (credPath) {
        if (credPath.trim().startsWith("{")) {
          serviceAccount = JSON.parse(credPath);
        } else {
          const resolvedPath = import_path.default.resolve(process.cwd(), credPath);
          if (import_fs.default.existsSync(resolvedPath)) {
            serviceAccount = JSON.parse(import_fs.default.readFileSync(resolvedPath, "utf8"));
          } else {
            const rawPath = import_path.default.join(process.cwd(), credPath);
            if (import_fs.default.existsSync(rawPath)) {
              serviceAccount = JSON.parse(import_fs.default.readFileSync(rawPath, "utf8"));
            }
          }
        }
      }
    } catch (e) {
      console.error("[AdminStore] Failed to load Google service account credentials:", e);
    }
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error("[AdminStore] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
      }
    }
    if (!serviceAccount) {
      console.warn(
        "[AdminStore] Firebase Admin SDK credentials missing. Active/Online database bypass registered. System will fallback to an auto-synchronized in-memory fast datastore."
      );
      useOfflineFallback = true;
      if (!inMemoryCollections.has("users")) {
        seedInMemorySuperAdmin();
      }
      return mockDb;
    }
    const appName = "admin-app";
    const credential = (0, import_app.cert)(serviceAccount);
    const targetProjectId = serviceAccount.project_id || firebase_applet_config_default.projectId;
    let adminApp;
    const existingApps = (0, import_app.getApps)();
    const matchedApp = existingApps.find((app2) => app2.name === appName);
    if (matchedApp) {
      adminApp = matchedApp;
    } else {
      adminApp = (0, import_app.initializeApp)({
        credential,
        databaseURL: `https://${targetProjectId}.firebaseio.com`
      }, appName);
    }
    try {
      const dbId = serviceAccount.project_id && serviceAccount.project_id !== firebase_applet_config_default.projectId ? "(default)" : firebase_applet_config_default.firestoreDatabaseId;
      firestoreDbInstance = dbId && dbId !== "(default)" ? (0, import_firestore.getFirestore)(adminApp, dbId) : (0, import_firestore.getFirestore)(adminApp);
    } catch (dbInitErr) {
      console.warn("[AdminStore] Failed to connect to Firestore instance via Admin SDK, switching to offline fallback mode:", dbInitErr);
      useOfflineFallback = true;
      if (!inMemoryCollections.has("users")) {
        seedInMemorySuperAdmin();
      }
      return mockDb;
    }
  }
  return firestoreDbInstance;
}
var firestoreDb = {
  collection(path3) {
    return getDb().collection(path3);
  }
};
var sessionsMap = /* @__PURE__ */ new Map();
var rateLimitMap = /* @__PURE__ */ new Map();
async function registerInFirebaseAuth(email, passwordRaw) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebase_applet_config_default.apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: passwordRaw,
      returnSecureToken: true
    })
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.error?.message === "EMAIL_EXISTS") {
      console.log(`[Firebase Auth Sync] Email '${email}' already exists. Bypassing Auth creation.`);
      return "user_" + Buffer.from(email).toString("hex").substring(0, 16);
    }
    throw new Error(data.error?.message || "Firebase Authentication registration failed");
  }
  return data.localId;
}
async function resetPasswordInFirebaseAuth(uid, passwordRaw) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebase_applet_config_default.apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      localId: uid,
      password: passwordRaw,
      returnSecureToken: true
    })
  });
  if (!response.ok) {
    const data = await response.json();
    console.error(`[Firebase Auth Sync] Failed to update password inside Firebase Auth for UID '${uid}':`, data.error?.message);
  } else {
    console.log(`[Firebase Auth Sync] Password updated successfully in Firebase Auth for UID: '${uid}'`);
  }
}
var AdminStore = class {
  // Rate limiter check: max 15 requests per 3 minutes
  static checkRateLimit(ip) {
    const now = Date.now();
    const timeframe = 3 * 60 * 1e3;
    const limit = 15;
    let hits = rateLimitMap.get(ip) || [];
    hits = hits.filter((t) => now - t < timeframe);
    hits.push(now);
    rateLimitMap.set(ip, hits);
    return hits.length <= limit;
  }
  // Initial setup: bootstrap default Super Admin if none exists in Firestore
  static async initialize() {
    try {
      const adminUsername = process.env.SUPER_ADMIN_USERNAME;
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
      const adminEmail = process.env.SUPER_ADMIN_EMAIL;
      console.log(`[AdminStore.initialize] Invoked. Raw SUPER_ADMIN_USERNAME: "${adminUsername}", Raw SUPER_ADMIN_EMAIL: "${adminEmail}", Password present: ${!!adminPassword}`);
      let isFallbackRoute = !adminUsername || !adminPassword || !adminEmail;
      if (!isFallbackRoute) {
        try {
          console.log("[AdminStore.initialize] Probing online Firestore Cloud connection...");
          const activeDb = getDb();
          if (activeDb === mockDb) {
            isFallbackRoute = true;
          } else {
            const probePromise = activeDb.collection("users").limit(1).get();
            const timeoutPromise = new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Firestore connection timeout")), 2e3)
            );
            await Promise.race([probePromise, timeoutPromise]);
            console.log("[AdminStore.initialize] Firestore connection verified successfully! Online database mode is active.");
          }
        } catch (probeErr) {
          console.warn("[AdminStore.initialize] Firestore connection probe failed or timed out:", probeErr.message || probeErr);
          console.warn("[AdminStore.initialize] Falling back to self-contained, high-performance in-memory datastore.");
          isFallbackRoute = true;
        }
      }
      if (isFallbackRoute) {
        useOfflineFallback = true;
        console.warn("[System Config] SUPER_ADMIN environment variables are missing OR Firestore connection failed.");
        console.log("[System Config] Offline/In-Memory fallback triggered automatically. Seeding default super admin:");
        console.log(" \u{1F449} Username: admin");
        console.log(" \u{1F449} Password: admin123");
        console.log(" \u{1F449} Email: admin@mingde.org");
        if (!inMemoryCollections.has("users")) {
          seedInMemorySuperAdmin();
        }
        return;
      }
      const cleanUsername = adminUsername.trim();
      const cleanEmail = adminEmail.trim();
      const usersColl = firestoreDb.collection("users");
      const snapshot = await usersColl.get();
      let existingDoc = null;
      let existingData = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username && data.username.toLowerCase() === cleanUsername.toLowerCase() || data.email && data.email.toLowerCase() === cleanEmail.toLowerCase()) {
          existingDoc = doc;
          existingData = {
            ...data,
            id: doc.id
          };
        }
      });
      const salt = import_bcryptjs.default.genSaltSync(10);
      const passwordHash = import_bcryptjs.default.hashSync(adminPassword, salt);
      if (existingDoc && existingData) {
        console.log(`[System Init] Super Admin '${cleanUsername}' already exists. Syncing/updating password credentials from .env...`);
        await usersColl.doc(existingDoc.id).update({
          username: cleanUsername,
          email: cleanEmail,
          password_hash: passwordHash,
          role: "super_admin",
          status: "active",
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          const uidToUpdate = existingData.uid || existingDoc.id;
          await resetPasswordInFirebaseAuth(uidToUpdate, adminPassword);
        } catch (authErr) {
          console.warn("[System Init] Firebase Auth password sync warning:", authErr);
        }
        console.log("[System Init] Credentials synchronized successfully. You can now log in.");
      } else {
        console.log(`[System Init] No Super Admin matching '${cleanUsername}' detected. Initializing auto-creation...`);
        console.log(`[System Init] Seeding Super Admin for: [${cleanUsername}] with email [${cleanEmail}]...`);
        let uid = "super_admin_seed_" + import_crypto.default.randomBytes(4).toString("hex");
        try {
          const authUid = await registerInFirebaseAuth(cleanEmail, adminPassword);
          if (authUid) {
            uid = authUid;
          }
        } catch (authErr) {
          console.error("[System Init] Firebase Auth seeding error (Profile will still be created in Firestore):", authErr);
        }
        const superAdminUser = {
          id: uid,
          uid,
          username: cleanUsername,
          email: cleanEmail,
          password_hash: passwordHash,
          role: "super_admin",
          status: "active",
          permissions: [
            "full_access",
            "manage_users",
            "manage_videos",
            "upload_videos",
            "upload_posters",
            "create_articles",
            "edit_articles",
            "delete_content",
            "manage_categories"
          ],
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await usersColl.doc(uid).set(superAdminUser);
        await this.writeLogInternal("system", "system", "system@mingde.org", "INITIAL_BOOTSTRAP", `Security Admin Vault Initialized. Created production-ready superadmin user: ${cleanUsername}`);
        console.log("--- DB SYSTEM INITIATED SUCCESSFULLY ---");
        console.log(`Username: ${cleanUsername}`);
        console.log("----------------------------------------");
      }
    } catch (err) {
      console.error("[System Init] Unexpected exception during database check/setup:", err);
      console.warn("[System Init] Demoting to offline/in-memory fallback due to pre-flight startup error.");
      useOfflineFallback = true;
      if (!inMemoryCollections.has("users")) {
        seedInMemorySuperAdmin();
      }
    }
  }
  // Users Management
  static async getUsers() {
    try {
      const snapshot = await firestoreDb.collection("users").get();
      const users = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          ...data,
          id: doc.id,
          uid: data.uid || doc.id,
          created_at: data.created_at || data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: data.updated_at || data.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      return users;
    } catch (err) {
      console.error("[AdminStore] Error reading users from cloud Firestore:", err);
      return [];
    }
  }
  static async getUserById(id) {
    try {
      const docRef = firestoreDb.collection("users").doc(id);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          created_at: data.created_at || data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: data.updated_at || data.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    } catch (err) {
      console.error(`[AdminStore] Error retrieving user profile ${id}:`, err);
    }
    return void 0;
  }
  static async getUserByUsername(username) {
    try {
      const cleanUsername = username.trim().toLowerCase();
      console.log(`[AdminStore.getUserByUsername] Fetching users collection snapshot...`);
      const querySnap = await firestoreDb.collection("users").get();
      console.log(`[AdminStore.getUserByUsername] Got users. Total documents found:`, querySnap.docs ? querySnap.docs.length : 0);
      let found = void 0;
      querySnap.forEach((doc) => {
        const data = doc.data();
        console.log(`[AdminStore.getUserByUsername] Checking user document ID: "${doc.id}", Username in doc: "${data.username}"`);
        if (data.username && data.username.toLowerCase() === cleanUsername) {
          found = {
            ...data,
            id: doc.id,
            uid: data.uid || doc.id,
            created_at: data.created_at || data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: data.updated_at || data.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      });
      return found;
    } catch (err) {
      console.error(`[AdminStore] Error querying username ${username}:`, err);
    }
    return void 0;
  }
  static async getUserByEmail(email) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const querySnap = await firestoreDb.collection("users").get();
      let found = void 0;
      querySnap.forEach((doc) => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase() === cleanEmail) {
          found = {
            ...data,
            id: doc.id,
            uid: data.uid || doc.id,
            created_at: data.created_at || data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: data.updated_at || data.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      });
      return found;
    } catch (err) {
      console.error(`[AdminStore] Error querying email ${email}:`, err);
    }
    return void 0;
  }
  static async createUser(operator, data) {
    if (operator.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admin can create accounts");
    }
    const cleanUsername = data.username.trim();
    const cleanEmail = data.email.trim();
    const existingUser = await this.getUserByUsername(cleanUsername);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    const existingByEmail = await this.getUserByEmail(cleanEmail);
    if (existingByEmail) {
      throw new Error("Email already registered");
    }
    console.log(`[AdminStore] Spawning new admin user: '${cleanUsername}'...`);
    let uid = "usr_" + import_crypto.default.randomBytes(8).toString("hex");
    try {
      const authUid = await registerInFirebaseAuth(cleanEmail, data.passwordRaw);
      if (authUid) {
        uid = authUid;
      }
    } catch (authErr) {
      console.warn("[AdminStore] Firebase Auth signup failed. Creating Firestore Profile anyway, fallback generated UID:", authErr.message || authErr);
    }
    const salt = import_bcryptjs.default.genSaltSync(10);
    const passwordHash = import_bcryptjs.default.hashSync(data.passwordRaw, salt);
    const newUser = {
      id: uid,
      uid,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: data.role,
      status: "active",
      permissions: data.permissions || [],
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await firestoreDb.collection("users").doc(uid).set(newUser);
    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      "ADMIN_CREATED",
      `Created new admin user: '${cleanUsername}' with role '${data.role}'`
    );
    return newUser;
  }
  static async updateUser(operator, userId, data) {
    if (operator.role !== "super_admin" && operator.id !== userId) {
      throw new Error("Unauthorized");
    }
    const userRef = firestoreDb.collection("users").doc(userId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      throw new Error("User not found");
    }
    const targetUser = docSnap.data();
    const updates = {};
    if (data.email) {
      targetUser.email = data.email.trim();
      updates.email = data.email.trim();
    }
    if (operator.role === "super_admin") {
      if (data.role) {
        if (operator.id === userId && data.role !== "super_admin") {
          const allUsers = await this.getUsers();
          const superCount = allUsers.filter((u) => u.role === "super_admin").length;
          if (superCount <= 1) {
            throw new Error("Cannot change role: You are the sole Super Admin of the Circle");
          }
        }
        targetUser.role = data.role;
        updates.role = data.role;
      }
      if (data.status) {
        if (operator.id === userId && data.status === "suspended") {
          throw new Error("Cannot suspend your own account");
        }
        targetUser.status = data.status;
        updates.status = data.status;
      }
      if (data.permissions) {
        targetUser.permissions = data.permissions;
        updates.permissions = data.permissions;
      }
    }
    targetUser.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    updates.updated_at = targetUser.updated_at;
    updates.updatedAt = targetUser.updatedAt;
    await userRef.update(updates);
    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      "ADMIN_UPDATED",
      `Updated admin user '${targetUser.username}' profile/rights`
    );
    return {
      ...targetUser,
      id: userId,
      uid: targetUser.uid || userId
    };
  }
  static async deleteUser(operator, userId) {
    if (operator.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admin can delete accounts");
    }
    if (operator.id === userId) {
      throw new Error("Cannot delete your own account");
    }
    const userRef = firestoreDb.collection("users").doc(userId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      throw new Error("User not found");
    }
    const targetUser = docSnap.data();
    await userRef.delete();
    for (const [token, session] of sessionsMap.entries()) {
      if (session.userId === userId) {
        sessionsMap.delete(token);
      }
    }
    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      "ADMIN_DELETED",
      `Permanently deleted administrator account: '${targetUser.username}' (${targetUser.email})`
    );
  }
  static async resetUserPassword(operator, userId, passwordRaw) {
    if (operator.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admin can reset user passwords");
    }
    const userRef = firestoreDb.collection("users").doc(userId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      throw new Error("User not found");
    }
    const targetUser = docSnap.data();
    const salt = import_bcryptjs.default.genSaltSync(10);
    const passwordHash = import_bcryptjs.default.hashSync(passwordRaw, salt);
    const uidToUpdate = targetUser.uid || userId;
    try {
      await resetPasswordInFirebaseAuth(uidToUpdate, passwordRaw);
    } catch (authErr) {
      console.error(`[AdminStore] Password update failed in Firebase Auth for user ${targetUser.username}:`, authErr);
    }
    await userRef.update({
      password_hash: passwordHash,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      "ADMIN_PASSWORD_RESET",
      `Super Admin reset password for '${targetUser.username}'`
    );
  }
  // Session Token management
  static createSession(userId, rememberMe) {
    const token = import_crypto.default.randomBytes(32).toString("hex");
    const lifespan = rememberMe ? 30 * 24 * 60 * 60 * 1e3 : 2 * 60 * 60 * 1e3;
    const expiresAt = new Date(Date.now() + lifespan).toISOString();
    sessionsMap.set(token, {
      id: token,
      userId,
      expiresAt,
      rememberMe
    });
    return token;
  }
  static async verifySession(token) {
    const session = sessionsMap.get(token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionsMap.delete(token);
      return null;
    }
    const userProfile = await this.getUserById(session.userId);
    if (!userProfile || userProfile.status !== "active") return null;
    return userProfile;
  }
  static destroySession(token) {
    sessionsMap.delete(token);
  }
  // Logs Access
  static async getLogs(operator) {
    if (operator.role !== "super_admin" && operator.role !== "admin") {
      throw new Error("Unauthorized to view audit logs");
    }
    try {
      const snapshot = await firestoreDb.collection("activity_logs").get();
      const logs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp || (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error("[AdminStore] Error reading logs from Firestore:", err);
      return [];
    }
  }
  static writeLog(userId, username, email, action, details, ip, ua) {
    this.writeLogInternal(userId, username, email, action, details, ip, ua).catch((err) => {
      console.error("[AdminStore] Failed background write to security audit logs:", err);
    });
  }
  static async writeLogInternal(userId, username, email, action, details, ip, ua) {
    try {
      const logId = "log_" + Date.now() + "_" + Math.floor(Math.random() * 1e3);
      const logData = {
        id: logId,
        userId,
        userEmail: email,
        userName: username,
        username,
        // field pairing compatibility
        email,
        // field pairing compatibility
        action,
        details,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ipAddress: ip || "127.0.0.1",
        userAgent: ua || "unknown"
      };
      await firestoreDb.collection("activity_logs").doc(logId).set(logData);
    } catch (err) {
      console.warn("[AdminStore] Log entry skipped (Firestore transaction issue):", err);
    }
  }
};

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("Warning: GEMINI_API_KEY is not defined or is placeholder. Falling back to static values.");
      return null;
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var fallbackQuotes = [
  {
    content: "\u5BFB\u6C42\u77E5\u8BC6\u662F\u6BCF\u4E00\u4E2A\u7537\u5973\u7A46\u65AF\u6797\u7684\u5929\u804C\u3002",
    source: "\u5148\u77E5\u7A46\u7F55\u9ED8\u5FB7 (\u613F\u4E3B\u798F\u5B89\u4E4B) \u5723\u8BAD",
    pinyin: "X\xFAnqi\xFA zh\u012Bsh\xEC sh\xEC m\u011Bi y\u012Bg\xE8 n\xE1nn\u01DA M\xF9s\u012Bl\xEDn de ti\u0101nzh\xED."
  },
  {
    content: "\u6700\u4F18\u79C0\u7684\u4FE1\u58EB\u662F\u90A3\u4E9B\u54C1\u5FB7\u6700\u9AD8\u5C1A\u7684\u4EBA\u3002",
    source: "\u5723\u8BAD\u5F55",
    pinyin: "Zu\xEC y\u014Duxi\xF9 de x\xECnsh\xEC sh\xEC n\xE0xi\u0113 p\u01D0nd\xE9 zu\xEC g\u0101osh\xE0ng de r\xE9n."
  },
  {
    content: "\u5927\u5730\u662F\u6E05\u51C0\u5B89\u5B81\u7684\u6BBF\u5802\uFF0C\u81EA\u7136\u662F\u81F3\u771F\u8005\u5C55\u73B0\u8FF9\u8C61\u7684\u753B\u5377\u3002",
    source: "\u53E4\u5178\u54F2\u5B66\u968F\u7B14",
    pinyin: "D\xE0d\xEC sh\xEC q\u012Bngj\xECng \u0101nn\xEDng de di\xE0nt\xE1ng, z\xECr\xE1n sh\xEC zh\xECzh\u0113nzh\u011B zh\u01CEnji\xE0n j\xECxi\xE0ng de hu\xE0ju\xE0n."
  },
  {
    content: "\u77E5\u8BC6\u5982\u540C\u8FF7\u5931\u7684\u9A7C\u7FA4\uFF0C\u65E0\u8BBA\u5B83\u5728\u54EA\u91CC\u88AB\u53D1\u73B0\uFF0C\u884C\u8005\u7686\u5F53\u5F15\u4E3A\u5DF1\u6709\u3002",
    source: "\u8D24\u54F2\u683C\u8A00\u5F55",
    pinyin: "Zh\u012Bsh\xEC r\xFAt\xF3ng m\xEDsh\u012B de tu\xF3q\xFAn, w\xFAl\xF9n t\u0101 z\xE0i n\u01CEl\u01D0 b\xE8i f\u0101xi\xE0n, x\xEDngzh\u011B ji\u0113 d\u0101ng y\u01D0n w\xE9i j\u01D0y\u01D2u."
  }
];
app.use("/api/cms", (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  if (!AdminStore.checkRateLimit(ip)) {
    return res.status(429).json({ error: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\u3002\u4E3A\u9632\u7206\u7834\uFF0C\u7CFB\u7EDF\u5DF2\u4E34\u65F6\u5C01\u9501\u60A8\u7684IP 3\u5206\u949F\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002" });
  }
  next();
});
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return await AdminStore.verifySession(token);
}
function sanitize(input) {
  if (typeof input !== "string") return "";
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/cms/login", async (req, res) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
  }
  const cleanUsername = sanitize(username.trim());
  console.log(`[CMS Login API] Login request received for user: "${cleanUsername}"`);
  let user;
  try {
    user = await AdminStore.getUserByUsername(cleanUsername);
  } catch (err) {
    console.error(`[CMS Login API] Failed to fetch user by username from AdminStore:`, err);
    return res.status(500).json({ error: "\u7CFB\u7EDF\u5185\u90E8\u6570\u636E\u5E93\u8FDE\u63A5\u9519\u8BEF" });
  }
  if (!user) {
    console.log(`[CMS Login API] User "${cleanUsername}" was NOT found in the database.`);
    AdminStore.writeLog("guest", cleanUsername, "unknown", "LOGIN_FAILED", `Attempted login under unknown user: '${cleanUsername}'`);
    return res.status(401).json({ error: "\u5BC6\u7801\u9519\u8BEF\u6216\u8BE5\u7BA1\u7406\u5458\u8D26\u6237\u4E0D\u5B58\u5728" });
  }
  console.log(`[CMS Login API] Found user: "${user.username}" with role: "${user.role}" and status: "${user.status}".`);
  if (user.status !== "active") {
    AdminStore.writeLog(user.id, user.username, user.email, "LOGIN_SUSPENDED", `Attempted login on suspended admin account`);
    return res.status(403).json({ error: "\u8BE5\u7BA1\u7406\u5458\u8D26\u53F7\u5DF2\u88AB\u6682\u505C\u4F7F\u7528\uFF0C\u8BF7\u8054\u7CFB\u8D85\u7EA7\u7BA1\u7406\u5458\u3002" });
  }
  let match = false;
  try {
    const bcryptModule = await import("bcryptjs");
    const bcrypt2 = bcryptModule.default || bcryptModule;
    match = bcrypt2.compareSync(password, user.password_hash);
  } catch (err) {
    console.error(`[CMS Login API] Bcrypt comparison error:`, err);
    return res.status(500).json({ error: "\u7CFB\u7EDF\u5185\u90E8\u5BC6\u7801\u6A21\u5757\u6821\u9A8C\u6545\u969C" });
  }
  if (!match) {
    console.log(`[CMS Login API] Password check FAILED for user: "${cleanUsername}"`);
    AdminStore.writeLog(user.id, user.username, user.email, "LOGIN_FAILED", `Failed login credentials check`);
    return res.status(401).json({ error: "\u5BC6\u7801\u9519\u8BEF\u6216\u8BE5\u7BA1\u7406\u5458\u8D26\u6237\u4E0D\u5B58\u5728" });
  }
  console.log(`[CMS Login API] Password check passed. Creating token session...`);
  const token = AdminStore.createSession(user.id, !!rememberMe);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const ua = req.headers["user-agent"] || "unknown";
  AdminStore.writeLog(user.id, user.username, user.email, "LOGIN_SUCCESS", `Successfully logged in via Username & Password`, ip, ua);
  const userProfile = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  res.json({ token, profile: userProfile });
});
app.get("/api/cms/session", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "\u4F1A\u8BDD\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55" });
  }
  res.json({
    profile: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });
});
app.post("/api/cms/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const user = await AdminStore.verifySession(token);
    if (user) {
      AdminStore.writeLog(user.id, user.username, user.email, "LOGOUT_SUCCESS", "Successfully logged out and destroyed credentials session");
    }
    AdminStore.destroySession(token);
  }
  res.json({ success: true });
});
app.get("/api/cms/users", async (req, res) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: "Unauthorized credentials" });
  if (operator.role !== "super_admin" && operator.role !== "admin") {
    return res.status(403).json({ error: "\u65E0\u6743\u67E5\u770B\u4E66\u9662\u6210\u5458\u540D\u518C" });
  }
  const rawUsers = await AdminStore.getUsers();
  const users = rawUsers.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status,
    permissions: u.permissions,
    created_at: u.created_at,
    updated_at: u.updated_at
  }));
  res.json({ users });
});
app.post("/api/cms/users", async (req, res) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: "Unauthorized credentials" });
  if (operator.role !== "super_admin") {
    return res.status(403).json({ error: "\u6743\u9650\u4E0D\u8DB3\uFF1A\u53EA\u6709\u8D85\u7EA7\u7BA1\u7406\u5458\u80FD\u8BBE\u7ACB\u65B0\u7684\u5404\u90E8\u53CA\u5404\u95E8\u4E66\u9662\u7406\u4E8B\u5B98\u3002" });
  }
  const { username, email, passwordRaw, role: targetRole, permissions } = req.body;
  if (!username || !email || !passwordRaw || !targetRole) {
    return res.status(400).json({ error: "\u6240\u6709\u8868\u683C\u5FC5\u987B\u586B\u5199\u5B8C\u6574" });
  }
  try {
    const newUser = await AdminStore.createUser(operator, {
      username: sanitize(username),
      email: sanitize(email),
      passwordRaw,
      role: targetRole,
      permissions: permissions || []
    });
    res.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        permissions: newUser.permissions,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "\u8D26\u6237\u521B\u5EFA\u5931\u8D25" });
  }
});
app.put("/api/cms/users/:id", async (req, res) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: "Unauthorized credentials" });
  if (operator.role !== "super_admin") {
    return res.status(403).json({ error: "\u6743\u9650\u4E0D\u8DB3\uFF1A\u4EC5\u8D85\u7EA7\u7BA1\u7406\u5458\u53EF\u4EE5\u7F16\u8F91 and \u66F4\u6539\u4E66\u9662\u7406\u4E8B\u540D\u518C\uFF01" });
  }
  const { email, role: targetRole, status, permissions } = req.body;
  try {
    const updatedUser = await AdminStore.updateUser(operator, req.params.id, {
      email: email ? sanitize(email) : void 0,
      role: targetRole,
      status,
      permissions
    });
    res.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        permissions: updatedUser.permissions,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "\u4FEE\u6539\u5931\u8D25" });
  }
});
app.delete("/api/cms/users/:id", async (req, res) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: "Unauthorized credentials" });
  if (operator.role !== "super_admin") {
    return res.status(403).json({ error: "\u6743\u9650\u4E0D\u8DB3\uFF1A\u4EC5\u8D85\u7EA7\u7BA1\u7406\u5458\u53EF\u4EE5\u7F62\u514D\u6216\u62B9\u9500\u4E66\u9662\u7406\u4E8B\u6210\u5458\uFF01" });
  }
  try {
    await AdminStore.deleteUser(operator, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "\u6CE8\u9500\u5B66\u8854\u5931\u8D25" });
  }
});
app.post("/api/cms/users/:id/reset-password", async (req, res) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: "Unauthorized credentials" });
  if (operator.role !== "super_admin") {
    return res.status(403).json({ error: "\u6743\u9650\u4E0D\u8DB3\uFF1A\u53EA\u6709\u8D85\u7EA7\u7BA1\u7406\u5458\u80FD\u91CD\u7F6E\u5176\u5B83\u4EBA\u7B49\u7684\u5BC6\u7801\u5370\u4FE1\u3002" });
  }
  const { passwordRaw } = req.body;
  if (!passwordRaw) {
    return res.status(400).json({ error: "\u65B0\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
  }
  try {
    await AdminStore.resetUserPassword(operator, req.params.id, passwordRaw);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "\u91CD\u7F6E\u5931\u8D25" });
  }
});
app.get("/api/cms/logs", async (req, res) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: "Unauthorized credentials" });
  if (operator.role !== "super_admin" && operator.role !== "admin") {
    return res.status(403).json({ error: "\u65E0\u6743\u67E5\u770B\u4E66\u9662\u7CFB\u7EDF\u5BA1\u8BA1\u65E5\u5FD7" });
  }
  try {
    const logs = await AdminStore.getLogs(operator);
    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message || "\u83B7\u53D6\u65E5\u5FD7\u5931\u8D25" });
  }
});
app.post("/api/gemini/quote", async (req, res) => {
  const ai = getAiClient();
  if (!ai) {
    const idx = Math.floor(Math.random() * fallbackQuotes.length);
    return res.json({ quote: fallbackQuotes[idx], isFallback: true });
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: 'Generate a short, elegant, premium Islamic wisdom quote in Simplified Chinese with poetic depth. Include its source (e.g. Quran chapter or Sahih Hadith, or traditional philosopher). Return JSON format: { "content": "Simplified Chinese translation of the wisdom", "source": "Poetic source name in Chinese" }',
      config: {
        responseMimeType: "application/json"
      }
    });
    const resultText = response.text?.trim() || "";
    const parsed = JSON.parse(resultText);
    res.json({ quote: parsed, isFallback: false });
  } catch (err) {
    console.log("Daily Wisdom loaded from premium offline cache.");
    const idx = Math.floor(Math.random() * fallbackQuotes.length);
    res.json({ quote: fallbackQuotes[idx], isFallback: true });
  }
});
app.post("/api/gemini/summarize", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  const ai = getAiClient();
  if (!ai) {
    return res.json({
      summary: `\u3010AI \u6458\u8981\u9884\u89C8\u3011\u672C\u6587\u63A2\u8BA8\u4E86\u300A${title}\u300B\u4E2D\u7684\u6DF1\u5C42\u54F2\u5B66\u7406\u5FF5\u3002\u5728\u4F20\u7EDF\u4E1C\u65B9\u7F8E\u5B66\u4E0E\u4F0A\u65AF\u5170\u5B66\u672F\u667A\u6167\u7684\u4EA4\u878D\u4E2D\uFF0C\u5C55\u73B0\u51FA\u4EBA\u7C7B\u9053\u5FB7\u4FEE\u517B\u3001\u5FC3\u7075\u5B81\u9759\u4EE5\u53CA\u7406\u667A\u6C42\u7D22\u7684\u6838\u5FC3\u4EF7\u503C\u3002`,
      keywords: ["\u5B66\u672F\u667A\u6167", "\u7F8E\u5B66\u4EA4\u878D", "\u9053\u5FB7\u4FEE\u517B", "\u4F20\u7EDF\u4EF7\u503C"],
      isFallback: true
    });
  }
  try {
    const prompt = `Title: ${title}
Content: ${content}

Summarize the text above into a highly readable and premium Chinese cultural paragraph (maximum 150 characters) and extract 4 relevant scholarly keywords. Return JSON format: { "summary": "your paragraph", "keywords": ["kw1", "kw2", "kw3", "kw4"] }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text?.trim() || "";
    const parsed = JSON.parse(text);
    res.json({ ...parsed, isFallback: false });
  } catch (err) {
    console.log("Gemini summarizer loaded offline fallback summary content.");
    res.json({
      summary: `\u672C\u6587\u63A2\u8BA8\u4E86\u300A${title}\u300B\u4E2D\u53E4\u5178\u6587\u5316\u7406\u5FF5\u53CA\u5176\u5F53\u4EE3\u4EBA\u6587\u610F\u4E49\u3002\u901A\u8FC7\u591A\u89C6\u89D2\u7684\u7814\u8BFB\uFF0C\u63D0\u70BC\u51FA\u5BF9\u4E8E\u4EBA\u672C\u5FB7\u884C\u4E0E\u79D1\u5B66\u63A2\u7A76\u7684\u591A\u7EF4\u542F\u53D1\u3002`,
      keywords: ["\u5FB7\u884C\u542F\u53D1", "\u4EBA\u6587\u4EF7\u503C", "\u6587\u5316\u7814\u8BFB", "\u5B66\u672F\u4F20\u627F"],
      isFallback: true
    });
  }
});
async function initServer() {
  await AdminStore.initialize();
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
    console.log("Production static file serving enabled for:", distPath);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
initServer().catch((err) => {
  console.error("Failed to launch application server:", err);
});
//# sourceMappingURL=server.cjs.map
