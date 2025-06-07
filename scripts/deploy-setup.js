#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if DATABASE_URL contains postgresql or postgres
const databaseUrl = process.env.DATABASE_URL;
const isPostgreSQL = databaseUrl && (databaseUrl.includes('postgresql') || databaseUrl.includes('postgres'));

console.log('Database URL:', databaseUrl);
console.log('Using PostgreSQL:', isPostgreSQL);

if (isPostgreSQL) {
  // Use PostgreSQL schema
  const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
  const defaultSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  if (fs.existsSync(postgresSchemaPath)) {
    console.log('Switching to PostgreSQL schema...');
    const postgresSchema = fs.readFileSync(postgresSchemaPath, 'utf8');
    fs.writeFileSync(defaultSchemaPath, postgresSchema);
    console.log('Schema switched to PostgreSQL');
  } else {
    console.error('PostgreSQL schema file not found');
    process.exit(1);
  }
} else {
  console.log('Using SQLite schema (default)');
}

console.log('Deploy setup completed'); 