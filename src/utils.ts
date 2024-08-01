import * as mssql from 'mssql';

// Database configuration
const dbConfig = {
    user: 'laetitia_db',
    password: 'Sunshine#1410',
    server: 'laetitiadbserver.database.windows.net',
    database: 'laetitiadb',
    options: {
        encrypt: true // Use encryption for Azure SQL Database
    }
};

// Function to get database context
export async function getDatabaseContext(): Promise<string> {
    let pool;
    try {
        // Create a connection pool
        pool = await mssql.connect(dbConfig);

        // Query to get schema information
        const tables = await pool.request().query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND TABLE_NAME='car_info'`;

        // Retrieve columns for each table
        let context = 'Database Schema:\n';
        for (const table of tables.recordset) {
            context += `Table: ${table.TABLE_NAME}\n`;
            const columns = await pool.request().query`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=${table.TABLE_NAME}`;
            for (const column of columns.recordset) {
                context += `  Column: ${column.COLUMN_NAME} (${column.DATA_TYPE})\n`;
            }
            context += '\n';
        }

        return context;
    } catch (err) {
        console.error('Error retrieving database context:', err);
        return 'Error retrieving database context.';
    } finally {
        // Close the pool
        if (pool) {
            await pool.close();
        }
    }
}

// Function to run SQL queries
export async function runQuery(query: string): Promise<any> {
    let pool;
    try {
        // Create a connection pool
        pool = await mssql.connect(dbConfig);

        // Execute the query
        const result = await pool.request().query(query);

        return result.recordset;
    } catch (err) {
        console.error('Error running query:', err);
        throw err;
    } finally {
        // Close the pool
        if (pool) {
            await pool.close();
        }
    }
}
