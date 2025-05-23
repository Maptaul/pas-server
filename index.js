const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6vndn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("passystem");
    const usersCollection = db.collection("users");
    const applicationsCollection = db.collection("applications");

    // GET: Retrieve all users
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST: Create or update a user (during signup)
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);

        if (existingUser) {
          const updateDoc = {
            $set: {
              name: user.name,
              role: user.role,
              photoURL: user.photoURL || null,
              updatedAt: new Date().toISOString(),
            },
          };
          const result = await usersCollection.updateOne(query, updateDoc);
          return res.status(200).json(result);
        }

        const newUser = {
          name: user.name,
          email: user.email,
          role: user.role,
          photoURL: user.photoURL || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Internal server error", error: error.message });
      }
    });

    // GET: Retrieve user by email
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Internal server error", error: error.message });
      }
    });

    // GET: Retrieve all applications
    app.get("/applications", async (req, res) => {
      const cursor = applicationsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST: Save passport application
    app.post("/applications", async (req, res) => {
      try {
        const applicationData = req.body;

        // Validate required fields
        if (
          !applicationData.passportType ||
          !applicationData.onlineRegistrationNumber ||
          !applicationData.fullName ||
          !applicationData.dateOfBirth ||
          !applicationData.mobileNumber ||
          !applicationData.files ||
          !applicationData.files.applicationCopy ||
          !applicationData.files.nidBirthCertificate ||
          !applicationData.files.nidOnlineCopy ||
          !applicationData.files.fatherNidBirthCertificate ||
          !applicationData.files.motherNidBirthCertificate ||
          !applicationData.files.utilityBillCopy ||
          !applicationData.files.landRegister ||
          !applicationData.files.citizenshipCertificate
        ) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Generate application ID
        const applicationId = `PAS-2025-${Math.floor(
          10000 + Math.random() * 90000
        )}`;

        // Prepare application data
        const application = {
          applicationId,
          ...applicationData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to MongoDB
        const result = await applicationsCollection.insertOne(application);
        res.status(201).json({ message: "Application submitted", applicationId, result });
      } catch (error) {
        console.error("Error in POST /applications:", error);
        res.status(500).json({ error: "Internal server error", error: error.message });
      }
    });
  } catch (error) {
    console.error("Error in run function:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});