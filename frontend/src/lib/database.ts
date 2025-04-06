
// Simple in-memory database for storing CSV data
type DataEntry = {
  [key: string]: string;
};

interface Database {
  [date: string]: DataEntry[];
}

// Singleton database instance
class DatabaseManager {
  private static instance: DatabaseManager;
  private database: Database = {};

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public storeData(date: string, data: DataEntry[]): void {
    this.database[date] = data;
    console.log(`Stored ${data.length} entries for date: ${date}`);
  }

  public getData(date: string): DataEntry[] {
    return this.database[date] || [];
  }

  public getDates(): string[] {
    return Object.keys(this.database);
  }

  public verifyQRData(date: string, qrData: string): { verified: boolean; entry?: DataEntry } {
    const dateData = this.getData(date);
    
    // Assuming QR data is a simple ID or key that matches a field in our data
    const entry = dateData.find(item => {
      // Try to match against any field in the entry
      return Object.values(item).some(
        value => value.toString().toLowerCase() === qrData.toLowerCase()
      );
    });
    
    return {
      verified: !!entry,
      entry
    };
  }
}

export default DatabaseManager.getInstance();
