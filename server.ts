import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { PLACES_DATA, HOTELS_DATA, RESTAURANTS_DATA, BLOG_ARTICLES, TRAVEL_TIPS } from "./src/data/srilankaData";
import { generate1000WordGuide } from "./src/data/guideGenerator";

dotenv.config();

// Path to store dynamic blogs
const bundleBlogsPath = path.join(process.cwd(), "src", "data", "dynamicBlogs.json");
const bundleTipsPath = path.join(process.cwd(), "src", "data", "dynamicTips.json");

const dynamicBlogsPath = process.env.VERCEL === "1"
  ? path.join("/tmp", "dynamicBlogs.json")
  : bundleBlogsPath;

const dynamicTipsPath = process.env.VERCEL === "1"
  ? path.join("/tmp", "dynamicTips.json")
  : bundleTipsPath;

// Helper to load dynamic tips
function getDynamicTips(): any[] {
  try {
    if (fs.existsSync(dynamicTipsPath)) {
      return JSON.parse(fs.readFileSync(dynamicTipsPath, "utf-8"));
    }
    if (process.env.VERCEL === "1" && fs.existsSync(bundleTipsPath)) {
      return JSON.parse(fs.readFileSync(bundleTipsPath, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading dynamic tips:", e);
  }
  return [];
}

// Helper to save dynamic tips
function saveDynamicTips(tips: any[]) {
  try {
    fs.writeFileSync(dynamicTipsPath, JSON.stringify(tips, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing dynamic tips:", e);
  }
}

// Helper to load dynamic blogs
function getDynamicBlogs(): any[] {
  try {
    if (fs.existsSync(dynamicBlogsPath)) {
      return JSON.parse(fs.readFileSync(dynamicBlogsPath, "utf-8"));
    }
    if (process.env.VERCEL === "1" && fs.existsSync(bundleBlogsPath)) {
      return JSON.parse(fs.readFileSync(bundleBlogsPath, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading dynamic blogs:", e);
  }
  return [];
}

// Helper to save dynamic blogs
function saveDynamicBlogs(blogs: any[]) {
  try {
    fs.writeFileSync(dynamicBlogsPath, JSON.stringify(blogs, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing dynamic blogs:", e);
  }
}

const top20Places = [
  "hr-sigiriya", // Sigiriya Rock
  "hr-kandy", // Temple of the Tooth
  "hr-gallefort", // Galle Fort
  "hr-dambulla", // Dambulla Cave Temple
  "hr-anuradhapura", // Anuradhapura
  "hr-polonnaruwa", // Polonnaruwa
  "mt-adamspeak", // Adam's Peak
  "mt-ellarock", // Ella Rock
  "mt-littleadamspeak", // Little Adam's Peak
  "mt-hortonplains", // Horton Plains
  "sf-yala", // Yala
  "sf-wilpattu", // Wilpattu
  "sf-udawalawe", // Udawalawe
  "bh-mirissa", // Mirissa Beach
  "bh-hikkaduwa", // Hikkaduwa Beach
  "bh-bentota", // Bentota Beach
  "bh-arugambay", // Arugam Bay
  "bh-unawatuna", // Unawatuna Beach
  "bh-nilaveli", // Nilaveli Beach
  "wf-diyaluma" // Diyaluma Ella
];

function getTargetPlaceForDate(dateStr: string, offset: number = 0) {
  const startDate = new Date("2026-06-22").getTime(); // Reference epoch
  const currentDate = new Date(dateStr).getTime();
  const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  const dayIndex = (Math.max(0, diffDays) * 3 + offset) % top20Places.length;
  const targetPlaceId = top20Places[dayIndex];
  const place = PLACES_DATA.find((p) => p.id === targetPlaceId);
  return place || PLACES_DATA.find((p) => p.id === "hr-sigiriya") || PLACES_DATA[0];
}

function getDeterministicBlogsForDateRange(): any[] {
  const startDate = new Date("2026-06-22");
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const blogs: any[] = [];
  const daysToGenerate = Math.min(60, diffDays);
  
  for (let i = 0; i <= daysToGenerate; i++) {
    const targetDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split("T")[0];
    
    for (let offset = 0; offset < 3; offset++) {
      const place = getTargetPlaceForDate(dateStr, offset);
      const guide = generate1000WordGuide(place);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const formattedDate = `${months[targetDate.getMonth()]} ${targetDate.getDate()}, ${targetDate.getFullYear()}`;
      
      const tableOfContents = [
        { id: "intro-history", label: "Introduction & History" },
        { id: "location-reach", label: "How to Reach" },
        { id: "weather-timing", label: "Best Time & Weather" },
        { id: "fees-hours", label: "Entry Fees & Hours" },
        { id: "activities", label: "Top Things to Do" },
        { id: "nearby", label: "Nearby Attractions" },
        { id: "safety", label: "Safety Guidelines" }
      ];
      
      const sections = [
        { type: "h2", text: "Introduction & Historical Context", id: "intro-history" },
        { type: "paragraph", text: guide.historyAndLegend },
        { type: "tweet", text: `Exploring the breathtaking history of ${place.name} in Sri Lanka! An absolute must-visit destination. #SriLanka #TravelGuide`, tweetText: `Exploring the breathtaking history of ${place.name} in Sri Lanka! 🇱🇰` },
        { type: "h2", text: "How to Get There & Location Details", id: "location-reach" },
        { type: "paragraph", text: guide.locationAndReach },
        { type: "h2", text: "Best Time to Visit & Weather Conditions", id: "weather-timing" },
        { type: "paragraph", text: guide.bestTimeAndWeather },
        { type: "h2", text: "Entry Fees, Tickets, and Opening Hours", id: "fees-hours" },
        { type: "paragraph", text: guide.feesAndTimings },
        { type: "h2", text: "Top Things to Do & Activities", id: "activities" },
        { type: "paragraph", text: guide.thingsToDo },
        { type: "h2", text: "Nearby Attractions to Explore", id: "nearby" },
        { type: "paragraph", text: guide.nearbyAttractions },
        { type: "h2", text: "Crucial Safety Guidelines & Local Regulations", id: "safety" },
        { type: "paragraph", text: guide.safetyTips }
      ];
      
      const cat = place.category === "mountains_hill_country" ? "Adventure" : place.category === "heritage_sites" ? "Culture" : "Nature";
      const selectedFaqs = [
        { question: `What is the best time to visit ${place.name}?`, answer: place.bestTime || "December to April is highly recommended." },
        { question: `Is there an entrance fee for ${place.name}?`, answer: place.entranceFee || "Entry details can vary; please check with the park gates." }
      ];
      
      const newBlog = {
        id: `bl-dynamic-fallback-${place.id}-${dateStr}-${offset}`,
        title: `${place.name}: The Ultimate ~1000-Word Explorer Guide`,
        excerpt: place.description,
        author: "IZYSL Guide Bot",
        date: formattedDate,
        category: cat,
        imageUrl: place.imageUrls[0] || "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
        readTime: "8 min read",
        firstParagraph: `Welcome to the comprehensive explorer's guide to ${place.name}, one of the most stunning destinations in ${place.location}, Sri Lanka. In this detailed travel article, we'll cover everything you need to know before visiting.`,
        tableOfContents,
        sections,
        faqs: selectedFaqs,
        relatedPosts: ["bl-train", "bl-beaches"],
        dateCode: dateStr,
        offset
      };
      
      blogs.push(newBlog);
    }
  }
  
  return blogs.reverse();
}

function getDeterministicTipsForDateRange(): any[] {
  const startDate = new Date("2026-06-22");
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const tips: any[] = [];
  const daysToGenerate = Math.min(60, diffDays);
  
  for (let i = 0; i <= daysToGenerate; i++) {
    const targetDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split("T")[0];
    const fallbackTip = getTargetTipForDate(dateStr);
    
    tips.push({
      id: `tip-dynamic-${dateStr}-${i}`,
      title: fallbackTip.title,
      content: fallbackTip.content,
      dateCode: dateStr
    });
  }
  
  return tips.reverse();
}

const fallbackTips = [
  {
    title: "Dialog & Mobitel 4G Connectivity",
    content: "For reliable coverage across the central highlands and coastal villages, purchase a Dialog or Mobitel eSIM. Dialog generally has the highest coverage density in remote mountainous zones."
  },
  {
    title: "Cash is King in Rural Towns",
    content: "Carry local rupees (LKR) at all times. While high-end hotels accept credit cards, local seafood cafes, surf instructors, national park fees, and tuk-tuk drivers only accept cash."
  },
  {
    title: "Respect Buddha Statues & Temples",
    content: "Never pose with your back turned directly to a Buddha statue for photographs, as it is considered a serious mark of disrespect. Always ask permission before photographing monks."
  },
  {
    title: "Safety Flags on Southern Beaches",
    content: "During monsoon seasons, strong rip currents occur along the southern coast. Never enter the water when red warning flags are displayed on the sands of Mirissa or Hikkaduwa."
  },
  {
    title: "Type G plug & Round Adaptors",
    content: "Sri Lanka utilizes standard rectangular British 3-pin G plugs, alongside round 3-pin D/M plugs. Carry a universal adaptor, and use the 'pen trick' to open round pin outlets safely if needed."
  },
  {
    title: "Monsoon Season Split Planning",
    content: "Planning is key: the South & West coast beaches (Unawatuna, Weligama) are sunny from November to April, while the East coast beaches (Pasikuda, Nilaveli) shine from May to September."
  },
  {
    title: "Wild Elephant Highway Etiquette",
    content: "Do not stop your vehicle, honk, or feed wild elephants that stand near roadsides (like the Buttala-Sella Kataragama road). Keep windows closed and drive by slowly and quietly."
  },
  {
    title: "PickMe & Uber for fair pricing",
    content: "Download PickMe and Uber upon arrival in Colombo. They guarantee metered rates for tuk-tuks and cars, which protects you from tourist price inflation in cities."
  },
  {
    title: "Drinking Water Safety Guard",
    content: "Never drink un-filtered tap water. Use bottled mineral water or filtered water provided at your eco-villas, and use bottled water for brushing your teeth in rural areas."
  },
  {
    title: "Temple Dress Modesty Rules",
    content: "Always wear white or light-colored clothing that covers both shoulders and knees when visiting historical ruins. Keep a clean sarong in your backpack for instant cover."
  },
  {
    title: "Sinharaja Rainforest Leech Guard",
    content: "When trekking Sinharaja or Knuckles forest paths, apply lemon oil, soap, or tobacco water to your legs, and wear tall leech socks to prevent bites on damp forest floors."
  },
  {
    title: "King Coconut Hydration (Thambili)",
    content: "Drink fresh orange King Coconut (Thambili) water sold by roadside vendors. It is clean, rich in electrolytes, and the perfect hydration cure under the hot tropical sun."
  },
  {
    title: "Kottu Roti & Local Spices",
    content: "Sample fresh Kottu Roti at popular street stalls. If you have a sensitive stomach, request 'tourist mild' as local Sri Lankan spices can be exceptionally hot."
  },
  {
    title: "Tuk-Tuk price negotiations",
    content: "In rural towns where ride-sharing apps aren't active, negotiate the price with the tuk-tuk driver *before* getting in. Standard rural rates are roughly 150-200 LKR per kilometer."
  },
  {
    title: "Mosquito Protection Essentials",
    content: "Sri Lanka has zero malaria risk, but Dengue fever is present. Always apply high-DEET insect repellent, especially at sunrise and sunset when mosquitoes are highly active."
  }
];

function getTargetTipForDate(dateStr: string) {
  const startDate = new Date("2026-06-22").getTime(); // Start epoch
  const currentDate = new Date(dateStr).getTime();
  const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  const dayIndex = Math.max(0, diffDays) % fallbackTips.length;
  return fallbackTips[dayIndex];
}



dotenv.config();

// Lazy initialization of the Gemini API Client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment secrets. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

function getSimulatedChatResponse(message: string): string {
  const normalized = message.toLowerCase();
  
  if (normalized.includes("itinerary") || normalized.includes("plan") || normalized.includes("days") || normalized.includes("tour")) {
    return "🌅 **Handcrafted Sri Lanka Itinerary (Simulated AI response)**\n\n" +
           "Here is a recommended 3-day itinerary to experience the best of Sri Lanka:\n\n" +
           "- **Day 1: Ancient History & Rock Fortress**\n" +
           "  - Start early at **Sigiriya Lion Rock Fortress** (7 AM) to beat the heat. Climb to the ancient palace ruins.\n" +
           "  - Afternoon: Visit the nearby **Dambulla Cave Temple** to see beautifully preserved Buddhist murals.\n\n" +
           "- **Day 2: Tea Fields & Scenic Blue Train**\n" +
           "  - Take the famous high-altitude blue train from Kandy to **Ella**.\n" +
           "  - Visit the **Nine Arch Bridge** and take a short hike up **Little Adam's Peak** for sunset.\n\n" +
           "- **Day 3: Wildlife Safari & Coastal Sunset**\n" +
           "  - Morning: Do a half-day safari in **Yala National Park** to spot leopards and elephants.\n" +
           "  - Evening: Relax at **Mirissa Beach** and view the sunset from Coconut Tree Hill.";
  }
  
  if (normalized.includes("visa") || normalized.includes("eta") || normalized.includes("entry") || normalized.includes("passport")) {
    return "🛂 **Sri Lanka Visa Guidelines (Simulated AI response)**\n\n" +
           "1. **ETA (Electronic Travel Authorization)**: Required for almost all nationalities. Apply at least a week before travel via the official portal: `eta.gov.lk`.\n" +
           "2. **Validity**: Standard tourist visas are valid for 30 or 60 days.\n" +
           "3. **Passport Requirements**: Must be valid for at least 6 months from the date of arrival in Sri Lanka.\n" +
           "4. **On Arrival Visa**: Available for many countries, but pre-applying online is highly recommended to avoid long queues at the airport.";
  }

  if (normalized.includes("ella") || normalized.includes("train") || normalized.includes("bridge") || normalized.includes("hike")) {
    return "⛰️ **Ella Travel Guide & Train Tips (Simulated AI response)**\n\n" +
           "- **Blue Train**: The Kandy to Ella train is world-famous. Book your 2nd or 3rd class reserved seats exactly 30 days in advance. 2nd class is best as you can open the windows for photos.\n" +
           "- **Nine Arch Bridge**: Walk to the bridge early (before 8:30 AM). The best photo spot is from the tea hills overlooking the bridge.\n" +
           "- **Hikes**: **Little Adam's Peak** is a very easy 45-minute walk. **Ella Rock** is a 3-hour hike; follow the rail tracks and then the forest trail. A local guide is recommended for Ella Rock.";
  }

  if (normalized.includes("sigiriya") || normalized.includes("lion")) {
    return "🦁 **Sigiriya Lion Rock Fortress Guide (Simulated AI response)**\n\n" +
           "- **Climb**: Start climbing by 7:00 AM. It takes about 1,200 steps to reach the top summit ruins. Take plenty of water and wear sunscreen.\n" +
           "- **Entrance Fee**: $36 USD (approx. 11,000 LKR) for foreign tourists.\n" +
           "- **Pidurangala Rock**: Located adjacent to Sigiriya. Tickets cost only $3 USD. Climb it at sunrise for the best view looking directly at the Sigiriya Rock fortress!";
  }

  if (normalized.includes("beach") || normalized.includes("mirissa") || normalized.includes("galle") || normalized.includes("surf")) {
    return "🌴 **Southern Coast & Beach Guide (Simulated AI response)**\n\n" +
           "- **Galle Fort**: A UNESCO heritage town with Dutch-colonial streets, boutiques, and a beautiful lighthouse. Walk the ramparts at sunset.\n" +
           "- **Mirissa**: Best for relaxing on the beach and surfing. Head to Coconut Tree Hill for the famous palm-tree viewpoints.\n" +
           "- **Hiriketiya**: A gorgeous horseshoe bay famous for beginner-friendly surf breaks and trendy beach cafes.\n" +
           "- **Whale Watching**: November to April is the prime season in Mirissa to spot Blue Whales.";
  }

  return "🌸 **Welcome to the IZYSL AI Travel Guide!**\n\n" +
         "Ask me any question about travel places, itineraries, visa requirements, local transport, or budgets in Sri Lanka.\n\n" +
         "*Note: To enable custom AI conversations using live Gemini models, please set your Google AI Studio API key as `GEMINI_API_KEY` in the `.env` file of this project.*";
}

const app = express();

// Set larger limit for base64 image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Serve comment upload assets statically with writeable Vercel fallback
const uploadsDir = process.env.VERCEL === "1"
  ? path.join("/tmp", "uploads", "comments")
  : path.join(process.cwd(), "uploads", "comments");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads/comments", express.static(uploadsDir));

// Server-side comment photo upload endpoint with size and mime-type security guards
app.post("/api/comments/upload", (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image || !filename) {
      return res.status(400).json({ error: "Missing image file payload parameters." });
    }

    // Extract details from Base64 Data URL
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid photo format structure." });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // 1. Server-side Mime-type Security Guard
    const allowedMimeTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ 
        error: "Security Check Failed: Only JPG, JPEG, PNG, and WebP media formats are allowed on our servers." 
      });
    }

    // 2. Server-side File Size limit validation (2MB)
    const buffer = Buffer.from(base64Data, "base64");
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if (buffer.length > maxSizeBytes) {
      return res.status(400).json({ 
        error: "Security Check Failed: Uploaded image exceeds the maximal 2MB limit." 
      });
    }

    // Map mimeType to clean secure extension
    let extension = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      extension = "jpg";
    } else if (mimeType.includes("webp")) {
      extension = "webp";
    }

    // 3. Generate randomized collision-safe filename
    const randomId = Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    const safeFilename = `comment_${randomId}.${extension}`;
    const destinationPath = path.join(uploadsDir, safeFilename);

    // Write parsed buffer to disk
    fs.writeFileSync(destinationPath, buffer);

    return res.json({
      success: true,
      photoUrl: `/uploads/comments/${safeFilename}`,
      filename: safeFilename,
      sizeBytes: buffer.length,
      status: "pending" // Flagged for immediate moderation queue
    });
  } catch (err: any) {
    console.error("Critical server-side upload error:", err);
    return res.status(500).json({ error: "Internal Server Error during file write procedures." });
  }
});

// AI Travel Assistant endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
       res.status(400).json({ error: "Message input is required." });
       return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const text = getSimulatedChatResponse(message);
      res.json({ text });
      return;
    }

    const ai = getGeminiClient();
    
    const systemInstruction = 
      "You are the 'IZYSL.COM AI Assistant,' an expert, friendly local travel advisor. " +
      "You have world-class knowledge of Sri Lankan waterfalls, pristine beaches, high altitude mountain hikes, " +
      "safari national parks, historical heritage landmarks, boutique resorts, and fine dining. " +
      "Provide extremely helpful advice on itineraries, local costs, visa requirements, transport details, " +
      "and things to avoid. Answer warmly in structured Markdown, keeping answers punchy yet elegant.";

    const contents = history ? [...history, { role: "user", parts: [{ text: message }] }] : [{ role: "user", parts: [{ text: message }] }];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error details:", error.message || error);
    res.status(500).json({ 
      error: error.message || "An unexpected error occurred during message generation.",
      needsApiKey: !process.env.GEMINI_API_KEY
    });
  }
});

// Serve dynamic blog articles merged with static ones
app.get("/api/blogs", (req, res) => {
  const dynamicBlogs = getDeterministicBlogsForDateRange();
  res.json([...BLOG_ARTICLES, ...dynamicBlogs]);
});

// Serve dynamic travel tips merged with static ones
app.get("/api/tips", (req, res) => {
  const dynamicTips = getDeterministicTipsForDateRange();
  res.json([...TRAVEL_TIPS, ...dynamicTips]);
});

// Serve dynamic sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  try {
    const dynamicBlogs = getDeterministicBlogsForDateRange();
    const todayStr = new Date().toISOString().split("T")[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Main Home Page
    xml += `  <url>\n    <loc>https://izysl.com/</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    
    // Navigation Sections (clean paths instead of hashes)
    const sections = ["explore", "planner", "tips", "blog", "reviews", "emergency", "map"];
    for (const sec of sections) {
      xml += `  <url>\n    <loc>https://izysl.com/${sec}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
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
    
    // Hotels
    for (const hotel of HOTELS_DATA) {
      xml += `  <url>\n    <loc>https://izysl.com/hotel/${hotel.id}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }
    
    // Restaurants
    for (const rest of RESTAURANTS_DATA) {
      xml += `  <url>\n    <loc>https://izysl.com/restaurant/${rest.id}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }
    
    xml += `</urlset>`;
    
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (e) {
    console.error("Error serving dynamic sitemap:", e);
    res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
  }
});

function getIndexHtml(): string {
  const paths = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(__dirname, "index.html"),
    path.join(process.cwd(), "index.html")
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  throw new Error("index.html not found");
}

function injectSEO(html: string, metadata: { title: string, desc: string, image: string, url: string, schema?: string }): string {
  let replaced = html;
  
  // Replace Title
  replaced = replaced.replace(/<title>.*?<\/title>/, `<title>${metadata.title}</title>`);
  replaced = replaced.replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${metadata.title}" />`);
  replaced = replaced.replace(/<meta name="twitter:title" content=".*?" \/>/g, `<meta name="twitter:title" content="${metadata.title}" />`);
  
  // Replace Description
  replaced = replaced.replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${metadata.desc}" />`);
  replaced = replaced.replace(/<meta property="og:description" content=".*?" \/>/g, `<meta property="og:description" content="${metadata.desc}" />`);
  replaced = replaced.replace(/<meta name="twitter:description" content=".*?" \/>/g, `<meta name="twitter:description" content="${metadata.desc}" />`);
  
  // Replace Image
  replaced = replaced.replace(/<meta property="og:image" content=".*?" \/>/g, `<meta property="og:image" content="${metadata.image}" />`);
  replaced = replaced.replace(/<meta name="twitter:image" content=".*?" \/>/g, `<meta name="twitter:image" content="${metadata.image}" />`);
  
  // Replace Canonical
  replaced = replaced.replace(/<link rel="canonical" href=".*?" \/>/g, `<link rel="canonical" href="${metadata.url}" />`);
  
  if (metadata.schema) {
    replaced = replaced.replace("</head>", `${metadata.schema}\n</head>`);
  }
  return replaced;
}

// Prerendering route for blogs
app.get("/blog/:id", (req, res) => {
  try {
    const blogs = [...BLOG_ARTICLES, ...getDynamicBlogs()];
    const blog = blogs.find(b => b.id === req.params.id);
    if (blog) {
      let html = getIndexHtml();
      const schema = `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "${blog.title}",
        "image": "${blog.imageUrl}",
        "datePublished": "${blog.dateCode || '2026-06-22'}",
        "description": "${blog.excerpt}",
        "author": { "@type": "Person", "name": "${blog.author}" }
      }
      </script>`;
      
      html = injectSEO(html, {
        title: `${blog.title} - Sri Lanka Travel Blog | IZYSL.COM`,
        desc: blog.excerpt,
        image: blog.imageUrl,
        url: `https://izysl.com/blog/${blog.id}`,
        schema
      });
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }
  } catch (e) {
    console.error("Error rendering blog SEO:", e);
  }
  try {
    return res.send(getIndexHtml());
  } catch (err) {
    return res.status(500).send("Server Error");
  }
});

// Prerendering route for places
app.get("/place/:id", (req, res) => {
  try {
    const place = PLACES_DATA.find(p => p.id === req.params.id);
    if (place) {
      let html = getIndexHtml();
      const schema = `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "${place.name}",
        "description": "${place.description}",
        "image": "${place.imageUrls[0]}",
        "address": { "@type": "PostalAddress", "addressLocality": "${place.location}", "addressCountry": "LK" }
      }
      </script>`;
      
      html = injectSEO(html, {
        title: `${place.name} Travel Guide & Tips | IZYSL.COM`,
        desc: place.description,
        image: place.imageUrls[0],
        url: `https://izysl.com/place/${place.id}`,
        schema
      });
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }
  } catch (e) {
    console.error("Error rendering place SEO:", e);
  }
  try {
    return res.send(getIndexHtml());
  } catch (err) {
    return res.status(500).send("Server Error");
  }
});

// Setup and start server if NOT on Vercel
async function initDevOrProdServer() {
  if (process.env.VERCEL === "1") {
    return;
  }

  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Serve frontend assets
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IZYSL.COM Server listening dynamically on http://0.0.0.0:${PORT}`);
  });
}

initDevOrProdServer().catch((error) => {
  console.error("Failed to initialize Express dev/prod listener:", error);
});

export default app;
