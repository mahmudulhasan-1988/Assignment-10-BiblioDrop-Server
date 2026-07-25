import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

async function cleanupDuplicates() {
  console.log("=== Cleaning up duplicate books ===\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);

    // --- Books cleanup ---
    const booksCollection = db.collection("books");
    const booksTotal = await booksCollection.countDocuments();
    console.log(`Total books before cleanup: ${booksTotal}`);

    const booksPipeline = [
      { $group: { _id: "$title", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
    ];

    const booksDuplicates = await booksCollection.aggregate(booksPipeline).toArray();
    console.log(`Duplicate book titles found: ${booksDuplicates.length}`);

    if (booksDuplicates.length > 0) {
      for (const dup of booksDuplicates) {
        console.log(`  - "${dup._id}": ${dup.count} copies`);
        const idsToDelete = dup.ids.slice(1);
        await booksCollection.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`    Deleted ${idsToDelete.length} duplicates`);
      }
    }

    const booksFinal = await booksCollection.countDocuments();
    console.log(`Final book count: ${booksFinal}`);

    // --- Reading List cleanup ---
    console.log("\n=== Cleaning up duplicate reading list entries ===\n");

    const readingListCollection = db.collection("readingList");
    const rlTotal = await readingListCollection.countDocuments();
    console.log(`Total reading list entries before cleanup: ${rlTotal}`);

    const rlPipeline = [
      { $group: { _id: { userId: "$userId", bookId: "$bookId" }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
    ];

    const rlDuplicates = await readingListCollection.aggregate(rlPipeline).toArray();
    console.log(`Duplicate reading list entries found: ${rlDuplicates.length}`);

    if (rlDuplicates.length > 0) {
      let totalDeleted = 0;
      for (const dup of rlDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        await readingListCollection.deleteMany({ _id: { $in: idsToDelete } });
        totalDeleted += idsToDelete.length;
        console.log(`  - User ${dup._id.userId}, Book ${dup._id.bookId}: deleted ${idsToDelete.length} duplicate(s)`);
      }
      console.log(`Total reading list duplicates deleted: ${totalDeleted}`);
    }

    const rlFinal = await readingListCollection.countDocuments();
    console.log(`Final reading list count: ${rlFinal}`);

    // --- Create unique index to prevent future duplicates ---
    await readingListCollection.createIndex({ userId: 1, bookId: 1 }, { unique: true });
    console.log("\nCreated unique index on (userId, bookId) for readingList collection");
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

cleanupDuplicates();
