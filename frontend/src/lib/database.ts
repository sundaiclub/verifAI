interface DatabaseEntry {
  // Add your entry type here based on your data structure
  [key: string]: any;
}

class DatabaseManager {
  private data: { [date: string]: DatabaseEntry[] } = {};

  getDates(): string[] {
    return Object.keys(this.data).sort().reverse();
  }

  getData(date: string): DatabaseEntry[] {
    return this.data[date] || [];
  }

  setData(date: string, entries: DatabaseEntry[]) {
    this.data[date] = entries;
  }
}

const databaseManager = new DatabaseManager();
export default databaseManager; 