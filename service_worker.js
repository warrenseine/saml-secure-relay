importScripts("./tweetnacl.js");
importScripts("./tweetnacl-util.js");

chrome.webRequest.onBeforeRequest.addListener(
  async function (details) {
    if (
      details.method === "POST" &&
      details.requestBody &&
      details.requestBody.formData &&
      details.requestBody.formData.SAMLResponse
    ) {
      const buffer = nacl.util.decodeUTF8(
        details.requestBody.formData.SAMLResponse[0]
      );
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const pk = nacl.util.decodeBase64(
        "aHJjTvvKSp6spHTCMX20opmVBXOGKF0yjYoolxTtH3U="
      );
      const ek = nacl.box.keyPair();
      const b = nacl.box(buffer, nonce, pk, ek.secretKey);

      try {
        const response = await fetch("http://127.0.0.1:31415", {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: JSON.stringify({
            pk: nacl.util.encodeBase64(ek.publicKey),
            nonce: nacl.util.encodeBase64(nonce),
            msg: nacl.util.encodeBase64(b),
          }),
        });

        await response.json();
      } catch (error) {
        if (!(error instanceof TypeError)) {
          console.error(error);
        }
        // Otherwise, it's a TypeError, which is expected
        // because the server is closing the connection early.
      }
    }
  },
  { urls: ["https://signin.aws.amazon.com/*"] },
  ["requestBody"]
);

// See: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep_a_service_worker_alive_continuously

/**
 * Tracks when a service worker was last alive and extends the service worker
 * lifetime by writing the current time to extension storage every 20 seconds.
 * You should still prepare for unexpected termination - for example, if the
 * extension process crashes or your extension is manually stopped at
 * chrome://serviceworker-internals.
 */
let heartbeatInterval;

async function runHeartbeat() {
  await chrome.storage.local.set({ "last-heartbeat": new Date().getTime() });
}

/**
 * Starts the heartbeat interval which keeps the service worker alive. Call
 * this sparingly when you are doing work which requires persistence, and call
 * stopHeartbeat once that work is complete.
 */
async function startHeartbeat() {
  // Run the heartbeat once at service worker startup.
  runHeartbeat().then(() => {
    // Then again every 20 seconds.
    heartbeatInterval = setInterval(runHeartbeat, 20 * 1000);
  });
}

async function stopHeartbeat() {
  clearInterval(heartbeatInterval);
}

/**
 * Returns the last heartbeat stored in extension storage, or undefined if
 * the heartbeat has never run before.
 */
async function getLastHeartbeat() {
  return (await chrome.storage.local.get("last-heartbeat"))["last-heartbeat"];
}
