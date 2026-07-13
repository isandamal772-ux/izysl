import fs from "fs";
import path from "path";
import { PLACES_DATA, BLOG_ARTICLES, TRAVEL_TIPS } from "../src/data/srilankaData";
import { generate1000WordGuide } from "../src/data/guideGenerator";
import dotenv from "dotenv";

dotenv.config();

const top20Places = [
  "hr-sigiriya", "hr-kandy", "hr-gallefort", "hr-dambulla", "hr-anuradhapura",
  "hr-polonnaruwa", "mt-adamspeak", "mt-ellarock", "mt-littleadamspeak", "mt-hortonplains",
  "sf-yala", "sf-wilpattu", "sf-udawalawe", "bh-mirissa", "bh-hikkaduwa",
  "bh-bentota", "bh-arugambay", "bh-unawatuna", "bh-nilaveli", "wf-diyaluma"
];

const fallbackTips = [
  { title: "Dialog & Mobitel 4G Connectivity", content: "For reliable coverage across the central highlands and coastal villages, purchase a Dialog or Mobitel eSIM. Dialog generally has the highest coverage density in remote mountainous zones." },
  { title: "Cash is King in Rural Towns", content: "Carry local rupees (LKR) at all times. While high-end hotels accept credit cards, local seafood cafes, surf instructors, national park fees, and tuk-tuk drivers only accept cash." },
  { title: "Respect Buddha Statues & Temples", content: "Never pose with your back turned directly to a Buddha statue for photographs, as it is considered a serious mark of disrespect. Always ask permission before photographing monks." },
  { title: "Safety Flags on Southern Beaches", content: "During monsoon seasons, strong rip currents occur along the southern coast. Never enter the water when red warning flags are displayed on the sands of Mirissa or Hikkaduwa." },
  { title: "Type G plug & Round Adaptors", content: "Sri Lanka utilizes standard rectangular British 3-pin G plugs, alongside round 3-pin D/M plugs. Carry a universal adaptor, and use the 'pen trick' to open round pin outlets safely if needed." },
  { title: "Monsoon Season Split Planning", content: "Planning is key: the South & West coast beaches (Unawatuna, Weligama) are sunny from November to April, while the East coast beaches (Pasikuda, Nilaveli) shine from May to September." },
  { title: "Wild Elephant Highway Etiquette", content: "Do not stop your vehicle, honk, or feed wild elephants that stand near roadsides (like the Buttala-Sella Kataragama road). Keep windows closed and drive by slowly and quietly." },
  { title: "PickMe & Uber for fair pricing", content: "Download PickMe and Uber upon arrival in Colombo. They guarantee metered rates for tuk-tuks and cars, which protects you from tourist price inflation in cities." },
  { title: "Drinking Water Safety Guard", content: "Never drink un-filtered tap water. Use bottled mineral water or filtered water provided at your eco-villas, and use bottled water for brushing your teeth in rural areas." },
  { title: "Temple Dress Modesty Rules", content: "Always wear white or light-colored clothing that covers both shoulders and knees when visiting historical ruins. Keep a clean sarong in your backpack for instant cover." },
  { title: "Sinharaja Rainforest Leech Guard", content: "When trekking Sinharaja or Knuckles forest paths, apply lemon oil, soap, or tobacco water to your legs, and wear tall leech socks to prevent bites on damp forest floors." },
  { title: "King Coconut Hydration (Thambili)", content: "Drink fresh orange King Coconut (Thambili) water sold by roadside vendors. It is clean, rich in electrolytes, and the perfect hydration cure under the hot tropical sun." },
  { title: "Kottu Roti & Local Spices", content: "Sample fresh Kottu Roti at popular street stalls. If you have a sensitive stomach, request 'tourist mild' as local spices can be hot." },
  { title: "Tuk-Tuk price negotiations", content: "In rural towns where ride-sharing apps aren't active, negotiate the price with the tuk-tuk driver *before* getting in. Standard rural rates are roughly 150-200 LKR per kilometer." },
  { title: "Mosquito Protection Essentials", content: "Sri Lanka has zero malaria risk, but Dengue fever is present. Always apply high-DEET insect repellent, especially at sunrise and sunset when mosquitoes are active." }
];

function getTargetPlaceForDate(dateStr: string, offset: number = 0) {
  const startDate = new Date("2026-06-22").getTime();
  const currentDate = new Date(dateStr).getTime();
  const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  const dayIndex = (Math.max(0, diffDays) * 3 + offset) % top20Places.length;
  const targetPlaceId = top20Places[dayIndex];
  const place = PLACES_DATA.find((p) => p.id === targetPlaceId);
  return place || PLACES_DATA[0];
}

function getTargetTipForDate(dateStr: string) {
  const startDate = new Date("2026-06-22").getTime();
  const currentDate = new Date(dateStr).getTime();
  const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  const dayIndex = Math.max(0, diffDays) % fallbackTips.length;
  return fallbackTips[dayIndex];
}

// Generate daily content
async function run() {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const dynamicBlogsPath = path.join(process.cwd(), "src", "data", "dynamicBlogs.json");
  const dynamicTipsPath = path.join(process.cwd(), "src", "data", "dynamicTips.json");

  // Load existing data
  let dynamicBlogs: any[] = [];
  let dynamicTips: any[] = [];

  if (fs.existsSync(dynamicBlogsPath)) {
    dynamicBlogs = JSON.parse(fs.readFileSync(dynamicBlogsPath, "utf-8"));
  }
  if (fs.existsSync(dynamicTipsPath)) {
    dynamicTips = JSON.parse(fs.readFileSync(dynamicTipsPath, "utf-8"));
  }

  // Generate 3 blogs
  for (let offset = 0; offset < 3; offset++) {
    const hasBlog = dynamicBlogs.some((b: any) => b.dateCode === todayStr && b.offset === offset);
    if (hasBlog) {
      console.log(`Blog for ${todayStr} (offset ${offset}) already exists.`);
      continue;
    }

    const place = getTargetPlaceForDate(todayStr, offset);
    const guide = generate1000WordGuide(place);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date(todayStr);
    const formattedDate = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

    const newBlog = {
      id: `bl-dynamic-fallback-${place.id}-${Date.now()}-${offset}`,
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
      dateCode: todayStr,
      offset
    };

    dynamicBlogs.push(newBlog);
    console.log(`Generated daily blog for ${place.name}`);
  }

  // Generate 1 tip
  const hasTip = dynamicTips.some((t: any) => t.dateCode === todayStr);
  if (!hasTip) {
    const fallbackTip = getTargetTipForDate(todayStr);
    const newTip = {
      id: `tip-dynamic-${todayStr}-${Date.now()}`,
      title: fallbackTip.title,
      content: fallbackTip.content,
      dateCode: todayStr
    };
    dynamicTips.push(newTip);
    console.log(`Generated daily tip: ${fallbackTip.title}`);
  } else {
    console.log(`Tip for ${todayStr} already exists.`);
  }

  // Save files
  const dir = path.dirname(dynamicBlogsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dynamicBlogsPath, JSON.stringify(dynamicBlogs, null, 2), "utf-8");
  fs.writeFileSync(dynamicTipsPath, JSON.stringify(dynamicTips, null, 2), "utf-8");
  console.log("Updated daily content files successfully.");
}

run().catch((e) => {
  console.error("Error executing daily update script:", e);
  process.exit(1);
});
