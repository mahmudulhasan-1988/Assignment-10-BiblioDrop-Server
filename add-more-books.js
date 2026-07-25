import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "assignment-10-webDB";

const moreBooks = [
  // Fiction
  { title: "The Old Man and the Sea", author: "Ernest Hemingway", category: "Fiction", description: "A story about an aging Cuban fisherman's struggle with a giant marlin.", deliveryFee: 2.19, coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400", status: "available", rating: 4.5, totalReviews: 198, isbn: "978-0684801223", publishedYear: 1952 },
  { title: "Jane Eyre", author: "Charlotte Bronte", category: "Fiction", description: "A novel about a young orphan girl who becomes a governess.", deliveryFee: 2.39, coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400", status: "available", rating: 4.6, totalReviews: 234, isbn: "978-0141441145", publishedYear: 1847 },
  { title: "Wuthering Heights", author: "Emily Bronte", category: "Fiction", description: "A story of passion and revenge on the Yorkshire moors.", deliveryFee: 2.29, coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", status: "available", rating: 4.4, totalReviews: 189, isbn: "978-0141439556", publishedYear: 1847 },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", category: "Fiction", description: "A story about a young man whose portrait ages while he remains young.", deliveryFee: 2.19, coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400", status: "available", rating: 4.5, totalReviews: 178, isbn: "978-0141439570", publishedYear: 1890 },
  { title: "Brave New World", author: "Aldous Huxley", category: "Fiction", description: "A dystopian novel about a futuristic World State.", deliveryFee: 2.49, coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400", status: "available", rating: 4.6, totalReviews: 267, isbn: "978-0060850524", publishedYear: 1932 },
  { title: "Lord of the Flies", author: "William Golding", category: "Fiction", description: "A story about boys stranded on an uninhabited island.", deliveryFee: 2.29, coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400", status: "available", rating: 4.3, totalReviews: 198, isbn: "978-0399501487", publishedYear: 1954 },
  { title: "The Grapes of Wrath", author: "John Steinbeck", category: "Fiction", description: "A story of the Joad family during the Great Depression.", deliveryFee: 2.39, coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", status: "available", rating: 4.5, totalReviews: 212, isbn: "978-0143039433", publishedYear: 1939 },
  { title: "Catch-22", author: "Joseph Heller", category: "Fiction", description: "A satirical novel about World War II.", deliveryFee: 2.49, coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400", status: "available", rating: 4.4, totalReviews: 189, isbn: "978-1451626641", publishedYear: 1961 },

  // Sci-Fi & Fantasy
  { title: "Ender's Game", author: "Orson Scott Card", category: "Sci-Fi & Fantasy", description: "A young genius is trained to fight an alien invasion.", deliveryFee: 2.59, coverImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400", status: "available", rating: 4.7, totalReviews: 345, isbn: "978-0812550702", publishedYear: 1985 },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", category: "Sci-Fi & Fantasy", description: "A human ambassador visits a planet with ambisexual inhabitants.", deliveryFee: 2.49, coverImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400", status: "available", rating: 4.6, totalReviews: 234, isbn: "978-0441478125", publishedYear: 1969 },
  { title: "Snow Crash", author: "Neal Stephenson", category: "Sci-Fi & Fantasy", description: "A pizza delivery driver moonlights as a hacker in a future America.", deliveryFee: 2.39, coverImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400", status: "available", rating: 4.5, totalReviews: 198, isbn: "978-0553380958", publishedYear: 1992 },
  { title: "Hyperion", author: "Dan Simmons", category: "Sci-Fi & Fantasy", description: "A group of pilgrims journey to the Time Tombs.", deliveryFee: 2.69, coverImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400", status: "available", rating: 4.7, totalReviews: 267, isbn: "978-0553283686", publishedYear: 1989 },
  { title: "The Hunger Games", author: "Suzanne Collins", category: "Sci-Fi & Fantasy", description: "A young girl is forced to fight to the death on live TV.", deliveryFee: 2.49, coverImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400", status: "available", rating: 4.6, totalReviews: 456, isbn: "978-0439023481", publishedYear: 2008 },

  // Academic
  { title: "The Origin of Species", author: "Charles Darwin", category: "Academic", description: "The foundation of evolutionary biology.", deliveryFee: 3.49, coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", status: "available", rating: 4.8, totalReviews: 389, isbn: "978-0451529060", publishedYear: 1859 },
  { title: "The Structure of Scientific Revolutions", author: "Thomas Kuhn", category: "Academic", description: "A book about paradigm shifts in science.", deliveryFee: 3.19, coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", status: "available", rating: 4.5, totalReviews: 234, isbn: "978-0226458121", publishedYear: 1962 },
  { title: "Silent Spring", author: "Rachel Carson", category: "Academic", description: "A book about the dangers of pesticides.", deliveryFee: 3.29, coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", status: "available", rating: 4.6, totalReviews: 267, isbn: "978-0618249060", publishedYear: 1962 },

  // Biography
  { title: "Leonardo da Vinci", author: "Walter Isaacson", category: "Biography", description: "A biography of the Renaissance genius.", deliveryFee: 3.69, coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", status: "available", rating: 4.7, totalReviews: 312, isbn: "978-1501139154", publishedYear: 2017 },
  { title: "Einstein: His Life and Universe", author: "Walter Isaacson", category: "Biography", description: "A biography of Albert Einstein.", deliveryFee: 3.59, coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", status: "available", rating: 4.8, totalReviews: 345, isbn: "978-0743264747", publishedYear: 2007 },
  { title: "The Woolfs", author: "Vita Sackville-West", category: "Biography", description: "A biography of Virginia and Leonard Woolf.", deliveryFee: 3.39, coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", status: "available", rating: 4.4, totalReviews: 178, isbn: "978-0156001199", publishedYear: 1928 },

  // History
  { title: "The Rise and Fall of the Third Reich", author: "William Shirer", category: "History", description: "A comprehensive history of Nazi Germany.", deliveryFee: 3.99, coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", status: "available", rating: 4.8, totalReviews: 456, isbn: "978-1451651683", publishedYear: 1960 },
  { title: "The Diary of Anne Frank", author: "Anne Frank", category: "History", description: "The writings of Anne Frank during WWII.", deliveryFee: 2.49, coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", status: "available", rating: 4.9, totalReviews: 567, isbn: "978-0553296983", publishedYear: 1947 },
  { title: "The Splendid and the Vile", author: "Erik Larson", category: "History", description: "Churchill's first year as Prime Minister.", deliveryFee: 3.29, coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", status: "available", rating: 4.6, totalReviews: 289, isbn: "978-0385348713", publishedYear: 2020 },

  // Children's
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "Children's", description: "A young wizard discovers his magical heritage.", deliveryFee: 2.99, coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", status: "available", rating: 4.9, totalReviews: 892, isbn: "978-0590353427", publishedYear: 1997 },
  { title: "The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", category: "Children's", description: "Children discover a magical land through a wardrobe.", deliveryFee: 2.49, coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", status: "available", rating: 4.8, totalReviews: 567, isbn: "978-0064471046", publishedYear: 1950 },
  { title: "Charlie and the Chocolate Factory", author: "Roald Dahl", category: "Children's", description: "A boy wins a tour of a magical chocolate factory.", deliveryFee: 2.29, coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", status: "available", rating: 4.7, totalReviews: 456, isbn: "978-0142437178", publishedYear: 1964 },

  // Poetry
  { title: "The Waste Land", author: "T.S. Eliot", category: "Poetry", description: "A modernist poem about post-WWI disillusionment.", deliveryFee: 1.99, coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400", status: "available", rating: 4.5, totalReviews: 189, isbn: "978-0571115242", publishedYear: 1922 },
  { title: "Howl", author: "Allen Ginsberg", category: "Poetry", description: "A beat generation poem about conformity and liberation.", deliveryFee: 1.89, coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400", status: "available", rating: 4.4, totalReviews: 167, isbn: "978-0060930905", publishedYear: 1956 },

  // Self-Help
  { title: "Mindset: The New Psychology of Success", author: "Carol Dweck", category: "Self-Help", description: "How a growth mindset can lead to success.", deliveryFee: 2.79, coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400", status: "available", rating: 4.6, totalReviews: 345, isbn: "978-0345472328", publishedYear: 2006 },
  { title: "The Power of Now", author: "Eckhart Tolle", category: "Self-Help", description: "A guide to spiritual enlightenment.", deliveryFee: 2.69, coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400", status: "available", rating: 4.5, totalReviews: 456, isbn: "978-1577314806", publishedYear: 1997 },
  { title: "Daring Greatly", author: "Brené Brown", category: "Self-Help", description: "How the courage to be vulnerable transforms our lives.", deliveryFee: 2.59, coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400", status: "available", rating: 4.7, totalReviews: 389, isbn: "978-1592408412", publishedYear: 2012 },
  { title: "Grit: The Power of Passion and Perseverance", author: "Angela Duckworth", category: "Self-Help", description: "Why talent is overrated and grit matters more.", deliveryFee: 2.69, coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400", status: "available", rating: 4.6, totalReviews: 312, isbn: "978-1501111105", publishedYear: 2016 },
];

async function addMoreBooks() {
  console.log("Adding more books to database...");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);
    const collection = db.collection("books");

    const existingCount = await collection.countDocuments();
    console.log(`Existing books: ${existingCount}`);

    // Check which books already exist by title
    const existingTitles = await collection.distinct("title");
    const existingSet = new Set(existingTitles);

    // Filter out books that already exist
    const newBooks = moreBooks
      .filter((book) => !existingSet.has(book.title))
      .map((book) => ({
        ...book,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    console.log(`New books to add: ${newBooks.length}`);

    if (newBooks.length > 0) {
      const result = await collection.insertMany(newBooks);
      console.log(`Inserted ${result.insertedCount} books`);
    }

    const finalCount = await collection.countDocuments();
    console.log(`Total books in database: ${finalCount}`);

    // Show pagination info
    const itemsPerPage = 10;
    const totalPages = Math.ceil(finalCount / itemsPerPage);
    console.log(`\nPagination info:`);
    console.log(`  - Books per page: ${itemsPerPage}`);
    console.log(`  - Total pages: ${totalPages}`);
    for (let i = 1; i <= totalPages; i++) {
      const start = (i - 1) * itemsPerPage + 1;
      const end = Math.min(i * itemsPerPage, finalCount);
      console.log(`  - Page ${i}: books ${start}-${end}`);
    }
  } catch (error) {
    console.error("Error adding books:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

addMoreBooks();
