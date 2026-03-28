const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SECRET = "supersecretkey";

// DB
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "cookiemisu"
});

db.connect(err => {
  if (err) console.log(err);
  else console.log("DB connected");
});


// 🔐 LOGIN (secure)
app.post("/login", async (req, res) => {

  const { username, password } = req.body;

  // 🔥 بدل ما تخزني password plain
  const adminUser = "admin";
  const hashedPassword = await bcrypt.hash("1234", 10);

  if (username !== adminUser) {
    return res.status(401).send("wrong");
  }

  const match = await bcrypt.compare(password, hashedPassword);

  if (!match) {
    return res.status(401).send("wrong");
  }

  // 🔥 generate token
  const token = jwt.sign({ user: username }, SECRET, { expiresIn: "2h" });

  res.json({ token });

});


// 🔒 middleware
function verifyToken(req, res, next){

  const auth = req.headers["authorization"];

  if(!auth) return res.status(403).send("No token");

  const token = auth.split(" ")[1];

  jwt.verify(token, SECRET, (err, decoded)=>{
    if(err) return res.status(403).send("Invalid token");
    req.user = decoded;
    next();
  });

}


// 📥 ORDER
app.post("/order", (req, res) => {

  const { name, phone, cart } = req.body;

  if (!name || !phone || !cart || cart.length === 0) {
    return res.status(400).send("Missing data");
  }

  const sql = `
    INSERT INTO orders (name, phone, product, size, quantity, price, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  cart.forEach(item => {
    db.query(sql, [
      name,
      phone,
      item.name,
      item.size || "",
      item.quantity || 1,
      item.price || 0
    ]);
  });

  res.send("saved");
});


// 🔒 GET ORDERS
app.get("/orders", verifyToken, (req, res) => {

  db.query("SELECT * FROM orders", (err, result) => {
    if (err) return res.status(500).send("error");
    res.json(result);
  });

});


// 🔒 UPDATE
app.put("/order/:id", verifyToken, (req, res) => {

  db.query(
    "UPDATE orders SET status='done' WHERE id=?",
    [req.params.id],
    () => res.send("updated")
  );

});


app.listen(3000, () => console.log("Server running"));
