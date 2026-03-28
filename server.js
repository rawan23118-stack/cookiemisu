const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// DB
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cookiemisu"
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("Connected to DB");
  }
});


// 🔐 LOGIN بسيط
app.post("/login", (req, res) => {

  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    return res.send("ok");
  }

  res.status(401).send("wrong");
});


// 📥 حفظ الطلب
app.post("/order", (req, res) => {

  const { name, phone, cart } = req.body;

  if (!name || !phone || !cart || cart.length === 0) {
    return res.status(400).send("Missing data");
  }

  const sql = `
    INSERT INTO orders (name, phone, product, size, quantity, price, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  let completed = 0;

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
        if (err) {
          return res.status(500).send("DB error");
        }

        completed++;
        if (completed === cart.length) {
          res.send("Order saved");
        }
      }
    );
  });
});


// 📤 عرض الطلبات (بدون حماية)
app.get("/orders", (req, res) => {

  db.query("SELECT * FROM orders", (err, result) => {
    if (err) {
      return res.status(500).send("Error fetching");
    }
    res.json(result);
  });

});


// 🔄 تحديث الحالة
app.put("/order/:id", (req, res) => {

  db.query(
    "UPDATE orders SET status='done' WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).send("Error updating");
      }
      res.send("updated");
    }
  );

});


app.listen(3000, () => console.log("Server running"));
