import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

const coverImages = {
  "The Great Gatsby": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
  "To Kill a Mockingbird": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop",
  "1984": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop",
  "Pride and Prejudice": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
  "The Catcher in the Rye": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop",
  "A Brief History of Time": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop",
  "Steve Jobs": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
  "Sapiens: A Brief History of Humankind": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=600&fit=crop",
  "The Very Hungry Caterpillar": "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&h=600&fit=crop",
  "The Prophet": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop",
  "Atomic Habits": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop",
  "Dune": "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=400&h=600&fit=crop",
  "The Alchemist": "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&h=600&fit=crop",
  "Thinking, Fast and Slow": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop",
  "The Diary of a Young Girl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
  "The Art of War": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop",
  "Where the Wild Things Are": "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400&h=600&fit=crop",
  "Leaves of Grass": "https://images.unsplash.com/photo-1501959915551-4e8d30928317?w=400&h=600&fit=crop",
  "The 7 Habits of Highly Effective People": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=600&fit=crop",
  "Foundation": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop",
  "The Hobbit": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
  "Cosmos": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=600&fit=crop",
  "Long Walk to Freedom": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
  "A People's History of the United States": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop",
  "Goodnight Moon": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
  "The Raven": "https://images.unsplash.com/photo-1501959915551-4e8d30928317?w=400&h=600&fit=crop",
  "How to Win Friends and Influence People": "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=600&fit=crop",
};

async function updateCoverImages() {
  console.log("Updating book cover images...");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);
    const collection = db.collection("books");

    let updated = 0;
    let skipped = 0;

    for (const [title, imageUrl] of Object.entries(coverImages)) {
      const result = await collection.updateOne(
        { title: title },
        { $set: { coverImage: imageUrl, updatedAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✓ Updated: ${title}`);
        updated++;
      } else {
        console.log(`- Skipped (not found): ${title}`);
        skipped++;
      }
    }

    console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);

    // Verify some updates
    console.log("\nVerifying updates:");
    const sampleBooks = await collection.find({}).limit(5).toArray();
    sampleBooks.forEach((book) => {
      console.log(`  ${book.title}: ${book.coverImage ? "Has image" : "No image"}`);
    });
  } catch (error) {
    console.error("Error updating cover images:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

updateCoverImages();
