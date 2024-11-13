const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// use middle were;
app.use(express.json());
app.use(cors());

// by default server get;
app.get("/", (req, res) => {
  res.send("system is running");
});

// by default listen;
app.listen(port, () => {
  console.log(`System si running on port:${port}`);
});

// =====================================================================================
//                                    MAIN CODE
//======================================================================================

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@baniray-primary-school.uegos.mongodb.net/?retryWrites=true&w=majority&appName=Baniray-primary-school`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // class related api;
    // Get the database and collection on which to run the operation

    // class collection;
    const userCollection = client
      .db("baniray-primary-school")
      .collection("users");

    // class collection;
    const classCollection = client
      .db("baniray-primary-school")
      .collection("classes");

    // teachers collection;
    const teachersCollection = client
      .db("baniray-primary-school")
      .collection("classes");

    // success collection;
    const successCollection = client
      .db("baniray-primary-school")
      .collection("success");

    // blog collection;
    const blogsCollection = client
      .db("baniray-primary-school")
      .collection("blogs");

    // create json web token;
    app.post("/jwt", async (req, res) => {
      try {
        const userInfo = req.body;
        const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });
        res.send(token);
      } catch (error) {
        console.log(error);
      }
    });

    // verify token middleWere
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(410).send({ message: "forbidden access" });
      }

      const token = req.headers.authorization.split(" ")[1];

      // verify a token symmetric
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(410).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verify teachers middleWere after verify token;
    const verifyTeacher = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      // verify teachers;
      const isTeacher = user.role === "teacher";
      if (!isTeacher) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // user related api --------------------------------------------------------------------->
    // post user
    app.post("/user", async (req, res) => {
      try {
        const userInfo = req.body;
        const query = { email: userInfo?.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "user already exist" });
        }
        const result = await userCollection.insertOne(userInfo);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get teachers
    app.get("/user/teacher/:email", verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: "unauthorized access" });
        }
        const query = { email: email };
        const user = await userCollection.findOne(query);

        let teacher = false;
        if (user) {
          teacher = user.role === "teacher";
        }
        res.send({ teacher });
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/user", verifyToken, verifyTeacher, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // classes related apis---------------------------------------------+++==========-------------->
    // post class;
    app.post("/classes", verifyToken, verifyTeacher, async (req, res) => {
      const classItem = req.body;

      const result = await classCollection.insertOne(classItem);
      res.send(result);
    });

    // get all class
    app.get("/classes", async (req, res) => {
      try {
        const result = await classCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "error facing classes" });
      }
    });

    // get single class;
    app.get("/classes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await classCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // update a classes
    app.patch("/classes/:id", verifyToken, verifyTeacher, async (req, res) => {
      const classInfo = req.body;
      const id = req.params;
      const query = { _id: new ObjectId(id) };

      // Specify the update to set a value for the plot field
      const updateDoc = {
        $set: {
          class: classInfo.class,
          subject: classInfo.subject,
          teacher: classInfo.teacher,
          details: classInfo.details,
          schedule: classInfo.schedule,
          learningObjectives: classInfo.learningObjectives,
          whatLearned: classInfo.whatLearned,
          materialsNeeded: classInfo.materialsNeeded,
          additionalResources: classInfo.additionalResources,
          image: classInfo?.image,
        },  
      };
      const result = await classCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete class;
    app.delete("/classes/:id", verifyToken, verifyTeacher, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await classCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // teacher related apis--------------------------------------------------->
    app.get("/teachers", async (req, res) => {
      try {
        const result = await teachersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "error facing teachers" });
      }
    });

    // teacher related apis --------------------------------------------------------->
    app.get("/blogs", async (req, res) => {
      try {
        const result = await blogsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "error facing blogs" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
