import { encode, decode } from "@msgpack/msgpack";
import fs from "fs";
import path from "path";
import lodash from "lodash";

interface DatabaseOptions {
  filePath?: string;
  autoSave?: boolean;
  cacheData?: boolean;
}

class Database {
  private filePath: string;
  private data: Record<string, any>;
  private autoSave: boolean;
  private cacheData: boolean;

  /**
   * Creates a new Database instance
   * @param options Database options
   */
  constructor(options: DatabaseOptions = {}) {
    this.filePath = options.filePath || "database.bdb";
    this.autoSave = options.autoSave !== false;
    this.cacheData = options.cacheData !== false;
    this.data = {};
    
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (this.cacheData) {
      this.load();
    } else if (!fs.existsSync(this.filePath)) {
      this.save();
    }
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
   * Gets data directly from the file without using cache
   * @returns The loaded data or empty object on failure
   */
  private readFromDisk(): Record<string, any> {
    try {
      if (fs.existsSync(this.filePath)) {
        const buffer = fs.readFileSync(this.filePath);
        if (buffer.length > 0) {
          return decode(buffer) as Record<string, any>;
        }
      }
      return {};
    } catch (error) {
      console.error("Error reading database from disk:", error);
      return {};
    }
  }

  /**
   * Saves data to the database file
   */
  public save(): void {
    try {
      const dataToSave = this.cacheData ? this.data : this.readFromDisk();
      const encoded = encode(dataToSave);
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
    let data = this.cacheData ? this.data : this.readFromDisk();
    
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!data[mainKey]) {
        data[mainKey] = {};
      }
      
      lodash.set(data[mainKey], nestedKey, value);
    } else {
      data[key] = value;
    }
    
    if (!this.cacheData) {
      const encoded = encode(data);
      if (this.autoSave) {
        fs.writeFileSync(this.filePath, encoded);
      }
    } else {
      this.data = data;
      if (this.autoSave) {
        this.save();
      }
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
    const data = this.cacheData ? this.data : this.readFromDisk();
    
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!data[mainKey]) {
        return defaultValue;
      }
      
      const value = lodash.get(data[mainKey], nestedKey);
      return value !== undefined ? value : defaultValue;
    }
    
    return data[key] !== undefined ? data[key] : defaultValue;
  }

  /**
   * Checks if a key exists in the database
   * @param key The key to check
   * @returns Whether the key exists
   */
  public has(key: string): boolean {
    const data = this.cacheData ? this.data : this.readFromDisk();
    
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!data[mainKey]) {
        return false;
      }
      
      return lodash.has(data[mainKey], nestedKey);
    }
    
    return data[key] !== undefined;
  }

  /**
   * Deletes a key from the database
   * @param key The key to delete
   * @returns Whether the key was deleted
   */
  public delete(key: string): boolean {
    let data = this.cacheData ? this.data : this.readFromDisk();
    let result = false;
    
    if (key.includes('.')) {
      const keys = key.split('.');
      const mainKey = keys.shift()!;
      const nestedKey = keys.join('.');
      
      if (!data[mainKey]) {
        return false;
      }
      
      result = lodash.unset(data[mainKey], nestedKey);
    } else {
      if (data[key] === undefined) {
        return false;
      }
      
      delete data[key];
      result = true;
    }
    
    if (!this.cacheData) {
      // If not caching, we need to write the updated data back
      const encoded = encode(data);
      if (this.autoSave) {
        fs.writeFileSync(this.filePath, encoded);
      }
    } else {
      this.data = data;
      if (this.autoSave) {
        this.save();
      }
    }
    
    return result;
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
    const data = this.cacheData ? this.data : this.readFromDisk();
    return Object.entries(data).map(([ID, data]) => ({ ID, data }));
  }

  /**
   * Clears all data from the database
   */
  public clear(): void {
    if (this.cacheData) {
      this.data = {};
    } else {
      // If not caching, we just write an empty object to the file
      const encoded = encode({});
      fs.writeFileSync(this.filePath, encoded);
    }
    
    if (this.cacheData && this.autoSave) {
      this.save();
    }
  }
}

// Export the Database class as default export
export default Database;

// Also provide named exports for compatibility with CommonJS modules
export { Database };