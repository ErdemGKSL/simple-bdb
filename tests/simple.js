const { Database } = require("../dist");

const db = new Database({
    autoSave: true,
});

db.set("test", 3);
db.set("test2", 3.2);
db.set("test3", "3");
db.set("selam.test", [1,2,3]);

// 3
console.log(
    "test:",
    db.get("test"),
);

// 3.2
console.log(
    "test2:",
    db.get("test2"),
);

// 3
console.log(
    "test3:",
    db.get("test3"),
);

// { test: [ 1, 2, 3 ] }
console.log(
    "selam:",
    db.get("selam"),
);

// [ 1, 2, 3 ]
console.log(
    "selam.test:",
    db.get("selam.test"),
);

// 1
console.log(
    "selam.test[0]:",
    db.get("selam.test[0]"),
);