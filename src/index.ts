import { encode, decode } from "@msgpack/msgpack";
import fs from "fs";
import path from "path";
import lodash from "lodash";

interface DatabaseOptions {
  filePath?: string;
  autoSave?: boolean;
}

class Database {
  private filePath: string;
  private data: Record<string, any>;
  private autoSave: boolean;

  /**
   * Creates a new Database instance
   * @param options Database options
   */
  constructor(options: DatabaseOptions = {}) {
    this.filePath = options.filePath || "database.bdb";
    this.autoSave = options.autoSave !== false;
    this.data = {};
    
    // Create directory if it doesn't exist
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Load existing data if file exists
    this.load();
  }

  /**
   * Loads data from the database file
   */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const buffer = fs.readFileSync(this.filePath);
        if (buffer.length > 0) {
          this.data = decode(buffer) as Record<string, any>;
        }
      } else {
        this.save();
      }
    } catch (error) {
      console.error("Error loading database:", error);
      this.data = {};
      this.save();
    }
  }

  /**
   * Saves data to the database file
   */
  public save(): void {
    try {
      const encoded = encode(this.data);
      fs.writeFileSync(this.filePath, encoded);
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }

  /**
   * Sets a value in the database
   * @param key The key to set
   * @param value The value to set
   * @returns The value that was set
   */
  public set(key: string, value: any): any {
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!this.data[mainKey]) {
        this.data[mainKey] = {};
      }
      
      lodash.set(this.data[mainKey], nestedKey, value);
    } else {
      this.data[key] = value;
    }
    
    if (this.autoSave) {
      this.save();
    }
    
    return value;
  }

  /**
   * Gets a value from the database
   * @param key The key to get
   * @param defaultValue Default value if key doesn't exist
   * @returns The value from the database or the default value
   */
  public get(key: string, defaultValue: any = null): any {
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!this.data[mainKey]) {
        return defaultValue;
      }
      
      const value = lodash.get(this.data[mainKey], nestedKey);
      return value !== undefined ? value : defaultValue;
    }
    
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  /**
   * Checks if a key exists in the database
   * @param key The key to check
   * @returns Whether the key exists
   */
  public has(key: string): boolean {
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!this.data[mainKey]) {
        return false;
      }
      
      return lodash.has(this.data[mainKey], nestedKey);
    }
    
    return this.data[key] !== undefined;
  }

  /**
   * Deletes a key from the database
   * @param key The key to delete
   * @returns Whether the key was deleted
   */
  public delete(key: string): boolean {
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!this.data[mainKey]) {
        return false;
      }
      
      const result = lodash.unset(this.data[mainKey], nestedKey);
      
      if (this.autoSave) {
        this.save();
      }
      
      return result;
    }
    
    if (this.data[key] === undefined) {
      return false;
    }
    
    delete this.data[key];
    
    if (this.autoSave) {
      this.save();
    }
    
    return true;
  }

  /**
   * Adds a number to a value in the database
   * @param key The key to add to
   * @param amount The amount to add
   * @returns The new value
   */
  public add(key: string, amount: number): number {
    const currentValue = this.get(key, 0);
    const newValue = (typeof currentValue === "number" ? currentValue : 0) + amount;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * Subtracts a number from a value in the database
   * @param key The key to subtract from
   * @param amount The amount to subtract
   * @returns The new value
   */
  public subtract(key: string, amount: number): number {
    return this.add(key, -amount);
  }

  /**
   * Pushes a value to an array in the database
   * @param key The key of the array
   * @param value The value to push
   * @returns The new array
   */
  public push(key: string, value: any): any[] {
    const array = this.get(key, []);
    if (!Array.isArray(array)) {
      throw new Error(`Expected an array at ${key}, got ${typeof array}`);
    }
    
    array.push(value);
    this.set(key, array);
    return array;
  }

  /**
   * Removes elements from an array in the database
   * @param key The key of the array
   * @param callback Function to filter elements to remove
   * @returns The new array
   */
  public pull(key: string, callback: (value: any) => boolean): any[] {
    const array = this.get(key, []);
    if (!Array.isArray(array)) {
      throw new Error(`Expected an array at ${key}, got ${typeof array}`);
    }
    
    const newArray = array.filter(item => !callback(item));
    this.set(key, newArray);
    return newArray;
  }

  /**
   * Gets all data from the database
   * @returns All data
   */
  public all(): { ID: string; data: any }[] {
    return Object.entries(this.data).map(([ID, data]) => ({ ID, data }));
  }

  /**
   * Clears all data from the database
   */
  public clear(): void {
    this.data = {};
    if (this.autoSave) {
      this.save();
    }
  }
}

// Export the Database class as default export
export default Database;

// Also provide named exports for compatibility with CommonJS modules
export { Database };