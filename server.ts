import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("news.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user', -- 'user', 'reporter', 'editor', 'admin'
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    image_url TEXT,
    category_id INTEGER,
    author_id INTEGER,
    status TEXT DEFAULT 'draft', -- 'draft', 'pending', 'published'
    location TEXT,
    is_breaking INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    user_name TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(article_id) REFERENCES articles(id)
  );

  CREATE TABLE IF NOT EXISTS shorts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_url TEXT,
    title TEXT,
    author_id INTEGER,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)").run(
    "Rajesh Kumar", "rajesh@news.com", "admin", "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
  );
  db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run("राजनीति", "politics");
  db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run("खेल", "sports");
  db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run("बॉलीवुड", "bollywood");
  db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run("टेक", "tech");

  // Seed some initial news
  db.prepare(`
    INSERT INTO articles (title, content, image_url, category_id, author_id, location, is_breaking, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "भारत ने जीता टी-20 वर्ल्ड कप", 
    "भारतीय टीम ने फाइनल में दक्षिण अफ्रीका को हराकर खिताब अपने नाम किया।", 
    "https://picsum.photos/seed/cricket/800/450", 
    2, 1, "बारबाडोस", 1, "published"
  );

  // Seed some initial shorts
  db.prepare(`
    INSERT INTO shorts (video_url, title, author_id)
    VALUES (?, ?, ?)
  `).run(
    "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-alone-3487-large.mp4",
    "आज की बड़ी खबरें",
    1
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/news", (req, res) => {
    const { category, status = 'published' } = req.query;
    let query = `
      SELECT a.*, c.name as category_name, u.name as author_name 
      FROM articles a 
      JOIN categories c ON a.category_id = c.id 
      JOIN users u ON a.author_id = u.id
      WHERE a.status = ?
    `;
    const params = [status];

    if (category) {
      query += " AND c.slug = ?";
      params.push(category as string);
    }

    query += " ORDER BY a.created_at DESC";
    const news = db.prepare(query).all(...params);
    res.json(news);
  });

  app.get("/api/news/:id", (req, res) => {
    const article = db.prepare(`
      SELECT a.*, c.name as category_name, u.name as author_name, u.avatar as author_avatar
      FROM articles a 
      JOIN categories c ON a.category_id = c.id 
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!article) return res.status(404).json({ error: "Not found" });
    
    const comments = db.prepare("SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json({ ...article, comments });
  });

  app.post("/api/news", (req, res) => {
    const { title, content, image_url, category_id, author_id, location, is_breaking, status } = req.body;
    const result = db.prepare(`
      INSERT INTO articles (title, content, image_url, category_id, author_id, location, is_breaking, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, content, image_url, category_id, author_id, location, is_breaking ? 1 : 0, status || 'pending');
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.get("/api/shorts", (req, res) => {
    const shorts = db.prepare(`
      SELECT s.*, u.name as author_name, u.avatar as author_avatar
      FROM shorts s
      JOIN users u ON s.author_id = u.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(shorts);
  });

  app.post("/api/shorts", (req, res) => {
    const { video_url, title, author_id } = req.body;
    const result = db.prepare(`
      INSERT INTO shorts (video_url, title, author_id)
      VALUES (?, ?, ?)
    `).run(video_url, title, author_id);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/stats", (req, res) => {
    const totalViews = db.prepare("SELECT SUM(views) as total FROM articles").get() as { total: number };
    const articleCount = db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number };
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    res.json({
      views: totalViews.total || 0,
      articles: articleCount.count,
      users: userCount.count
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
