# SimpleBDB

A lightweight, simple binary database for Node.js applications. SimpleBDB uses MsgPack encoding for efficient storage and fast access, making it perfect for small to medium-sized projects.

## Features

- 📦 **Binary Storage**: Stores data in an efficient binary format using MsgPack
- 🔄 **Auto-save**: Automatically saves changes to disk (configurable)
- 🔍 **Nested Keys**: Support for dot notation to access nested properties
- 🛠️ **Data Manipulation**: Includes utility methods for common operations (add, subtract, push, pull)
- 💾 **Persistent Storage**: Data persists between application restarts
- 🚀 **Simple API**: Easy to learn and integrate

## Installation

```bash
npm install simple-bdb
# or
yarn add simple-bdb
```

## Usage

### Basic Usage

```javascript
// Import the database
const SimpleBDB = require('simple-bdb');
// or with ES modules
import SimpleBDB from 'simple-bdb';

// Create a new database instance
const db = new SimpleBDB({ filePath: './data/mydb.bdb' });

// Set a value
db.set('user.name', 'John');

// Get a value
const name = db.get('user.name'); // Returns 'John'

// Check if a key exists
const hasAge = db.has('user.age'); // Returns false

// Delete a key
db.delete('user.name'); // Returns true
```

### Working with Numbers

```javascript
// Add to a number
db.set('counter', 10);
db.add('counter', 5); // counter is now 15

// Subtract from a number
db.subtract('counter', 3); // counter is now 12
```

### Working with Arrays

```javascript
// Push to an array
db.set('users', ['Alice']);
db.push('users', 'Bob'); // users is now ['Alice', 'Bob']

// Remove elements from an array
db.pull('users', user => user === 'Alice'); // users is now ['Bob']
```

### Advanced Usage

```javascript
// Get all data
const allData = db.all();
// Returns: [{ ID: 'user', data: { name: 'John' }}, { ID: 'counter', data: 12 }]

// Clear database
db.clear();
```

## API Documentation

### Constructor

```javascript
new SimpleBDB(options)
```

**Options:**
- `filePath` (string, optional): Path to the database file. Default: `'database.bdb'`
- `autoSave` (boolean, optional): Whether to automatically save changes. Default: `true`
- `cachedData` (boolean, optional): Whether to cache data for making less read request to your os. Default: `true`

### Methods

#### `set(key, value)`
Sets a value in the database.
- Returns: The value that was set

#### `get(key, defaultValue = null)`
Gets a value from the database.
- Returns: The value or defaultValue if key doesn't exist

#### `has(key)`
Checks if a key exists.
- Returns: Boolean

#### `delete(key)`
Deletes a key from the database.
- Returns: Boolean (true if key was deleted)

#### `add(key, amount)`
Adds a number to a value.
- Returns: The new value

#### `subtract(key, amount)`
Subtracts a number from a value.
- Returns: The new value

#### `push(key, value)`
Pushes a value to an array.
- Returns: The new array

#### `pull(key, callback)`
Removes elements from an array using a filter function.
- Returns: The new array

#### `all()`
Gets all data from the database.
- Returns: Array of objects with ID and data properties

#### `save()`
Manually saves data to the database file.

#### `clear()`
Clears all data from the database.