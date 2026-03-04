import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("orders.db");

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

// Google Sheets Helper
async function appendToGoogleSheet(orderData: any) {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    console.warn("Google Sheets credentials missing. Skipping Sheets sync.");
    return;
  }

  try {
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    const values = [
      [
        new Date().toLocaleString(),
        orderData.orderNumber,
        orderData.name,
        orderData.phone,
        orderData.chocolate,
        orderData.oreo,
        orderData.mango,
        orderData.total,
        orderData.txn
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    
    console.log("Order synced to Google Sheets successfully.");
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

      // 2. Sync to Google Sheets (Async)
      appendToGoogleSheet(req.body);

      res.status(201).json({ success: true, message: "Order saved successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ success: false, message: "Failed to save order" });
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
