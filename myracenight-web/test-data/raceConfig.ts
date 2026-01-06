// Test Race Configuration
// This file contains sample data for testing 3 races end-to-end

export const TEST_RACES = [
  {
    raceNumber: 1,
    name: "The Cushman & Wakefield Gold Cup",
    sponsorName: "Cushman & Wakefield",
    sponsorLogoUrl: "https://via.placeholder.com/200x80/FFD700/000000?text=C%26W",
    videoUrl: "https://pub-666acfb7ee384f5884b17d0b8b3f391a.r2.dev/Race-1-Gold-Cup.mp4", // Your Cloudflare URL
    commentaryAudioUrl: "", // Optional: Add commentary audio URL
    horses: [
      {
        number: 1,
        name: "Thunder Bolt",
        ownerName: "John Smith",
        jockeyName: "Lightning Larry",
        color: "red",
        odds: "3/1",
        backstory: "Born during a thunderstorm, this horse has electrifying speed!"
      },
      {
        number: 2,
        name: "Speedy Gonzales",
        ownerName: "Maria Rodriguez",
        jockeyName: "Fast Freddy",
        color: "blue",
        odds: "5/2",
        backstory: "Named after the fastest mouse in Mexico, this horse is all about velocity."
      },
      {
        number: 3,
        name: "Golden Dream",
        ownerName: "Sarah Johnson",
        jockeyName: "Steady Steve",
        color: "gold",
        odds: "4/1",
        backstory: "This horse dreams of winning - and it shows!"
      },
      {
        number: 4,
        name: "Storm Chaser",
        ownerName: "Mike Wilson",
        jockeyName: "Brave Bob",
        color: "green",
        odds: "6/1",
        backstory: "Chasing storms is nothing compared to chasing victory."
      },
      {
        number: 5,
        name: "Midnight Runner",
        ownerName: "Emily Chen",
        jockeyName: "Night Nick",
        color: "purple",
        odds: "7/1",
        backstory: "Runs best under the lights - a true night owl."
      },
      {
        number: 6,
        name: "Desert Fox",
        ownerName: "Ahmed Hassan",
        jockeyName: "Sandy Sam",
        color: "orange",
        odds: "10/1",
        backstory: "From the Arabian deserts, built for endurance and speed."
      },
      {
        number: 7,
        name: "Arctic Blast",
        ownerName: "Anna Petrov",
        jockeyName: "Cool Carl",
        color: "cyan",
        odds: "8/1",
        backstory: "Cool as ice, fast as the Arctic wind."
      },
      {
        number: 8,
        name: "Lucky Charm",
        ownerName: "Patrick O'Brien",
        jockeyName: "Lucky Luke",
        color: "pink",
        odds: "12/1",
        backstory: "With a four-leaf clover and a horseshoe, luck is on their side!"
      }
    ]
  },
  {
    raceNumber: 2,
    name: "The Speed Derby Spectacular",
    sponsorName: "Velocity Motors",
    sponsorLogoUrl: "https://via.placeholder.com/200x80/FF0000/FFFFFF?text=Velocity",
    videoUrl: "https://pub-666acfb7ee384f5884b17d0b8b3f391a.r2.dev/Race-2-Stakes.mp4", // Your Cloudflare URL
    commentaryAudioUrl: "",
    horses: [
      {
        number: 1,
        name: "Rocket Fuel",
        ownerName: "James Wright",
        jockeyName: "Turbo Tim",
        color: "red",
        odds: "5/2",
        backstory: "Powered by pure adrenaline and rocket fuel!"
      },
      {
        number: 2,
        name: "Flash Gordon",
        ownerName: "Lisa Turner",
        jockeyName: "Quick Quinn",
        color: "blue",
        odds: "3/1",
        backstory: "Fast as a flash, brave as Gordon!"
      },
      {
        number: 3,
        name: "Blazing Star",
        ownerName: "Carlos Mendez",
        jockeyName: "Star Stanley",
        color: "gold",
        odds: "4/1",
        backstory: "Like a shooting star across the track."
      },
      {
        number: 4,
        name: "Wind Dancer",
        ownerName: "Sophie Laurent",
        jockeyName: "Graceful Gary",
        color: "green",
        odds: "6/1",
        backstory: "Dances with the wind, glides like poetry."
      },
      {
        number: 5,
        name: "Sonic Boom",
        ownerName: "David Park",
        jockeyName: "Boom Barry",
        color: "purple",
        odds: "5/1",
        backstory: "Breaks the sound barrier on the home stretch!"
      },
      {
        number: 6,
        name: "Lightning Strike",
        ownerName: "Rachel Green",
        jockeyName: "Bolt Ben",
        color: "orange",
        odds: "7/1",
        backstory: "Strikes like lightning, gone in a flash."
      },
      {
        number: 7,
        name: "Turbo Charge",
        ownerName: "Alex Kim",
        jockeyName: "Charged Charlie",
        color: "cyan",
        odds: "8/1",
        backstory: "Turbocharged for maximum performance!"
      },
      {
        number: 8,
        name: "Speed Demon",
        ownerName: "Nina Patel",
        jockeyName: "Demon Dan",
        color: "pink",
        odds: "9/1",
        backstory: "A demon on the track, an angel in the stable."
      }
    ]
  },
  {
    raceNumber: 3,
    name: "The Grand Champion Stakes",
    sponsorName: "Elite Properties",
    sponsorLogoUrl: "https://via.placeholder.com/200x80/4B0082/FFFFFF?text=Elite",
    videoUrl: "https://pub-666acfb7ee384f5884b17d0b8b3f391a.r2.dev/Race-3-Chase.mp4", // Your Cloudflare URL
    commentaryAudioUrl: "",
    horses: [
      {
        number: 1,
        name: "Royal Thunder",
        ownerName: "Lord Wellington",
        jockeyName: "Royal Ronnie",
        color: "red",
        odds: "2/1",
        backstory: "Royalty on four legs, thunder in the hooves."
      },
      {
        number: 2,
        name: "Majestic Glory",
        ownerName: "Duchess Cambridge",
        jockeyName: "Glorious George",
        color: "blue",
        odds: "3/1",
        backstory: "Majestic in stance, glorious in victory."
      },
      {
        number: 3,
        name: "Champion's Pride",
        ownerName: "Coach Martinez",
        jockeyName: "Pride Peter",
        color: "gold",
        odds: "5/2",
        backstory: "Born to be a champion, proud to prove it."
      },
      {
        number: 4,
        name: "Victory Lap",
        ownerName: "Tom Harrison",
        jockeyName: "Victory Vince",
        color: "green",
        odds: "4/1",
        backstory: "Always running the victory lap in their mind."
      },
      {
        number: 5,
        name: "Golden Warrior",
        ownerName: "Samantha Lee",
        jockeyName: "Warrior Will",
        color: "purple",
        odds: "6/1",
        backstory: "A warrior's heart in a champion's body."
      },
      {
        number: 6,
        name: "Supreme Legend",
        ownerName: "Marcus Thompson",
        jockeyName: "Legend Liam",
        color: "orange",
        odds: "7/1",
        backstory: "Legends are made on days like today."
      },
      {
        number: 7,
        name: "Epic Journey",
        ownerName: "Diana Foster",
        jockeyName: "Journey Jack",
        color: "cyan",
        odds: "8/1",
        backstory: "Every race is an epic journey to greatness."
      },
      {
        number: 8,
        name: "Destiny's Call",
        ownerName: "Robert Chang",
        jockeyName: "Destiny Dave",
        color: "pink",
        odds: "10/1",
        backstory: "When destiny calls, you answer with speed!"
      }
    ]
  }
];

// Sample commentary script for Race 1 (can be used to generate audio)
export const RACE_1_COMMENTARY = `
"Good evening ladies and gentlemen, and welcome to the Cushman & Wakefield Gold Cup!

We have an exciting field of eight magnificent horses ready for action tonight.

In lane one, we have Thunder Bolt, ridden by Lightning Larry. This horse was born during a thunderstorm and has been electrifying ever since!

Lane two features Speedy Gonzales with Fast Freddy in the saddle. Named after the fastest mouse in Mexico, this combination is all about velocity.

Golden Dream in lane three with Steady Steve aboard. This horse dreams of winning - and tonight might be the night!

Storm Chaser in lane four, partnered with Brave Bob. They're not just chasing storms tonight, they're chasing glory!

And they're off!

Thunder Bolt takes an early lead, with Speedy Gonzales hot on the heels!

Coming around the first turn, Golden Dream is making a move on the outside!

Down the backstretch, Storm Chaser is finding another gear!

Into the final turn, it's anybody's race!

Thunder Bolt and Speedy Gonzales neck and neck!

Here comes Golden Dream with a late charge!

They're hitting the home stretch...

And it's... THUNDER BOLT by a nose! What an incredible finish!

What a race, ladies and gentlemen! Thunder Bolt takes the Cushman & Wakefield Gold Cup!
`;

// Function to create test races in database with your Cloudflare URLs
export function generateTestRaceSQL(eventId: string) {
  return TEST_RACES.map((race, index) => `
INSERT INTO "Race" (
  "id", "eventId", "raceNumber", "name", 
  "sponsorName", "sponsorLogoUrl", "videoUrl", 
  "status", "commentaryScript"
) VALUES (
  'race-test-${index + 1}',
  '${eventId}',
  ${race.raceNumber},
  '${race.name}',
  '${race.sponsorName}',
  '${race.sponsorLogoUrl}',
  '${race.videoUrl}',  -- Uses your Cloudflare R2 URLs
  'PENDING',
  ''
);
  `).join('\n');
}

// Function to create test horses in database
export function generateTestHorseSQL(eventId: string) {
  return TEST_RACES.flatMap((race, raceIndex) => 
    race.horses.map((horse, horseIndex) => `
INSERT INTO "Horse" (
  "id", "eventId", "raceId", "name", 
  "ownerName", "jockeyName", "approvalStatus",
  "description"
) VALUES (
  'horse-test-${raceIndex + 1}-${horseIndex + 1}',
  '${eventId}',
  'race-test-${raceIndex + 1}',
  '${horse.name}',
  '${horse.ownerName}',
  '${horse.jockeyName}',
  'APPROVED',
  '${horse.backstory}'
);
    `)
  ).join('\n');
}
