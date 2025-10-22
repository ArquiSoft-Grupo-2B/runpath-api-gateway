const firebase_admin = require("firebase-admin");

// Check if there are no initialized apps, then initialize one
if (!firebase_admin.apps.length) {
  firebase_admin.initializeApp({
    credential: firebase_admin.credential.applicationDefault(),
  });
}

module.exports = {
  version: "1.0.0",
  name: "firebase-auth",
  policies: ["firebase-auth"],
  init: (pluginContext) => {
    pluginContext.registerPolicy({
      name: "firebase-auth",
      policy: (actionParams) => {
        return async (req, res, next) => {
          const authHeader = req.headers.authorization;

          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
              .status(401)
              .json({ error: "Unauthorized: Missing or invalid token" });
          }

          const token = authHeader.split(" ")[1];
          console.log("Verifying Firebase token:", token);

          try {
            const decodedToken = await firebase_admin
              .auth()
              .verifyIdToken(token);
            req.user = decodedToken;
            console.log(decodedToken);
            next();
          } catch (error) {
            console.log("Firebase token verification error:", error);
            return res.status(401).json({ error: "Invalid or expired token" });
          }
        };
      },
    });
  },
};
