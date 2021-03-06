const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x7cys.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("DB Connected");
    const productCollection = client.db(`gadgetFreak`).collection(`products`);
    const orderCollection = client.db(`gadgetFreak`).collection(`orders`);

    app.post("/login", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
      console.log(token);
      res.send({ token });
    });

    // product post
    app.post("/uploadPd", async (req, res) => {
      const product = req.body;

      const tokenInfo = req.headers.authorization;
      //   console.log(tokenInfo);
      const [email, accessToken] = tokenInfo.split(" ");
      // verify token
      const decoded = verifyToken(accessToken);

      if (email === decoded.email) {
        const result = await productCollection.insertOne(product);
        res.send(result);
      } else {
        res.send({ success: "Unauthorized Access" });
      }
    });

    // GET all products
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.post("/addOrder", async (req, res) => {
      const orderInfo = req.body;
      const result = await orderCollection.insertOne(orderInfo);
      res.send(result);
    });

    app.get("/orderList", async (req, res) => {
      const tokenInfo = req.headers.authorization;
      console.log(tokenInfo);
      const [email, accessToken] = tokenInfo.split(" ");
      // verify token
      const decoded = verifyToken(accessToken);

      if (email === decoded.email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        res.send({ success: "Unauthorized Access" });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running `gadget-freak` Server");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});

// verify token function
function verifyToken(token) {
  let email;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      email = "Invalid email";
    }
    if (decoded) {
      email = decoded;
    }
  });
  return email;
}
