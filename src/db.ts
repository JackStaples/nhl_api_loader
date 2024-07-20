import { Pool } from 'pg';
import config from './config';
import setupSql from './sql/setupSql';

console.log('__dirname:', __dirname);

const pool = new Pool(config);

export function query(text: string, params?: any[]) {
    return pool.query(text, params);
};

/**
 * runs the database setup scripts found in ./sql/creation.sql
 */
export async function setupDatabase() {
    try {
        await query(setupSql);
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}


export default pool;