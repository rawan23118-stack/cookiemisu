const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* 🔥 اتصال الداتا بيس */
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "cookiemisu",
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ Connected to DB");
  }
});

/* 🔥 إرسال الطلب */
app.post("/order", (req, res) => {
  console.log("BODY:", req.body); // مهم للتشخيص

  const { name, phone, cart } = req.body;

  if (!name || !phone || !cart || cart.length === 0) {
    return res.status(400).send("Missing data");
  }

  const sql = `
    INSERT INTO orders (name, phone, product, size, quantity, price, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  let completed = 0;
  let sent = false;

  cart.forEach(item => {
    db.query(
      sql,
      [
        name,
        phone,
        item.name,
        item.size || "",
        item.quantity || 1,
        item.price || 0
      ],
      (err) => {
        if (sent) return;

        if (err) {
          console.log("❌ Insert Error:", err);
          sent = true;
          return res.status(500).send("Database error");
        }

        completed++;

        if (completed === cart.length) {
          sent = true;
          res.send("✅ Order saved");
        }
      }
    );
  });
});

/* 🔥 جلب الطلبات (بدون created_at عشان ما يخرب) */
app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, result) => {
    if (err) {
      console.log("❌ Fetch Error:", err);
      return res.status(500).send("Error fetching");
    }
    res.json(result);
  });
});

/* 🔥 تغيير الحالة */
app.put("/order/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "UPDATE orders SET status='done' WHERE id=?",
    [id],
    (err) => {
      if (err) {
        console.log("❌ Update Error:", err);
        return res.status(500).send("Error updating");
      }
      res.send("✅ updated");
    }
  );
});

/* 🔥 تشغيل السيرفر */
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});
