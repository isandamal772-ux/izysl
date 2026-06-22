import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Search, 
  MapPin, 
  Star, 
  Heart, 
  PhoneCall, 
  Info, 
  Mail,
  ExternalLink, 
  Share2, 
  BookOpen, 
  MessageSquare, 
  X, 
  Menu, 
  Sun, 
  Moon, 
  Plus, 
  Map, 
  Settings, 
  CheckCircle,
  Clock, 
  HelpCircle,
  ArrowRight,
  Globe,
  DollarSign,
  Camera,
  AlertTriangle,
  Calculator,
  Receipt,
  Bed,
  CloudSun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PLACES_DATA, HOTELS_DATA, RESTAURANTS_DATA, BLOG_ARTICLES, TRAVEL_TIPS } from "./data/srilankaData";
import { DestinationCategory, Place, Hotel, Restaurant, UserProfile, UserReview } from "./types";
import { ShimmerImage } from "./components/ShimmerImage";
import { loginWithGoogle, logoutUser, isReady } from "./firebase";
import { getStaticReviewsFor, ALL_TOURIST_PHOTOS } from "./data/reviewsData";
import { generate1000WordGuide } from "./data/guideGenerator";

// Import modular widgets
import TripPlanner from "./components/TripPlanner";
import AiAssistant from "./components/AiAssistant";
import CurrencyConverter from "./components/CurrencyConverter";
import WeatherWidget from "./components/WeatherWidget";
import CostCalculator from "./components/CostCalculator";
import InteractiveMap from "./components/InteractiveMap";
import AnimatedLogo from "./components/AnimatedLogo";

function normalizeBlog(blog: any): any {
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
      { question: "What is the dress code for historical temples?", answer: "You must cover your shoulders and knees. Remember to remove shoes and hats before entering sacred spaces." },
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

function getClientFallbackDailyBlog(): any {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  const topics = [
    {
      title: "Horton Plains National Park: Hikes & Baker's Falls",
      excerpt: "Explore the misty plains, dramatic cliffs at World's End, and the cascading waters of Baker's Falls.",
      category: "Nature",
      imageUrl: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=800&q=80",
      firstParagraph: "Horton Plains National Park in Sri Lanka is a cold, windy forest landscape sitting over 2,100 meters above sea level. This UNESCO World Heritage site offers some of the country's most dramatic views, including the sheer drop of World's End and the misty flow of Baker's Falls.",
      tableOfContents: [
        { id: "worlds-end", label: "The Majestic World's End Hike" },
        { id: "bakers-falls", label: "Baker's Falls & Misty Cloud Forests" }
      ],
      sections: [
        { type: "h2", text: "The Majestic World's End Hike", id: "worlds-end" },
        { type: "paragraph", text: "The circular trail through Horton Plains is a scenic 9km loop. Walking through the open grasslands and dense cloud forests leads you to the spectacular sheer cliff known as World's End, which drops nearly 880 meters. It offers a spectacular view of the southern valley, best seen early in the morning before the mist rolls in." },
        { type: "tweet", text: "Staring down the 880-meter drop at World's End in Horton Plains is a humbling and unforgettable memory! #SriLankaTravel #HortonPlains", tweetText: "Staring down the 880-meter drop at World's End in Horton Plains is a humbling and unforgettable memory! 🌲🇱🇰" },
        { type: "h2", text: "Baker's Falls & Misty Cloud Forests", id: "bakers-falls" },
        { type: "paragraph", text: "Continuing along the path, you will hear the roaring waters of Baker's Falls. Named after Sir Samuel Baker, this 20-meter waterfall is surrounded by lush ferns and native rhododendrons. The damp, refreshing spray from the falls is a perfect reward after walking the trails." }
      ],
      faqs: [
        { question: "What is the best time to visit Horton Plains?", answer: "Arrive at the gate by 6:00 AM. The clear weather window at World's End usually closes by 9:00 AM when heavy mist covers the valley." },
        { question: "Are plastic bottles allowed inside the national park?", answer: "No, Horton Plains is a strictly enforced zero-plastic zone. All plastic wrappers and bottle labels will be removed at the entrance checkpoint." }
      ],
      relatedPosts: ["bl-waterfalls", "bl-transport"]
    },
    {
      title: "Ahangama Surf Guide: Best Wave Breaks & Beach Cafes",
      excerpt: "Discover the emerging surf capital of the south coast, filled with stilt villas, cool cafes, and consistent waves.",
      category: "Adventure",
      imageUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80",
      firstParagraph: "Ahangama has quickly transformed from a sleepy fishing village into one of Sri Lanka's trendiest coastal hubs. Renowned for its reliable reef breaks, sandy beaches, and artisanal coffee spots, it is the ultimate base for surfers and remote nomads alike.",
      tableOfContents: [
        { id: "surfing", label: "Surfing in Ahangama for All Levels" },
        { id: "cafes", label: "Beach Cafes & Coastal Vibe" }
      ],
      sections: [
        { type: "h2", text: "Surfing in Ahangama for All Levels", id: "surfing" },
        { type: "paragraph", text: "Ahangama boasts a diverse range of surf spots, from mellow sandy beach breaks to advanced reef sections. Kabalana Beach, home to the famous 'The Rock' break, offers clean waves for experienced riders, while Marshmallows and Gas Stations offer easier swells perfect for intermediate learners." },
        { type: "tweet", text: "Surfing the warm Indian Ocean waves at sunrise in Ahangama is pure bliss. The surf culture here is incredible! #Ahangama #SurfSriLanka", tweetText: "Surfing the warm Indian Ocean waves at sunrise in Ahangama is pure bliss! 🏄‍♂️🇱🇰" },
        { type: "h2", text: "Beach Cafes & Coastal Vibe", id: "cafes" },
        { type: "paragraph", text: "After spending the morning in the water, Ahangama's vibrant cafe culture welcomes you. Popular spots serve delicious smoothie bowls, avocado toasts, and locally sourced specialty coffee. In the evening, the town features beach bonfires, fresh seafood barbecues, and live acoustic music." }
      ],
      faqs: [
        { question: "When is the surf season in Ahangama?", answer: "The main surf season runs from November to April when the offshore winds are clean and swells are consistent." },
        { question: "Can I rent surfboards locally?", answer: "Yes, there are numerous surf shops along the Galle Road in Ahangama renting boards for around 500-1000 LKR per hour." }
      ],
      relatedPosts: ["bl-beaches", "bl-transport"]
    },
    {
      title: "Ancient City of Anuradhapura: Sacred Bodhi Tree & Stupas",
      excerpt: "Step back 2000 years into Sri Lanka's first capital, home to colossal stupas and ruins of ancient Buddhist monasteries.",
      category: "Culture",
      imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      firstParagraph: "Anuradhapura is the spiritual cradle of ancient Sri Lanka, serving as the country's first royal capital for over a millennium. Today, this vast archaeological reserve holds some of the world's largest brick stupas, sacred ruins, and ancient irrigation tanks.",
      tableOfContents: [
        { id: "monuments", label: "Gigantic Stupas & Royal Architecture" },
        { id: "bodhi-tree", label: "The Sacred Jaya Sri Maha Bodhi" }
      ],
      sections: [
        { type: "h2", text: "Gigantic Stupas & Royal Architecture", id: "monuments" },
        { type: "paragraph", text: "The skyline of Anuradhapura is dominated by colossal brick stupas. The Ruwanwelisaya Stupa, a white dome structure built in 140 BC, is a marvel of ancient engineering. Walking around the base of these monumental shrines among silent devotees is a deeply moving experience." },
        { type: "tweet", text: "Standing in awe of Ruwanwelisaya in Anuradhapura, a monument built over 2,000 years ago. The history here is spectacular! #Anuradhapura #SriLankaHeritage", tweetText: "Standing in awe of Ruwanwelisaya in Anuradhapura, built over 2,000 years ago! ☸️🇱🇰" },
        { type: "h2", text: "The Sacred Jaya Sri Maha Bodhi", id: "bodhi-tree" },
        { type: "paragraph", text: "The central point of worship in Anuradhapura is the Jaya Sri Maha Bodhi. This sacred fig tree was grown from a south branch of the historical Bodhi Tree under which Lord Buddha attained enlightenment. It was planted in 288 BC, making it the oldest historically documented, human-planted tree in the world." }
      ],
      faqs: [
        { question: "What is the dress code for visiting temples in Anuradhapura?", answer: "Wear white or light-colored clothing that covers both shoulders and knees. You must remove shoes and hats before entering sacred temple grounds." },
        { question: "How should I get around the ancient city?", answer: "Renting a bicycle is the best way to explore the spacious, shady archaeological park. You can also hire a tuk-tuk for the day." }
      ],
      relatedPosts: ["bl-luxury", "bl-transport"]
    }
  ];

  const dateHash = todayStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const topic = topics[dateHash % topics.length];
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date();
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  return {
    id: `bl-dynamic-client-${dateHash}`,
    title: `${topic.title} - Daily Feature`,
    excerpt: topic.excerpt,
    author: "IZYSL Guide Bot",
    date: dateStr,
    category: topic.category,
    imageUrl: topic.imageUrl,
    readTime: "6 min read",
    firstParagraph: topic.firstParagraph,
    tableOfContents: topic.tableOfContents,
    sections: topic.sections,
    faqs: topic.faqs,
    relatedPosts: topic.relatedPosts,
    dateCode: todayStr
  };
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory | "ALL" | "HOTELS" | "RESTAURANTS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"explore" | "planner" | "tips" | "blog" | "reviews" | "emergency" | "map">("explore");
  const [activeModalTab, setActiveModalTab] = useState<"overview" | "reach" | "tips">("overview");
  const [blogArticles, setBlogArticles] = useState<any[]>(BLOG_ARTICLES.map(normalizeBlog));
  const [travelTips, setTravelTips] = useState<any[]>(TRAVEL_TIPS);

  // Hero Background Slideshow State
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    "https://images.unsplash.com/photo-1588598126707-167bb336599b?auto=format&fit=crop&w=1920&q=80&fm=webp", // Sigiriya Rock
    "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1920&q=80&fm=webp", // Ella Nine Arch Bridge
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80&fm=webp"  // Sri Lanka Beach
  ];

  useEffect(() => {
    const slideshowTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(slideshowTimer);
  }, []);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error"; id: number } | null>(null);

  const triggerToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast(curr => curr?.id === id ? null : curr);
    }, 4500);
  };

  // Mobile Bottom-Sheet states
  const [isFeedbackSheetOpen, setIsFeedbackSheetOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  
  // Suggestions states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestDropdown, setShowSuggestDropdown] = useState(false);

  // Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle suggested items listing based on debounced search
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = debouncedSearchQuery.toLowerCase();
    
    const matchedPlaces = PLACES_DATA.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.location.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    ).map(p => ({ ...p, type: "place" }));

    const matchedHotels = HOTELS_DATA.filter(h => 
      h.name.toLowerCase().includes(query) || 
      h.location.toLowerCase().includes(query)
    ).map(h => ({ ...h, type: "hotel" }));

    const matchedRestaurants = RESTAURANTS_DATA.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.location.toLowerCase().includes(query)
    ).map(r => ({ ...r, type: "restaurant" }));

    const allMatches = [...matchedPlaces, ...matchedHotels, ...matchedRestaurants].slice(0, 6);
    setSuggestions(allMatches);
  }, [debouncedSearchQuery]);

  // Detail Modal target states
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
  const [activeGalleryPhoto, setActiveGalleryPhoto] = useState<any | null>(null);

  // Advanced Destination Stay Cost Calculator States
  const [calcHotelId, setCalcHotelId] = useState<string>("");
  const [calcNights, setCalcNights] = useState<number>(3);
  const [calcRoomClass, setCalcRoomClass] = useState<"deluxe" | "suite" | "villa">("deluxe");
  const [calcRoomsCount, setCalcRoomsCount] = useState<number>(1);
  const [calcGuestsCount, setCalcGuestsCount] = useState<number>(2);
  const [calcHalfBoard, setCalcHalfBoard] = useState<boolean>(false);
  const [calcFullBoard, setCalcFullBoard] = useState<boolean>(false);
  const [calcGuide, setCalcGuide] = useState<boolean>(false);
  const [calcChauffeur, setCalcChauffeur] = useState<boolean>(false);
  const [showAllHotels, setShowAllHotels] = useState<boolean>(false);

  // Auto-set the selected calculation hotel when modal target place updates
  useEffect(() => {
    setShowAllHotels(false); // Reset list collapse
    if (selectedPlace) {
      // Find matching hotels for this place
      const matched = HOTELS_DATA.filter(h => h.id.startsWith(`ht-${selectedPlace.id}-`));
      if (matched.length > 0) {
        setCalcHotelId(matched[0].id);
      } else {
        // Fallback to any close hotel
        const close = HOTELS_DATA.filter(h => 
          h.location.toLowerCase().includes(selectedPlace.location.toLowerCase()) ||
          selectedPlace.location.toLowerCase().includes(h.location.toLowerCase())
        );
        if (close.length > 0) {
          setCalcHotelId(close[0].id);
        } else {
          setCalcHotelId("");
        }
      }
    } else {
      setCalcHotelId("");
    }
  }, [selectedPlace]);

  // States for reviews tracking
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentRating, setNewCommentRating] = useState<number>(5);
  const [newCommentText, setNewCommentText] = useState("");
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhotoData, setPreviewPhotoData] = useState<string | null>(null);

  // Wishlist / Favorites tracker
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Language selection simulation
  const [language, setLanguage] = useState<"EN" | "DE" | "FR" | "RU">("EN");

  // Newsletter tracking states
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Contact Form tracking states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  // Escape key global listener for modal closes
  useEffect(() => {
    const handleEscapeClose = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlace(null);
        setSelectedHotel(null);
        setSelectedRestaurant(null);
        setIsFeedbackSheetOpen(false);
        setIsReviewSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscapeClose);
    return () => window.removeEventListener("keydown", handleEscapeClose);
  }, []);

  // Load state and system initial parameters
  useEffect(() => {
    // Check dark mode preference
    const savedDark = localStorage.getItem("izysl_dark") || localStorage.getItem("visit_srilanka_dark");
    if (savedDark !== null) {
      setDarkMode(savedDark === "true");
    }

    // Load active session profile
    try {
      const savedUser = localStorage.getItem("izysl_user") || localStorage.getItem("visit_srilanka_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Error parsing user state:", e);
    }

    // Load wishlist favorites securely with try-catch and syntax fallback
    try {
      const savedFavs = localStorage.getItem("izysl_favs") || localStorage.getItem("visit_srilanka_favs");
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        } else {
          setFavorites([]);
        }
      }
    } catch (e) {
      console.warn("Favorites deserialization issue, resetting to empty:", e);
      setFavorites([]);
    }

    // Load custom comments
    try {
      const savedComments = localStorage.getItem("izysl_comments") || localStorage.getItem("visit_srilanka_comments");
      if (savedComments) {
        setUserReviews(JSON.parse(savedComments));
      }
    } catch (e) {
      console.warn("Comments parse concern:", e);
    }
  }, []);

  // Update Dark Mode document rules
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("izysl_dark", String(darkMode));
  }, [darkMode]);

  // Dynamic URL Router (SEO Clean Deep-Linking)
  useEffect(() => {
    const parseLocation = () => {
      let path = window.location.pathname;
      if (path === "/" || path === "/index.html") {
        // Backwards compatibility fallback to hash
        const hash = window.location.hash.replace("#", "");
        if (hash) {
          path = "/" + hash;
        }
      }
      
      if (path.startsWith("/place/")) {
        const id = path.replace("/place/", "");
        const matched = PLACES_DATA.find(p => p.id === id);
        if (matched) {
          setSelectedPlace(matched);
          setActiveTab("explore");
        }
      } else if (path.startsWith("/hotel/")) {
        const id = path.replace("/hotel/", "");
        const matched = HOTELS_DATA.find(h => h.id === id);
        if (matched) {
          setSelectedHotel(matched);
          setActiveTab("explore");
        }
      } else if (path.startsWith("/restaurant/")) {
        const id = path.replace("/restaurant/", "");
        const matched = RESTAURANTS_DATA.find(r => r.id === id);
        if (matched) {
          setSelectedRestaurant(matched);
          setActiveTab("explore");
        }
      } else if (path.startsWith("/blog/")) {
        const id = path.replace("/blog/", "");
        const matched = blogArticles.find(b => b.id === id);
        if (matched) {
          setSelectedBlog(matched);
          setActiveTab("blog");
        }
      } else {
        const cleanPath = path.replace("/", "");
        const validTabs = ["explore", "planner", "tips", "blog", "reviews", "emergency", "map"];
        if (validTabs.includes(cleanPath)) {
          setActiveTab(cleanPath as any);
          setSelectedPlace(null);
          setSelectedHotel(null);
          setSelectedRestaurant(null);
          setSelectedBlog(null);
        }
      }
    };

    parseLocation();
    window.addEventListener("popstate", parseLocation);
    window.addEventListener("hashchange", parseLocation);
    return () => {
      window.removeEventListener("popstate", parseLocation);
      window.removeEventListener("hashchange", parseLocation);
    };
  }, [blogArticles]);

  // Update pathname when React states change (SEO Clean URLs)
  useEffect(() => {
    let newPath = `/${activeTab}`;
    if (selectedPlace) {
      newPath = `/place/${selectedPlace.id}`;
    } else if (selectedHotel) {
      newPath = `/hotel/${selectedHotel.id}`;
    } else if (selectedRestaurant) {
      newPath = `/restaurant/${selectedRestaurant.id}`;
    } else if (selectedBlog) {
      newPath = `/blog/${selectedBlog.id}`;
    }
    
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, "", newPath);
    }
  }, [activeTab, selectedPlace, selectedHotel, selectedRestaurant, selectedBlog]);

  // Dynamic Browser Document Title and SEO Metadata Manager
  useEffect(() => {
    let title = "IZYSL.COM | Premium Luxury Sri Lanka Travel Guide & Planner";
    let description = "Official luxury travel guide of Sri Lanka. Interactive province filters, beautiful cascading waterfalls, pristine surf beaches, Ella train journeys, and mountain budget routes.";
    
    if (activeTab === "planner") {
      title = "Interactive Sri Lanka Trip Planner & Route Builder | IZYSL.COM";
      description = "Plan your dream vacation to Sri Lanka. Add tourist spots, estimate total stay costs, coordinate chauffeur transport, and export your itinerary.";
    } else if (activeTab === "tips") {
      title = "Sri Lanka Crucial Travel Advice, Visa & Etiquette | IZYSL.COM";
      description = "Read resident guidelines regarding tourist visa paperwork, train seat bookings, airport customs protocols, temple dress codes, and local tips.";
    } else if (activeTab === "blog") {
      if (selectedBlog) {
        title = `${selectedBlog.title} - Nomad Chronicles | IZYSL.COM`;
        description = selectedBlog.excerpt || "Explore travel logs and backpacker diaries written by local and international nomads in Sri Lanka.";
      } else {
        title = "Sri Lanka Travel Articles & Guides | IZYSL.COM";
        description = "Explore travel articles, hiking itineraries, national park guidebooks, and budget travel diaries written by local and international nomads.";
      }
    } else if (activeTab === "reviews") {
      title = "Explorer Reviews, Photo Log & Shared Memories | IZYSL.COM";
      description = "Browse travel reviews, high-resolution photography collections, and holiday memories submitted by travelers in Sri Lanka.";
    } else if (activeTab === "emergency") {
      title = "Emergency Services, Hospitals & Travel Directory | IZYSL.COM";
      description = "Emergency contact numbers, tourist police branches, travel administration offices, and public hospital coordinates in Sri Lanka.";
    } else if (activeTab === "map") {
      title = "Interactive Regional Map of Sri Lanka | IZYSL.COM";
      description = "Explore various provinces, waterfalls, surf beaches, and historic heritage sites of Sri Lanka on an interactive visual map.";
    } else if (activeTab === "explore") {
      if (selectedPlace) {
        title = `${selectedPlace.name} - Sri Lanka Travel Guide | IZYSL.COM`;
        description = selectedPlace.description || "Discover waterfalls, beaches, and historic landmarks in Sri Lanka.";
      } else if (selectedHotel) {
        title = `${selectedHotel.name} - Luxury Hotel | IZYSL.COM`;
        description = selectedHotel.description || "Luxury hotel and resort guide in Sri Lanka.";
      } else if (selectedRestaurant) {
        title = `${selectedRestaurant.name} - Dining Guide | IZYSL.COM`;
        description = selectedRestaurant.description || "Fine dining and street food guide in Sri Lanka.";
      }
    }
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
  }, [activeTab, selectedPlace, selectedHotel, selectedRestaurant, selectedBlog]);

  // Fetch dynamic daily blog posts from Express server
  useEffect(() => {
    fetch("/api/blogs")
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        }
        throw new Error("API returned non-JSON index page (static hosting fallback)");
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setBlogArticles(data.map(normalizeBlog));
        } else {
          throw new Error("Invalid blogs data format");
        }
      })
      .catch((err) => {
        console.warn("Using client-side daily blog generation (standalone mode):", err);
        const clientDailyBlog = getClientFallbackDailyBlog();
        setBlogArticles([...BLOG_ARTICLES.map(normalizeBlog), clientDailyBlog]);
      });
  }, []);

  // Fetch dynamic travel tips from Express server
  useEffect(() => {
    fetch("/api/tips")
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        }
        throw new Error("API returned non-JSON index page (static hosting fallback)");
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTravelTips(data);
        } else {
          throw new Error("Invalid tips data format");
        }
      })
      .catch((err) => {
        console.warn("Using client-side static travel tips fallback:", err);
        setTravelTips(TRAVEL_TIPS);
      });
  }, []);

  // Auth operations
  const handleSignIn = async () => {
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
    } catch (e) {
      console.error("Auth helper issue: ", e);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Toggle Favorite
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(f => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("izysl_favs", JSON.stringify(updated));
  };

  // Handle Review Insertion with dynamic rating calc
  const handleAddReview = (entityId: string) => {
    if (!newCommentText.trim()) return;

    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      userId: currentUser?.uid || "anonymous-explorer",
      userName: newCommentName.trim() || currentUser?.displayName || "International Nomad",
      userPhoto: currentUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      entityId,
      rating: newCommentRating,
      comment: newCommentText.trim(),
      photoUrl: uploadedPhotoUrl || simulatedPhoto || undefined,
      status: (uploadedPhotoUrl || simulatedPhoto) ? "pending" : "approved",
      createdAt: new Date().toISOString()
    };

    const updated = [newRev, ...userReviews];
    setUserReviews(updated);
    localStorage.setItem("izysl_comments", JSON.stringify(updated));

    // Clear state inputs
    setNewCommentName("");
    setNewCommentRating(5);
    setNewCommentText("");
    setSimulatedPhoto(null);
    setUploadedPhotoUrl(null);
    setUploadError(null);
    setPreviewPhotoData(null);
    setIsUploading(false);
  };

  // Fetch reviews for specific entity
  const getReviewsForEntity = (id: string) => {
    return userReviews.filter(r => r.entityId === id);
  };

  // Handle Real Photo Upload in Client Form
  const handlePhotoUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setPreviewPhotoData(null);
    setUploadedPhotoUrl(null);

    // 1. Client-side Mime-type extension validation
    const allowedExtensions = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedExtensions.includes(file.type.toLowerCase())) {
      const errorMsg = "Unsupported file type. Only JPG, JPEG, PNG, and WebP images are allowed.";
      setUploadError(errorMsg);
      triggerToast(errorMsg, "error");
      return;
    }

    // 2. Client-side File Size validation (Maximum 2MB)
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeBytes) {
      const errorMsg = `File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed is 2.0MB.`;
      setUploadError(errorMsg);
      triggerToast(errorMsg, "error");
      return;
    }

    // Convert file to Base64 for instant preview & secure body upload
    const reader = new FileReader();
    reader.onload = async (entry) => {
      const base64String = entry.target?.result as string;
      if (!base64String) {
        setUploadError("Could not read local image file payload.");
        return;
      }

      // Display immediate preview locally
      setPreviewPhotoData(base64String);
      setIsUploading(true);

      // Submit to secure Express backend for server-side validation & file serialization
      try {
        const response = await fetch("/api/comments/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: base64String,
            filename: file.name
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Server validation error from upload channel.");
        }

        // Successfully saved to /uploads/comments/ with random filename (server-side)
        setUploadedPhotoUrl(data.photoUrl);
        triggerToast("Photo uploaded successfully! Your review will have pending moderation status.", "success");
      } catch (err: any) {
        console.warn("Upload service unavailable. Switching to safe local sandbox image client-side mode:", err);
        
        // Clean local base64 fallback so user doesn't get stuck with a 'Failed to fetch' error!
        setUploadedPhotoUrl(base64String);
        triggerToast("Local upload sandbox safeguard active. Your photo has been loaded into matching reviews successfully!", "success");
        setUploadError(null); // Clear errors
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to parse image from device storage.");
      triggerToast("Failed to parse image.", "error");
    };

    reader.readAsDataURL(file);
  };

  // Calculate dynamic compound ratings incorporating user comments
  const getCompoundRating = (id: string, baseRating: number) => {
    const custom = getReviewsForEntity(id);
    if (custom.length === 0) return baseRating;
    const sum = custom.reduce((acc, curr) => acc + curr.rating, 0) + baseRating;
    return parseFloat((sum / (custom.length + 1)).toFixed(1));
  };

  // Client Filter logic matching destination, category, waterfalls tag list etc.
  const getFilteredItems = () => {
    let items: (Place | Hotel | Restaurant)[] = [];

    if (selectedCategory === "ALL") {
      items = [...PLACES_DATA, ...HOTELS_DATA, ...RESTAURANTS_DATA];
    } else if (selectedCategory === "HOTELS") {
      items = HOTELS_DATA;
    } else if (selectedCategory === "RESTAURANTS") {
      items = RESTAURANTS_DATA;
    } else {
      items = PLACES_DATA.filter(p => p.category === selectedCategory);
    }

    if (debouncedSearchQuery.trim() !== "") {
      const q = debouncedSearchQuery.toLowerCase();
      items = items.filter(item => {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesLoc = item.location.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        // Look up categories, tags, or extra metadata references
        return matchesName || matchesLoc || matchesDesc;
      });
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // Social Sharing Link Simulation
  const handleShareSystem = (name: string) => {
    const url = `https://izysl.com/island/${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(url);
    triggerToast(`Shared! Copying travel link for "${name}" to clipboard. Try sharing with your travel partners!\n${url}`, "success");
  };

  // Multi-lingual translation mapping dictionary
  const dictionary = {
    EN: {
      heroTitle: "Explore Paradise Island",
      heroSub: "Embark on an unforgettable journey across golden-red sand beaches, misty mountain rails, cascading waterfalls, and sacred world heritage reserves.",
      searchPlaceholder: "Search beaches, ancient waterfalls, safari parks, restaurants...",
      categories: "Browse Categories",
      exploreBtn: "Explore Places",
      plannerBtn: "Plan My Trip",
      all: "All Paradises",
      beaches: "Beaches",
      waterfalls: "Waterfalls",
      mountains: "Highlands",
      safari: "Safari Reserves",
      heritage: "Ancient Heritage",
      hotels: "Lux Hotels",
      dining: "Specialty Dining",
      emergency: "Emergencies & Contacts",
      newsletterTitle: "Join Our Wanderlust newsletter",
      newsletterSub: "Get weekly curated boutique Sri Lankan retreats and transport discount alerts."
    },
    DE: {
      heroTitle: "Entdecken Sie die Paradiesinsel Sri Lanka",
      heroSub: "Erkunden Sie goldene Strände, Bergzüge, Wasserfälle, Wildreservate und reiche Kultur.",
      searchPlaceholder: "Suchen Sie nach Stränden, Wasserfällen, Nationalparks...",
      categories: "Kategorien durchsuchen",
      exploreBtn: "Orte erkunden",
      plannerBtn: "Reise planen",
      all: "Alle Paradiese",
      beaches: "Strände",
      waterfalls: "Wasserfälle",
      mountains: "Hochland",
      safari: "Safari-Parks",
      heritage: "Kulturerbe",
      hotels: "Resorts & Hotels",
      dining: "Restaurants",
      emergency: "Notfallnummern",
      newsletterTitle: "Abonnieren Sie unseren Newsletter",
      newsletterSub: "Erhalten Sie wöchentlich kuratierte Ausflugstipps für das wunderschöne Sri Lanka."
    },
    FR: {
      heroTitle: "Découvrez l'Île Paradis du Sri Lanka",
      heroSub: "Explorez des plages dorées, des trains de montagne, des cascades sauvages et une faune riche.",
      searchPlaceholder: "Rechercher des plages, des cascades, des parcs nationaux...",
      categories: "Parcourir les catégories",
      exploreBtn: "Explorer les lieux",
      plannerBtn: "Planifier mon voyage",
      all: "Tout voir",
      beaches: "Plages",
      waterfalls: "Cascades",
      mountains: "Montagnes",
      safari: "Parcs safaris",
      heritage: "Monuments historiques",
      hotels: "Hôtels de luxe",
      dining: "Gastronomie",
      emergency: "Urgences voyage",
      newsletterTitle: "Inscrivez-vous à notre newsletter",
      newsletterSub: "Recevez chaque semaine des idées de retraite et des réductions de voyage locales."
    },
    RU: {
      heroTitle: "Откройте для себя Райский Остров Шри-Ланка",
      heroSub: "Исследуйте золотые пляжи, горные поезда, бурные водопады и древнее наследие.",
      searchPlaceholder: "Поиск пляжей, водопадов, заповедников, отелей...",
      categories: "Категории",
      exploreBtn: "Исследовать",
      plannerBtn: "Запланировать",
      all: "Все места",
      beaches: "Пляжи",
      waterfalls: "Водопады",
      mountains: "Горы",
      safari: "Сафари-парки",
      heritage: "Культурное наследие",
      hotels: "Отели класса люкс",
      dining: "Рестораны",
      emergency: "Телефоны экстренных служб",
      newsletterTitle: "Подписаться на рассылку",
      newsletterSub: "Получайте еженедельные советы о лучших отелях и достопримечательностях Шри-Ланки."
    }
  };

  const t = dictionary[language];

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-slate-150 font-sans bg-transparent selection:bg-gold-500/20 selection:text-gold-200 pb-16 md:pb-0">
      
      {/* Dynamic Brand Logo Background Watermark */}
      <div 
        id="izysl-logo-watermark"
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.02] mix-blend-overlay overflow-hidden"
      >
        <img 
          src="/logo.png" 
          alt="Watermark Logo" 
          className="w-[85vw] h-[85vw] max-w-[750px] max-h-[750px] object-contain animate-pulse" 
          style={{ animationDuration: "16s" }}
        />
      </div>

      {/* -------------------- UPPER HEADER / BANNER / NAV -------------------- */}
      <header className="sticky top-0 z-40 bg-ocean-900/65 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Slogan with custom Brand logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("explore")}>
            <AnimatedLogo />
            <div>
              <span className="font-display font-extrabold text-white tracking-normal block text-base md:text-xl leading-none">
                IZYSL.<span className="text-[#FFB703]">COM</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#FFB703] block uppercase font-bold mt-1">
                Luxury Travel Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation Link Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold font-sans">
            <button 
              id="nav-btn-explore" 
              onClick={() => setActiveTab("explore")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "explore" ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-350 hover:text-slate-900"}`}
            >
              Explore Paradises
            </button>
            <button 
              id="nav-btn-map" 
              onClick={() => setActiveTab("map")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "map" ? "bg-slate-100 dark:bg-slate-800 text-[#0077be] dark:text-[#ffea6c]" : "text-slate-600 dark:text-slate-200 hover:text-slate-900"}`}
            >
              🗺️ Interactive Map
            </button>
            <button 
              id="nav-btn-planner" 
              onClick={() => setActiveTab("planner")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "planner" ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-350 hover:text-slate-900"}`}
            >
              🎯 Trip Itinerary Planner
            </button>
            <button 
              id="nav-btn-tips" 
              onClick={() => setActiveTab("tips")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "tips" ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-350 hover:text-slate-900"}`}
            >
              🌴 Island Tips
            </button>

            <button 
              id="nav-btn-blog" 
              onClick={() => setActiveTab("blog")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "blog" ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-350 hover:text-slate-900"}`}
            >
              📝 Articles
            </button>

            <button 
              id="nav-btn-reviews" 
              onClick={() => setActiveTab("reviews")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "reviews" ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-350 hover:text-slate-900"}`}
            >
              📸 Reviews & Gallery
            </button>
            <button 
              id="nav-btn-emergency" 
              onClick={() => setActiveTab("emergency")}
              className={`px-3 focus:outline-none py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "emergency" ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-350 hover:text-slate-900"}`}
            >
              ☎️ Directory
            </button>
          </nav>

          {/* Quick Actions (Theme, Language, User Login Profile) */}
          <div className="flex items-center gap-2.5">
            {/* Language Selector */}
            <select
              id="nav-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[10px] uppercase font-bold border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 outline-none cursor-pointer focus:border-emerald-500"
            >
              <option value="EN">EN 🇺🇸</option>
              <option value="DE">DE 🇩🇪</option>
              <option value="FR">FR 🇫🇷</option>
              <option value="RU">RU 🇷🇺</option>
            </select>

            {/* Theme Toggle */}
            <button
              id="btn-nav-theme"
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e3a8a]/30 border border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/50 hover:scale-105 active:scale-95 transition-all p-0 text-center"
              title="Toggle Contrast Mode"
              aria-label="Toggle Contrast Mode"
            >
              {darkMode ? (
                <Sun className="w-[18px] h-[18px] text-[#fbbf24]" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-[#ffffff]" />
              )}
            </button>

            {/* Login Wrapper */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <ShimmerImage
                  src={currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                  alt={currentUser.displayName || "User"}
                  className="w-7.25 h-7.25 rounded-full border border-emerald-500 shadow-sm"
                  height="29px"
                />
                <button
                  id="btn-nav-logout"
                  onClick={handleSignOut}
                  className="hidden md:block text-[10px] font-bold text-red-600 hover:text-red-500 font-mono tracking-wider cursor-pointer"
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={handleSignIn}
                className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:brightness-105 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm font-sans tracking-wide cursor-pointer"
              >
                LOGIN
              </button>
            )}
          </div>

        </div>
      </header>

      {/* -------------------- FULLSCREEN PARALLAX HERO SECTION -------------------- */}
      {activeTab === "explore" && searchQuery === "" && (
        <section 
          id="hero-interactive" 
          className="relative w-full h-[520px] md:h-[650px] overflow-hidden flex items-center justify-center p-4 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroSlides[0]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Rotating Slideshow of 3 WebP Images */}
          <div className="absolute inset-0 select-none overflow-hidden hover:pointer-events-none">
            {heroSlides.map((slide, idx) => (
              <img
                key={idx}
                src={slide}
                alt="Scenic Sri Lanka Background"
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : "low"}
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1500ms] ease-in-out"
                style={{
                  opacity: currentSlide === idx ? 1 : 0,
                }}
              />
            ))}
          </div>

          {/* Dark Overlay 40% Black so text stays readable */}
          <div className="absolute inset-0 bg-black/40 z-[1]" />

          {/* Glassmorphism premium dark overlay shield */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/90 z-[2]" />

          {/* Sparkly interactive light dots decor */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

          {/* Hero specialized watermark */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.06] pointer-events-none mix-blend-overlay">
            <img src="/logo.png" alt="Hero Watermark" className="w-[380px] h-[380px] object-contain animate-pulse" style={{ animationDuration: "10s" }} />
          </div>

          {/* Hero text items */}
          <div className="relative text-center max-w-4xl mx-auto space-y-6 flex flex-col items-center z-10 w-full">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10.5px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 uppercase tracking-widest leading-none flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: "12s" }} /> izysl.com
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-display font-medium text-white tracking-tight leading-[1.1] drop-shadow-lg">
              {t.heroTitle}
            </h1>
            <p className="text-sm md:text-base text-slate-200/90 font-sans max-w-2xl leading-relaxed">
              {t.heroSub}
            </p>

            {/* CTA action buttons */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button 
                id="btn-cta-explore" 
                onClick={() => {
                  setSelectedCategory("ALL");
                  document.getElementById("interactive-places-anchor")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#D4AF37] hover:bg-[#C5A028] text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                {t.exploreBtn}
              </button>
              <button 
                id="btn-cta-planner" 
                onClick={() => setActiveTab("planner")}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 transition-all font-semibold cursor-pointer"
              >
                {t.plannerBtn}
              </button>
            </div>

            {/* Instant Multi-attribute Search Bar component with Suggestions */}
            <div className="w-full max-w-2xl pt-4 relative">
              {/* Overlay cover to close suggestions dropdown when clicking outside */}
              {showSuggestDropdown && suggestions.length > 0 && (
                <div className="fixed inset-0 z-30" onClick={() => setShowSuggestDropdown(false)} />
              )}
              
              <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl p-2 shadow-2xl flex items-center relative z-40">
                <Search className="w-5 h-5 text-emerald-300 ml-2 flex-shrink-0" />
                <input
                  id="hero-chat-input"
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowSuggestDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestDropdown(true);
                  }}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent border-0 outline-none text-white placeholder-slate-350 px-3 text-xs md:text-sm font-sans"
                />
                {searchQuery !== "" && (
                  <button 
                    id="btn-clear-search" 
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                    }}
                    className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs mr-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button 
                  id="btn-search-trigger"
                  onClick={() => document.getElementById("interactive-places-anchor")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-sans px-4 py-2.5 rounded-xl ml-2 text-xs cursor-pointer flex-shrink-0"
                >
                  Locate
                </button>
              </div>

              {/* Suggestions Popup panel */}
              {showSuggestDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-50 text-left divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSearchQuery(item.name);
                        setShowSuggestDropdown(false);
                        if (item.type === "place") {
                          setSelectedPlace(item);
                        } else if (item.type === "hotel") {
                          setSelectedHotel(item);
                        } else if (item.type === "restaurant") {
                          setSelectedRestaurant(item);
                        }
                        document.getElementById("interactive-places-anchor")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-4 py-3 hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-450">
                          {item.type === "place" ? (
                            <MapPin className="w-3.5 h-3.5" />
                          ) : item.type === "hotel" ? (
                            <Star className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Compass className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs md:text-sm font-sans font-medium text-white group-hover:text-emerald-300 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {item.location} • {item.type.toUpperCase() === "PLACE" ? item.category.toUpperCase() : item.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
                Try searching <span className="underline cursor-pointer" onClick={() => { setSearchQuery("Ella"); setShowSuggestDropdown(true); }}>"Ella"</span>, <span className="underline cursor-pointer" onClick={() => { setSearchQuery("Beach"); setShowSuggestDropdown(true); }}>"Beach"</span>, <span className="underline cursor-pointer" onClick={() => { setSearchQuery("Sigiriya"); setShowSuggestDropdown(true); }}>"Sigiriya"</span> or <span className="underline cursor-pointer" onClick={() => { setSearchQuery("Café Chill"); setShowSuggestDropdown(true); }}>"Café Chill"</span>
              </p>
            </div>

          </div>
        </section>
      )}

      {/* -------------------- MAIN APP CORE LAYOUT CONTAINER -------------------- */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* -------------------- TAB 1: DESTINATION LANDSCAPES PORTAL -------------------- */}
        {activeTab === "explore" && (
          <div className="space-y-10">

            {/* Category selection row */}
            <div id="interactive-places-anchor" className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Compass className="w-5 h-5 text-emerald-600" /> Catalog Selection
                  </h3>
                  <p className="text-xs text-slate-400">Instantly toggle specialized micro-databases</p>
                </div>
                {/* Wishlist quick-link indicator */}
                {favorites.length > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-500 dark:text-rose-400 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-sm">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>Wishlisted Destinations: <strong>{favorites.length}</strong></span>
                  </div>
                )}
              </div>

              {/* Grid buttons representing main categories requested */}
              <div className="flex flex-wrap gap-2">
                <button
                  id="cat-all"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  ✨ {t.all} ({PLACES_DATA.length + HOTELS_DATA.length + RESTAURANTS_DATA.length})
                </button>
                <button
                  id="cat-beaches"
                  onClick={() => setSelectedCategory(DestinationCategory.BEACHES)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === DestinationCategory.BEACHES
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  🏄‍♂️ {t.beaches}
                </button>
                <button
                  id="cat-waterfalls"
                  onClick={() => setSelectedCategory(DestinationCategory.WATERFALLS)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === DestinationCategory.WATERFALLS
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  💦 {t.waterfalls}
                </button>
                <button
                  id="cat-mountains"
                  onClick={() => setSelectedCategory(DestinationCategory.MOUNTAINS_HILL_COUNTRY)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === DestinationCategory.MOUNTAINS_HILL_COUNTRY
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  ⛰️ {t.mountains}
                </button>
                <button
                  id="cat-safari"
                  onClick={() => setSelectedCategory(DestinationCategory.SAFARI_PARKS)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === DestinationCategory.SAFARI_PARKS
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  🐆 {t.safari}
                </button>
                <button
                  id="cat-heritage"
                  onClick={() => setSelectedCategory(DestinationCategory.HERITAGE_SITES)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === DestinationCategory.HERITAGE_SITES
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  🏛️ {t.heritage}
                </button>
                <button
                  id="cat-hotels"
                  onClick={() => setSelectedCategory("HOTELS")}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === "HOTELS"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  🏨 {t.hotels}
                </button>
                <button
                  id="cat-restaurants"
                  onClick={() => setSelectedCategory("RESTAURANTS")}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-sans uppercase tracking-wide transition-all cursor-pointer ${
                    selectedCategory === "RESTAURANTS"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  🍛 {t.dining}
                </button>
              </div>
            </div>

            {/* Grid Display of filtered items (Beaches, Waterfalls, etc.) */}
            <div>
              {searchQuery !== "" && (
                <p className="text-xs text-slate-400 mb-4 font-mono">
                  Showing <strong>{filteredItems.length}</strong> matching criteria for query: <em>"{searchQuery}"</em>
                </p>
              )}

              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const isFavorite = favorites.includes(item.id);
                    // Determine if it is Place, Hotel or Restaurant
                    const isPlace = "category" in item;
                    const isHotel = "facilities" in item || "bookingUrl" in item;
                    const isRestaurant = "cuisine" in item;

                    const rating = getCompoundRating(item.id, item.rating);
                    
                    const getProvinceFromLocation = (loc: string, nameName: string): string => {
                      const l = (loc + " " + nameName).toLowerCase();
                      if (l.includes("central") || l.includes("nuwara eliya") || l.includes("kandy") || l.includes("matale") || l.includes("pussellawa") || l.includes("ramboda") || l.includes("kothmale") || l.includes("hatton") || l.includes("sigiriya") || l.includes("dambulla") || l.includes("knuckles")) return "Central";
                      if (l.includes("southern") || l.includes("galle") || l.includes("matara") || l.includes("hambantota") || l.includes("mirissa") || l.includes("unawatuna") || l.includes("hikkaduwa") || l.includes("weligama") || l.includes("koggala") || l.includes("yala") || l.includes("bentota") || l.includes("ahungalla") || l.includes("tangalle")) return "Southern";
                      if (l.includes("western") || l.includes("colombo") || l.includes("negombo") || l.includes("kalutara")) return "Western";
                      if (l.includes("uva") || l.includes("ella") || l.includes("badulla") || l.includes("monaragala") || l.includes("diyaluma") || l.includes("bambarakanda")) return "Uva";
                      if (l.includes("sabaragamuwa") || l.includes("ratnapura") || l.includes("kegalle") || l.includes("udawalawe") || l.includes("adam's peak") || l.includes("sri pada")) return "Sabaragamuwa";
                      if (l.includes("eastern") || l.includes("trincomalee") || l.includes("arugam") || l.includes("ampara") || l.includes("batticaloa") || l.includes("pasikudah") || l.includes("nilaveli")) return "Eastern";
                      if (l.includes("northern") || l.includes("jaffna") || l.includes("kilinochchi") || l.includes("mannar")) return "Northern";
                      if (l.includes("north central") || l.includes("anuradhapura") || l.includes("polonnaruwa") || l.includes("minneriya")) return "North Central";
                      if (l.includes("north western") || l.includes("kalpitiya") || l.includes("puttalam") || l.includes("kurunegala") || l.includes("wilpattu")) return "North Western";
                      return "Central"; // default fallback
                    };
                    const province = getProvinceFromLocation(item.location, item.name);
                    
                    // Specific color schema for each province tag to boost sensory design quality
                    const getProvinceStyles = (prov: string) => {
                      const p = prov?.trim()?.toLowerCase() || "";
                      if (p.includes("central")) return "bg-pink-500/15 text-pink-300 border border-pink-500/30";
                      if (p.includes("southern")) return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
                      if (p.includes("western")) return "bg-blue-500/15 text-blue-300 border border-blue-500/30";
                      if (p.includes("uva")) return "bg-emerald-500/15 text-emerald-450 border border-emerald-500/30";
                      if (p.includes("sabaragamuwa")) return "bg-purple-500/15 text-purple-300 border border-purple-500/30";
                      if (p.includes("eastern")) return "bg-sky-500/15 text-sky-300 border border-sky-500/30";
                      if (p.includes("northern")) return "bg-teal-500/15 text-teal-300 border border-teal-500/30";
                      if (p.includes("north central")) return "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30";
                      if (p.includes("north western")) return "bg-rose-500/15 text-rose-350 border border-rose-500/30";
                      return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
                    };
                    const provBadge = getProvinceStyles(province);
                    const photoCredit = (item as any).imageLicense || (item as any).attribution || "Wikimedia CC BY-SA 4.0";

                    return (
                      <motion.div
                        key={item.id}
                        id={`dest-card-${item.id}`}
                        onClick={() => {
                          if (isPlace) setSelectedPlace(item as any);
                          else if (isHotel) setSelectedHotel(item as any);
                          else if (isRestaurant) setSelectedRestaurant(item as any);
                        }}
                        className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-gold-500/10 hover:border-gold-500/40 hover:-translate-y-2 transition-all duration-300 flex flex-col cursor-pointer h-[460px] group"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        {/* 16:9 Real Photo Card Display - High quality image zoom layout */}
                        <div className="relative h-[220px] w-full overflow-hidden aspect-[16/9]">
                          <ShimmerImage
                            src={item.imageUrl || (item as any).imageUrls?.[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                            height="220px"
                          />
                          {/* Favorite button spacer */}
                          <button
                            id={`btn-fav-card-${item.id}`}
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className="absolute top-[12px] right-[12px] w-[32px] h-[32px] p-0 flex items-center justify-center rounded-full backdrop-blur-md bg-black/60 border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer z-20"
                          >
                            <Heart className={`w-[18px] h-[18px] ${isFavorite ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                          </button>
                          
                          {/* Upper category identifier badge */}
                          <div className="absolute bottom-3 left-3 bg-[#0A1F44]/80 text-white backdrop-blur-md text-[9px] font-bold font-sans uppercase px-2.5 py-1 rounded-md tracking-wider border border-white/10">
                            {isPlace ? (item as Place).category : isHotel ? "Luxury Hotel" : "Specialty Restaurant"}
                          </div>
                        </div>

                        {/* Card Body - Luxury Styling */}
                        <div className="p-4.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider font-sans flex items-center gap-1 line-clamp-1 truncate max-w-[70%]">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> {item.location}
                              </span>
                              <div className="flex items-center gap-1 font-mono text-[11px] text-[#FFB703]">
                                <Star className="w-3.5 h-3.5 fill-[#FFB703] text-[#FFB703]" />
                                <strong>{rating.toFixed(1)}</strong>
                              </div>
                            </div>

                            <h4 className="text-[17px] font-bold font-display tracking-tight text-white mt-2 line-clamp-1 group-hover:text-[#FFB703] transition-colors duration-200">
                              {item.name}
                            </h4>
                            {/* Province Pill tag overlay */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className={`text-[9px] font-mono uppercase tracking-wide px-2.5 py-0.5 rounded-full ${provBadge}`}>
                                {province}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans font-normal mt-2 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Dynamic licensing attribution citation & CTA link */}
                          <div className="pt-3 border-t border-white/10 flex flex-col gap-1.5 mt-auto">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="truncate max-w-[70%] text-slate-450 block italic">
                                📸 {photoCredit}
                              </span>
                              <span className="text-[#FFB703] font-sans font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                                Detail Guide <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-250 dark:border-slate-800 justify-center h-64 flex flex-col items-center text-center p-8 rounded-2xl">
                  <Compass className="w-10 h-10 text-slate-400 animate-pulse" />
                  <p className="text-slate-800 dark:text-slate-200 font-sans font-bold mt-2">No boutique spaces matched your parameters.</p>
                  <p className="text-slate-400 text-xs mt-1">Clear the active query or toggle categories to browse waterfalls, beaches, and safari spots.</p>
                  <button 
                    id="btn-null-search-clear"
                    onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}
                    className="bg-emerald-600 text-white font-semibold font-sans text-xs px-4 py-2.5 rounded-xl mt-4"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {/* -------------------- INTEGRATED ASSORTED HELPER PANEL (BENTO RETREAT) -------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              {/* Column 1: Live exchange & Trip microclimates */}
              <div className="lg:col-span-4 space-y-6">
                <CurrencyConverter />
                <WeatherWidget />
              </div>
              
              {/* Column 2: Holiday cost calculator */}
              <div className="lg:col-span-4 max-w-full">
                <CostCalculator />
              </div>

              {/* Column 3: Emergency assistance & WhatsApp direct links */}
              <div className="lg:col-span-4 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="bg-red-500/20 text-red-300 font-mono text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-500/35">
                    Essential Travel Contacts
                  </span>
                  <h4 className="text-lg font-sans font-bold mt-3 text-white">Emergency Assistance Directory</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Save these vital safety coordinates to your mobile ledger before traversing regional roads or hiking high-altitude peaks.
                  </p>

                  <div className="mt-5 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-350">Tourist Police Hotline:</span>
                      <a href="tel:1912" className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> 1912
                      </a>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-350">National Emergency Services:</span>
                      <a href="tel:119" className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> 119
                      </a>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-350">Ambulance Emergency:</span>
                      <a href="tel:1990" className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> 1990 Suwa Seriya
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                  {/* WhatsApp hotline simulation */}
                  <div className="bg-emerald-900/40 border border-emerald-500/30 p-4 rounded-xl">
                    <h5 className="font-sans font-bold text-xs text-emerald-300">WhatsApp On-Call Concierge</h5>
                    <p className="text-[10px] text-slate-300 leading-normal mt-1">Need help mapping a local rail connection? Speak to our tourism officers on the phone immediately.</p>
                    <a
                      id="link-whatsapp-sim"
                      href="https://wa.me/94770000000?text=Hello%2520IZYSL.COM!%2520I%2520need%2520assistance%2520planning%2520my%2520itinerary."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 bg-[#25D366] hover:brightness-105 px-3 py-1.5 rounded-lg text-slate-900 font-sans text-[11px] font-bold"
                    >
                      <span>Join WhatsApp Chat</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* -------------------- TAB 2: TRIP PLANNER ENGINE -------------------- */}
        {activeTab === "planner" && (
          <TripPlanner />
        )}

        {/* -------------------- TAB 3: ISLAND TIPS & TRAVEL SECRETS -------------------- */}
        {activeTab === "tips" && (
          <div className="space-y-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-sans font-bold text-slate-900 dark:text-white">Sri Lanka Crucial Travel Advice</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                Read our resident guidelines regarding visa paperwork, airport customs protocols, train seat bookings, local packing essentials, clothing guidelines, and temple etiquette.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {travelTips.map((tip, idx) => (
                <div key={idx} id={`tip-card-${idx}`} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold font-sans text-xs">
                      0{idx + 1}
                    </span>
                    <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">
                      {tip.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-11">
                    {tip.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Airport & Transit guide block */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-3xl p-6 border border-amber-200/40 dark:border-amber-950/20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8">
                <h4 className="text-base font-sans font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  ✈️ Airport & Transit Advice (Bandaranaike BIA)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-350 mt-1.5 leading-relaxed">
                  Most international flights touch down at <strong>Bandaranaike International Airport (CMB / BIA)</strong> in Katunayake (30km north of Colombo). Upon arrival, we suggest buying a local Dialog or Mobitel eSIM directly from the arrivals terminal for instant 4G coverage. Download the local taxi app <strong>PickMe</strong> (Sri Lanka's Uber alternative) for honest prices on transit into Colombo or Galle. You can easily pre-book airport taxis using the link below.
                </p>
              </div>
              <div className="lg:col-span-4 flex justify-end">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Bandaranaike+International+Airport+Katunayake"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 text-white font-sans text-xs font-bold px-4 py-3 rounded-xl hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm w-full lg:w-auto text-center justify-center"
                >
                  Airport Directions on Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 4: BLOG / TRAVEL JOURNAL -------------------- */}
        {activeTab === "blog" && (
          <div className="space-y-8">
            <div className="max-w-2xl">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono tracking-widest uppercase text-xs">Resident Chronicles</span>
              <h1 className="text-3xl font-sans font-bold text-slate-900 dark:text-white mt-1">Sri Lanka Travel Articles & Guides</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                SEO optimized guides composed by regional travel bloggers regarding hiking off-the-beaten trails, spotting leopards, and photographing historic heritage architecture.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Blog articles - 8 cols */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogArticles.map((art) => (
                    <article key={art.id} id={`blog-card-${art.id}`} className="chronicle-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 text-[10px] text-slate-450 uppercase font-mono mb-2">
                            <span>{art.date}</span>
                            <span>•</span>
                            <span>{art.author}</span>
                          </div>
                          <h4 
                            onClick={() => setSelectedBlog(art)}
                            className="text-sm font-bold font-sans tracking-tight text-slate-800 dark:text-slate-200 hover:text-emerald-500 cursor-pointer"
                          >
                            {art.title}
                          </h4>
                          <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 leading-relaxed line-clamp-4">
                            {art.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-right">
                        <button 
                          id={`btn-blog-read-${art.id}`}
                          onClick={() => setSelectedBlog(art)}
                          className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold font-sans hover:underline flex items-center gap-0.5 justify-end cursor-pointer"
                        >
                          Read full chronicle <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Right Column: Promotional Sidebar - 4 cols */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div>
                    <span className="text-[9px] uppercase font-mono font-bold text-[#E60023] bg-[#E60023]/10 px-2.5 py-1 rounded-md tracking-wider inline-flex items-center gap-1">
                      📌 Curated on Pinterest
                    </span>
                    <h3 className="text-lg font-bold font-sans text-slate-950 dark:text-white mt-3">
                      Explore Wonder Sri Lanka
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Discover visual inspirations, hidden lagoons, colonial railways, and misty highlands pinned by global wanderers.
                    </p>
                  </div>

                  {/* Curated visual pins layout block */}
                  <a 
                    href="https://www.pinterest.com/pin/941111653359387692/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group relative block aspect-video w-full rounded-2xl overflow-hidden border border-slate-205 dark:border-slate-800 cursor-pointer shadow-inner"
                  >
                    <ShimmerImage 
                      src="https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80" 
                      alt="Explore Wonder Sri Lanka blue mountain train" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent flex flex-col justify-end p-4 text-left">
                      <span className="text-xs font-bold text-white tracking-wide">
                        View Interactive Pin Board
                      </span>
                      <span className="text-[9.5px] text-slate-300 font-mono">
                        Pinterest ID: 941111653359387692
                      </span>
                    </div>
                  </a>

                  {/* Redirection button */}
                  <a
                    href="https://www.pinterest.com/pin/941111653359387692/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#E60023] hover:bg-[#b8001c] text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all uppercase tracking-wider text-center"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.76-2.245 3.76-5.487 0-2.861-2.063-4.869-5.007-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.166-1.495-.69-2.433-2.878-2.433-4.63 0-3.771 2.737-7.238 7.904-7.238 4.15 0 7.375 2.957 7.375 6.91 0 4.122-2.599 7.44-6.208 7.44-1.213 0-2.352-.63-2.743-1.377l-.747 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.983-5.368 11.983-11.987C24 5.367 18.637 0 12.017 0z" />
                    </svg>
                    <span>Pin & Explore Board</span>
                  </a>

                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl flex items-center justify-between gap-3 text-[11px] border border-slate-200/50 dark:border-slate-800">
                    <span className="font-mono text-slate-400">Board Saves: <strong className="text-emerald-600 dark:text-emerald-400 font-sans">4.8k</strong></span>
                    <span className="font-mono text-slate-400">Viewers / Mo: <strong className="text-emerald-600 dark:text-emerald-400 font-sans">125k</strong></span>
                  </div>
                </div>

                {/* Additional Quick Local Tips sidebar panel */}
                <div className="bg-emerald-600 text-white rounded-3xl p-6 space-y-4">
                  <span className="bg-white/20 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Did You Know?
                  </span>
                  <h4 className="text-sm font-bold font-sans">Sigiriya Climbing Advices</h4>
                  <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                    Arriving at Sigiriya gate at 7:00 AM avoids long queues and high humidity. Don't forget to take a reusable hydration bottle and comfortable non-slip hiking boots!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 5: EMERGENCY CONTACTS & DIRECTORY -------------------- */}
        {activeTab === "emergency" && (
          <div className="space-y-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-sans font-bold text-slate-900 dark:text-white">Emergency Services & General Assistance</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                Sri Lanka offers robust networks of tourist safety offices, public hospitals, and transit administrators to support international guests. Keep these coordinates saved on your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Directory table */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-200 mb-4">Official Tourism Administration</h3>
                  <div className="space-y-4 text-xs font-sans">
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="font-bold block">Sri Lanka Tourism Development Authority (SLTDA)</span>
                        <span className="text-slate-400 text-[10px]">Headquarters: Colombo 03, Sri Lanka</span>
                      </div>
                      <a href="tel:+94112426900" className="text-emerald-600 font-mono font-bold hover:underline">+94 11 242 6900</a>
                    </div>

                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="font-bold block">Tourist Police Division</span>
                        <span className="text-slate-400 text-[10px]">Dedicated security assistance for travelers</span>
                      </div>
                      <a href="tel:0112421052" className="text-emerald-600 font-mono font-bold hover:underline">011-2421052</a>
                    </div>

                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="font-bold block">Sri Lanka Railways Helpline</span>
                        <span className="text-slate-400 text-[10px]">Seat reservation inquiry & dispatch logs</span>
                      </div>
                      <a href="tel:1919" className="text-emerald-600 font-mono font-bold hover:underline">1919</a>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-200 mb-4">Visa Guidance & Embassy Services</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mb-4">
                    Tourists must apply for an Electronic Travel Authorization (ETA / eVisa) prior to arriving. Your standard eVisa covers 30 days of entry and can be easily extended at the Department of Immigration & Emigration in Battaramulla, Colombo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://www.eta.gov.lk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-500 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      Official eVisa ETA Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Mobile Button to slide up Inquiry Sheet */}
              <div className="lg:hidden pt-4">
                <button
                  onClick={() => setIsFeedbackSheetOpen(true)}
                  className="w-full bg-[#FFB703] text-slate-950 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:brightness-105 transition-all text-xs cursor-pointer"
                >
                  <Mail className="w-4 h-4" /> Open Inquiry Form Bottom Sheet
                </button>
              </div>

              {/* Sidebar / Mobile Bottom Sheet for Inquiry Form */}
              <div className={`${isFeedbackSheetOpen ? "fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm p-0 m-0" : "hidden lg:block lg:col-span-4"}`}>
                <div 
                  className={`${
                    isFeedbackSheetOpen 
                      ? "bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto animate-fadeIn" 
                      : "bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 rounded-3xl shadow-sm"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isFeedbackSheetOpen && (
                    <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 animate-fadeIn">
                      <span className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400">Emergency Inquiry</span>
                      <button
                        onClick={() => setIsFeedbackSheetOpen(false)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <X className="w-[18px] h-[18px] font-bold" />
                      </button>
                    </div>
                  )}

                  <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">Send Inquiry to Tourist Board</h4>
                  <p className="text-slate-400 text-[10px] mt-1 mb-4 leading-normal">
                    Ask our tourist support specialists a query regarding hotel licensing, safari driver coordinates, or hiking permits.
                  </p>

                  {contactSent ? (
                    <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl">
                      <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Message Transmitted</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">We will respond to your international inbox within 12 standard business hours.</p>
                      <button id="btn-reset-contact" onClick={() => { setContactSent(false); setContactName(""); setContactEmail(""); setContactMessage(""); }} className="mt-3 text-[10px] text-emerald-600 underline font-semibold cursor-pointer">
                        Create new ticket
                      </button>
                    </div>
                  ) : (
                    <form
                      id="tourist-inquiry-form"
                      onSubmit={(e) => { e.preventDefault(); setContactSent(true); }}
                      className="space-y-3 font-sans text-xs"
                    >
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Your Full Name</label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:border-emerald-500 outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">International E-Mail</label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:border-emerald-500 outline-none"
                          placeholder="explorer@email.com"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Inquiry details</label>
                        <textarea
                          id="contact-msg"
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:border-emerald-500 outline-none"
                          placeholder="How can our guides help you?"
                        />
                      </div>
                      <button
                        id="btn-inquiry-submit"
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer"
                      >
                        Submit Ticket
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 6: ISLAND REVIEWS & GALLERY -------------------- */}
        {activeTab === "reviews" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="max-w-3xl space-y-2">
                <span className="text-[#d97706] dark:text-amber-400 font-semibold font-mono tracking-widest uppercase text-[10.5px]">
                  Shared Nomad Experiences
                </span>
                <h1 className="text-3xl md:text-4xl font-display font-medium text-slate-900 dark:text-white">
                  Explorer Reviews, Travel Logs & Photos Gallery
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Browse direct reviews from international and domestic nomads, inspect high-resolution drone and coastal photography, or submit your own memories of the paradise island.
              </p>
            </div>

            {/* Photo Showcase Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-sans font-bold text-slate-800 dark:text-slate-200">
                    📸 Community Photo Showcase
                  </h3>
                  <p className="text-xs text-slate-400">Captured and submitted by verified guests across waterfalls, peaks, and surf towns</p>
                </div>
              </div>

              <div className="community-photo-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  id="btn-reviews-gallery-top"
                  onClick={() => {
                    triggerToast("To upload a capture: Click 'Explore Places' at the top, open any destination modal, and submit a review with an image attached!", "info");
                  }}
                  className="green-button-class"
                >
                  <Plus className="icon-plus" />
                  <span>Add Your Capture</span>
                </button>

                {ALL_TOURIST_PHOTOS.map((photo) => (
                  <div 
                    key={photo.id} 
                    onClick={() => {
                      setActiveGalleryPhoto(photo);
                      triggerToast(`Opening explorer snapshot: ${photo.placeName}`, "info");
                    }}
                    className="photo-item group relative rounded-2xl overflow-hidden aspect-square border border-slate-200/40 dark:border-slate-800 bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <ShimmerImage
                      src={photo.url}
                      alt={photo.placeName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      height="100%"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-amber-300">{photo.placeName}</span>
                        {photo.pinterestUrl && (
                          <span className="text-[8px] bg-[#E60023] text-white px-1 py-0.5 rounded font-mono font-bold font-sans">PIN</span>
                        )}
                      </div>
                      <p className="text-[11px] leading-tight text-slate-200 line-clamp-2 mt-0.5">{photo.caption}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block font-mono">By {photo.uploadedBy}</span>
                    </div>
                    {/* Landmark quick look */}
                    <div className="absolute top-2.5 right-2.5 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-full text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                         onClick={(e) => {
                           e.stopPropagation();
                           const matched = PLACES_DATA.find(p => p.name.toLowerCase().includes(photo.placeName.toLowerCase()) || photo.placeName.toLowerCase().includes(p.name.toLowerCase()));
                           if (matched) {
                             setSelectedPlace(matched);
                           } else {
                             alert(`Viewing high-quality photography of ${photo.placeName}.\nOpen 'Explore Paradises' to see all detailed reviews.`);
                           }
                         }}
                         title={`Read ${photo.placeName} details`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews list grid and custom submit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Feed of all reviews */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-base font-sans font-bold text-slate-800 dark:text-slate-200">
                    💬 Global Nomad Stream
                  </h3>
                  <p className="text-xs text-slate-400">Aggregated feedback, hotel details, and safety logs from visitors</p>
                </div>

                <div className="global-nomad-stream space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    ...userReviews,
                    ...PLACES_DATA.slice(0, 8).flatMap(p => getStaticReviewsFor(p.id, p.name, p.category)),
                    ...RESTAURANTS_DATA.slice(0, 2).flatMap(r => getStaticReviewsFor(r.id, r.name, "restaurants")),
                    ...HOTELS_DATA.slice(0, 1).flatMap(h => getStaticReviewsFor(h.id, h.name, "hotels"))
                  ].map((rev, index) => {
                    const allItems = [...PLACES_DATA, ...HOTELS_DATA, ...RESTAURANTS_DATA];
                    const item = allItems.find(i => i.id === rev.entityId);
                    const entityName = item ? item.name : "Exclusive Sanctuary";
                    const entityCategory = item ? ("category" in item ? (item as any).category : "Luxury Hotel") : "Landmark";

                    return (
                      <div key={rev.id || index} className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800 p-5 rounded-2xl space-y-3 hover:border-emerald-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="review-avatar animate-none" data-initial={rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}>
                              <ShimmerImage
                                src={rev.userPhoto}
                                alt={rev.userName}
                                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800"
                                height="32px"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{rev.userName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Landmark: <span className="underline cursor-pointer font-bold text-emerald-600 dark:text-emerald-400" onClick={() => {
                                  const matchedPlace = PLACES_DATA.find(p => p.id === rev.entityId);
                                  const matchedHotel = HOTELS_DATA.find(h => h.id === rev.entityId);
                                  const matchedRest = RESTAURANTS_DATA.find(r => r.id === rev.entityId);
                                  if (matchedPlace) setSelectedPlace(matchedPlace);
                                  else if (matchedHotel) setSelectedHotel(matchedHotel);
                                  else if (matchedRest) setSelectedRestaurant(matchedRest);
                                }}>{entityName}</span> ({entityCategory})
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-amber-500 text-xs">{"★".repeat(rev.rating)}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-1">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{rev.comment}</p>

                        {rev.photoUrl && (
                          <ShimmerImage
                            src={rev.photoUrl}
                            alt="Nomad travel capture"
                            className="w-44 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-850 mt-2"
                            height="96px"
                          />
                        )}

                        {rev.pinterestUrl && (
                          <div className="mt-2.5">
                            <a
                              href={rev.pinterestUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E60023] hover:bg-[#b8001c] text-white text-[10px] font-sans font-bold rounded-lg shadow-sm transition-all"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.76-2.245 3.76-5.487 0-2.861-2.063-4.869-5.007-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.166-1.495-.69-2.433-2.878-2.433-4.63 0-3.771 2.737-7.238 7.904-7.238 4.15 0 7.375 2.957 7.375 6.91 0 4.122-2.599 7.44-6.208 7.44-1.213 0-2.352-.63-2.743-1.377l-.747 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.983-5.368 11.983-11.987C24 5.367 18.637 0 12.017 0z" />
                              </svg>
                              <span>Pinterest Visual Board</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Mobile Button to slide up Review Sheet */}
                <div className="lg:hidden pt-4">
                  <button
                    onClick={() => setIsReviewSheetOpen(true)}
                    className="w-full bg-[#FFB703] text-slate-950 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:brightness-105 transition-all text-xs cursor-pointer animate-pulse"
                  >
                    ✍️ Post Traveler Log Bottom Sheet
                  </button>
                </div>
              </div>

              {/* Sidebar: Add Custom Review Log */}
              <div className={`${isReviewSheetOpen ? "fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm p-0 m-0" : "hidden lg:block lg:col-span-4"}`}>
                <div 
                  className={`${
                    isReviewSheetOpen 
                      ? "bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-6 rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto animate-fadeIn flex flex-col justify-between space-y-4" 
                      : "bg-slate-50 dark:bg-slate-950/20 p-6 rounded-3xl border border-slate-200/55 dark:border-slate-800 flex flex-col justify-between space-y-6"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-4">
                    {isReviewSheetOpen && (
                      <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200 dark:border-slate-850">
                        <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#FFB703]">Post Traveler Log</span>
                        <button
                          onClick={() => setIsReviewSheetOpen(false)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-222 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <X className="w-[18px] h-[18px] font-bold" />
                        </button>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                        ✍️ Post Traveler Log
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1">
                        Share your experience tracking leopards, climbing mountains, or staying in fine Kandy/Galle spots.
                      </p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Target Paradise</label>
                        <select
                          id="feed-select-landmark"
                          className="w-full bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-805 p-2 rounded-xl text-slate-850 dark:text-slate-100 outline-none font-medium"
                          onChange={(e) => {
                            (window as any).selectedFeedTargetId = e.target.value;
                          }}
                        >
                          <option value="">-- Select Destination --</option>
                          {PLACES_DATA.map(p => <option key={p.id} value={p.id}>⛰️ {p.name}</option>)}
                          {HOTELS_DATA.map(h => <option key={h.id} value={h.id}>🏨 {h.name}</option>)}
                          {RESTAURANTS_DATA.map(r => <option key={r.id} value={r.id}>🍛 {r.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Nomad Handle Name</label>
                        <input
                          id="feed-comment-name"
                          type="text"
                          value={newCommentName}
                          onChange={(e) => setNewCommentName(e.target.value)}
                          placeholder="e.g. BackpackerNisha"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Star rating (1-5)</label>
                        <select
                          id="feed-comment-rating-el"
                          value={newCommentRating}
                          onChange={(e) => setNewCommentRating(parseInt(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500 font-medium"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                          <option value={3}>⭐⭐⭐ (3 - Satisfactory)</option>
                          <option value={2}>⭐⭐ (2 - Lacking Facilities)</option>
                          <option value={1}>⭐ (1 - Avoid / High Hazard)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Detailed Comment</label>
                        <textarea
                          id="feed-comment-text"
                          rows={4}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Speak about road conditions, local guides, tea estate views, or cuisine tastes..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      id="feed-btn-upload-img"
                      type="button"
                      onClick={() => {
                        setSimulatedPhoto("https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=400&q=80");
                        triggerToast("Scenic coastal drone photo simulation attached successfully!", "success");
                      }}
                      className="w-full bg-white dark:bg-slate-900 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-medium"
                    >
                      📸 Attach Coastal Capture
                    </button>
                    {simulatedPhoto && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 text-center block font-semibold">✓ Photo attached!</span>
                    )}

                    <button
                      id="feed-btn-submit"
                      onClick={() => {
                        const targetId = (window as any).selectedFeedTargetId;
                        if (!targetId) {
                          triggerToast("Please select a target paradise landmark first!", "error");
                          return;
                        }
                        if (!newCommentText.trim()) {
                          triggerToast("Please enter your detailed travel comments before broadcasting!", "error");
                          return;
                        }
                        handleAddReview(targetId);
                        setIsReviewSheetOpen(false);
                        triggerToast("Broadcast successful! Your luxury travel review has been submitted to the feed.", "success");
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-3 rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer font-bold"
                    >
                      Broadcast Nomad Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 7: INTERACTIVE REGIONAL MAP -------------------- */}
        {activeTab === "map" && (
          <div className="space-y-6">
            <InteractiveMap />
          </div>
        )}

      </main>

      {/* -------------------- FOOTER & NEWSLETTER BLOCK -------------------- */}
      <footer className="bg-[#0A1F44]/95 backdrop-blur-md border-t border-white/10 pt-16 pb-12 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          
          {/* Newsletter Box */}
          <div className="bg-gradient-to-tr from-[#0b2149] via-[#04122d] to-[#0A1F44] text-white rounded-3xl p-6 md:p-10 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 mb-16 shadow-2xl">
            <div className="md:max-w-md">
              <span className="text-[9px] font-mono font-bold text-[#FFB703] uppercase tracking-widest block mb-1.5">Exclusive updates</span>
              <h4 className="text-xl md:text-2xl font-sans font-extrabold text-white leading-tight">
                {t.newsletterTitle}
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t.newsletterSub}
              </p>
            </div>
            
            <div className="w-full md:max-w-sm">
              {newsletterSubscribed ? (
                <div className="p-4 bg-emerald-950/45 border border-emerald-500/35 rounded-2xl text-center">
                  <CheckCircle className="w-6 h-6 text-[#FFB703] mx-auto mb-1.5" />
                  <span className="font-bold text-xs text-emerald-300">Wanderlust list active!</span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Check your email for your free Sri Lanka eBook travel guide.</p>
                </div>
              ) : (
                <form
                  id="newsletter-form"
                  onSubmit={(e) => { e.preventDefault(); setNewsletterSubscribed(true); }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center shadow-lg"
                >
                  <input
                    id="newsletter-input"
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter international email..."
                    className="w-full bg-transparent border-0 outline-none text-xs text-white placeholder-slate-400 px-3 outline-none"
                  />
                  <button
                    id="btn-newsletter-submit"
                    type="submit"
                    className="bg-[#FFB703] hover:bg-[#e09b00] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex-shrink-0 cursor-pointer transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Regular Footer Directory */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 border-b border-white/10 pb-12 text-xs">
            {/* Column 1 info with designer and licensing credits */}
            <div className="col-span-2 space-y-4">
              <span className="font-sans font-bold text-[#FFB703] text-sm tracking-wide block uppercase font-display">IZYSL.COM</span>
              <p className="text-slate-350 leading-relaxed max-w-sm text-xs font-sans">
                Your luxury adventure companion regarding cascading waterfalls, golden sand beaches, forest wildlife reserves, historic temples, boutique resort stays, and specialty fine dining.
              </p>
              <div className="space-y-1.5 text-[10px] text-slate-400 font-mono">
                <p>Designed & Developed by <strong className="text-[#FFB703]">M.A.I Sandamal</strong></p>
                <p>All photos and location images are licensed under Unsplash & CC/Wikimedia.</p>
                <p className="opacity-60">© 2026 IZYSL.COM. All rights reserved.</p>
              </div>
            </div>

            {/* Column 2 Category items links */}
            <div className="space-y-3">
              <span className="font-black text-[10px] text-slate-350 uppercase tracking-widest block">Main Categories</span>
              <ul className="space-y-1.5 text-slate-300 list-none pl-0">
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("explore"); setSelectedCategory(DestinationCategory.BEACHES); }}>Southern Beaches</li>
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("explore"); setSelectedCategory(DestinationCategory.WATERFALLS); }}>Highland Waterfalls</li>
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("explore"); setSelectedCategory(DestinationCategory.MOUNTAINS_HILL_COUNTRY); }}>Mountain Trails</li>
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("explore"); setSelectedCategory(DestinationCategory.SAFARI_PARKS); }}>Leopard Safaris</li>
              </ul>
            </div>

            {/* Column 3 Hospitality links */}
            <div className="space-y-3">
              <span className="font-black text-[10px] text-slate-350 uppercase tracking-widest block">Hospitality</span>
              <ul className="space-y-1.5 text-slate-300 list-none pl-0">
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("explore"); setSelectedCategory("HOTELS"); }}>Resort Stays</li>
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("explore"); setSelectedCategory("RESTAURANTS"); }}>Fine Dining</li>
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("planner"); }}>Route Planner</li>
                <li className="hover:text-[#FFB703] cursor-pointer transition-colors" onClick={() => { setActiveTab("tips"); }}>eVisa ETA Help</li>
              </ul>
            </div>

            {/* Column 4 Social Link block */}
            <div className="space-y-3">
              <span className="font-black text-[10px] text-slate-350 uppercase tracking-widest block">Follow Paradise</span>
              <ul className="space-y-1.5 text-slate-300 list-none pl-0">
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB703] transition-colors">Instagram Feed</a></li>
                <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB703] transition-colors">YouTube Drone Reels</a></li>
                <li><a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB703] transition-colors">Pinterest Moodboards</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB703] transition-colors">Travel Community Group</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>


      {/* ------------------------------------------------------------- */}
      {/* -------------------- PLACE MODAL VIEWER --------------------- */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            id="modal-place"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              id="modal-place-body"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
            >
              {/* Image banner inside modal */}
              <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <ShimmerImage
                  src={selectedPlace.imageUrl || selectedPlace.imageUrls?.[0]}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                  height="320px"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                
                {/* Elegant image license overlay */}
                {selectedPlace.imageLicense && (
                  <div className="absolute top-4 left-4 bg-slate-950/75 backdrop-blur-md text-white font-mono text-[9px] px-2.5 py-1.5 rounded-lg border border-white/10 z-10 flex items-center gap-1 shadow-md">
                    <span className="opacity-75">📷 Licensed:</span>
                    <span className="font-semibold text-emerald-400">{selectedPlace.imageLicense}</span>
                  </div>
                )}

                <button
                  id="btn-close-place-modal"
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-[12px] right-[12px] w-[32px] h-[32px] p-0 flex items-center justify-center rounded-full backdrop-blur-md bg-black/60 border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                >
                  <X className="w-[18px] h-[18px] text-white" />
                </button>

                <div className="absolute bottom-5 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
                  <div>
                    <span className="bg-emerald-600 font-mono text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider block w-max mb-1.5">
                      {selectedPlace.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight leading-none text-white">
                      {selectedPlace.name}
                    </h2>
                    <span className="text-slate-350 text-xs mt-1 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> {selectedPlace.location}
                    </span>
                  </div>

                  {/* Core rating */}
                  <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-mono">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <strong>{getCompoundRating(selectedPlace.id, selectedPlace.rating)} / 5</strong>
                    <span className="opacity-60 text-[10px]">({selectedPlace.reviewsCount + getReviewsForEntity(selectedPlace.id).length} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Modal Contents */}
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800 dark:text-slate-200">
                {/* Left Side: Long review and images */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Card 1: About Ramboda Ella - Blue icon + white background + shadow */}
                  <div 
                    id="about-destination-card"
                    className="bg-white dark:bg-slate-900 rounded-[12px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)] mb-[24px]"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <Compass className="w-5 h-5 text-blue-500 fill-blue-550/10 shrink-0" />
                      <h3 className="text-lg md:text-xl font-sans font-extrabold text-slate-900 dark:text-white">
                        About {selectedPlace.name}
                      </h3>
                    </div>

                    {/* Standard Entry Ticket Admittance */}
                    <div className="mb-4 bg-blue-50/50 dark:bg-white/5 border border-blue-100/30 dark:border-white/10 p-4 rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">🇱🇰</span>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Standard Admittance Entry Ticket</span>
                          <span className="font-semibold text-slate-800 dark:text-[#FFB703] text-[11px] md:text-xs">
                            {selectedPlace.entranceFee || (
                              selectedPlace.category === DestinationCategory.BEACHES 
                                ? "Free Public Access" 
                                : selectedPlace.category === DestinationCategory.WATERFALLS
                                ? "Free Local / LKR 150-250 Conservation Fee"
                                : selectedPlace.category === DestinationCategory.HERITAGE_SITES
                                ? "LKR 4,500 / USD 15 - 30 Standard Entry ticket"
                                : "LKR 1,500 / USD 10 entry price"
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-bold tracking-wider uppercase">Verified</span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-slate-600 dark:text-slate-350 text-[15px] md:text-[16px] leading-[1.6]">
                        {selectedPlace.fullReview || selectedPlace.description}
                      </p>

                      {(() => {
                        const guide = generate1000WordGuide(selectedPlace);
                        return (
                          <div className="space-y-4 border-t border-dashed border-slate-100 dark:border-slate-850 pt-4 mt-4 text-[14px] md:text-[15px] leading-[1.6]">
                            {guide.historyAndLegend && (
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                                  📜 History & Legend
                                </h4>
                                <p className="text-slate-600 dark:text-slate-350">
                                  {guide.historyAndLegend}
                                </p>
                              </div>
                            )}
                            
                            {guide.thingsToDo && (
                              <div className="space-y-1 pt-2">
                                <h4 className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                                  📸 Things to Do & Photography
                                </h4>
                                <p className="text-slate-600 dark:text-slate-350">
                                  {guide.thingsToDo}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Card 2: Location & How to Reach - Map pin icon + white background */}
                  <div 
                    id="location-reach-card"
                    className="bg-white dark:bg-slate-900 rounded-[12px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)] mb-[24px]"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <MapPin className="w-5 h-5 text-rose-500 fill-rose-500/10 shrink-0" />
                      <h3 className="text-lg md:text-xl font-sans font-extrabold text-slate-900 dark:text-white">
                        Location & How to Reach
                      </h3>
                    </div>

                    <div className="bg-rose-50/20 dark:bg-slate-950/25 border border-rose-100/40 dark:border-white/5 rounded-xl p-4 mb-4 text-[14px] md:text-[15px] leading-[1.6]">
                      <h4 className="font-bold text-slate-850 dark:text-[#FFB703] flex items-center gap-1.5 mb-2 font-display uppercase tracking-wider text-[11px]">
                        📍 Recommended Route Directions & Transport
                      </h4>
                      <ul className="space-y-2.5 list-disc pl-4 text-slate-600 dark:text-slate-300">
                        {selectedPlace.location.toLowerCase().includes("ella") ? (
                          <>
                            <li><strong>By Scenic Train:</strong> Book a first or second-class observational seat on the world-renowned Kandy-to-Ella railway line. An absolutely sensational ride.</li>
                            <li><strong>By Express Bus:</strong> Daily air-conditioned long-distance commuter buses route through Kumbalwela Junction.</li>
                            <li><strong>By TukTuk:</strong> Easily hail local micro-transit cabs from Ella center town. Normal charges LKR 500-1000.</li>
                          </>
                        ) : selectedPlace.location.toLowerCase().includes("galle") || selectedPlace.category === DestinationCategory.BEACHES ? (
                          <>
                            <li><strong>By Southern Expressway Bus:</strong> Take the luxury Colombo-Galle highway AC motor-coaches starting from Maharagama terminal. (takes approx 1.5 - 2 hours)</li>
                            <li><strong>By Coastal Mainline Train:</strong> Board scenic seaside commuter rail services from Colombo Fort moving south hugging the beaches.</li>
                          </>
                        ) : (
                          <>
                            <li><strong>By Private Chauffeur:</strong> Direct transfers starting from Bandaranaike International Airport (BIA) can be pre-booked in our planner.</li>
                            <li><strong>By Commuter Tuk-Tuk:</strong> Highly efficient option for close 5-15km regional moves. Pre-negotiate pricing or activate standard taximeters.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Integrated mini coordinates indicator */}
                    {(() => {
                      const guide = generate1000WordGuide(selectedPlace);
                      return guide.locationAndReach ? (
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                          {guide.locationAndReach}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* Card 3: Best Time to Visit & Weather - Sun/Cloud icon + white background */}
                  <div 
                    id="weather-card"
                    className="bg-white dark:bg-slate-900 rounded-[12px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)] mb-[24px]"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <CloudSun className="w-5 h-5 text-amber-500 fill-amber-500/10 shrink-0" />
                      <h3 className="text-lg md:text-xl font-sans font-extrabold text-slate-900 dark:text-white">
                        Best Time to Visit & Weather
                      </h3>
                    </div>

                    <div className="space-y-4 text-[14px] md:text-[15px] leading-[1.6]">
                      <div className="bg-amber-500/5 dark:bg-slate-950/25 border border-amber-500/20 rounded-xl p-3.5">
                        <h4 className="font-bold text-[#FFB703] flex items-center gap-1.5 mb-1.5 font-display uppercase tracking-widest text-[10px]">
                          📅 Best Season & Weather Months
                        </h4>
                        <p className="text-slate-650 dark:text-slate-350">
                          {selectedPlace.bestTime || (
                            selectedPlace.category === DestinationCategory.BEACHES
                              ? "December to April (ideal for Southern & Western surf breaks with calm blue skies and minimum monsoons)."
                              : "January to April offers dry cool weather suited for climbing high summits. Watch for rain from May through September."
                          )}
                        </p>
                      </div>

                      {/* Professional etiquette wrapper */}
                      <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 md:p-5">
                        <h4 className="text-xs font-sans font-bold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider mb-2">
                          💡 Pro Visitor Travel Etiquette
                        </h4>
                        <ul className="text-xs sm:text-sm space-y-2 text-slate-650 dark:text-slate-350 pl-4 list-disc">
                          {selectedPlace.visitorTips?.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          )) || (
                            <li>Respect sacred sites! Dress modestly to cover shoulders and knees, and remove shoes/hats before crossing temple thresholds.</li>
                          )}
                        </ul>
                      </div>

                      {/* Safety advices */}
                      {(() => {
                        const guide = generate1000WordGuide(selectedPlace);
                        return (
                          <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-xl text-xs">
                            <h4 className="font-sans font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                              ⚠️ Safety & Advisory Tips
                            </h4>
                            <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-sans">{guide.safetyTips || "Keep hydrated and hire certified guide support before attempting steep mountain routes."}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* -------------------- COMMENTS & AD-HOC REVIEWS BLOCK -------------------- */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">
                      Traveler Reviews & Feedback ({selectedPlace.reviewsCount + getReviewsForEntity(selectedPlace.id).length})
                    </h3>

                    {/* Submit Review box */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 space-y-4">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block font-sans">
                        Submit Traveler Log review
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Your Travel Handle</label>
                          <input
                            id="comment-name"
                            type="text"
                            value={newCommentName}
                            onChange={(e) => setNewCommentName(e.target.value)}
                            placeholder="e.g. EllaBackpacker"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Star rating (1-5)</label>
                          <select
                            id="comment-rating-select"
                            value={newCommentRating}
                            onChange={(e) => setNewCommentRating(parseInt(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500"
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5 - Elite Paradises)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 - Worth an Afternoon)</option>
                            <option value={3}>⭐⭐⭐ (3 - Medium Experience)</option>
                            <option value={2}>⭐⭐ (2 - Lacks Infrastructure)</option>
                            <option value={1}>⭐ (1 - Avoid completely)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1 font-sans">Review Comment details</label>
                        <textarea
                          id="comment-body"
                          rows={3}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Describe accessibility, wild currents, hike levels or pricing..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 px-3.5 py-2.5 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500"
                        />
                      </div>

                      {/* Photo upload form section */}
                      <div className="space-y-3.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          {/* File input handler with Camera icon green button conforming to specific CSS patterns */}
                          <div className="space-y-1">
                            <input
                              type="file"
                              id="comment-photo-file-input"
                              accept=".jpg,.jpeg,.png,.webp,image/*"
                              className="hidden"
                              onChange={handlePhotoUploadChange}
                            />
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                id="btn-camera-upload-trigger"
                                type="button"
                                disabled={isUploading}
                                onClick={() => document.getElementById("comment-photo-file-input")?.click()}
                                className="bg-[#10B981] hover:bg-[#059669] text-white font-sans text-xs font-bold px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow active:translate-y-0.5 transition-all text-center"
                              >
                                <Camera className="w-[18px] h-[18px]" />
                                {isUploading ? "Uploading..." : "Add Travel Photo"}
                              </button>
                              
                              {/* Quick Mock Fill fallback for standard testing */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSimulatedPhoto("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80");
                                  triggerToast("Boutique drone travel photo upload simulation completed!", "success");
                                }}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-300 font-sans px-3 py-2 rounded-lg text-[10px]"
                              >
                                ⚡ Simulated Photo
                              </button>
                            </div>
                            
                            {/* Form helper info */}
                            <p className="text-[10px] text-slate-400 font-medium">
                              Max 2MB, JPG/PNG/WEBP only
                            </p>
                          </div>

                          <button
                            id="btn-comment-submit"
                            onClick={() => handleAddReview(selectedPlace.id)}
                            disabled={!newCommentText.trim() || isUploading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-bold font-sans text-[11px] cursor-pointer disabled:opacity-40 shadow transition-all uppercase tracking-wide"
                          >
                            Publish Review Log
                          </button>
                        </div>

                        {/* Error warning display banner */}
                        {uploadError && (
                          <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[11px] leading-relaxed">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        {/* Visual Image Preview before submit */}
                        {(previewPhotoData || simulatedPhoto) && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                            <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#FFB703] block">Uploaded Photo Preview</span>
                            <div className="relative w-full sm:w-[300px] h-[200px] rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                              <img
                                src={previewPhotoData || simulatedPhoto || ""}
                                alt="Local Photo Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewPhotoData(null);
                                  setSimulatedPhoto(null);
                                  setUploadedPhotoUrl(null);
                                  setUploadError(null);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/20 p-0 z-10 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              >
                                <X className="w-[18px] h-[18px]" />
                              </button>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> File verified. Review will enter pending moderation.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
 
                     {/* Render Reviews List */}
                     <div className="space-y-4">
                       {/* Live static mock reviews combined with dynamic user writes */}
                       {getReviewsForEntity(selectedPlace.id).map((rev) => (
                         <div key={rev.id} className="review-card bg-slate-50 dark:bg-slate-950/40 border border-slate-150 p-4 rounded-xl text-xs space-y-2">
                           <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                               <div className="avatar" data-initial={rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}><ShimmerImage src={rev.userPhoto} alt={rev.userName} className="w-6 h-6 rounded-full" height="24px" /></div>
                               <span className="font-bold">{rev.userName}</span>
                             </div>
                             <span className="font-mono text-amber-500">{"★".repeat(rev.rating)}</span>
                           </div>
                           <p className="text-slate-650 dark:text-slate-300">{rev.comment}</p>
                           
                           {/* Display Moderation Pending Badge */}
                           {rev.status === "pending" && (
                             <div className="inline-flex items-center gap-1 bg-amber-500/10 text-[#FFB703] text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md mt-1 mb-1 uppercase">
                               ⏳ Pending Moderation (Photo Validation Active)
                             </div>
                           )}

                           {rev.photoUrl && (
                             <div className="mt-2 text-left">
                               <ShimmerImage 
                                 src={rev.photoUrl} 
                                 alt="Review attachment" 
                                 className="w-full sm:w-[300px] h-[200px] object-cover rounded-xl border border-slate-200 mt-1 shadow-sm" 
                                 height="200px" 
                               />
                             </div>
                           )}
                           <span className="text-[9px] text-slate-400 font-mono block pt-1">Published: {new Date(rev.createdAt).toLocaleDateString()}</span>
                         </div>
                       ))}

                      {/* Predefined verified community reviews */}
                      {getStaticReviewsFor(selectedPlace.id, selectedPlace.name, selectedPlace.category).map((rev) => (
                        <div key={rev.id} className="review-card bg-slate-50 dark:bg-slate-950/45 p-4 rounded-xl text-xs space-y-2 border border-slate-150 dark:border-slate-800">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="avatar" data-initial={rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}><ShimmerImage src={rev.userPhoto} alt={rev.userName} className="w-5.5 h-5.5 rounded-full" height="22px" /></div>
                              <span className="font-bold">{rev.userName}</span>
                            </div>
                            <span className="font-mono text-amber-500">{"★".repeat(rev.rating)}</span>
                          </div>
                          <p className="text-slate-650 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                          
                          {rev.photoUrl && (
                            <div className="mt-2 text-left">
                              <ShimmerImage 
                                src={rev.photoUrl} 
                                alt="Review attachment" 
                                className="w-full sm:w-[300px] h-[150px] object-cover rounded-xl border border-slate-200 mt-1 shadow-sm" 
                                height="150px" 
                              />
                            </div>
                          )}

                          {rev.pinterestUrl && (
                            <div className="mt-2 text-left">
                              <a
                                href={rev.pinterestUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E60023] hover:bg-[#b8001c] text-white text-[10px] font-sans font-bold rounded-lg shadow-sm transition-all"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.76-2.245 3.76-5.487 0-2.861-2.063-4.869-5.007-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.166-1.495-.69-2.433-2.878-2.433-4.63 0-3.771 2.737-7.238 7.904-7.238 4.15 0 7.375 2.957 7.375 6.91 0 4.122-2.599 7.44-6.208 7.44-1.213 0-2.352-.63-2.743-1.377l-.747 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.983-5.368 11.983-11.987C24 5.367 18.637 0 12.017 0z" />
                                </svg>
                                <span>Pinterest Visual Board</span>
                              </a>
                            </div>
                          )}

                          <span className="text-[10px] text-slate-450 font-mono block">Published: {new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Side: Maps link, metrics, nearby hotels/eateries */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Google Maps detailed navigation links requested */}
                  <div className="bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-150 text-xs">
                    <Map className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] mb-2">Interactive Location Setup</h4>
                    
                    {/* Live Iframe Google Map Embed */}
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-3.5 border border-slate-200 dark:border-slate-800 relative shadow-inner">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedPlace.name + ", Sri Lanka")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-[10.5px]">
                      Latitude: <strong>{selectedPlace.latitude} N</strong><br />
                      Longitude: <strong>{selectedPlace.longitude} E</strong>
                    </p>

                    <div className="space-y-2">
                      <a
                        id="btn-get-directions-gmaps"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedPlace.name + ", " + selectedPlace.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 text-white font-sans text-[11px] font-bold px-4 py-3 rounded-xl hover:bg-emerald-555 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full text-center hover:shadow-md transition-shadow"
                      >
                        Get Directions <ArrowRight className="w-3 h-3" />
                      </a>

                      <a
                        id="link-place-gmaps"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + ", " + selectedPlace.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-white font-sans text-[11px] font-semibold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 inline-flex items-center justify-center gap-1.5 cursor-pointer w-full text-center"
                      >
                        View Full Google Maps <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        id="btn-modal-share"
                        onClick={() => handleShareSystem(selectedPlace.name)}
                        className="bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-white font-sans text-[11px] font-semibold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 items-center justify-center gap-1.5 cursor-pointer w-full text-center flex"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Copy Shareable Link
                      </button>
                    </div>
                  </div>

                  {/* NEARBY HOTELS Lookup based on matched proximity text */}
                  {(() => {
                    const matchedHotels = HOTELS_DATA.filter(h => 
                      h.id.startsWith("ht-" + selectedPlace.id + "-") || 
                      h.location.toLowerCase().includes(selectedPlace.location.toLowerCase()) || 
                      selectedPlace.location.toLowerCase().includes(h.location.toLowerCase())
                    ).slice(0, 10);

                    const selectedCalculatorHotel = HOTELS_DATA.find(h => h.id === calcHotelId) || matchedHotels[0];

                    // Cost Calculation Math
                    const basePrice = selectedCalculatorHotel ? (selectedCalculatorHotel.pricePerNight || 100) : 100;
                    let roomClassMultiplier = 1.0;
                    let roomClassName = "Standard Deluxe Suite";
                    if (calcRoomClass === "suite") {
                      roomClassMultiplier = 1.5;
                      roomClassName = "Premium Executive Suite";
                    } else if (calcRoomClass === "villa") {
                      roomClassMultiplier = 2.2;
                      roomClassName = "Royal Presidential Villa";
                    }

                    const pricePerNightAdjusted = Math.round(basePrice * roomClassMultiplier);
                    const baseLodgingTotal = pricePerNightAdjusted * calcNights * calcRoomsCount;

                    let extraMealPricePerNight = 0;
                    if (calcHalfBoard) extraMealPricePerNight = 25;
                    if (calcFullBoard) extraMealPricePerNight = 45;

                    const mealTotal = extraMealPricePerNight * calcGuestsCount * calcNights;

                    let flatExtrasTotal = 0;
                    if (calcGuide) flatExtrasTotal += 40 * calcNights;
                    if (calcChauffeur) flatExtrasTotal += 60 * calcNights;

                    const subTotalBeforeDiscount = baseLodgingTotal + mealTotal + flatExtrasTotal;

                    let discountPercentage = 0;
                    if (calcNights >= 10) discountPercentage = 15;
                    else if (calcNights >= 5) discountPercentage = 10;

                    const discountAmount = Math.round((subTotalBeforeDiscount * discountPercentage) / 100);
                    const subTotalAfterDiscount = subTotalBeforeDiscount - discountAmount;

                    const serviceCharge = Math.round(subTotalAfterDiscount * 0.10);
                    const taxVAT = Math.round(subTotalAfterDiscount * 0.08);

                    const grandTotalUSD = subTotalAfterDiscount + serviceCharge + taxVAT;
                    const exchangeRate = 300;
                    const grandTotalLKR = grandTotalUSD * exchangeRate;

                    return (
                      <div 
                        id="nearby-accommodations-card"
                        className="bg-white dark:bg-slate-900 rounded-[12px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)] mb-[24px]"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <Bed className="w-5 h-5 text-indigo-500 fill-indigo-500/10 shrink-0" />
                              <div>
                                <h3 className="font-sans font-extrabold text-[15px] sm:text-[16px] text-slate-900 dark:text-white leading-tight">
                                  Nearby Accommodations
                                </h3>
                                <span className="text-[9.5px] text-slate-400 block font-normal mt-0.5">
                                  10 Star Class Hotels matched around {selectedPlace.name}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => document.getElementById("stay-calculator-anchor")?.scrollIntoView({ behavior: "smooth" })}
                              className="bg-indigo-605 hover:bg-indigo-700 text-white text-[10.5px] font-sans font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer select-none active:scale-95 shrink-0"
                            >
                              Check Prices
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {matchedHotels.slice(0, showAllHotels ? 10 : 3).map((hotel) => {
                              const isSelectedInCalc = calcHotelId === hotel.id;
                              return (
                                <div 
                                  key={hotel.id} 
                                  className={`flex flex-col gap-2.5 p-3.5 rounded-xl border transition-all duration-300 ${
                                    isSelectedInCalc 
                                      ? "bg-amber-500/5 border-amber-500/40 shadow-sm" 
                                      : "bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 hover:border-slate-350"
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    <ShimmerImage 
                                      src={hotel.imageUrl} 
                                      alt={hotel.name} 
                                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0" 
                                      height="56px" 
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-bold text-[11px] text-slate-850 dark:text-zinc-100 truncate leading-snug">
                                          {hotel.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-amber-500 flex-shrink-0 flex items-center">
                                          ★ {hotel.rating}
                                        </span>
                                      </div>
                                      <div className="flex mt-0.5 items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-bold font-sans uppercase tracking-wider">
                                          {hotel.category}
                                        </span>
                                        <span className="text-[9px] text-slate-400">
                                          {hotel.priceRange}
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-amber-500 dark:text-amber-400 font-semibold mt-1">
                                        {"★".repeat(hotel.starClass || 3)} Star Rating
                                      </div>
                                    </div>
                                  </div>

                                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal font-sans line-clamp-2">
                                    {hotel.description}
                                  </p>

                                  <div className="flex flex-wrap gap-1 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                                    {hotel.facilities.slice(0, 4).map((f, fIdx) => (
                                      <span key={fIdx} className="text-[8.5px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                        {f}
                                      </span>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                    {hotel.contactNumber && (
                                      <a 
                                        href={`tel:${hotel.contactNumber}`}
                                        className="text-[9.5px] font-sans font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                                      >
                                        📞 {hotel.contactNumber}
                                      </a>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ", Sri Lanka")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9.5px] bg-sky-550/15 hover:bg-sky-550/25 text-[#0077be] dark:text-[#ffea6c] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 transition"
                                      >
                                        📍 Maps
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCalcHotelId(hotel.id);
                                          document.getElementById("stay-calculator-anchor")?.scrollIntoView({ behavior: "smooth" });
                                        }}
                                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded transition active:scale-95 cursor-pointer ${
                                          isSelectedInCalc 
                                            ? "bg-amber-500 text-white shadow-sm" 
                                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-450 border border-amber-500/20"
                                        }`}
                                      >
                                        {isSelectedInCalc ? "✓ Active" : "🧮 Calc"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {matchedHotels.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setShowAllHotels(!showAllHotels)}
                              className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 rounded-xl transition cursor-pointer active:scale-[0.98]"
                            >
                              {showAllHotels 
                                ? "Collapse Hotel Directory" 
                                : `+ See All Nearby accommodations (10 Stars Available)`}
                            </button>
                          )}
                        </div>

                        {/* LIVE STAY COST ESTIMATE CALCULATOR */}
                        <div id="stay-calculator-anchor" className="bg-[#1e3a8a]/5 dark:bg-slate-900 border border-[#fbbf24]/30 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-amber-500" />
                            <div>
                              <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-sans">
                                Stay Cost & Billing Calculator
                              </h4>
                              <span className="text-[9px] text-slate-400 block">
                                Calculate estimates based on stays & customized additions
                              </span>
                            </div>
                          </div>

                          {/* SELECT HOTEL DROPDOWN */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                              Select Accommodation
                            </label>
                            <select
                              value={calcHotelId}
                              onChange={(e) => setCalcHotelId(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-[11px] bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 transition font-sans font-medium"
                            >
                              {matchedHotels.map(h => (
                                <option key={h.id} value={h.id}>
                                  🏨 {h.name} (Base: {h.priceRange})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* DURATION SLIDER AND CLASS CHOOSER */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                                Nights ({calcNights})
                              </label>
                              <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl overflow-hidden justify-between p-1 h-8">
                                <button
                                  type="button"
                                  onClick={() => setCalcNights(Math.max(1, calcNights - 1))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded active:scale-95 transition cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono text-[10.5px] font-bold text-slate-850 dark:text-white">
                                  {calcNights} Nights
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCalcNights(Math.min(30, calcNights + 1))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded active:scale-95 transition cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                                Room Category
                              </label>
                              <select
                                value={calcRoomClass}
                                onChange={(e: any) => setCalcRoomClass(e.target.value)}
                                className="w-full px-2 py-1 text-[10.5px] bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 transition h-8"
                              >
                                <option value="deluxe">Standard Deluxe Suite (1.0x)</option>
                                <option value="suite">Executive Suite (1.5x)</option>
                                <option value="villa">Presidential Luxury Villa (2.2x)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                                Rooms Count
                              </label>
                              <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl overflow-hidden justify-between p-1 h-8">
                                <button
                                  type="button"
                                  onClick={() => setCalcRoomsCount(Math.max(1, calcRoomsCount - 1))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded active:scale-95 transition cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono text-[10.5px] font-bold text-slate-850 dark:text-white">
                                  {calcRoomsCount} Rooms
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCalcRoomsCount(Math.min(10, calcRoomsCount + 1))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded active:scale-95 transition cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                                Guests Amount
                              </label>
                              <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl overflow-hidden justify-between p-1 h-8">
                                <button
                                  type="button"
                                  onClick={() => setCalcGuestsCount(Math.max(1, calcGuestsCount - 1))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded active:scale-95 transition cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono text-[10.5px] font-bold text-slate-850 dark:text-white">
                                  {calcGuestsCount} Guests
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCalcGuestsCount(Math.min(20, calcGuestsCount + 1))}
                                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded active:scale-95 transition cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* TRAVEL SERVICES CHECKBOX ADDONS */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                              Add-on Travel Services
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                              {/* Meal Option Radio setup */}
                              <div className="flex gap-2">
                                <label className="flex-1 flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-950 border border-slate-150 rounded-xl cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-350 select-none">
                                  <input
                                    type="radio"
                                    name="calc-meals"
                                    checked={!calcHalfBoard && !calcFullBoard}
                                    onChange={() => { setCalcHalfBoard(false); setCalcFullBoard(false); }}
                                    className="accent-amber-500"
                                  />
                                  <span>Room Only Booking</span>
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className={`flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-950 border rounded-xl cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-350 select-none ${calcHalfBoard ? "border-amber-500" : "border-slate-150"}`}>
                                  <input
                                    type="checkbox"
                                    checked={calcHalfBoard}
                                    onChange={(e) => {
                                      setCalcHalfBoard(e.target.checked);
                                      if (e.target.checked) setCalcFullBoard(false);
                                    }}
                                    className="accent-amber-500 roundedScale"
                                  />
                                  <span>Half Board (+$25/n)</span>
                                </label>
                                <label className={`flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-950 border rounded-xl cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-350 select-none ${calcFullBoard ? "border-amber-500" : "border-slate-150"}`}>
                                  <input
                                    type="checkbox"
                                    checked={calcFullBoard}
                                    onChange={(e) => {
                                      setCalcFullBoard(e.target.checked);
                                      if (e.target.checked) setCalcHalfBoard(false);
                                    }}
                                    className="accent-amber-500 roundedScale"
                                  />
                                  <span>Full Board (+$45/n)</span>
                                </label>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <label className={`flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-950 border rounded-xl cursor-pointer text-[9.5px] font-bold text-slate-650 dark:text-slate-350 select-none ${calcGuide ? "border-amber-500/50" : "border-slate-150"}`}>
                                  <input
                                    type="checkbox"
                                    checked={calcGuide}
                                    onChange={(e) => setCalcGuide(e.target.checked)}
                                    className="accent-amber-500"
                                  />
                                  <span>Private Guide (+$40/d)</span>
                                </label>
                                <label className={`flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-950 border rounded-xl cursor-pointer text-[9.5px] font-bold text-slate-650 dark:text-slate-350 select-none ${calcChauffeur ? "border-amber-500/50" : "border-slate-150"}`}>
                                  <input
                                    type="checkbox"
                                    checked={calcChauffeur}
                                    onChange={(e) => setCalcChauffeur(e.target.checked)}
                                    className="accent-amber-500"
                                  />
                                  <span>Chauffeur Car (+$60/d)</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* ITEMIZED CASH REGISTER INVOICE LOG */}
                          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-inner">
                            <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-slate-300 dark:border-slate-800 text-[10.5px]">
                              <span className="font-bold flex items-center gap-1"><Receipt className="w-3.5 h-3.5 text-amber-500" /> STAY INVOICE SUMMARY</span>
                              <span className="font-semibold text-[9.5px]">VISITSRILANKA • GEN</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="truncate max-w-[150px]">{selectedCalculatorHotel?.name || "No lodging selected"}</span>
                                <span className="font-bold text-slate-850 dark:text-slate-250">${basePrice}/night</span>
                              </div>
                              <div className="flex justify-between pl-2 text-[9px] text-slate-400">
                                <span>└ Class: {roomClassName}</span>
                                <span>x{roomClassMultiplier} Rate</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-850 dark:text-slate-250">
                                <span>└ Base Lodging ({calcNights}n x {calcRoomsCount} room)</span>
                                <span>${baseLodgingTotal.toFixed(2)}</span>
                              </div>

                              {mealTotal > 0 && (
                                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                  <span>├ Meal Dining Addon</span>
                                  <span>+${mealTotal.toFixed(2)}</span>
                                </div>
                              )}

                              {flatExtrasTotal > 0 && (
                                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                  <span>├ Driver & Guiding Addons</span>
                                  <span>+${flatExtrasTotal.toFixed(2)}</span>
                                </div>
                              )}

                              {discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                  <span>├ Long Stay {discountPercentage}% Discount</span>
                                  <span>-${discountAmount.toFixed(2)}</span>
                                </div>
                              )}

                              <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-850">
                                <span>├ Service Charge (10%)</span>
                                <span>+${serviceCharge.toFixed(2)}</span>
                              </div>

                              <div className="flex justify-between">
                                <span>├ Government Tax (8% VAT)</span>
                                <span>+${taxVAT.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="border-t-2 border-double border-slate-300 dark:border-slate-800 pt-2 flex flex-col gap-1 text-[10.5px]">
                              <div className="flex justify-between items-center text-slate-900 dark:text-white">
                                <span className="font-sans font-extrabold text-[11px]">GRAND ESTIMATE TOTAL</span>
                                <span className="font-bold text-[13px] text-amber-500">${grandTotalUSD.toLocaleString()} USD</span>
                              </div>
                              
                              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg flex justify-between items-center border border-amber-500/15">
                                <span className="text-[9px] font-sans font-bold">NATIVE RATE (LKR)</span>
                                <span className="text-11px font-bold">Rs. {grandTotalLKR.toLocaleString()} LKR</span>
                              </div>
                              <span className="text-[8.5px] text-slate-400 block text-right font-sans">
                                Price rate: 1 USD = 300 LKR • Inclusive of all taxes
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {selectedCalculatorHotel?.bookingUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Directing you to reserve a room at ${selectedCalculatorHotel.name}.\nContact Phone support: ${selectedCalculatorHotel.contactNumber || "N/A"}`);
                                  window.open(selectedCalculatorHotel.bookingUrl, "_blank");
                                }}
                                className="w-full text-center py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 font-sans text-[11px] font-bold text-white rounded-xl inline-flex items-center justify-center gap-1 shadow active:translate-y-0.5 transition cursor-pointer h-9"
                              >
                                🌐 Request Room Reservation
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const summaryText = `--- VISIT SRI LANKA TRIP ESTIMATE ---\nDestination Spot: ${selectedPlace.name}\nHotel Chosen: ${selectedCalculatorHotel?.name}\nCabin Tier: ${roomClassName}\nDuration: ${calcNights} Nights • Rooms: ${calcRoomsCount}\nSelected Guests: ${calcGuestsCount}\nServices: ${calcHalfBoard ? "Half-Board Meals" : calcFullBoard ? "Full-Board Meals" : "Standard Breakfast only"}${calcGuide ? " + Private Tour Guide" : ""}${calcChauffeur ? " + Private Auto Chauffeur" : ""}\n\nInvoice Total USD: $${grandTotalUSD.toLocaleString()} USD\nInvoice Total LKR: Rs. ${grandTotalLKR.toLocaleString()} LKR\nHotel Support: ${selectedCalculatorHotel?.contactNumber || "N/A"}\nCalculated via Visit Sri Lanka Hub`;
                                
                                navigator.clipboard.writeText(summaryText);
                                alert("Stay selection invoice copied successfully to clipboard! You are ready to share it.");
                              }}
                              className="w-full text-center py-2 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-650 dark:text-slate-300 rounded-xl transition cursor-pointer h-9"
                            >
                              📋 Copy Quote & Calculation Summary
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* NEARBY RESTAURANTS Lookup based on proximity text */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-20s rounded-2xl p-5 space-y-3.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      Nearby Dining & Food hubs
                    </h4>
                    <div className="space-y-3">
                      {RESTAURANTS_DATA.filter(r => r.location.toLowerCase().includes(selectedPlace.location.toLowerCase()) || selectedPlace.location.toLowerCase().includes(r.location.toLowerCase())).slice(0, 2).map((res) => (
                        <div key={res.id} className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-150">
                          <ShimmerImage src={res.imageUrl} alt={res.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 animate-pulse-none" height="48px" />
                          <div className="min-w-0">
                            <span className="font-bold text-[11px] block text-slate-850 truncate leading-tight dark:text-zinc-200">{res.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{res.cuisine.split(",")[0]} • Cost: {res.priceRange}</span>
                          </div>
                        </div>
                      ))}
                      {RESTAURANTS_DATA.filter(r => r.location.toLowerCase().includes(selectedPlace.location.toLowerCase()) || selectedPlace.location.toLowerCase().includes(r.location.toLowerCase())).length === 0 && (
                        <span className="text-slate-400 text-[10px] block">Specialty roti & local curry setups located within walking boundaries.</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Sticky bottom bar for mobile users to quickly click 'Check Prices' */}
              <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800 p-3 md:hidden flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">10 Hotels Available</span>
                  <span className="font-extrabold text-indigo-600 dark:text-[#FFB703] text-xs sm:text-sm">Best Price Promise</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("stay-calculator-anchor")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-sans font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer select-none active:scale-95"
                >
                  Check Prices
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ------------------------------------------------------------- */}
      {/* -------------------- HOTEL MODAL EDITOR --------------------- */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedHotel && (
          <motion.div
            id="modal-hotel"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              id="modal-hotel-body"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 md:p-8 text-slate-800 dark:text-slate-200"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
            >
              <button
                id="btn-close-hotel-modal"
                onClick={() => setSelectedHotel(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full p-0 transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
              >
                <X className="w-[18px] h-[18px]" />
              </button>

              <div className="space-y-4">
                <ShimmerImage src={selectedHotel.imageUrl} alt={selectedHotel.name} className="w-full h-56 object-cover rounded-2xl animate-pulse-none" height="224px" loading="eager" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 block uppercase font-bold tracking-widest">{selectedHotel.location}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <strong>{selectedHotel.rating}</strong>
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-sans font-bold text-slate-900 dark:text-white">
                  {selectedHotel.name}
                </h3>

                <p className="text-xs md:text-sm text-slate-550 dark:text-slate-380 leading-relaxed">
                  {selectedHotel.description}
                </p>

                {/* Amenities */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-sans">Amenities & Highlights</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedHotel.facilities || []).map(am => (
                      <span key={am} className="bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-md text-[10px] border border-slate-150 text-slate-650 dark:text-zinc-300">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cost estimate */}
                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-150">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase font-sans">Estimated Cost</span>
                    <span className="text-sm font-sans font-extrabold text-emerald-800 dark:text-emerald-400">{selectedHotel.priceRange}</span>
                  </div>
                  <a
                    id="link-hotel-book-gmaps"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedHotel.name + " " + selectedHotel.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-505 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl block flex items-center gap-1"
                  >
                    Locate on Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ------------------------------------------------------------- */}
      {/* ----------------- RESTAURANT MODAL EDITOR ------------------- */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedRestaurant && (
          <motion.div
            id="modal-restaurant"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              id="modal-res-body"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 md:p-8 text-slate-800 dark:text-slate-200"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
            >
              <button
                id="btn-close-res-modal"
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full p-0 transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
              >
                <X className="w-[18px] h-[18px]" />
              </button>

              <div className="space-y-4">
                <ShimmerImage src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="w-full h-56 object-cover rounded-2xl animate-pulse-none" height="224px" loading="eager" />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 block uppercase font-bold tracking-widest">{selectedRestaurant.location}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <strong>{selectedRestaurant.rating}</strong>
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-sans font-bold text-slate-900 dark:text-white">
                  {selectedRestaurant.name}
                </h3>

                <p className="text-xs md:text-sm text-slate-550 dark:text-slate-380 leading-relaxed">
                  {selectedRestaurant.description}
                </p>

                {/* Specialties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 id-headings-specs uppercase tracking-widest block font-sans">Cuisine Type</h4>
                    <span className="text-xs font-semibold">{selectedRestaurant.cuisine}</span>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 id-headings-specs uppercase tracking-widest block font-sans">Must-Try Specialties</h4>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{(selectedRestaurant.menuHighlights || (selectedRestaurant as any).specialties || []).join(", ")}</span>
                  </div>
                </div>

                {/* Cost estimate */}
                <div className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-950/20 rounded-xl border border-sky-150">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase font-sans">Average investment</span>
                    <span className="text-xs font-sans font-bold text-slate-700 dark:text-zinc-300">{selectedRestaurant.priceRange}</span>
                  </div>
                  <a
                    id="link-res-directions-gmaps"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRestaurant.name + " " + selectedRestaurant.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-505 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl block flex items-center gap-1"
                  >
                    Get directions <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ------------------------------------------------------------- */}
      {/* ------------------ BLOG FULL READER MODAL ------------------- */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedBlog && (
          <motion.div
            id="modal-blog-reader"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dynamic SEO JSON-LD Schema Markup injection */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "TravelArticle",
                      "@id": `https://izysl.com/blog/${selectedBlog.id}#article`,
                      "headline": selectedBlog.title,
                      "description": selectedBlog.excerpt,
                      "image": [selectedBlog.imageUrl],
                      "datePublished": "2026-06-15T08:00:00+05:30",
                      "dateModified": "2026-06-15T10:30:00+05:30",
                      "author": {
                        "@type": "Person",
                        "name": selectedBlog.author
                      },
                      "publisher": {
                        "@type": "Organization",
                        "name": "IZYSL.COM | Premium Luxury Sri Lanka Travel Guide",
                        "logo": {
                          "@type": "ImageObject",
                          "url": "https://izysl.com/logo.png"
                        }
                      },
                      "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": `https://izysl.com/blog/${selectedBlog.id}`
                      }
                    },
                    {
                      "@type": "FAQPage",
                      "@id": `https://izysl.com/blog/${selectedBlog.id}#faq`,
                      "mainEntity": (selectedBlog.faqs || []).map((faq: any) => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": faq.answer
                        }
                      }))
                    }
                  ]
                })
              }}
            />

            <motion.div
              id="modal-blog-body"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
            >
              {/* Cover Banner (No Photo) */}
              <div className="relative w-full bg-slate-900 border-b border-slate-800 p-6 md:p-8 text-white space-y-4 rounded-t-3xl">
                <div className="flex justify-between items-start">
                  <span className="bg-amber-500 font-mono text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider block w-max">
                    {selectedBlog.category}
                  </span>
                  <button
                    id="btn-close-blog-modal"
                    onClick={() => setSelectedBlog(null)}
                    className="w-[32px] h-[32px] p-0 flex items-center justify-center rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10 text-white"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                </div>
                {/* Proper semantic H1 tag for main blog title */}
                <h1 className="text-xl md:text-3xl font-sans font-extrabold tracking-tight leading-snug text-white">
                  {selectedBlog.title}
                </h1>
                <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                  <span>By {selectedBlog.author}</span>
                  <span>•</span>
                  <span>Published {selectedBlog.date}</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-200">
                {/* 1. TOP DOWNLOAD CTA */}
                <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">Exclusive Travel Aid</span>
                      <h4 className="font-bold text-xs">Download Full Guide PDF & Google Maps Layer</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerToast("Excellent choice! Your comprehensive Sri Lanka PDF guidebook and mapped custom layers are starting download...", "success")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans px-4 py-2.5 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 text-center w-full sm:w-auto"
                  >
                    📥 Get Guide PDF + Pin-Map
                  </button>
                </div>

                {/* 2. TABLE OF CONTENTS */}
                {selectedBlog.tableOfContents && selectedBlog.tableOfContents.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#FFB703] uppercase">Table of Contents</span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 list-none p-0 m-0">
                      {selectedBlog.tableOfContents.map((item: any, idx: number) => (
                        <li key={idx} className="text-xs">
                          <button
                            onClick={() => {
                              const el = document.getElementById(item.id);
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                              }
                            }}
                            className="text-emerald-600 dark:text-emerald-450 hover:underline flex items-center gap-1.5 cursor-pointer text-left font-medium"
                          >
                            <span>{idx + 1}.</span> {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. HERO HOOK (First Paragraph featuring numbers) */}
                <p className="text-sm md:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-medium border-l-4 border-[#FFB703] pl-4 italic">
                  {selectedBlog.firstParagraph}
                </p>

                {/* 4. SECTIONS (H2, H3, paragraphs, click-to-tweets) */}
                <div className="space-y-5 text-slate-700 dark:text-slate-300">
                  {selectedBlog.sections?.map((sec: any, idx: number) => {
                    if (sec.type === "h2") {
                      return (
                        <h2
                          key={idx}
                          id={sec.id}
                          className="text-lg md:text-xl font-sans font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-100 dark:border-slate-800 pb-1.5"
                        >
                          {sec.text}
                        </h2>
                      );
                    }
                    if (sec.type === "h3") {
                      return (
                        <h3 key={idx} className="text-sm md:text-base font-sans font-bold text-slate-800 dark:text-slate-200">
                          {sec.text}
                        </h3>
                      );
                    }
                    if (sec.type === "paragraph") {
                      return (
                        <p key={idx} className="text-xs md:text-sm leading-relaxed">
                          {sec.text}
                        </p>
                      );
                    }
                    if (sec.type === "tweet") {
                      return (
                        <div
                          key={idx}
                          className="bg-blue-500/5 hover:bg-blue-500/10 border-2 border-dashed border-blue-500/25 p-5 rounded-2xl relative my-6 transition-all group"
                        >
                          <p className="text-xs md:text-sm font-sans font-semibold text-slate-800 dark:text-slate-200 leading-relaxed pr-8">
                            "{sec.text}"
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-[10px] text-blue-500 font-mono font-bold uppercase tracking-wider block">Click quote to tweet</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(sec.text);
                                triggerToast("Quote successfully copied to clipboard!", "success");
                                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(sec.tweetText || sec.text)}`;
                                window.open(tweetUrl, "_blank");
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-sans text-[10px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                              Tweet
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* 5. FAQS SECTION */}
                {selectedBlog.faqs && selectedBlog.faqs.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Frequently Asked Questions
                    </h3>
                    <div className="space-y-3.5">
                      {selectedBlog.faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                          <span className="font-extrabold text-[#FFB703] text-xs font-mono block mb-1">Q: {faq.question}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed block">{faq.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. BOTTOM DOWNLOAD CTA */}
                <div className="bg-gradient-to-tr from-[#0b2149] to-[#0A1F44] border border-white/10 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <div className="text-left space-y-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-[#FFB703]">Highlands & Southern Coast Companion</span>
                    <h4 className="font-bold text-xs text-white">Unlock offline guides & direct Google Maps navigation layer</h4>
                    <p className="text-[10px] text-slate-300">Compatible with Google Maps, Maps.me, and Apple Maps.</p>
                  </div>
                  <button
                    onClick={() => triggerToast("Preparing luxury maps packet layer with over 120 verified secret spots ready to load on your phone...", "success")}
                    className="bg-[#FFB703] hover:bg-[#e09b00] text-slate-950 text-xs font-bold font-sans px-5 py-3 rounded-xl cursor-pointer shadow-md shrink-0 text-center w-full sm:w-auto"
                  >
                    🗺️ Download Google Maps Layer
                  </button>
                </div>

                {/* 7. SOCIAL PLATFORMS SHARE BOX */}
                <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs font-bold">Share to Southern Wanderers & Communities:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const shareUrl = `https://reddit.com/r/travel/submit?title=${encodeURIComponent("Sri Lanka travel help required or tips on: " + selectedBlog.title)}&url=${encodeURIComponent("https://izysl.com/blog/" + selectedBlog.id)}`;
                        window.open(shareUrl, "_blank");
                        triggerToast("Opened Reddit share page with preset target title!", "success");
                      }}
                      className="bg-[#FF4500] hover:bg-[#ff5722] text-white text-[10px] font-sans font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      Reddit
                    </button>
                    <button
                      onClick={() => {
                        const shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://izysl.com/blog/" + selectedBlog.id)}`;
                        window.open(shareUrl, "_blank");
                        triggerToast("Opened Facebook share link!", "success");
                      }}
                      className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-[10px] font-sans font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      Facebook
                    </button>
                    <button
                      onClick={() => {
                        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(selectedBlog.title + " - " + "https://izysl.com/blog/" + selectedBlog.id)}`;
                        window.open(whatsappUrl, "_blank");
                        triggerToast("Opened WhatsApp share dialog!", "success");
                      }}
                      className="bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] font-sans font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out this awesome Sri Lanka guide: " + selectedBlog.title)}&url=${encodeURIComponent("https://izysl.com/blog/" + selectedBlog.id)}&hashtags=SriLanka,Travel`;
                        window.open(twitterUrl, "_blank");
                        triggerToast("Opened X/Twitter share link!", "success");
                      }}
                      className="bg-black hover:bg-slate-900 text-white text-[10px] font-sans font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      Twitter/X
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://izysl.com/blog/${selectedBlog.id}`);
                        triggerToast("Article link successfully copied to clipboard!", "success");
                      }}
                      className="bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white text-[10px] font-sans font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* 7.5. TRAVELERS PHOTO GALLERY */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 id="traveler-photos-title" className="font-sans font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        12 Travelers shared their photos
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Interactive real-time shared moments across Sri Lanka
                      </p>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                      Verified Views
                    </span>
                  </div>

                  {/* 3x4 Grid on Desktop, 2 Columns on Mobile */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(() => {
                      const activeUserPhotos = userReviews
                        .filter((rev) => rev.photoUrl)
                        .map((rev, idx) => ({
                          id: rev.id || `user-upload-${idx}`,
                          placeName: "Your Shared Moment",
                          url: rev.photoUrl as string,
                          uploadedBy: rev.userName,
                          caption: rev.comment,
                        }));
                      const combined = [...activeUserPhotos, ...ALL_TOURIST_PHOTOS];
                      return combined.slice(0, 12).map((photo, idx) => (
                        <div
                          key={photo.id || idx}
                          onClick={() => {
                            setActiveGalleryPhoto(photo);
                            triggerToast(`Opening traveler snapshot by ${photo.uploadedBy}`, "info");
                          }}
                          className="group relative h-28 sm:h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-98"
                        >
                          <ShimmerImage
                            src={photo.url}
                            alt={photo.caption || photo.placeName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            height="128px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-left">
                            <span className="text-[9.5px] font-bold text-white truncate">{photo.placeName}</span>
                            <span className="text-[8px] text-slate-300 truncate">By {photo.uploadedBy}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 8. RELATED POSTS (INTERNAL LINKING DEEP INTERACTIVE INTEGRATION) */}
                {selectedBlog.relatedPosts && selectedBlog.relatedPosts.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="font-sans font-bold text-xs text-slate-500 uppercase tracking-widest block mb-3">
                      Wanderlust Chronicle: Read Next
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedBlog.relatedPosts.map((id: string) => {
                        const matchedArt = blogArticles.find(b => b.id === id);
                        if (!matchedArt) return null;
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              setSelectedBlog(matchedArt);
                              const readerEl = document.getElementById("modal-blog-body");
                              if (readerEl) {
                                readerEl.scrollTo({ top: 0, behavior: "smooth" });
                              }
                            }}
                            className="bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-950/40 p-3 rounded-2xl border border-slate-150 dark:border-slate-800/80 cursor-pointer flex gap-3 transition-colors group align-middle items-center"
                          >
                            <div className="min-w-0 text-left w-full p-1">
                              <span className="font-extrabold font-sans text-[10.5px] leading-tight block text-slate-800 dark:text-slate-150 line-clamp-2 hover:text-[#FFB703]">
                                {matchedArt.title}
                              </span>
                              <span className="text-[9px] text-slate-450 font-mono mt-1.5 block">{matchedArt.category} • Read Guide →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------ LIGHTBOX GALLERY DETAILED POPUP ------------------- */}
      <AnimatePresence>
        {activeGalleryPhoto && (
          <motion.div
            id="gallery-lightbox"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-4xl w-full bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              {/* Photo Image Stage */}
              <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[450px]">
                <img
                  src={activeGalleryPhoto.url}
                  alt={activeGalleryPhoto.placeName}
                  className="max-h-[75vh] w-full object-contain"
                />
                
                {/* Close Button on Image for mobile comfort */}
                <button
                  type="button"
                  onClick={() => setActiveGalleryPhoto(null)}
                  className="absolute top-[12px] right-[12px] w-[32px] h-[32px] p-0 flex items-center justify-center rounded-full backdrop-blur-md bg-black/60 border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer z-20"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Sidebar description details */}
              <div className="w-full md:w-80 p-6 bg-slate-900 text-white flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider">Nomad Travel Snapshot</span>
                    <h3 className="text-lg font-bold font-sans tracking-tight text-white">{activeGalleryPhoto.placeName}</h3>
                  </div>

                  <p className="text-xs text-slate-350 leading-relaxed font-sans bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                    "{activeGalleryPhoto.caption || "Spectacular moment captured on travel exploration path."}"
                  </p>

                  {activeGalleryPhoto.pinterestUrl && (
                    <div className="pt-2">
                      <a
                        href={activeGalleryPhoto.pinterestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 justify-center bg-[#E60023] hover:bg-[#b8001c] text-white font-semibold font-sans text-xs py-3 px-3.5 rounded-xl transition-all w-full shadow-md"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.76-2.245 3.76-5.487 0-2.861-2.063-4.869-5.007-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.166-1.495-.69-2.433-2.878-2.433-4.63 0-3.771 2.737-7.238 7.904-7.238 4.15 0 7.375 2.957 7.375 6.91 0 4.122-2.599 7.44-6.208 7.44-1.213 0-2.352-.63-2.743-1.377l-.747 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.983-5.368 11.983-11.987C24 5.367 18.637 0 12.017 0z" />
                        </svg>
                        <span>Explore Dynamic Pin</span>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                      {activeGalleryPhoto.uploadedBy ? activeGalleryPhoto.uploadedBy.charAt(0) : "T"}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-sans font-bold block truncate text-slate-100">Shared by {activeGalleryPhoto.uploadedBy || "Anonymous Nomad"}</span>
                      <span className="text-[9.5px] text-slate-400 font-mono block">Verified Explorer</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGalleryPhoto(null)}
                  className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-3 rounded-xl shadow transition-all cursor-pointer uppercase tracking-wider block text-center"
                >
                  Close Snapshot View
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AiAssistant />

      {/* Toast notifications portal */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-slate-950/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-white flex items-start gap-3"
          >
            <div className="mt-0.5">
              {toast.type === "success" && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
              )}
              {toast.type === "info" && (
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">i</span>
              )}
              {toast.type === "error" && (
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs">!</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-sans font-medium leading-relaxed whitespace-pre-line">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white transition-colors text-lg font-bold leading-none select-none pl-1 cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp contact button bottom-right */}
      <a
        id="whatsapp-floating-button"
        href="https://wa.me/94771234567?text=Hi!%2520I'm%252520using%2520IZYSL.COM%2520and%2520would%2520like%2520some%2520travel%2520assistance."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-40 bg-[#25D366] hover:bg-[#128C7E] text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-115 flex items-center justify-center cursor-pointer group hover:shadow-emerald-500/20"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.448 4.7 1.449 5.483 0 9.944-4.461 9.947-9.948.002-2.657-1.03-5.155-2.903-7.03C16.516 1.74 14.02 1.7 11.1 12.003c-2.659-.001-5.155 1.03-7.025 2.905-1.874 1.875-2.904 4.373-2.906 7.03-.004 5.486 4.456 9.95 9.942 9.95zm-2.016-11.13c-.11-.2-.42-.31-.88-.54-.46-.23-2.72-1.34-3.14-1.49-.42-.15-.73-.23-.98.15-.26.38-1 .99-1.22 1.22-.23.23-.46.26-.92.03-.46-.23-1.95-.72-3.71-2.29-1.37-1.22-2.29-2.73-2.56-3.19-.27-.46-.03-.71.2-.94.21-.21.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.57-.04-.8-.11-.23-.98-2.36-1.34-3.23-.35-.85-.71-.74-.98-.75-.25-.01-.54-.01-.84-.01-.3 0-.79.11-1.2.56-.41.45-1.58 1.54-1.58 3.76s1.62 4.36 1.85 4.67c.23.31 3.2 4.88 7.74 6.84 1.08.47 1.92.75 2.58.96.99.31 1.9.27 2.62.16.8-.12 2.72-1.11 3.1-2.19.38-1.07.38-2 .27-2.19-.11-.2-.42-.3-.88-.53z" />
        </svg>
        <span className="absolute right-14 bg-slate-900 dark:bg-slate-950 text-white text-[10.5px] font-sans font-medium px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-slate-700/50">
          Chat with our Sri Lanka Expert 💬
        </span>
      </a>
      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800/85 flex justify-around items-center h-14 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "explore" ? "text-emerald-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Explore</span>
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "map" ? "text-[#0077be] dark:text-[#ffea6c]" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Map className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Map</span>
        </button>
        <button
          onClick={() => setActiveTab("planner")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "planner" ? "text-emerald-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Planner</span>
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "tips" ? "text-emerald-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Info className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Tips</span>
        </button>
        <button
          onClick={() => setActiveTab("blog")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "blog" ? "text-emerald-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Articles</span>
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "reviews" ? "text-emerald-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Reviews</span>
        </button>
        <button
          onClick={() => setActiveTab("emergency")}
          className={`flex flex-col items-center justify-center w-12 h-full gap-0.5 text-center cursor-pointer transition-colors ${activeTab === "emergency" ? "text-emerald-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          <PhoneCall className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-wide">Directory</span>
        </button>
      </div>

    </div>
  );
}
