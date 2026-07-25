import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

// Test book to delete and restore
const testBook = {
  title: "Test Book - Delete Me",
  author: "Test Author",
  category: "Fiction",
  description: "This is a test book for delete functionality testing.",
  deliveryFee: 1.99,
  coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
  status: "available",
  rating: 4.0,
  totalReviews: 0,
  isbn: "000-0000000000",
  publishedYear: 2024,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function testDelete() {
  console.log("=== Testing Book Delete Functionality ===\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const collection = db.collection("books");

    // Step 1: Get initial count
    const initialCount = await collection.countDocuments();
    console.log(`Step 1: Initial book count: ${initialCount}`);

    // Step 2: Insert test book
    console.log("\nStep 2: Inserting test book...");
    const insertResult = await collection.insertOne(testBook);
    const testBookId = insertResult.insertedId.toString();
    console.log(`  Inserted test book with ID: ${testBookId}`);

    // Verify insertion
    const countAfterInsert = await collection.countDocuments();
    console.log(`  Book count after insert: ${countAfterInsert}`);
    console.log(`  Insert successful: ${countAfterInsert === initialCount + 1 ? "YES" : "NO"}`);

    // Step 3: Delete via API
    console.log(`\nStep 3: Deleting book via API (ID: ${testBookId})...`);
    const response = await fetch(`http://localhost:5000/api/books/${testBookId}`, {
      method: "DELETE",
    });

    const result = await response.json();
    console.log(`  API Response: ${JSON.stringify(result)}`);

    // Step 4: Verify deletion
    const countAfterDelete = await collection.countDocuments();
    console.log(`\nStep 4: Verifying deletion...`);
    console.log(`  Book count after delete: ${countAfterDelete}`);
    console.log(`  Delete successful: ${countAfterDelete === initialCount ? "YES" : "NO"}`);

    // Check if book still exists
    const deletedBook = await collection.findOne({ _id: new ObjectId(testBookId) });
    console.log(`  Book still exists in DB: ${deletedBook ? "YES (ERROR)" : "NO (CORRECT)"}`);

    // Step 5: Summary
    console.log("\n=== Test Summary ===");
    console.log(`  Initial count: ${initialCount}`);
    console.log(`  After insert: ${countAfterInsert}`);
    console.log(`  After delete: ${countAfterDelete}`);
    console.log(`  Delete functionality: ${countAfterDelete === initialCount ? "WORKING" : "FAILED"}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

testDelete();
