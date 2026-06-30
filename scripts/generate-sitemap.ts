import fs from "fs";
import path from "path";
import { PLACES_DATA, HOTELS_DATA, RESTAURANTS_DATA, BLOG_ARTICLES } from "../src/data/srilankaData";

// Load dynamic blogs if any exist locally
const dynamicBlogsPath = path.join(process.cwd(), "src", "data", "dynamicBlogs.json");
let dynamicBlogs: any[] = [];
try {
  if (fs.existsSync(dynamicBlogsPath)) {
    dynamicBlogs = JSON.parse(fs.readFileSync(dynamicBlogsPath, "utf-8"));
  }
} catch (e) {
  console.warn("No dynamic blogs found for sitemap build:", e);
}

const todayStr = new Date().toISOString().split("T")[0];
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// Main Home Page
xml += `  <url>\n    <loc>https://izysl.com/</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

// Navigation Sections (clean paths)
const sections = ["explore", "planner", "tips", "blog", "reviews", "emergency", "map"];
for (const sec of sections) {
  const isDaily = sec === "blog" || sec === "tips";
  const freq = isDaily ? "daily" : "weekly";
  const prio = isDaily ? "0.95" : "0.9";
  xml += `  <url>\n    <loc>https://izysl.com/${sec}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>\n`;
}

// Static Blogs
for (const blog of BLOG_ARTICLES) {
  xml += `  <url>\n    <loc>https://izysl.com/blog/${blog.id}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
}

// Dynamic Blogs
for (const blog of dynamicBlogs) {
  xml += `  <url>\n    <loc>https://izysl.com/blog/${blog.id}</loc>\n    <lastmod>${blog.dateCode || todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
}

// Places
for (const place of PLACES_DATA) {
  xml += `  <url>\n    <loc>https://izysl.com/place/${place.id}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
}

// Restaurants
for (const rest of RESTAURANTS_DATA) {
  xml += `  <url>\n    <loc>https://izysl.com/restaurant/${rest.id}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
}

xml += `</urlset>`;

const publicSitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
const publicDir = path.dirname(publicSitemapPath);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(publicSitemapPath, xml, "utf-8");
console.log(`Generated sitemap with ${PLACES_DATA.length + RESTAURANTS_DATA.length + BLOG_ARTICLES.length + dynamicBlogs.length + sections.length + 1} URLs at ${publicSitemapPath}`);
