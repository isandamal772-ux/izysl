import fs from "fs";
import path from "path";
import { PLACES_DATA, BLOG_ARTICLES } from "../src/data/srilankaData";
import { generate1000WordGuide } from "../src/data/guideGenerator";

async function run() {
  const dynamicBlogsPath = path.join(process.cwd(), "src", "data", "dynamicBlogs.json");

  // Load existing data
  let dynamicBlogs: any[] = [];
  if (fs.existsSync(dynamicBlogsPath)) {
    dynamicBlogs = JSON.parse(fs.readFileSync(dynamicBlogsPath, "utf-8"));
  }

  // Find 10 places that don't have static blogs and aren't already in dynamic blogs
  const existingIds = new Set([
    ...BLOG_ARTICLES.map((b) => b.id.replace("bl-", "")),
    ...dynamicBlogs.map((b) => b.id.split("-")[3] || b.id) // extract place ID if formatted as bl-dynamic-fallback-PLACEID-timestamp-offset
  ]);

  const selectedPlaces = PLACES_DATA.filter((p) => !existingIds.has(p.id)).slice(0, 10);

  // If we need more, just select from PLACES_DATA to fill up to 10
  if (selectedPlaces.length < 10) {
    const remainingCount = 10 - selectedPlaces.length;
    const additional = PLACES_DATA.filter((p) => !selectedPlaces.some((sp) => sp.id === p.id)).slice(0, remainingCount);
    selectedPlaces.push(...additional);
  }

  console.log(`Selected ${selectedPlaces.length} places for article generation...`);

  const today = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  for (let i = 0; i < selectedPlaces.length; i++) {
    const place = selectedPlaces[i];
    const guide = generate1000WordGuide(place);

    // Spread target dates over consecutive days to make it look organic
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = targetDate.toISOString().split("T")[0];
    const formattedDate = `${months[targetDate.getMonth()]} ${targetDate.getDate()}, ${targetDate.getFullYear()}`;

    const newBlog = {
      id: `bl-dynamic-auto-${place.id}-${Date.now()}-${i}`,
      title: `${place.name}: The Ultimate ~1000-Word Explorer Guide`,
      excerpt: place.description,
      author: "IZYSL Guide Bot",
      date: formattedDate,
      category: place.category === "mountains_hill_country" ? "Adventure" : place.category === "heritage_sites" ? "Culture" : "Nature",
      imageUrl: place.imageUrls[0] || "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
      readTime: "8 min read",
      firstParagraph: `Welcome to the comprehensive explorer's guide to ${place.name}, one of the most stunning destinations in ${place.location}, Sri Lanka. In this detailed travel article, we'll cover everything you need to know before visiting.`,
      tableOfContents: [
        { id: "intro-history", label: "Introduction & History" },
        { id: "location-reach", label: "How to Reach" },
        { id: "weather-timing", label: "Best Time & Weather" },
        { id: "fees-hours", label: "Entry Fees & Hours" },
        { id: "activities", label: "Top Things to Do" },
        { id: "nearby", label: "Nearby Attractions" },
        { id: "safety", label: "Safety Guidelines" }
      ],
      sections: [
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
      ],
      faqs: [
        { question: `What is the best time to visit ${place.name}?`, answer: place.bestTime || "December to April is highly recommended." },
        { question: `Is there an entrance fee for ${place.name}?`, answer: place.entranceFee || "Entry details can vary; please check with the park gates." }
      ],
      relatedPosts: ["bl-train", "bl-beaches"],
      dateCode: dateStr,
      offset: i
    };

    dynamicBlogs.push(newBlog);
    console.log(`Generated dynamic blog for ${place.name}`);
  }

  // Save changes
  const dir = path.dirname(dynamicBlogsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dynamicBlogsPath, JSON.stringify(dynamicBlogs, null, 2), "utf-8");
  console.log(`Successfully generated and appended 10 articles to ${dynamicBlogsPath}`);
}

run().catch((e) => {
  console.error("Error executing 10 article generator:", e);
  process.exit(1);
});
