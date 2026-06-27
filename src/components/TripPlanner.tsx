import React, { useState, useMemo } from "react";
import { PLACES_DATA, HOTELS_DATA, RESTAURANTS_DATA } from "../data/srilankaData";
import { DestinationCategory, Place, Hotel, Restaurant, TripPlan } from "../types";
import { Compass, Calendar, MapPin, Eye, FileText, Globe, Plus, Trash2, CheckCircle, Search, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";

// Robust helper to determine province on the fly from name and location keywords
const determineProvince = (place: Place): string => {
  const loc = (place.location || "").toLowerCase();
  const name = (place.name || "").toLowerCase();
  const text = `${loc} ${name}`;

  if (text.includes("western") || text.includes("colombo") || text.includes("negombo") || text.includes("mount lavinia") || text.includes("galle face") || text.includes("kelaniya") || text.includes("beddagana") || text.includes("bellanwila") || text.includes("kotte")) {
    return "Western";
  }
  if (text.includes("eastern") || text.includes("trincomalee") || text.includes("arugam") || text.includes("nilaveli") || text.includes("batticaloa") || text.includes("ampara") || text.includes("pasikudah") || text.includes("pigeon island") || text.includes("kumana")) {
    return "Eastern";
  }
  if (text.includes("northern") || text.includes("jaffna") || text.includes("casuarina") || text.includes("charty") || text.includes("nallur") || text.includes("nagadeepa") || text.includes("delft") || text.includes("point pedro") || text.includes("kilinochchi") || text.includes("mannar") || text.includes("mullaitivu") || text.includes("vavuniya")) {
    return "Northern";
  }
  if (text.includes("sabaragamuwa") || text.includes("ratnapura") || text.includes("kitulgala") || text.includes("sinharaja") || text.includes("kuruwita") || text.includes("bopath") || text.includes("belihuloya") || text.includes("kegalle") || text.includes("pinnawala")) {
    return "Sabaragamuwa";
  }
  if (text.includes("uva") || text.includes("badulla") || text.includes("ella") || text.includes("diyaluma") || text.includes("ravana") || text.includes("namunukula") || text.includes("bambarakanda") || text.includes("koslanda") || text.includes("wellawaya") || text.includes("gal oya") || text.includes("kataragama") || text.includes("monaragala") || text.includes("dunhinda") || text.includes("haputale") || text.includes("diyatalawa") || text.includes("bandarawela") || text.includes("haldummulla")) {
    return "Uva";
  }
  if (text.includes("north central") || text.includes("anuradhapura") || text.includes("polonnaruwa") || text.includes("mihintale") || text.includes("sigiriya") || text.includes("ritigala") || text.includes("wilpattu") || text.includes("giritale") || text.includes("kaudulla") || text.includes("minneriya")) {
    return "North Central";
  }
  if (text.includes("north western") || text.includes("puttalam") || text.includes("chilaw") || text.includes("kurunegala") || text.includes("anamaduwa") || text.includes("kalpitiya") || text.includes("yapahuwa") || text.includes("munneswaram")) {
    return "North Western";
  }
  if (text.includes("southern") || text.includes("galle") || text.includes("mirissa") || text.includes("unawatuna") || text.includes("tangalle") || text.includes("hambantota") || text.includes("matara") || text.includes("yala") || text.includes("walawe") || text.includes("hiriketiya") || text.includes("weligama") || text.includes("hikkaduwa") || text.includes("bundala") || text.includes("kataragama") || text.includes("koggal") || text.includes("ahungalla") || text.includes("talpe") || text.includes("dikwella") || text.includes("midigama")) {
    return "Southern";
  }
  if (text.includes("central") || text.includes("kandy") || text.includes("nuwara eliya") || text.includes("hatton") || text.includes("talawakele") || text.includes("maskeliya") || text.includes("horton") || text.includes("knuckles") || text.includes("pussellawa") || text.includes("dambulla") || text.includes("ramboda") || text.includes("aberdeen") || text.includes("mahaweli") || text.includes("devon") || text.includes("st. clair") || text.includes("laxapana") || text.includes("pidurutalagala") || text.includes("adams peak") || text.includes("gadaladeniya") || text.includes("lankatilaka") || text.includes("ambuluwawa") || text.includes("matale") || text.includes("sigiriya")) {
    return "Central";
  }

  // General fallback city associations
  if (text.includes("galle") || text.includes("mirissa") || text.includes("matara")) return "Southern";
  if (text.includes("kandy") || text.includes("eliya") || text.includes("matale")) return "Central";
  if (text.includes("jaffna")) return "Northern";
  if (text.includes("batticaloa") || text.includes("trinco")) return "Eastern";
  if (text.includes("anuradhapura") || text.includes("polonnaruwa")) return "North Central";
  if (text.includes("kurunegala") || text.includes("puttalam")) return "North Western";
  if (text.includes("ella") || text.includes("badulla")) return "Uva";

  return "Central"; // Ultimate fallback
};

// Precise category classification into the 5 requested sections
const classifyPlace = (p: Place): string => {
  const name = p.name.toLowerCase();
  const cat = p.category;

  if (cat === DestinationCategory.BEACHES || name.includes("beach") || name.includes("bay") || name.includes("coast") || name.includes("lagoon") || name.includes("surf") || name.includes("weligama")) {
    return "beaches";
  }
  if (cat === DestinationCategory.WATERFALLS || name.includes("falls") || name.includes("ella") || name.includes("river") || name.includes("oya") || name.includes("waterfall") || name.includes("lake") || name.includes("rapids")) {
    return "waterfalls";
  }
  if (cat === DestinationCategory.SAFARI_PARKS || name.includes("park") || name.includes("sanctuary") || name.includes("reserve") || name.includes("forest") || name.includes("safari") || name.includes("sinharaja")) {
    return "parks";
  }
  if (cat === DestinationCategory.MOUNTAINS_HILL_COUNTRY || name.includes("mountain") || name.includes("peak") || name.includes("rock") || name.includes("ridge") || name.includes("range") || name.includes("hill") || name.includes("hiking") || name.includes("trek") || name.includes("gap") || name.includes("knuckles") || name.includes("pidurutalagala")) {
    return "mountains";
  }
  if (cat === DestinationCategory.HERITAGE_SITES || name.includes("temple") || name.includes("viharaya") || name.includes("kovil") || name.includes("shrine") || name.includes("vihara") || name.includes("dagoba") || name.includes("stupa") || name.includes("vihare") || name.includes("sigiriya") || name.includes("anuradhapura") || name.includes("polonnaruwa") || name.includes("mihintale")) {
    return "temples";
  }

  // Fallback for remaining cases
  return "temples";
};

interface PlaceWithProvince extends Place {
  province: string;
  assignedCategory: string;
}

export default function TripPlanner() {
  const [selectedDuration, setSelectedDuration] = useState<number>(3); // Default 3 Days
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>(["ht-98acres"]); // Pre-select standard default hotel
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>(["rs-cafechill"]); // Pre-select specialty default restaurant
  
  const [generatedPlan, setGeneratedPlan] = useState<TripPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Show More / Show Less state tracking for each category section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    beaches: false,
    temples: false,
    waterfalls: false,
    parks: false,
    mountains: false,
  });

  // Preprocess all PLACES_DATA with province classification
  const processedPlaces = useMemo<PlaceWithProvince[]>(() => {
    return PLACES_DATA.map(p => ({
      ...p,
      province: determineProvince(p),
      assignedCategory: classifyPlace(p)
    }));
  }, []);

  // Filter based on search query
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return processedPlaces;
    const query = searchQuery.toLowerCase();
    return processedPlaces.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.location.toLowerCase().includes(query) ||
      p.province.toLowerCase().includes(query)
    );
  }, [processedPlaces, searchQuery]);

  const toggleSelection = (id: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(id)) {
      setter(list.filter(item => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  const getSortedRoute = (places: PlaceWithProvince[]) => {
    // Elegant route looping sequence: Western -> North Western -> Northern -> North Central -> Eastern -> Central -> Uva -> Sabaragamuwa -> Southern
    const order: Record<string, number> = {
      "Western": 1,
      "North Western": 2,
      "Northern": 3,
      "North Central": 4,
      "Eastern": 5,
      "Central": 6,
      "Uva": 7,
      "Sabaragamuwa": 8,
      "Southern": 9,
    };

    return [...places].sort((a, b) => {
      const orderA = order[a.province] || 10;
      const orderB = order[b.province] || 10;
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort: Northern latitude down to Southern
      return b.latitude - a.latitude;
    });
  };

  const handleGenerateItinerary = () => {
    const chosenPlaces = processedPlaces.filter(p => selectedPlaceIds.includes(p.id));
    const sortedRoute = getSortedRoute(chosenPlaces);
    
    const chosenHotels = HOTELS_DATA.filter(h => selectedHotels.includes(h.id));
    const chosenRestaurants = RESTAURANTS_DATA.filter(r => selectedRestaurants.includes(r.id));

    // Fallbacks if user hasn't selected items
    const defaultBeaches = processedPlaces.filter(p => p.assignedCategory === "beaches").slice(0, 4);
    const defaultWaterfalls = processedPlaces.filter(p => p.assignedCategory === "waterfalls").slice(0, 4);
    const defaultRoute = [...defaultBeaches, ...defaultWaterfalls];

    const routeToUse = sortedRoute.length > 0 ? sortedRoute : defaultRoute;
    const hotelList = chosenHotels.length > 0 ? chosenHotels : [HOTELS_DATA[0]];
    const restaurantList = chosenRestaurants.length > 0 ? chosenRestaurants : RESTAURANTS_DATA.slice(0, 3);

    const generatedItinerary: TripPlan["itinerary"] = {};

    for (let day = 1; day <= selectedDuration; day++) {
      const activeHotel = hotelList[(day - 1) % hotelList.length];
      const activeRestaurant1 = restaurantList[((day * 2) - 2) % restaurantList.length];
      const activeRestaurant2 = restaurantList[((day * 2) - 1) % restaurantList.length];
      
      // Pull 2 routed places for this day
      const place1 = routeToUse[((day * 2) - 2) % routeToUse.length];
      const place2 = routeToUse[((day * 2) - 1) % routeToUse.length];

      generatedItinerary[`Day ${day}`] = {
        theme: day === 1 
          ? `Arrival & Scenic Explorations in ${place1.province}` 
          : day === 2 
            ? `Highland Nature Marvels & Wellness Drive in ${place1.province}` 
            : `Coastal Wonders & Pristine Preservation in ${place2.province}`,
        morning: [
          `Greet the sunrise with a specialty handcrafted breakfast at ${activeHotel.name}.`,
          `Set off in a premium private ride for an early journey to ${place1.name} in ${place1.province}. ${place1.description}`,
          place1.visitorTips && place1.visitorTips[0] ? `Curated advice: ${place1.visitorTips[0]}` : `Settle in, appreciate the grand misty mornings, and take clear landscape photographs.`
        ],
        afternoon: [
          `Delight in a fine-dining luncheon at ${activeRestaurant1.name}, trying their highly recommended delicacies.`,
          `Embark on a scenic guided excursion to ${place2.name} located in ${place2.province}. ${place2.description}`,
          place2.visitorTips && place2.visitorTips[0] ? `Insider recommendation: ${place2.visitorTips[0]}` : `Explore the rich surrounding heritage and pristine native landscapes.`
        ],
        evening: [
          `Gather for an elegant sunset dinner and dynamic organic beachside cocktails at ${activeRestaurant2.name}.`,
          `Return to your luxurious comfort lounge at ${activeHotel.name} for a restful overnight sleep.`
        ]
      };
    }

    const newTrip: TripPlan = {
      id: `plan-${Date.now()}`,
      userId: "local-user",
      title: `Curated ${selectedDuration}-Day Sri Lanka Luxury Journey`,
      durationDays: selectedDuration,
      itinerary: generatedItinerary,
      createdAt: new Date().toISOString()
    };

    setGeneratedPlan(newTrip);
    setIsSaved(false);

    // Smooth auto-scroll to the output segment
    setTimeout(() => {
      document.getElementById("planner-itinerary-output")?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const savePlanningToUser = () => {
    if (!generatedPlan) return;
    const existingStr = localStorage.getItem("izysl_plans") || localStorage.getItem("visit_srilanka_plans") || "[]";
    const existingPlans = JSON.parse(existingStr);
    localStorage.setItem("izysl_plans", JSON.stringify([...existingPlans, generatedPlan]));
    setIsSaved(true);
  };

  // Section configs for modularity
  const sectionConfigs = [
    { key: "beaches", title: "🏖️ Section 2: Beaches", tooltip: "Add premium beach shores and surfing bays" },
    { key: "temples", title: "🏛️ Section 3: Temples", tooltip: "Add historical sacred temples and religious sites" },
    { key: "waterfalls", title: "💧 Section 4: Waterfalls & Rivers", tooltip: "Add cascading water chutes and rivers" },
    { key: "parks", title: "🌿 Section 5: National Parks", tooltip: "Add tiger, elephant and leopard safaris" },
    { key: "mountains", title: "⛰️ Section 6: Mountains & Hiking", tooltip: "Add dramatic summits and highland treks" },
  ];

  // Map category to representative icon
  const secIconMap: Record<string, string> = {
    beaches: "🏖️",
    temples: "🏛️",
    waterfalls: "💧",
    parks: "🌿",
    mountains: "⛰️"
  };

  const chosenPlaces = processedPlaces.filter(p => selectedPlaceIds.includes(p.id));
  const sortedRoute = getSortedRoute(chosenPlaces);

  return (
    <div id="trip-planner-container" className="bg-slate-50 dark:bg-[#0b0f19] rounded-3xl p-6 md:p-10 border border-slate-200/60 dark:border-slate-800/80 shadow-inner">
      
      {/* Header Segment */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <span className="bg-amber-500/10 border border-[#fbbf24]/30 text-[#fbbf24] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider font-sans inline-flex items-center gap-1.5 mb-3">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} /> Interactive Luxury Itinerary Builder
        </span>
        <h1 className="text-3xl md:text-4xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Map Your Elite Bespoke Itinerary
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
          Explore all 140+ real locations from our complete travel directory. Our advanced routing engines auto-sequence your selections by province to prevent highway backtracking.
        </p>
        <div className="mt-4 flex items-center justify-center">
          <a
            href="https://wa.me/94778677803?text=Hi!%20I'm%20using%2520the%2520IZYSL%2520Planner%20and%20would%20like%20to%20get%20help%20planning%20a%20custom%20trip."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-semibold px-4.5 py-2.5 rounded-full shadow-md hover:shadow-emerald-500/10 transition-all transform hover:scale-103 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.448 4.7 1.449 5.483 0 9.944-4.461 9.947-9.948.002-2.657-1.03-5.155-2.903-7.03C16.516 1.74 14.02 1.7 11.1 12.003c-2.659-.001-5.155 1.03-7.025 2.905-1.874 1.875-2.904 4.373-2.906 7.03-.004 5.486 4.456 9.95 9.942 9.95zm-2.016-11.13c-.11-.2-.42-.31-.88-.54-.46-.23-2.72-1.34-3.14-1.49-.42-.15-.73-.23-.98.15-.26.38-1 .99-1.22 1.22-.23.23-.46.26-.92.03-.46-.23-1.95-.72-3.71-2.29-1.37-1.22-2.29-2.73-2.56-3.19-.27-.46-.03-.71.2-.94.21-.21.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.57-.04-.8-.11-.23-.98-2.36-1.34-3.23-.35-.85-.71-.74-.98-.75-.25-.01-.54-.01-.84-.01-.3 0-.79.11-1.2.56-.41.45-1.58 1.54-1.58 3.76s1.62 4.36 1.85 4.67c.23.31 3.2 4.88 7.74 6.84 1.08.47 1.92.75 2.58.96.99.31 1.9.27 2.62.16.8-.12 2.72-1.11 3.1-2.19.38-1.07.38-2 .27-2.19-.11-.2-.42-.3-.88-.53z" />
            </svg>
            Need a custom tour plan? Talk to us on WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive Column (Forms, Place Pickers) */}
        <div className="lg:col-span-5 space-y-6 max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Section 1: Trip Duration */}
          <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-sans mb-3">
              📅 1. Select Journey Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 7, 14].map((duration) => (
                <button
                  key={duration}
                  id={`btn-dur-${duration}`}
                  onClick={() => setSelectedDuration(duration)}
                  className={`py-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    selectedDuration === duration
                      ? "bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-500 text-white shadow-md font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-sm font-sans">{duration}</span>
                  <span className="text-[9px] font-medium tracking-wider opacity-90 uppercase">Day{duration > 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instant Search Database Block */}
          <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-sans mb-2">
              🔍 Instant Travel Database Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any place (e.g. Galle, Ella, Ramboda)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
              />
            </div>
            {searchQuery.trim() !== "" && (
              <div className="mt-2 flex justify-between items-center">
                <span className="text-[10px] font-mono text-emerald-500">
                  Found {filteredPlaces.length} matching locations
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {/* Section 2 to 6: Loop through categories */}
          {sectionConfigs.map((sec) => {
            const sectionPlaces = filteredPlaces.filter(p => p.assignedCategory === sec.key);
            const isExpanded = expandedSections[sec.key];
            const visiblePlaces = isExpanded ? sectionPlaces : sectionPlaces.slice(0, 8);
            
            if (sectionPlaces.length === 0) return null; // Hide categories with 0 matches when searching

            return (
              <div key={sec.key} className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-350 dark:text-slate-300 uppercase tracking-widest block font-sans">
                    {sec.title}
                  </span>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-md font-mono">
                    {sectionPlaces.length} Available
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mb-3.5 leading-none">
                  {sec.tooltip}
                </span>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {visiblePlaces.map((place) => {
                    const active = selectedPlaceIds.includes(place.id);
                    return (
                      <button
                        key={place.id}
                        id={`btn-select-p-${place.id}`}
                        onClick={() => toggleSelection(place.id, selectedPlaceIds, setSelectedPlaceIds)}
                        className={`group px-3 py-2 text-left rounded-xl border text-xs transition-all duration-300 flex items-center justify-between gap-1 cursor-pointer overflow-hidden ${
                          active
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                            : "bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-[#0f172a]"
                        }`}
                      >
                        <div className="truncate pr-1 flex flex-col">
                          <span className="truncate text-slate-200 group-hover:text-white transition-colors">{place.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono truncate">{place.province}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 transition-all ${
                          active 
                            ? "bg-emerald-500 text-white font-bold" 
                            : "bg-slate-800 text-slate-400 group-hover:text-sky-400 group-hover:bg-slate-750"
                        }`}>
                          {active ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Show More toggle button if > 8 places */}
                {sectionPlaces.length > 8 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, [sec.key]: !isExpanded }))}
                    className="mt-2.5 w-full text-center text-[10px] text-sky-400 hover:text-sky-300 font-semibold font-mono flex items-center justify-center gap-1 cursor-pointer py-1 rounded bg-[#0b0f19]/80 border border-slate-800/80 hover:bg-[#0f172a]/90 transition-all duration-300"
                  >
                    {isExpanded ? (
                      <>Show Less ↑</>
                    ) : (
                      <>Show More (+{sectionPlaces.length - 8} locations) ↓</>
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {/* Elite Resorts Selection */}
          <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block font-sans mb-1">
              🏩 Section 7: Luxury Retreats
            </span>
            <span className="text-[10px] text-slate-400 block mb-3.5 leading-none">Choose exclusive lodging base parameters</span>
            <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {HOTELS_DATA.map((hotel) => {
                const active = selectedHotels.includes(hotel.id);
                return (
                  <div
                    key={hotel.id}
                    onClick={() => toggleSelection(hotel.id, selectedHotels, setSelectedHotels)}
                    className={`px-3 py-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all duration-200 ${
                      active
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                        : "bg-[#0b0f19] border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold block text-slate-200">{hotel.name}</span>
                      <span className="text-[10px] text-slate-500">{hotel.location} • {hotel.priceRange}</span>
                    </div>
                    <span className="text-xs flex-shrink-0">{active ? "✓" : "+"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialty Restaurants Selection */}
          <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850 font-sans">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block font-sans mb-1">
              🍽️ Section 8: Specialty Dining
            </span>
            <span className="text-[10px] text-slate-400 block mb-3.5 leading-none">Add gourmet and fine-dining experiences</span>
            <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {RESTAURANTS_DATA.map((r) => {
                const active = selectedRestaurants.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleSelection(r.id, selectedRestaurants, setSelectedRestaurants)}
                    className={`px-3 py-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all duration-200 ${
                      active
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                        : "bg-[#0b0f19] border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold block text-slate-200">{r.name}</span>
                      <span className="text-[10px] text-slate-500">{r.cuisine} • {r.priceRange}</span>
                    </div>
                    <span className="text-xs flex-shrink-0">{active ? "✓" : "+"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            id="btn-trigger-generation"
            onClick={handleGenerateItinerary}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 hover:brightness-105 active:scale-[0.98] text-white font-bold font-sans uppercase tracking-wider text-xs py-4.5 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Calendar className="w-4 h-4" /> Synthesize Bespoke Route
          </button>
        </div>

        {/* Right Output Column (Itinerary plan, Interactive Route) */}
        <div className="lg:col-span-7">
          {generatedPlan ? (
            <div id="planner-itinerary-output" className="bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 md:p-8 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-sans flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Customized Elite Journey Map
                  </span>
                  <h3 className="text-xl md:text-2xl font-sans font-bold text-slate-900 dark:text-white mt-1">
                    {generatedPlan.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-save-plan"
                    onClick={savePlanningToUser}
                    disabled={isSaved}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans flex items-center gap-1.5 transition-all ${
                      isSaved
                        ? "bg-slate-100 dark:bg-slate-850 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Saved to Wishlist
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Save Plan
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Requirement 5: Smart Route Visual Grid */}
              {chosenPlaces.length > 0 && (
                <div className="my-6 p-4.5 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-[#0f172a] border border-[#fbbf24]/20 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24] uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Optimized Smart Route sequence
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed mb-3.5">
                    Your selections have been grouped and organized geographically by Province hierarchy (Western ➔ Central ➔ Uva ➔ Southern) to ensure maximum driving continuity.
                  </div>
                  <div className="flex flex-wrap items-center gap-y-2.5 gap-x-1.5">
                    {sortedRoute.map((place, idx) => (
                      <React.Fragment key={place.id}>
                        <div className="flex items-center gap-1.5 bg-[#1e3a8a]/35 border border-[#fbbf24]/20 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200">
                          <span className="text-sm">
                            {secIconMap[place.assignedCategory] || "📍"}
                          </span>
                          <span className="font-semibold">{place.name}</span>
                          <span className="text-[9px] text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/15 px-1.5 py-0.5 rounded font-mono">
                            {place.province}
                          </span>
                        </div>
                        {idx < sortedRoute.length - 1 && (
                          <span className="text-slate-500 text-xs font-bold font-mono">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Day Details Accordions/Cards */}
              <div className="mt-6 space-y-6">
                {Object.keys(generatedPlan.itinerary).map((dayName) => {
                  const dayData = generatedPlan.itinerary[dayName];
                  return (
                    <motion.div
                      key={dayName}
                      id={`itinerary-card-${dayName.replace(" ", "-")}`}
                      className="bg-slate-50 dark:bg-[#0b0f19]/60 rounded-2xl p-5 border border-slate-150 dark:border-slate-800/60 shadow-sm"
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {dayName}
                        </span>
                        <h4 className="text-sm font-sans font-bold text-slate-800 dark:text-slate-200">
                          {dayData.theme}
                        </h4>
                      </div>

                      {/* Daily slots */}
                      <div className="space-y-4 mt-4 text-xs">
                        {/* Morning */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start">
                          <span className="md:col-span-2 text-slate-400 font-sans tracking-wider block font-bold uppercase text-[9px] pt-1">
                            🌅 Morning
                          </span>
                          <ul className="md:col-span-10 space-y-2 text-slate-600 dark:text-slate-300 list-none pl-0">
                            {dayData.morning.map((act, i) => (
                              <li key={i} className="relative pl-4 leading-relaxed font-sans">
                                <span className="absolute left-0 top-1.5 w-1 h-1 bg-emerald-500 rounded-full"></span>
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Afternoon */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start pt-3 border-t border-slate-120 dark:border-slate-850">
                          <span className="md:col-span-2 text-slate-400 font-sans tracking-wider block font-bold uppercase text-[9px] pt-1">
                            ☀️ Afternoon
                          </span>
                          <ul className="md:col-span-10 space-y-2 text-slate-600 dark:text-slate-300 list-none pl-0">
                            {dayData.afternoon.map((act, i) => (
                              <li key={i} className="relative pl-4 leading-relaxed font-sans">
                                <span className="absolute left-0 top-1.5 w-1 h-1 bg-sky-500 rounded-full"></span>
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Evening */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start pt-3 border-t border-slate-125 dark:border-slate-850">
                          <span className="md:col-span-2 text-slate-400 font-sans tracking-wider block font-bold uppercase text-[9px] pt-1">
                            🌙 Evening
                          </span>
                          <ul className="md:col-span-10 space-y-2 text-slate-600 dark:text-slate-300 list-none pl-0">
                            {dayData.evening.map((act, i) => (
                              <li key={i} className="relative pl-4 leading-relaxed font-sans">
                                <span className="absolute left-0 top-1.5 w-1 h-1 bg-indigo-500 rounded-full"></span>
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* PDF Print Layer */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                <a
                  href={`https://wa.me/94778677803?text=Hi!%20I%20have%20planned%20a%20trip%20titled%20"${encodeURIComponent(generatedPlan.title)}"%20using%20your%20Trip%20Planner%20and%20would%20like%20to%20discuss%20it.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold font-sans text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer transform hover:scale-103"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.448 4.7 1.449 5.483 0 9.944-4.461 9.947-9.948.002-2.657-1.03-5.155-2.903-7.03C16.516 1.74 14.02 1.7 11.1 12.003c-2.659-.001-5.155 1.03-7.025 2.905-1.874 1.875-2.904 4.373-2.906 7.03-.004 5.486 4.456 9.95 9.942 9.95zm-2.016-11.13c-.11-.2-.42-.31-.88-.54-.46-.23-2.72-1.34-3.14-1.49-.42-.15-.73-.23-.98.15-.26.38-1 .99-1.22 1.22-.23.23-.46.26-.92.03-.46-.23-1.95-.72-3.71-2.29-1.37-1.22-2.29-2.73-2.56-3.19-.27-.46-.03-.71.2-.94.21-.21.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.57-.04-.8-.11-.23-.98-2.36-1.34-3.23-.35-.85-.71-.74-.98-.75-.25-.01-.54-.01-.84-.01-.3 0-.79.11-1.2.56-.41.45-1.58 1.54-1.58 3.76s1.62 4.36 1.85 4.67c.23.31 3.2 4.88 7.74 6.84 1.08.47 1.92.75 2.58.96.99.31 1.9.27 2.62.16.8-.12 2.72-1.11 3.1-2.19.38-1.07.38-2 .27-2.19-.11-.2-.42-.3-.88-.53z" />
                  </svg>
                  Book / Discuss Trip on WhatsApp
                </a>
                <button
                  id="btn-print-itinerary"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-semibold font-sans text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Open Print Layout (PDF)
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-[#0f172a]/40 border border-dashed border-slate-250 dark:border-slate-800/60 rounded-3xl h-[450px] flex flex-col items-center justify-center p-8 text-center shadow-inner">
              <div className="bg-slate-200/50 dark:bg-slate-800/40 p-4 rounded-full mb-4">
                <Compass className="w-8 h-8 text-slate-400 dark:text-slate-500 animate-spin" style={{ animationDuration: "14s" }} />
              </div>
              <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200">Your personalized itinerary will populate here</h3>
              <p className="text-slate-400 dark:text-slate-400 text-xs max-w-sm mt-1.5 leading-relaxed font-sans">
                Build your optimal route! Search or check locations across beaches, waterfall streams, temples and safaris. Then click "Synthesize Route" to produce day-by-day travel timelines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
