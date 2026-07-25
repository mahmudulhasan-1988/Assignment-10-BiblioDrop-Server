import "dotenv/config";

const BACKEND_URL = `http://localhost:${process.env.PORT || 5000}`;

async function checkServer() {
  console.log("Checking backend server...\n");

  // Check 1: Health endpoint
  try {
    console.log("1. Checking health endpoint...");
    const healthRes = await fetch(`${BACKEND_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log("   ✓ Server is running:", healthData.status);
    console.log("   ✓ Timestamp:", healthData.timestamp);
  } catch (error) {
    console.log("   ✗ Server is not responding:", error.message);
    console.log("\nPlease start the backend server:");
    console.log("   cd Assignment-10-BiblioDrop-Server");
    console.log("   npm start\n");
    return;
  }

  // Check 2: Books endpoint
  try {
    console.log("\n2. Checking books endpoint...");
    const booksRes = await fetch(`${BACKEND_URL}/api/books?page=1&limit=5`);
    const booksData = await booksRes.json();

    if (booksData.books && booksData.pagination) {
      console.log("   ✓ Books endpoint is working");
      console.log("   ✓ Total books:", booksData.pagination.total);
      console.log("   ✓ Books on this page:", booksData.books.length);

      if (booksData.books.length > 0) {
        console.log("\n   Sample books:");
        booksData.books.slice(0, 3).forEach((book, i) => {
          console.log(`   ${i + 1}. "${book.title}" by ${book.author} (${book.category})`);
        });
      }
    } else if (Array.isArray(booksData)) {
      console.log("   ✓ Books endpoint is working (array response)");
      console.log("   ✓ Total books:", booksData.length);
    }
  } catch (error) {
    console.log("   ✗ Books endpoint error:", error.message);
  }

  // Check 3: Categories
  try {
    console.log("\n3. Checking categories...");
    const booksRes = await fetch(`${BACKEND_URL}/api/books?page=1&limit=1000`);
    const booksData = await booksRes.json();
    const books = booksData.books || (Array.isArray(booksData) ? booksData : []);

    const categories = {};
    books.forEach((book) => {
      const cat = book.category || "Other";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    console.log("   ✓ Categories found:", Object.keys(categories).length);
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count} books`);
      });
  } catch (error) {
    console.log("   ✗ Categories error:", error.message);
  }

  console.log("\n✓ All checks completed!");
}

checkServer();
