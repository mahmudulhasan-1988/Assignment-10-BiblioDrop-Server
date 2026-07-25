import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

async function testEdit() {
  console.log("=== Testing Book Edit via API ===\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const collection = db.collection("books");

    // Get the first book
    const book = await collection.findOne({ title: "Dune" });
    if (!book) {
      console.log("Book 'Dune' not found!");
      return;
    }

    console.log("Step 1: Found book 'Dune'");
    console.log(`  ID: ${book._id}`);
    console.log(`  Original title: ${book.title}`);
    console.log(`  Original fee: $${book.deliveryFee}`);

    // Test update via API
    const bookId = book._id.toString();
    const newFee = 3.99;

    console.log(`\nStep 2: Updating delivery fee from $${book.deliveryFee} to $${newFee}...`);

    const response = await fetch(`http://localhost:5000/api/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: bookId,
        deliveryFee: newFee,
      }),
    });

    const result = await response.json();
    console.log(`  API Response: ${JSON.stringify(result)}`);

    // Verify the update
    const updatedBook = await collection.findOne({ _id: new ObjectId(bookId) });
    console.log(`\nStep 3: Verifying update in database...`);
    console.log(`  Updated fee: $${updatedBook.deliveryFee}`);
    console.log(`  Update successful: ${updatedBook.deliveryFee === newFee ? "YES" : "NO"}`);

    // Revert the change
    console.log(`\nStep 4: Reverting change...`);
    await collection.updateOne(
      { _id: new ObjectId(bookId) },
      { $set: { deliveryFee: book.deliveryFee, updatedAt: new Date() } }
    );
    const revertedBook = await collection.findOne({ _id: new ObjectId(bookId) });
    console.log(`  Reverted fee: $${revertedBook.deliveryFee}`);

    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

testEdit();
