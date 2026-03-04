import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("/tmp/orders.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    chocolate INTEGER,
    oreo INTEGER,
    mango INTEGER,
    total INTEGER,
    txn TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Google Sheets Helper (Free via Apps Script)
async function syncToGoogleSheets(orderData: any) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    console.warn("GOOGLE_SCRIPT_URL missing. Skipping Sheets sync.");
    return;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (response.ok) {
      console.log("Order synced to Google Sheets via Apps Script.");
    } else {
      console.error("Failed to sync to Google Sheets:", await response.text());
    }
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/orders", async (req, res) => {
    const { orderNumber, name, phone, chocolate, oreo, mango, total, txn } = req.body;
    
    try {
      // 1. Save to SQLite
      const stmt = db.prepare(`
        INSERT INTO orders (orderNumber, name, phone, chocolate, oreo, mango, total, txn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(orderNumber, name, phone, chocolate, oreo, mango, total, txn);

      // 2. Sync to Google Sheets (Free Apps Script)
      syncToGoogleSheets(req.body).catch(err => console.error("Sheets sync background error:", err));

      res.status(201).json({ success: true, message: "Order saved successfully" });
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ success: false, message: `Database error: ${error.message}` });
    }
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
    res.json(orders);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
