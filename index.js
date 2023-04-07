const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;
// middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running");
});
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_SECRET, function (err, decoded) {
    if (err) {
      return res
        .status(403)
        .send({ message: "forbidden access from middleware" });
    }
    req.decoded = decoded;
    next();
  });
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.reagpra.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const usersCollection = client
      .db("bootstrap-dashboard")
      .collection("users");

    // provide jwttoken
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const { name } = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: name,
          email: email,
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_SECRET, {
        expiresIn: "2d",
      });
      res.send({ result, accessToken: token });
    });
  } finally {
    // await client.close()
  }
}
run();
app.listen(port, () => {
  console.log("Running on port", port);
});
