import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite'
import { seedCatalogIfNeeded } from './seedCatalog'
import { migrateDatabase } from './migrations'

const DATABASE_NAME = 'cardheon.db'

let databasePromise: Promise<SQLiteDatabase> | undefined

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrateDatabase(db)
      await seedCatalogIfNeeded(db)
      return db
    })
  }

  return databasePromise
}
