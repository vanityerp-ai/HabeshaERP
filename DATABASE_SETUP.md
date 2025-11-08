Here's how to configure your database:

1. Create or modify your .env file in the project root with this format:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vanitypos?schema=public"
```

2. Replace the placeholders:
- username: Your PostgreSQL username (default is usually "postgres")
- password: Your PostgreSQL password
- localhost: Keep as is if database is local, or use your database host
- 5432: Default PostgreSQL port, change if yours is different
- vanitypos: Your database name

3. Make sure PostgreSQL is running and the database exists

4. After setting up the .env file, run:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Restart your development server with:
   ```bash
   npm run dev
   ```

Common DATABASE_URL formats:
- Local development: postgresql://postgres:yourpassword@localhost:5432/vanitypos
- With specific user: postgresql://dbuser:userpass@localhost:5432/vanitypos
- Remote database: postgresql://username:password@host.com:5432/vanitypos

Need to create a new database? Run these commands in psql:
```sql
CREATE DATABASE vanitypos;
```