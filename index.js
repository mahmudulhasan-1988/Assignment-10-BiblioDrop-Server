import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));




// MongoDB Connection
let db = null;

async function connectDB() {
  if (db) return db;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("Connected to MongoDB");

  // Ensure unique compound index on (userId, bookId) for readingList
  await db.collection("readingList").createIndex({ userId: 1, bookId: 1 }, { unique: true });

  const subscriptionCollection = db.collection("subscription");
  const userCollection = db.collection("user");


  app.post("/subscription", async (req, res) => {
    const { user, session_id } = req.body;
    console.log(session_id);
    const isExistSession = await subscriptionCollection.findOne({ session_id })
    if (isExistSession) {
      return res.status(400).send({ message: "Session already exist" })
    }

    const subs_result = await subscriptionCollection.insertOne({
      userId: new ObjectId(user.id),
      session_id,
    });

    const user_result = await userCollection.updateOne(
      { _id: new ObjectId(user.id) },
      { $set: { plan: "pro" } },
    );
    res.send({ message: "Subscription created successfully", subs_result, user_result })
  })

  return db;

}


// ==================== BOOKS ROUTES ====================

// GET /api/books - Get all books with filters and pagination
app.get("/api/books", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("books");

    const { search, category, status, sort, page = 1, limit = 12, ownerId } = req.query;

    let query = {};

    // Filter by ownerId if provided (for librarian's own books)
    if (ownerId) {
      query.ownerId = ownerId;
    }

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { title: regex },
        { author: regex },
        { category: regex },
        { description: regex },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { publishedYear: -1 };
        break;
      case "oldest":
        sortOption = { publishedYear: 1 };
        break;
      case "price_low":
        sortOption = { deliveryFee: 1 };
        break;
      case "price_high":
        sortOption = { deliveryFee: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "title_az":
        sortOption = { title: 1 };
        break;
      case "title_za":
        sortOption = { title: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const total = await collection.countDocuments(query);

    // Get paginated books
    const books = await collection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Map _id to id
    const mapped = books.map((book) => ({
      ...book,
      id: book._id?.toString() || "",
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      books: mapped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// GET /api/books/:id - Get single book
app.get("/api/books/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("books");
    const { id } = req.params;

    let book;
    if (ObjectId.isValid(id)) {
      book = await collection.findOne({ _id: new ObjectId(id) });
    } else {
      book = await collection.findOne({ id });
    }

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ ...book, id: book._id?.toString() || "" });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ error: "Failed to fetch book" });
  }
});

// POST /api/books - Create a book
app.post("/api/books", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("books");

    const {
      title,
      author,
      category,
      description,
      deliveryFee,
      coverImage,
      isbn,
      publishedYear,
      ownerId,
      ownerName,
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }

    const now = new Date();
    const book = {
      title,
      author,
      category: category || "Fiction",
      description: description || "",
      deliveryFee: deliveryFee || 0,
      coverImage: coverImage || "",
      status: "pending",
      rating: 0,
      totalReviews: 0,
      isbn: isbn || "",
      publishedYear: publishedYear || now.getFullYear(),
      ownerId: ownerId || "",
      ownerName: ownerName || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(book);

    res.status(201).json({ ...book, _id: result.insertedId, id: result.insertedId.toString() });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Failed to create book" });
  }
});

// PUT /api/books/:id - Update a book
app.put("/api/books/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("books");
    const { id } = req.params;
    const updates = req.body;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// DELETE /api/books/:id - Delete a book
app.delete("/api/books/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("books");
    const { id } = req.params;

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// ==================== DELIVERIES ROUTES ====================

// GET /api/deliveries - Get all deliveries
app.get("/api/deliveries", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("deliveries");

    const { userId } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const deliveries = await collection.find(query).sort({ requestDate: -1 }).toArray();

    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

// POST /api/deliveries - Create a delivery
app.post("/api/deliveries", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("deliveries");

    const {
      userId,
      userName,
      userEmail,
      bookId,
      bookTitle,
      bookAuthor,
      bookCover,
      deliveryFee,
    } = req.body;

    if (!bookId || !bookTitle) {
      return res.status(400).json({ error: "Book ID and title are required" });
    }

    const now = new Date();
    const delivery = {
      userId: userId || "anonymous",
      userName: userName || "Anonymous",
      userEmail: userEmail || "",
      bookId,
      bookTitle,
      bookAuthor: bookAuthor || "",
      bookCover: bookCover || "",
      deliveryFee: deliveryFee || 0,
      status: "Pending",
      requestDate: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(delivery);

    res.status(201).json({ ...delivery, _id: result.insertedId });
  } catch (error) {
    console.error("Error creating delivery:", error);
    res.status(500).json({ error: "Failed to create delivery" });
  }
});

// PATCH /api/deliveries/:id - Update delivery status
app.patch("/api/deliveries/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("deliveries");
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Dispatched", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating delivery:", error);
    res.status(500).json({ error: "Failed to update delivery" });
  }
});

// ==================== REVIEWS ROUTES ====================

// GET /api/reviews - Get reviews for a book
app.get("/api/reviews", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("reviews");

    const { bookId } = req.query;

    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    const reviews = await collection.find({ bookId }).sort({ createdAt: -1 }).toArray();

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({ reviews, avgRating, totalReviews: reviews.length });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/reviews - Create a review
app.post("/api/reviews", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("reviews");

    const {
      userId,
      userName,
      userEmail,
      userImage,
      bookId,
      bookTitle,
      rating,
      comment,
    } = req.body;

    if (!bookId || !rating) {
      return res.status(400).json({ error: "Book ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const now = new Date();
    const review = {
      userId: userId || "anonymous",
      userName: userName || "Anonymous",
      userEmail: userEmail || "",
      userImage: userImage || "",
      bookId,
      bookTitle: bookTitle || "",
      rating,
      comment: comment || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(review);

    res.status(201).json({ ...review, _id: result.insertedId });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// DELETE /api/reviews/:id - Delete a review
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("reviews");
    const { id } = req.params;

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ==================== USERS ROUTES ====================

// GET /api/users - Get all users
app.get("/api/users", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("user");

    const users = await collection.find({}).toArray();

    const mapped = users.map((u) => ({
      id: u._id?.toString() || "",
      name: u.name || "",
      email: u.email || "",
      image: u.image || "",
      role: u.role || "reader",
      createdAt: u.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH /api/users - Update user
app.patch("/api/users", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("user");
    const { id, role, name, image } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updates = { updatedAt: new Date() };
    if (role !== undefined) {
      const validRoles = ["admin", "librarian", "reader"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      updates.role = role;
    }
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image = image;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/users?id=xxx - Delete user
app.delete("/api/users", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("user");
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// PATCH /api/users/:id/role - Update user role
app.patch("/api/users/:id/role", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("user");
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "librarian", "reader"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// DELETE /api/users/:id - Delete user by ID
app.delete("/api/users/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("user");
    const { id } = req.params;

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ==================== READING LIST ROUTES ====================

// GET /api/reading-list - Get reading list
app.get("/api/reading-list", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("readingList");

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const items = await collection.find({ userId }).sort({ addedAt: -1 }).toArray();

    const mapped = items.map((item) => ({
      ...item,
      _id: item._id?.toString() || "",
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error fetching reading list:", error);
    res.status(500).json({ error: "Failed to fetch reading list" });
  }
});

// POST /api/reading-list - Add to reading list
app.post("/api/reading-list", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("readingList");

    const { userId, bookId, bookTitle, bookAuthor, bookCover, category } = req.body;

    if (!userId || !bookId || !bookTitle) {
      return res.status(400).json({ error: "userId, bookId, and bookTitle are required" });
    }

    const existing = await collection.findOne({ userId, bookId });
    if (existing) {
      return res.status(409).json({ error: "Book already in reading list" });
    }

    const item = {
      userId,
      bookId,
      bookTitle,
      bookAuthor: bookAuthor || "",
      bookCover: bookCover || "",
      category: category || "",
      addedAt: new Date(),
    };

    const result = await collection.insertOne(item);

    res.status(201).json({ ...item, _id: result.insertedId.toString() });
  } catch (error) {
    // Handle duplicate key error from unique index (race condition)
    if (error.code === 11000) {
      return res.status(409).json({ error: "Book already in reading list" });
    }
    console.error("Error adding to reading list:", error);
    res.status(500).json({ error: "Failed to add to reading list" });
  }
});

// DELETE /api/reading-list?bookId=xxx - Remove from reading list
app.delete("/api/reading-list", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("readingList");

    const { userId, bookId } = req.query;

    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    const query = { bookId };
    if (userId) query.userId = userId;

    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Book not found in reading list" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing from reading list:", error);
    res.status(500).json({ error: "Failed to remove from reading list" });
  }
});

// ==================== HEALTH CHECK ====================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

