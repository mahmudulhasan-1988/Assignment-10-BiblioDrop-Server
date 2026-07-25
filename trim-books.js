import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

const booksToKeep = [
  "The Great Gatsby",
  "To Kill a Mockingbird",
  "1984",
  "Pride and Prejudice",
  "The Catcher in the Rye",
  "A Brief History of Time",
  "Steve Jobs",
  "Sapiens: A Brief History of Humankind",
  "The Very Hungry Caterpillar",
  "The Prophet",
  "Atomic Habits",
  "Dune",
  "The Alchemist",
  "Thinking, Fast and Slow",
  "The Diary of a Young Girl",
  "The Art of War",
  "Where the Wild Things Are",
  "Leaves of Grass",
  "The 7 Habits of Highly Effective People",
  "Foundation",
  "The Hobbit",
  "Cosmos",
  "Long Walk to Freedom",
  "A People's History of the United States",
  "Goodnight Moon",
  "The Raven",
  "How to Win Friends and Influence People",
];

async function trimBooks() {
  console.log("Trimming database to keep only 27 books...");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);
    const collection = db.collection("books");

    const totalBefore = await collection.countDocuments();
    console.log(`Books before trim: ${totalBefore}`);

    // Find books to keep
    const booksToKeepDocs = await collection
      .find({ title: { $in: booksToKeep } })
      .toArray();

    console.log(`Books to keep found: ${booksToKeepDocs.length}`);

    // Get IDs of books to keep
    const idsToKeep = booksToKeepDocs.map((b) => b._id);

    // Delete all books except the ones to keep
    const result = await collection.deleteMany({
      _id: { $nin: idsToKeep },
    });

    console.log(`Deleted ${result.deletedCount} books`);

    const totalAfter = await collection.countDocuments();
    console.log(`Books after trim: ${totalAfter}`);

    // Show remaining books
    const remaining = await collection.find({}).sort({ title: 1 }).toArray();
    console.log("\nRemaining books:");
    remaining.forEach((book, i) => {
      console.log(`${i + 1}. ${book.title} - ${book.category}`);
    });
  } catch (error) {
    console.error("Error trimming books:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

trimBooks();
