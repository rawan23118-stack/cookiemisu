const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cookiemisu1"
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

        if (err && !sent) {
          sent = true;
          console.log("DB Error:", err);
          return res.status(500).send("DB error");
        }

        completed++;

        if (completed === cart.length && !sent) {
          sent = true;
          res.send("Order saved");
        }

      }
    );

  });

});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
