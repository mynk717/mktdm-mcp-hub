import { getSecret, saveSecret, deleteSecret } from "../shared/secrets.js";

export default async function (req, res) {
  // Simple auth check for demonstration (Should be robust in production)
  if (req.headers["x-mktdm-admin-token"] !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { method } = req;
  const { keyName, value } = req.body;

  switch (method) {
    case "GET":
      return res.status(200).json({ keys: ["semrush", "wordpress"] }); // List allowed keys
    case "POST":
      await saveSecret(keyName, value);
      return res.status(200).json({ message: "Key saved" });
    case "DELETE":
      await deleteSecret(keyName);
      return res.status(200).json({ message: "Key deleted" });
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}
