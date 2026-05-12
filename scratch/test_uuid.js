console.log("Testing randomUUID...");
try {
  console.log("UUID:", crypto.randomUUID());
} catch (e) {
  console.log("crypto.randomUUID is not available:", e.message);
}
