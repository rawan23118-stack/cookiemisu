const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("Connected to DB");
  }
});

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
          sent = true;
          return res.status(500).send("Database error");
        }

        completed++;

        if (completed === cart.length) {
          sent = true;
          res.send("Order saved");
        }
      }
    );
  });
});

app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, result) => {
    if (err) {
      return res.status(500).send("Error fetching");
    }
    res.json(result);
  });
});

app.put("/order/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "UPDATE orders SET status='done' WHERE id=?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).send("Error updating");
      }
      res.send("updated");
    }
  );
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
