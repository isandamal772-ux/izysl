import { Place, Hotel, HotelCategory } from "../types";

// Dynamic unsplash images for premium hotel types
const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", // 5-Star Luxury
  "https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=800&q=80", // Jungle Lodge
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", // Heritage Manor
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", // Ocean Villa
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80", // Hilltop Vista
  "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=800&q=80", // Eco Oasis
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80", // Boutique Rooms
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", // Budget Inn
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80", // Social Hostel
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80"  // Eco Cottage
];

export function generateHotelsForPlace(place: Place): Hotel[] {
  const result: Hotel[] = [];
  
  // Clean special suffixes from place name to avoid naming clutter
  let spotName = place.name
    .replace(" Ella", "")
    .replace(" Falls", "")
    .replace(" Sanctuary", "")
    .replace(" National Park", "")
    .replace(" Temple", "")
    .replace(" Fortress", "");

  const hotelTemplates = [
    {
      nameSuffix: "Grande Regency & Royal Spa",
      category: HotelCategory.LUXURY,
      starClass: 5,
      pricePerNight: 280,
      priceRange: "$240 - $480 / Night",
      facilities: ["Infinity Pool", "Ayurvedic Spa", "Premium Lounge", "Fine Dining Room", "Helipad Access", "Concierge Guide"],
      descPattern: "A masterclass in elite Sri Lankan hospitality. Nestled in prime scenic acreage, this 5-star colonial-infused palace offers signature luxury butler suites and panoramic direct views of pristine local landmarks.",
    },
    {
      nameSuffix: "Wilderness Sanctuary & Eco Resort",
      category: HotelCategory.RESORT,
      starClass: 5,
      pricePerNight: 190,
      priceRange: "$160 - $320 / Night",
      facilities: ["Infinity Pool", "Elephant Safari Outpost", "Guided Jungle Treks", "Solar Deck", "Organic Restro", "Free Wi-Fi"],
      descPattern: "An immersive eco-sensitive resort integrated beautifully into the surrounding wild canopy. Built with certified green materials and featuring suspended luxury tents with breathtaking open-air plunge pools.",
    },
    {
      nameSuffix: "Heritage Manor & Tea Estate Hotel",
      category: HotelCategory.LUXURY,
      starClass: 4,
      pricePerNight: 140,
      priceRange: "$120 - $220 / Night",
      facilities: ["Heated Mountain Pool", "English High Tea", "Billiards Clubhouse", "Organic Gardens", "Log Fire lounge"],
      descPattern: "Dating back to the golden era, this restored heritage manor captures true architectural brilliance. Offers original antique furnishings, high-altitude botanical gardens, and scenic guided tours of local plantations.",
    },
    {
      nameSuffix: "Anantara Paradise Hill & Coast Villas",
      category: HotelCategory.RESORT,
      starClass: 5,
      pricePerNight: 350,
      priceRange: "$300 - $650 / Night",
      facilities: ["Private Beach/Valley View Pools", "Luxury Spa Pavilions", "Oceanfront Yoga Deck", "Sommelier Cellar", "24/7 Room Service"],
      descPattern: "Ultimate dream villas offering secluded infinity compounds. Exquisite hand-carved local woodwork, floor-to-ceiling glass paneling, and curated dining experiences under the stars.",
    },
    {
      nameSuffix: "Vista Heights Mountain Resort",
      category: HotelCategory.RESORT,
      starClass: 4,
      pricePerNight: 115,
      priceRange: "$95 - $180 / Night",
      facilities: ["Terraced Pool", "Sunset Deck", "Trekking Gear Rental", "Local Tea Lounge", "Gym"],
      descPattern: "Perched gracefully on a scenic cliffside. Featuring signature private balcony rooms optimized to view misty sunrise peaks, paired with highly rated regional standard culinary choices.",
    },
    {
      nameSuffix: "Mandara Green Eco Lodge",
      category: HotelCategory.LODGE,
      starClass: 3,
      pricePerNight: 75,
      priceRange: "$60 - $120 / Night",
      facilities: ["Natural Rock Pool", "Solar Power Grid", "Yoga Shala", "Vegetarian Kitchen", "Bicycle Hire"],
      descPattern: "Disconnect completely in a soothing rustic sanctuary. Nestled deeply among spice gardens and therapeutic water streams, this eco-lodge prioritizes mind relaxation and simple local comforts.",
    },
    {
      nameSuffix: "Bawa Design Boutique Collection",
      category: HotelCategory.LUXURY,
      starClass: 4,
      pricePerNight: 165,
      priceRange: "$130 - $260 / Night",
      facilities: ["Architectural Pool", "Sculpture Courtyard", "Modernist Cocktail Bar", "Curated Library", "Rain Showers"],
      descPattern: "Inspired directly by the geometric, open-air tropical modern style of Geoffrey Bawa. Features beautiful flowing indoor courtyards, minimalist aesthetic design, and exceptional artistic themes.",
    },
    {
      nameSuffix: "Paradise Comfort Suites & Inn",
      category: HotelCategory.BUDGET,
      starClass: 3,
      pricePerNight: 45,
      priceRange: "$35 - $75 / Night",
      facilities: ["Cozy Dine-In", "Laundry Service", "Airport Shuttle", "Car & Tuk Rental", "Free Wi-Fi"],
      descPattern: "The definitive choice for clean, cost-effective, and safe family lodging. Boasts comfortable air-conditioned rooms, warm, hospitable hosts, and proximity to all village markets and roads.",
    },
    {
      nameSuffix: "Zostel Social - Adventure Hostel",
      category: HotelCategory.HOSTEL,
      starClass: 2,
      pricePerNight: 18,
      priceRange: "$12 - $30 / Night",
      facilities: ["Social Hammock Lounge", "Shared Guest Kitchen", "Bonfire Hub", "Co-working Studio", "Tour Guide Desk"],
      descPattern: "A legendary backpackers hotspot designed with cozy shipping container rooms and colorful shared bunks. Boasts lively game boards, safe lockers, and curated group expeditions.",
    },
    {
      nameSuffix: "Cozy Valley Cabanas & Homestay",
      category: HotelCategory.LODGE,
      starClass: 3,
      pricePerNight: 35,
      priceRange: "$25 - $55 / Night",
      facilities: ["Home-cooked Curry Meals", "Scenic Lawn Walk", "River Bathing Access", "Eco Cabans", "Tea & Coffee Station"],
      descPattern: "A charming, family-run mountainside homestay capturing genuine rural Sri Lankan heritage. Savor freshly ground estate coffee and traditional, clay-pot cooked wood-fired breakfasts."
    }
  ];

  for (let idx = 0; idx < 10; idx++) {
    const temp = hotelTemplates[idx];
    
    // Slight deterministic lat/long offset around the place (within 1-3 kms)
    const angle = (idx * Math.PI) / 5;
    const distanceOffset = 0.008 + (idx * 0.003); // offsets latitude and longitude
    const latOffset = Math.sin(angle) * distanceOffset;
    const lngOffset = Math.cos(angle) * distanceOffset;
    
    // Deterministic contact number using Sri Lankan area code formulas
    const areaCode = place.location.toLowerCase().includes("nuwara eliya") ? "52" :
                     place.location.toLowerCase().includes("kandy") ? "81" :
                     place.location.toLowerCase().includes("galle") ? "91" :
                     place.location.toLowerCase().includes("colombo") ? "11" : "55";
                     
    const firstPart = Math.floor(220 + (idx * 17) % 80);
    const secondPart = Math.floor(4000 + (idx * 137) % 5000);
    const contact = `+94 ${areaCode} ${firstPart} ${secondPart}`;
    
    const hId = `ht-${place.id}-${idx}`;
    const hotelName = `${spotName} ${temp.nameSuffix}`;
    const hotelUrl = `https://www.safebookingsrilanka.com/hotel/${place.id}-${idx}`;

    result.push({
      id: hId,
      name: hotelName,
      category: temp.category,
      starClass: temp.starClass,
      pricePerNight: temp.pricePerNight,
      priceRange: temp.priceRange,
      facilities: temp.facilities,
      imageUrl: HOTEL_IMAGES[idx],
      rating: +(4.1 + (idx * 0.09) % 0.9).toFixed(1),
      location: `${idx * 2 + 10}, Grand Avenue, Near ${place.name}, ${place.location}`,
      latitude: +(place.latitude + latOffset).toFixed(5),
      longitude: +(place.longitude + lngOffset).toFixed(5),
      bookingUrl: hotelUrl,
      contactNumber: contact,
      description: temp.descPattern
    });
  }

  return result;
}
