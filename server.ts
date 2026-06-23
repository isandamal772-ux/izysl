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

// Path to store additional blog photos uploaded by users
const bundleAdditionalPhotosPath = path.join(process.cwd(), "src", "data", "additionalPhotos.json");
const additionalPhotosPath = process.env.VERCEL === "1"
  ? path.join("/tmp", "additionalPhotos.json")
  : bundleAdditionalPhotosPath;

function getAdditionalPhotos(): Record<string, string[]> {
  try {
    if (fs.existsSync(additionalPhotosPath)) {
      return JSON.parse(fs.readFileSync(additionalPhotosPath, "utf-8"));
    }
    if (process.env.VERCEL === "1" && fs.existsSync(bundleAdditionalPhotosPath)) {
      return JSON.parse(fs.readFileSync(bundleAdditionalPhotosPath, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading additional photos:", e);
  }
  return {};
}

function saveAdditionalPhotos(photos: Record<string, string[]>) {
  try {
    fs.writeFileSync(additionalPhotosPath, JSON.stringify(photos, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing additional photos:", e);
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

function getTargetPlaceForDate(dateStr: string) {
  const startDate = new Date("2026-06-22").getTime(); // Reference epoch
  const currentDate = new Date(dateStr).getTime();
  const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  const dayIndex = Math.max(0, diffDays) % 20;
  const targetPlaceId = top20Places[dayIndex];
  const place = PLACES_DATA.find((p) => p.id === targetPlaceId);
  return place || PLACES_DATA.find((p) => p.id === "hr-sigiriya") || PLACES_DATA[0];
}

// Fallback logic for dynamic daily blog generation when GEMINI_API_KEY is missing
// It programmatically compiles a detailed ~1000-word guide from the template system
function generateFallbackDailyBlog(todayStr: string) {
  const dynamicBlogs = getDynamicBlogs();
  const place = getTargetPlaceForDate(todayStr);
  const guide = generate1000WordGuide(place);

  const sections = [
    {
      type: "h2",
      text: "Introduction & Historical Context",
      id: "intro-history"
    },
    {
      type: "paragraph",
      text: guide.historyAndLegend
    },
    {
      type: "tweet",
      text: `Exploring the breathtaking history of ${place.name} in Sri Lanka! An absolute must-visit destination. #SriLanka #TravelGuide`,
      tweetText: `Exploring the breathtaking history of ${place.name} in Sri Lanka! 🇱🇰`
    },
    {
      type: "h2",
      text: "How to Get There & Location Details",
      id: "location-reach"
    },
    {
      type: "paragraph",
      text: guide.locationAndReach
    },
    {
      type: "h2",
      text: "Best Time to Visit & Weather Conditions",
      id: "weather-timing"
    },
    {
      type: "paragraph",
      text: guide.bestTimeAndWeather
    },
    {
      type: "h2",
      text: "Entry Fees, Tickets, and Opening Hours",
      id: "fees-hours"
    },
    {
      type: "paragraph",
      text: guide.feesAndTimings
    },
    {
      type: "h2",
      text: "Top Things to Do & Activities",
      id: "activities"
    },
    {
      type: "paragraph",
      text: guide.thingsToDo
    },
    {
      type: "h2",
      text: "Nearby Attractions to Explore",
      id: "nearby"
    },
    {
      type: "paragraph",
      text: guide.nearbyAttractions
    },
    {
      type: "h2",
      text: "Crucial Safety Guidelines & Local Regulations",
      id: "safety"
    },
    {
      type: "paragraph",
      text: guide.safetyTips
    }
  ];

  const tableOfContents = [
    { id: "intro-history", label: "Introduction & History" },
    { id: "location-reach", label: "How to Reach" },
    { id: "weather-timing", label: "Best Time & Weather" },
    { id: "fees-hours", label: "Entry Fees & Hours" },
    { id: "activities", label: "Top Things to Do" },
    { id: "nearby", label: "Nearby Attractions" },
    { id: "safety", label: "Safety Guidelines" }
  ];

  const faqs = [
    {
      question: `What is the best time to visit ${place.name}?`,
      answer: place.bestTime || "December to April is highly recommended."
    },
    {
      question: `Is there an entrance fee for ${place.name}?`,
      answer: place.entranceFee || "Entry details can vary; please check with the park gates."
    }
  ];

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date(todayStr);
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const newBlog = {
    id: `bl-dynamic-fallback-${place.id}-${Date.now()}`,
    title: `${place.name}: The Ultimate ~1000-Word Explorer Guide`,
    excerpt: place.description,
    author: "IZYSL Guide Bot",
    date: dateStr,
    category: place.category === "mountains_hill_country" ? "Adventure" : place.category === "heritage_sites" ? "Culture" : "Nature",
    imageUrl: place.imageUrls[0] || "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
    readTime: "8 min read",
    firstParagraph: `Welcome to the comprehensive explorer's guide to ${place.name}, one of the most stunning destinations in ${place.location}, Sri Lanka. In this detailed travel article, we'll cover everything you need to know before visiting.`,
    tableOfContents,
    sections,
    faqs,
    relatedPosts: ["bl-train", "bl-beaches"],
    dateCode: todayStr
  };

  dynamicBlogs.push(newBlog);
  saveDynamicBlogs(dynamicBlogs);
  console.log(`Saved new fallback daily blog: ${newBlog.title}`);
}

function parseMarkdownToBlogFields(blog: any): any {
  if (!blog) return null;
  if (blog.sections && blog.sections.length > 0) {
    return blog;
  }

  const sections: any[] = [];
  const tableOfContents: any[] = [];
  const content = blog.content || "";
  const lines = content.split("\n");
  let currentParagraph = "";

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      sections.push({
        type: "paragraph",
        text: currentParagraph.trim()
      });
      currentParagraph = "";
    }
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      const text = trimmed.substring(3).trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      sections.push({
        type: "h2",
        text,
        id
      });
      tableOfContents.push({ id, label: text });
    } else if (trimmed.startsWith("### ")) {
      flushParagraph();
      const text = trimmed.substring(4).trim();
      sections.push({
        type: "h3",
        text
      });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      sections.push({
        type: "paragraph",
        text: trimmed
      });
    } else {
      if (currentParagraph) {
        currentParagraph += " " + trimmed;
      } else {
        currentParagraph = trimmed;
      }
    }
  }
  flushParagraph();

  const categoryFaqs: { [key: string]: { question: string, answer: string }[] } = {
    nature: [
      { question: "Is it safe to hike here in the rainy season?", answer: "Hikes can be slippery during heavy monsoon seasons. Check local weather alerts before heading out." },
      { question: "Are there entry fees?", answer: "Most national parks require entry permits, which can be purchased at the main entrance gates." }
    ],
    adventure: [
      { question: "What should I pack for this trip?", answer: "Light breathable clothing, sturdy walking/hiking shoes, sunscreen, insect repellent, and plenty of water." },
      { question: "Do I need a local guide?", answer: "For off-the-beaten-path treks, hiring a certified local guide is highly recommended for safety." }
    ],
    culture: [
      { question: "What is the dress code for historical temples?", answer: "Wear white or light-colored clothing that covers both shoulders and knees. You must remove shoes and hats before entering sacred temple grounds." },
      { question: "Are photos allowed?", answer: "Photos are generally allowed, but never pose with your back turned directly to a Buddha statue, as it is considered disrespectful." }
    ]
  };

  const cat = (blog.category || "").toLowerCase();
  const selectedFaqs = categoryFaqs[cat] || categoryFaqs["adventure"];

  let firstParagraph = blog.firstParagraph;
  if (!firstParagraph && sections.length > 0) {
    const firstPIdx = sections.findIndex(s => s.type === "paragraph");
    if (firstPIdx !== -1) {
      firstParagraph = sections[firstPIdx].text;
      sections.splice(firstPIdx, 1);
    }
  }
  if (!firstParagraph) {
    firstParagraph = blog.excerpt || "Welcome to today's travel highlight.";
  }

  return {
    ...blog,
    firstParagraph,
    tableOfContents: tableOfContents.length > 0 ? tableOfContents : undefined,
    sections,
    faqs: blog.faqs || selectedFaqs,
    relatedPosts: blog.relatedPosts || ["bl-train", "bl-beaches"]
  };
}

// Function to generate daily blog post if not exists
// Function to generate daily blog post if not exists
async function ensureDailyBlogGenerated() {
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const dynamicBlogs = getDynamicBlogs();
    
    // Check if we already have a blog for today
    const hasTodayBlog = dynamicBlogs.some((blog: any) => blog.dateCode === todayStr);
    if (hasTodayBlog) return;

    console.log(`Generating daily SEO blog post for ${todayStr}...`);
    
    // Get Gemini client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY configured. Using fallback dynamic blog generator.");
      generateFallbackDailyBlog(todayStr);
      return;
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Pick the place corresponding to the day index
    const targetPlace = getTargetPlaceForDate(todayStr);
    
    const prompt = 
      `Write a high-quality, engaging, extremely detailed, and SEO-optimized travel guide article about '${targetPlace.name}' in Sri Lanka. ` +
      `Focus on keywords like 'best time to visit ${targetPlace.name}', 'things to do in ${targetPlace.name}', 'how to reach ${targetPlace.name}', and local travel safety guidelines. ` +
      `The total word count of the article MUST be approximately 1000 words. Make the descriptions rich and comprehensive. ` +
      `Response format MUST be a valid JSON object matching the following fields: ` +
      `{\n` +
      `  "id": "bl-dynamic-${Date.now()}",\n` +
      `  "title": "A catchy SEO-friendly title",\n` +
      `  "excerpt": "A short 1-2 sentence preview excerpt",\n` +
      `  "author": "IZYSL Travel Guide",\n` +
      `  "date": "formatted date string e.g. June 22, 2026",\n` +
      `  "category": "Adventure / Culture / Nature",\n` +
      `  "imageUrl": "Choose a relevant unsplash photo URL for this location or category",\n` +
      `  "readTime": "8 min read",\n` +
      `  "firstParagraph": "Engaging, long introduction paragraph",\n` +
      `  "tableOfContents": [\n` +
      `    { "id": "history", "label": "History & Legend" },\n` +
      `    { "id": "reach", "label": "How to Reach" },\n` +
      `    { "id": "weather", "label": "Best Time & Weather" },\n` +
      `    { "id": "activities", "label": "Things to Do" },\n` +
      `    { "id": "safety", "label": "Safety Tips" }\n` +
      `  ],\n` +
      `  "sections": [\n` +
      `    { "type": "h2", "text": "History & Legend", "id": "history" },\n` +
      `    { "type": "paragraph", "text": "Very long, detailed paragraph detailing the history, mythology, and cultural background of the site." },\n` +
      `    { "type": "tweet", "text": "Catchy tweet quote about the location", "tweetText": "Catchy tweet about the location #SriLanka" },\n` +
      `    { "type": "h2", "text": "How to Reach", "id": "reach" },\n` +
      `    { "type": "paragraph", "text": "Detailed instructions on how to reach this place from Kandy, Colombo, or Ella, including public transport, trains, or hiring private drivers." },\n` +
      `    { "type": "h2", "text": "Best Time & Weather", "id": "weather" },\n` +
      `    { "type": "paragraph", "text": "Detailed description of weather patterns, monsoon seasons, temperature, and when to plan your hike or beach trip." },\n` +
      `    { "type": "h2", "text": "Things to Do", "id": "activities" },\n` +
      `    { "type": "paragraph", "text": "A comprehensive list of activities, viewpoints, photo guides, photography tips, and nearby exploration landmarks." },\n` +
      `    { "type": "h2", "text": "Safety Tips", "id": "safety" },\n` +
      `    { "type": "paragraph", "text": "Crucial guidelines regarding currents, slippery rocks, local dress codes at temples, guides, and packing essentials." }\n` +
      `  ],\n` +
      `  "faqs": [\n` +
      `    { "question": "Question 1?", "answer": "Answer 1" },\n` +
      `    { "question": "Question 2?", "answer": "Answer 2" }\n` +
      `  ]\n` +
      `}\n` +
      `Return ONLY the JSON. No markdown wrappers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8
      }
    });

    const text = response.text;
    if (text) {
      let newBlog = JSON.parse(text);
      newBlog = parseMarkdownToBlogFields(newBlog);
      newBlog.dateCode = todayStr; // tag it with today's date
      
      // Fallback imageUrl if Gemini doesn't provide a valid one
      if (!newBlog.imageUrl || !newBlog.imageUrl.startsWith("http")) {
        newBlog.imageUrl = targetPlace.imageUrls[0] || "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80";
      }

      dynamicBlogs.push(newBlog);
      saveDynamicBlogs(dynamicBlogs);
      console.log(`Successfully generated and saved new daily blog: ${newBlog.title}`);
    } else {
      throw new Error("Empty model response");
    }
  } catch (error) {
    console.error("Failed to generate dynamic daily blog post, calling fallback:", error);
    const todayStr = new Date().toISOString().split("T")[0];
    generateFallbackDailyBlog(todayStr);
  }
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

async function ensureDailyTipGenerated() {
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const dynamicTips = getDynamicTips();

    // Check if we already have a generated tip for today
    const hasTodayTip = dynamicTips.some((tip: any) => tip.dateCode === todayStr);
    if (hasTodayTip) return;

    console.log(`Generating daily travel tip for ${todayStr}...`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY configured. Using fallback daily tip generator.");
      const fallbackTip = getTargetTipForDate(todayStr);
      const newTip = {
        ...fallbackTip,
        dateCode: todayStr
      };
      dynamicTips.push(newTip);
      saveDynamicTips(dynamicTips);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Choose a topic dynamically
    const seedTopics = [
      "train travel seat booking tips",
      "street food safety and local hygiene",
      "visiting remote temples and proper etiquette",
      "cell connectivity, eSIMs and transport apps",
      "wildlife safaris and elephant warnings",
      "coastal swimming, monsoons and rip currents",
      "currency exchange, ATMs and cash handling",
      "plug adaptors, voltage and power outages",
      "leeches, hiking safety and insect bites",
      "hospitality, tipping and local bargaining"
    ];
    const startDate = new Date("2026-06-22").getTime();
    const currentDate = new Date().getTime();
    const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const topic = seedTopics[Math.max(0, diffDays) % seedTopics.length];

    const prompt = 
      `Write a practical, highly useful travel tip/advice for international tourists visiting Sri Lanka. ` +
      `Focus on: '${topic}'. Keep it highly informative, warm, and structured. ` +
      `Response format MUST be a valid JSON object matching the following fields: ` +
      `{\n` +
      `  "title": "A catchy, short title of the advice (4-7 words)",\n` +
      `  "content": "Detailed advice description and tips (approx 2-3 sentences, 40-60 words)"\n` +
      `}\n` +
      `Return ONLY the JSON. No markdown wrappers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.75
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const newTip = {
        title: parsed.title,
        content: parsed.content,
        dateCode: todayStr
      };
      dynamicTips.push(newTip);
      saveDynamicTips(dynamicTips);
      console.log(`Successfully generated and saved new daily travel tip: ${newTip.title}`);
    } else {
      throw new Error("Empty model response");
    }
  } catch (error) {
    console.error("Failed to generate dynamic daily tip, calling fallback:", error);
    const todayStr = new Date().toISOString().split("T")[0];
    const fallbackTip = getTargetTipForDate(todayStr);
    const newTip = {
      ...fallbackTip,
      dateCode: todayStr
    };
    dynamicTips.push(newTip);
    saveDynamicTips(dynamicTips);
  }
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

// Server-side blog photo upload endpoint with size and mime-type security guards
app.post("/api/blogs/:id/add-photo", (req, res) => {
  try {
    const { id } = req.params;
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

    // Mime-type Security Guard
    const allowedMimeTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ 
        error: "Security Check Failed: Only JPG, JPEG, PNG, and WebP media formats are allowed on our servers." 
      });
    }

    // File Size limit validation (2MB)
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

    // Generate randomized collision-safe filename
    const randomId = Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    const safeFilename = `blog_${id}_${randomId}.${extension}`;
    const destinationPath = path.join(uploadsDir, safeFilename);

    // Write parsed buffer to disk
    fs.writeFileSync(destinationPath, buffer);
    const photoUrl = `/uploads/comments/${safeFilename}`; // Serve using comments static uploads

    // Save to additional photos
    const additionalPhotos = getAdditionalPhotos();
    if (!additionalPhotos[id]) {
      additionalPhotos[id] = [];
    }
    additionalPhotos[id].push(photoUrl);
    saveAdditionalPhotos(additionalPhotos);

    return res.json({
      success: true,
      photoUrl,
      filename: safeFilename
    });
  } catch (err: any) {
    console.error("Critical server-side blog photo upload error:", err);
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
app.get("/api/blogs", async (req, res) => {
  await ensureDailyBlogGenerated();
  const dynamicBlogs = getDynamicBlogs();
  const additionalPhotos = getAdditionalPhotos();
  
  const allBlogs = [...BLOG_ARTICLES, ...dynamicBlogs].map((blog: any) => {
    const extraUrls = additionalPhotos[blog.id] || [];
    if (extraUrls.length > 0) {
      const mergedUrls = [...(blog.imageUrls || (blog.imageUrl ? [blog.imageUrl] : []))];
      extraUrls.forEach((url: string) => {
        if (!mergedUrls.includes(url)) {
          mergedUrls.push(url);
        }
      });
      return {
        ...blog,
        imageUrl: blog.imageUrl || mergedUrls[0],
        imageUrls: mergedUrls
      };
    }
    return blog;
  });
  
  res.json(allBlogs);
});

// Serve dynamic travel tips merged with static ones
app.get("/api/tips", async (req, res) => {
  await ensureDailyTipGenerated();
  const dynamicTips = getDynamicTips();
  res.json([...TRAVEL_TIPS, ...dynamicTips]);
});

function serveDynamicSeoPage(req: express.Request, res: express.Response) {
  try {
    const distPath = path.join(process.cwd(), "dist");
    let indexPath = path.join(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(process.cwd(), "index.html");
    }

    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("index.html not found");
    }

    let html = fs.readFileSync(indexPath, "utf-8");

    // Default details
    let title = "IZYSL.COM | Premium Luxury Sri Lanka Travel Guide & Planner";
    let description = "Official luxury travel guide of Sri Lanka. Interactive province filters, beautiful cascading waterfalls, pristine surf beaches, Ella train journeys, and mountain budget routes.";
    let imageUrl = "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&h=630&q=80";

    const urlPath = req.path;
    if (urlPath.startsWith("/blog/")) {
      const id = urlPath.split("/")[2];
      const dynamicBlogs = getDynamicBlogs();
      const additionalPhotos = getAdditionalPhotos();
      const blog = [...BLOG_ARTICLES, ...dynamicBlogs].find(b => b.id === id);
      if (blog) {
        title = `${blog.title} - Nomad Chronicles | IZYSL.COM`;
        description = blog.excerpt || blog.firstParagraph || description;
        const extraPhotos = additionalPhotos[blog.id] || [];
        imageUrl = blog.imageUrl || extraPhotos[0] || imageUrl;
      }
    } else if (urlPath.startsWith("/place/")) {
      const id = urlPath.split("/")[2];
      const place = PLACES_DATA.find(p => p.id === id);
      if (place) {
        title = `${place.name} - Sri Lanka Travel Guide | IZYSL.COM`;
        description = place.description || description;
        imageUrl = place.imageUrl || place.imageUrls?.[0] || imageUrl;
      }
    } else if (urlPath.startsWith("/hotel/")) {
      const id = urlPath.split("/")[2];
      const hotel = HOTELS_DATA.find(h => h.id === id);
      if (hotel) {
        title = `${hotel.name} - Luxury Hotel | IZYSL.COM`;
        description = hotel.description || description;
        imageUrl = hotel.imageUrl || imageUrl;
      }
    } else if (urlPath.startsWith("/restaurant/")) {
      const id = urlPath.split("/")[2];
      const restaurant = RESTAURANTS_DATA.find(r => r.id === id);
      if (restaurant) {
        title = `${restaurant.name} - Dining Guide | IZYSL.COM`;
        description = restaurant.description || description;
        imageUrl = restaurant.imageUrl || imageUrl;
      }
    }

    // Clean html replacements
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    html = html.replace(/<meta name="description" content=".*?"\s*\/?>/gi, `<meta name="description" content="${description}" />`);
    html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${imageUrl}" />`);
    html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${title}" />`);
    html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${description}" />`);
    html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${imageUrl}" />`);

    const canonicalUrl = `https://izysl.com${urlPath}`;
    html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${canonicalUrl}" />`);

    res.header("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("Error serving dynamic SEO page:", err);
    const distPath = path.join(process.cwd(), "dist");
    let indexPath = path.join(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(process.cwd(), "index.html");
    }
    res.sendFile(indexPath);
  }
}

// Bind express routes for crawler/entity page pre-rendering
app.get(["/blog/:id", "/place/:id", "/hotel/:id", "/restaurant/:id"], serveDynamicSeoPage);

// Serve dynamic sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  try {
    const dynamicBlogs = getDynamicBlogs();
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

// Setup and start server if NOT on Vercel
async function initDevOrProdServer() {
  if (process.env.VERCEL === "1") {
    return;
  }

  const PORT = process.env.PORT || 3000;

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
