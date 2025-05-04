const { Database } = require("../dist");
const fs = require("fs");

// Helper function to measure execution time
function measureTime(operation, name) {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(3)} ms`);
    return result;
}

console.log("Starting massive data test without autoSave and cache...");

const db = new Database({
    autoSave: false,
    cacheData: true,
    filePath: "./massive-data.bdb"
});

// Number of items to insert
const ITEM_COUNT = 10000;

// Generate and insert massive data
console.log(`Writing ${ITEM_COUNT} items to database...`);

const totalStart = performance.now();

// Insert simple key-value pairs
for (let i = 0; i < ITEM_COUNT; i++) {
    db.set(`key${i}`, `value${i}`);
    
    // Log progress every 1000 items
    if (i % 1000 === 0 && i > 0) {
        console.log(`Inserted ${i} items...`);
    }
}

// Insert some nested data
for (let i = 0; i < 100; i++) {
    db.set(`nested.data${i}`, {
        id: i,
        name: `Item ${i}`,
        tags: Array(20).fill(0).map((_, j) => `tag${j}`),
        metadata: {
            created: Date.now(),
            modified: Date.now(),
            status: i % 2 === 0 ? 'active' : 'inactive'
        }
    });
}

// Insert array data
db.set("massive-array", Array(1000).fill(0).map((_, i) => ({
    index: i,
    value: `array-item-${i}`,
    nested: {
        data: `nested-${i}`
    }
})));

const totalEnd = performance.now();
console.log(`Total insertion time: ${((totalEnd - totalStart) / 1000).toFixed(2)} seconds`);

// Explicitly save the database
console.log("Saving database...");
measureTime(() => db.save(), "Database save");

// Add complex nested structure test
console.log("\nAdding complex nested structures...");
measureTime(() => {
    db.set("complex.deeply.nested.structure.with.many.levels", {
        data: "This is deeply nested",
        array: [1, 2, 3, 4, 5],
        object: { a: 1, b: 2, c: 3 }
    });
}, "Set complex nested structure");

// Add array of objects with nested properties
measureTime(() => {
    db.set("users", [
        { id: 1, name: "User 1", profile: { age: 25, role: "admin" } },
        { id: 2, name: "User 2", profile: { age: 30, role: "user" } },
        { id: 3, name: "User 3", profile: { age: 35, role: "moderator" } }
    ]);
}, "Set array of objects");

// Add object with arrays at multiple levels
measureTime(() => {
    db.set("categories", {
        technology: {
            items: ["computers", "phones", "tablets"],
            featured: [
                { name: "Computer X", price: 1000, specs: { ram: "16GB", storage: ["1TB SSD", "2TB HDD"] } },
                { name: "Phone Y", price: 800, specs: { ram: "8GB", storage: ["256GB"] } }
            ]
        },
        books: {
            items: ["fiction", "non-fiction", "educational"],
            featured: [
                { name: "Book A", price: 20, authors: ["Author 1", "Author 2"] },
                { name: "Book B", price: 15, authors: ["Author 3"] }
            ]
        }
    });
}, "Set complex object with arrays");

// Test retrieval of some values
console.log("\nTesting data retrieval:");
measureTime(() => db.get("key100"), "Get key100");
measureTime(() => db.get("key5000"), "Get key5000");
measureTime(() => db.get("nested.data50"), "Get nested.data50");
measureTime(() => db.get("massive-array[500]"), "Get massive-array[500]");

// Test complex path retrieval
console.log("\nTesting complex path retrieval:");
measureTime(() => db.get("complex.deeply.nested.structure.with.many.levels.data"), "Get deeply nested data");
measureTime(() => db.get("complex.deeply.nested.structure.with.many.levels.array[2]"), "Get deeply nested array item");
measureTime(() => db.get("users[1].profile.role"), "Get user profile role");
measureTime(() => db.get("categories.technology.featured[0].specs.storage[0]"), "Get extremely nested array item");
measureTime(() => db.get("categories.books.featured[0].authors[1]"), "Get nested array in object in array");

// Test retrieving non-existent paths (should not error)
console.log("\nTesting non-existent paths:");
measureTime(() => db.get("this.path.does.not.exist"), "Get non-existent path");
measureTime(() => db.get("users[10].name"), "Get non-existent array index");
measureTime(() => db.get("categories.music"), "Get non-existent category");

// Use case: Adding to arrays using path notation
console.log("\nTesting array operations:");
measureTime(() => {
    const currentArray = db.get("categories.technology.items") || [];
    currentArray.push("wearables");
    db.set("categories.technology.items", currentArray);
}, "Add item to existing array");

// Use case: Updating nested property
console.log("\nTesting nested property updates:");
measureTime(() => {
    const user = db.get("users[0]");
    if (user) {
        user.profile.age = 26;
        db.set("users[0]", user);
    }
}, "Update nested user property");

// Print database statistics
console.log("\nDatabase statistics:");
const all = db.all();
console.log(`Total keys at root level: ${Object.keys(all).length}`);
console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);

// Save again after all operations
console.log("\nSaving database after all operations...");
measureTime(() => db.save(), "Final database save");

// Save data as json for comparison
const jsonData = JSON.stringify(Object.fromEntries(
    all.map(({ ID, data }) => [ID, data])
));
fs.writeFileSync("./massive-data.json", jsonData, "utf-8");
console.log("Data saved to massive-data.json");
