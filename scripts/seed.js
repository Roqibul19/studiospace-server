// Adds sample studios so the site has something to show. Safe to run again:
// it updates the sample studios and never touches studios made by real users.
// Run with: npm run seed
import "dotenv/config";
import { MongoClient } from "mongodb";

const photo = (id) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=75&auto=format&fit=crop`;

const IMAGES = {
  softbox: photo("1527011046414-4781f1f94f8c"),
  camera: photo("1554048612-b6a482bc67e5"),
  lenses: photo("1516035069371-29a1b244cc32"),
  photographer: photo("1542038784456-1ea8e935640e"),
  clapper: photo("1485846234645-a62644f84728"),
  editing: photo("1574717024653-61fd2cf4d44d"),
  podcastMic: photo("1590602847861-f357a9332bbc"),
  darkMic: photo("1478737270239-2f02b77fc618"),
  stageMic: photo("1516280440614-37939bbacd81"),
  mixingDesk: photo("1598488035139-bdbb2231ce04"),
  piano: photo("1520523839897-bd0b52f945a0"),
  vintageMic: photo("1511671782779-c97d3d27a1d4"),
  guitar: photo("1471478331149-c72f17e33c73"),
  acoustic: photo("1525201548942-d8732f6617a0"),
  brushes: photo("1460661419201-fd4cecdf8a8b"),
  paints: photo("1513364776144-60967b0f800f"),
  crafts: photo("1452860606245-08befc0ff44b"),
};

const SAMPLE_HOST = {
  ownerName: "StudioSpace Sample Host",
  ownerEmail: "sample-host@studiospace.example",
  ownerImage: null,
};

const STUDIOS = [
  {
    title: "Daylight Cyc Wall Studio",
    category: "Photo Studio",
    hourlyRate: 45,
    securityDeposit: 150,
    maxCapacity: 10,
    location: "Gulshan 2, Dhaka",
    image: IMAGES.softbox,
    gallery: [IMAGES.softbox, IMAGES.camera, IMAGES.lenses],
    amenities: ["Cyc Wall", "Softbox Lighting", "Changing Room", "High-Speed WiFi", "Parking"],
    overview:
      "A bright white cyclorama studio with large north-facing windows and a full softbox kit. It suits fashion lookbooks, product campaigns and team portraits, with a private changing room and space for a small crew.",
    rating: 4.9,
    reviews: [
      { name: "Nadia Rahman", rating: 5, comment: "The cyc wall was spotless and the natural light lasted all afternoon. Our lookbook came together in half the time we planned." },
      { name: "Tanvir Ahmed", rating: 4.8, comment: "Great lighting kit and a very helpful host. Parking made loading our gear simple." },
    ],
  },
  {
    title: "Stage Nine Film Sound Stage",
    category: "Film Stage",
    hourlyRate: 120,
    securityDeposit: 500,
    maxCapacity: 40,
    location: "Tejgaon Industrial Area, Dhaka",
    image: IMAGES.clapper,
    gallery: [IMAGES.clapper, IMAGES.editing, IMAGES.photographer],
    amenities: ["Soundproofing", "Lighting Grid", "Green Screen", "Crew Lounge", "Loading Bay", "Power Backup"],
    overview:
      "A soundproofed stage with an overhead lighting grid, green screen and direct access from the loading bay. Built for short films, commercials and music videos, with a crew lounge and power backup for long shoot days.",
    rating: 4.8,
    reviews: [
      { name: "Farhan Kabir", rating: 4.9, comment: "We shot a full commercial here. The soundproofing is excellent, and the power backup kept us rolling through an outage." },
      { name: "Sadia Islam", rating: 4.7, comment: "Plenty of room for our crew, and the loading bay saved us a lot of time." },
    ],
  },
  {
    title: "The Quiet Room Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 25,
    securityDeposit: 60,
    maxCapacity: 4,
    location: "Dhanmondi 27, Dhaka",
    image: IMAGES.podcastMic,
    gallery: [IMAGES.podcastMic, IMAGES.darkMic, IMAGES.stageMic],
    amenities: ["Acoustic Treatment", "4 Broadcast Mics", "Video Cameras", "Sound Engineer on Request", "High-Speed WiFi"],
    overview:
      "A warm, acoustically treated lounge with four broadcast microphones and a three-camera video setup. Ideal for interviews and video podcasts, with a sound engineer available on request.",
    rating: 4.9,
    reviews: [
      { name: "Rumana Akter", rating: 5, comment: "Our audio has never sounded this clean. The room feels relaxed, which really helps guests open up." },
      { name: "Imran Hossain", rating: 4.8, comment: "Walked in, sat down and started recording. Everything was ready for us." },
    ],
  },
  {
    title: "Blue Note Recording Suite",
    category: "Music Suite",
    hourlyRate: 60,
    securityDeposit: 200,
    maxCapacity: 8,
    location: "Banani 11, Dhaka",
    image: IMAGES.mixingDesk,
    gallery: [IMAGES.mixingDesk, IMAGES.piano, IMAGES.vintageMic],
    amenities: ["Mixing Console", "Vocal Booth", "Upright Piano", "Studio Monitors", "Instrument Rentals"],
    overview:
      "A professional recording suite with a mixing console, isolated vocal booth and a tuned upright piano. It works well for tracking vocals, full band sessions and final mixes, and instruments can be rented on site.",
    rating: 4.7,
    reviews: [
      { name: "Arif Chowdhury", rating: 4.8, comment: "The vocal booth is excellent, and the monitors told us exactly what our mix needed." },
      { name: "Mim Sultana", rating: 4.6, comment: "A lovely piano and a comfortable control room. We have already booked again." },
    ],
  },
  {
    title: "Paper & Pigment Art Workshop",
    category: "Workshop",
    hourlyRate: 20,
    securityDeposit: 50,
    maxCapacity: 15,
    location: "Uttara Sector 7, Dhaka",
    image: IMAGES.brushes,
    gallery: [IMAGES.brushes, IMAGES.paints, IMAGES.crafts],
    amenities: ["Large Work Tables", "Easels", "Natural Light", "Sinks", "Storage Lockers"],
    overview:
      "A light-filled workshop with large tables, easels and easy-clean floors. A comfortable home for painting classes, printmaking sessions and craft meetups, with sinks and lockers for your materials.",
    rating: 4.6,
    reviews: [
      { name: "Tasnim Haque", rating: 4.7, comment: "My students loved the natural light, and clean-up was easy with the sinks close by." },
      { name: "Rafi Uddin", rating: 4.5, comment: "Roomy tables and a friendly host. A great place for a weekend class." },
    ],
  },
  {
    title: "Northlight Portrait Loft",
    category: "Photo Studio",
    hourlyRate: 35,
    securityDeposit: 100,
    maxCapacity: 6,
    location: "Bashundhara R/A, Dhaka",
    image: IMAGES.camera,
    gallery: [IMAGES.camera, IMAGES.lenses, IMAGES.softbox],
    amenities: ["Natural Light", "Seamless Backdrops", "Makeup Station", "Reflectors", "High-Speed WiFi"],
    overview:
      "A cosy loft with soft window light, seamless paper backdrops and a makeup station. A natural choice for headshots, family portraits and personal branding sessions.",
    rating: 4.5,
    reviews: [
      { name: "Sumaiya Noor", rating: 4.6, comment: "Beautiful soft light for headshots. The makeup station was a thoughtful touch." },
      { name: "Hasib Khan", rating: 4.4, comment: "Compact but well equipped, and great value for an hourly booking." },
    ],
  },
  {
    title: "Foundry Band Rehearsal Suite",
    category: "Music Suite",
    hourlyRate: 30,
    securityDeposit: 80,
    maxCapacity: 7,
    location: "Mirpur DOHS, Dhaka",
    image: IMAGES.guitar,
    gallery: [IMAGES.guitar, IMAGES.acoustic, IMAGES.piano],
    amenities: ["Drum Kit", "Guitar Amps", "PA System", "Soundproofing", "Instrument Storage"],
    overview:
      "A soundproofed rehearsal room with a full drum kit, guitar amps and a PA system ready to go. Bring your instruments and start playing without disturbing the neighbours.",
    rating: 4.4,
    reviews: [
      { name: "Shuvo Das", rating: 4.5, comment: "Everything was already set up when we arrived, so we played for the whole session." },
      { name: "Nabila Karim", rating: 4.3, comment: "Solid gear and good soundproofing for the price." },
    ],
  },
  {
    title: "Second Take Video Podcast Room",
    category: "Podcast Lounge",
    hourlyRate: 18,
    securityDeposit: 40,
    maxCapacity: 3,
    location: "Agrabad, Chattogram",
    image: IMAGES.darkMic,
    gallery: [IMAGES.darkMic, IMAGES.podcastMic, IMAGES.editing],
    amenities: ["Acoustic Panels", "2 Broadcast Mics", "LED Lighting", "Teleprompter", "High-Speed WiFi"],
    overview:
      "A compact, moody room for solo shows and two-person conversations. It comes with acoustic panels, adjustable LED lighting and a teleprompter for scripted episodes.",
    rating: 4.3,
    reviews: [
      { name: "Priya Barua", rating: 4.4, comment: "A great price for a video-ready room, and the lighting looks very professional." },
      { name: "Jubayer Alam", rating: 4.2, comment: "Small but quiet, and it has everything a two-person show needs." },
    ],
  },
];

const client = new MongoClient(process.env.DB_URI);

try {
  await client.connect();
  const studios = client.db("studiospaceDB").collection("studios");
  const now = Date.now();

  const results = await Promise.all(
    STUDIOS.map((studio, index) =>
      studios.updateOne(
        { isSample: true, title: studio.title },
        {
          $set: { ...studio, ...SAMPLE_HOST, isSample: true },
          $setOnInsert: { createdAt: new Date(now - index * 86_400_000) },
        },
        { upsert: true },
      ),
    ),
  );

  const added = results.filter((result) => result.upsertedCount).length;
  console.log(`Sample studios: ${added} added, ${STUDIOS.length - added} updated`);
} finally {
  await client.close();
}
