import { PLACES_DATA } from "../src/data/srilankaData";
import fs from "fs";

const urls = PLACES_DATA.map(p => `https://izysl.com/place/${p.id}`);
fs.writeFileSync("places_links_list.txt", urls.join("\n"), "utf-8");
console.log(`Successfully wrote ${urls.length} place links to places_links_list.txt`);
