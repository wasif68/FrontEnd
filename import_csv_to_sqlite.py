
import csv
import sqlite3

def import_csv_to_sqlite(csv_file, db_file):
    """
    Imports data from a CSV file into a new SQLite3 database table.

    Args:
        csv_file (str): The path to the CSV file.
        db_file (str): The path to the SQLite3 database file to be created.
    """
    try:
        # Connect to the SQLite3 database. 
        # This will create the database file if it doesn't exist.
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        # Open the CSV file for reading.
        with open(csv_file, 'r', encoding='utf-8') as f:
            # Use the csv.reader to handle CSV parsing.
            reader = csv.reader(f)

            # Read the header row to get column names.
            header = next(reader)
            
            # Sanitize column names to be valid SQL identifiers 
            # (e.g., replace spaces with underscores).
            columns = [col.strip().replace(' ', '_').replace('(', '').replace(')', '') for col in header]

            # Drop the table if it already exists to start fresh.
            table_name = 'data'
            cursor.execute(f'DROP TABLE IF EXISTS {table_name}')

            # Create a new table with the column names from the CSV header.
            # We use TEXT as a generic type for all columns for simplicity.
            create_table_sql = f'CREATE TABLE {table_name} ({", ".join([f"{col} TEXT" for col in columns])})'
            cursor.execute(create_table_sql)

            # Prepare the INSERT statement for batch processing.
            # This is more efficient for large datasets.
            insert_sql = f'INSERT INTO {table_name} ({", ".join(columns)}) VALUES ({", ".join(["?"] * len(columns))})'
            
            # Read the CSV file row by row and insert data in batches.
            batch_size = 1000
            batch = []
            for row in reader:
                if not row or all(cell.strip() == '' for cell in row):
                    continue  # skip empty rows
                if len(row) != len(columns):
                    print(f"Skipping row due to column mismatch: {row}")
                    continue
                batch.append(row)
                if len(batch) >= batch_size:
                    cursor.executemany(insert_sql, batch)
                    batch = []
            
            # Insert any remaining rows in the last batch.
            if batch:
                cursor.executemany(insert_sql, batch)

        # Commit the changes to the database.
        conn.commit()
        print(f"Data from '{csv_file}' has been successfully imported into '{db_file}' in table '{table_name}'.")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        # Close the database connection.
        if conn:
            conn.close()

if __name__ == '__main__':
    # Define the input CSV file and the output SQLite database file.
    csv_file_path = 'a.csv'
    db_file_path = 'your_data.db'
    
    # Run the import process.
    import_csv_to_sqlite(csv_file_path, db_file_path)
