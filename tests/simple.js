const { Database } = require("../dist");

// Add timer function
function measureTime(operation, name) {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(3)} ms`);
    return result;
}

const db = new Database({
    autoSave: true,
    cacheData: true
});

measureTime(() => db.set("test", 3), "Set test");
measureTime(() => db.set("test2", 3.2), "Set test2");
measureTime(() => db.set("test3", "3"), "Set test3");
measureTime(() => db.set("selam.test", [1,2,3]), "Set selam.test");

// 3
console.log(
    "test:",
    measureTime(() => db.get("test"), "Get test"),
);

// 3.2
console.log(
    "test2:",
    measureTime(() => db.get("test2"), "Get test2"),
);

// 3
console.log(
    "test3:",
    measureTime(() => db.get("test3"), "Get test3"),
);

// { test: [ 1, 2, 3 ] }
console.log(
    "selam:",
    measureTime(() => db.get("selam"), "Get selam"),
);

// [ 1, 2, 3 ]
console.log(
    "selam.test:",
    measureTime(() => db.get("selam.test"), "Get selam.test"),
);

// 1
console.log(
    "selam.test[0]:",
    measureTime(() => db.get("selam.test[0]"), "Get selam.test[0]"),
);

console.log(
    "all:",
    measureTime(() => db.all(), "Get all"),
);

console.log(
    JSON.stringify(Object.fromEntries(
        db.all().map(({ ID, data }) => [ID, data])
    ))
)