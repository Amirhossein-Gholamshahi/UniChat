// Utility: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Utility: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Utility: PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
    const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    return base64ToArrayBuffer(base64);
}

// Utility: ArrayBuffer to PEM
function arrayBufferToPem(buffer, type = "PUBLIC KEY") {
    const base64 = arrayBufferToBase64(buffer);
    const formatted = base64.match(/.{1,64}/g).join("\n");
    return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
}

function base64ToArrayBufferG(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64G(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}


// IndexedDB: Save private key
async function savePrivateKeyToIndexedDB(privateKeyBuffer) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("ChatAppKeys", 1);
        request.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("keys")) {
                db.createObjectStore("keys");
            }
        };
        request.onsuccess = function (e) {
            const db = e.target.result;
            const tx = db.transaction("keys", "readwrite");
            const store = tx.objectStore("keys");
            store.put(privateKeyBuffer, "privateKey");
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// IndexedDB: Get private key
async function getPrivateKeyFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("ChatAppKeys", 1);
        request.onsuccess = function (e) {
            const db = e.target.result;
            const tx = db.transaction("keys", "readonly");
            const store = tx.objectStore("keys");
            const getRequest = store.get("privateKey");
            getRequest.onsuccess = async () => {
                const buffer = getRequest.result;
                if (!buffer) return reject("Private key not found in IndexedDB");
                try {
                    const key = await window.crypto.subtle.importKey(
                        "pkcs8",
                        buffer,
                        { name: "RSA-OAEP", hash: "SHA-256" },
                        true,
                        ["decrypt"]
                    );
                    resolve(key);
                } catch (err) {
                    reject(err);
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// Generate Key Pair and Store Private Key
export async function generateKeyPairAndStore() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    await savePrivateKeyToIndexedDB(privateKeyBuffer);

    return arrayBufferToPem(publicKeyBuffer, "PUBLIC KEY");
}

// Encrypt message using recipient's public key (PEM format)
export async function encryptMessage(message, recipientPublicKeyPem) {
    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        pemToArrayBuffer(recipientPublicKeyPem), 
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );

    const encoded = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoded
    );

    return arrayBufferToBase64(encrypted); // Return Base64 string
}
export async function encryptGroupMessage(message, groupAesKeyBase64) {
    const encoder = new TextEncoder();
    const keyBytes = base64ToArrayBufferG(groupAesKeyBase64);

    const aesKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-ECB" },  // ECB mode, no IV
        false,
        ["encrypt"]
    );

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-ECB" },
        aesKey,
        encoder.encode(message)
    );

    return arrayBufferToBase64G(encrypted);
}

// Decrypt message using private key from IndexedDB
export async function decryptMessage(messageBase64) {
    const encryptedArrayBuffer = base64ToArrayBuffer(messageBase64);

    const privateKey = await getPrivateKeyFromIndexedDB();

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedArrayBuffer
    );

    return new TextDecoder().decode(decrypted);
}
