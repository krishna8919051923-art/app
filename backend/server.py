from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Chat Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Festival(BaseModel):
    name: str
    date: str
    description: str
    significance: str

class TravelInfo(BaseModel):
    best_time_to_visit: str
    nearest_airport: str
    accommodation: List[str]
    local_transport: str
    permits_required: str
    weather_info: str

class SikkimMonastery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    district: str
    altitude: str
    tradition: str
    description: str
    founded: str
    architecture: str
    spiritual_significance: str
    main_image: str
    gallery_images: List[str]
    panoramic_images: List[str]
    coordinates: Dict[str, float]
    highlights: List[str]
    visiting_hours: str
    entrance_fee: str
    accessibility: str
    cultural_importance: str
    festivals: List[Festival]
    travel_info: TravelInfo
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MonasteryCreate(BaseModel):
    name: str
    location: str
    district: str
    altitude: str
    tradition: str
    description: str
    founded: str
    architecture: str
    spiritual_significance: str
    main_image: str
    gallery_images: List[str]
    panoramic_images: List[str]
    coordinates: Dict[str, float]
    highlights: List[str]
    visiting_hours: str
    entrance_fee: str
    accessibility: str
    cultural_importance: str
    festivals: List[Festival]
    travel_info: TravelInfo

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_message: str
    ai_response: str
    monastery_context: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: str
    monastery_id: Optional[str] = None

# Sikkim Monastery Data
sikkim_monasteries_data = [
    {
        "name": "Rumtek Monastery",
        "location": "Rumtek, East Sikkim",
        "district": "East Sikkim",
        "altitude": "1,550 meters",
        "tradition": "Kagyu School of Tibetan Buddhism",
        "description": "Also known as the Dharma Chakra Centre, Rumtek is one of the largest monasteries in Sikkim and serves as the seat-in-exile of the Karmapa Lama.",
        "founded": "1966 (originally 1734)",
        "architecture": "Traditional Tibetan architecture with intricate woodwork and colorful murals",
        "spiritual_significance": "Seat of the 16th Karmapa and center of Kagyu lineage in exile",
        "main_image": "https://images.pexels.com/photos/32010298/pexels-photo-32010298.jpeg",
        "gallery_images": [
            "https://images.pexels.com/photos/32010298/pexels-photo-32010298.jpeg",
            "https://images.pexels.com/photos/2408167/pexels-photo-2408167.jpeg",
            "https://images.pexels.com/photos/19715251/pexels-photo-19715251.jpeg"
        ],
        "panoramic_images": [
            "https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6",
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg"
        ],
        "coordinates": {"lat": 27.2996, "lng": 88.5565},
        "highlights": ["Golden Stupa", "Shrine Hall", "Monastery Museum", "Sacred Dance Festival"],
        "visiting_hours": "6:00 AM - 6:00 PM",
        "entrance_fee": "Free",
        "accessibility": "Road accessible, moderate walk from parking",
        "cultural_importance": "Most important Kagyu monastery in Sikkim, seat of Karmapa lineage",
        "festivals": [
            {
                "name": "Kagyu Monlam",
                "date": "February/March",
                "description": "Annual prayer festival with masked dances",
                "significance": "Important spiritual gathering for Kagyu practitioners"
            },
            {
                "name": "Buddha Purnima",
                "date": "May",
                "description": "Celebration of Buddha's birth, enlightenment, and death",
                "significance": "Most sacred day in Buddhist calendar"
            }
        ],
        "travel_info": {
            "best_time_to_visit": "March to June, September to December",
            "nearest_airport": "Bagdogra Airport (124 km)",
            "accommodation": ["Hotel Sonam Delek", "Rumtek Monastery Guest House", "Gangtok Hotels"],
            "local_transport": "Shared jeeps, private taxis from Gangtok (24 km)",
            "permits_required": "Inner Line Permit for non-Indians",
            "weather_info": "Pleasant climate, avoid monsoon season (July-August)"
        }
    },
    {
        "name": "Pemayangtse Monastery",
        "location": "Pelling, West Sikkim",
        "district": "West Sikkim",
        "altitude": "2,085 meters",
        "tradition": "Nyingma School of Tibetan Buddhism",
        "description": "One of the oldest and most important monasteries in Sikkim, meaning 'Perfect Sublime Lotus'. It offers stunning views of Kanchenjunga.",
        "founded": "1705",
        "architecture": "Three-story structure with traditional Sikkimese architecture",
        "spiritual_significance": "Second most important monastery in Sikkim, head monastery of Nyingma sect",
        "main_image": "https://images.unsplash.com/photo-1634308670152-17f7f1aa4e79",
        "gallery_images": [
            "https://images.unsplash.com/photo-1634308670152-17f7f1aa4e79",
            "https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6",
            "https://images.pexels.com/photos/33262249/pexels-photo-33262249.jpeg"
        ],
        "panoramic_images": [
            "https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6",
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg"
        ],
        "coordinates": {"lat": 27.3182, "lng": 88.2160},
        "highlights": ["Zangdog Palri Model", "Ancient Manuscripts", "Kanchenjunga Views", "Ta-tshog Festival"],
        "visiting_hours": "7:00 AM - 5:00 PM",
        "entrance_fee": "₹20 for Indians, $5 for foreigners",
        "accessibility": "Well-connected by road, short walk from parking",
        "cultural_importance": "Premier Nyingma monastery, showcases traditional Sikkimese Buddhism",
        "festivals": [
            {
                "name": "Chaam Dance Festival",
                "date": "January/February",
                "description": "Sacred masked dance performances",
                "significance": "Drives away evil spirits and brings good fortune"
            },
            {
                "name": "Saga Dawa",
                "date": "May/June",
                "description": "Celebrates Buddha's birth, enlightenment, and parinirvana",
                "significance": "Most sacred month in Buddhist calendar"
            }
        ],
        "travel_info": {
            "best_time_to_visit": "October to May for clear mountain views",
            "nearest_airport": "Bagdogra Airport (160 km)",
            "accommodation": ["Hotel Garuda", "Pelling Tourist Lodge", "Norbu Ghang Resort"],
            "local_transport": "Shared jeeps from Pelling (2 km), taxis available",
            "permits_required": "Inner Line Permit for areas beyond Pelling",
            "weather_info": "Cool climate, heavy snowfall in winter, clear views in autumn"
        }
    },
    {
        "name": "Enchey Monastery",
        "location": "Gangtok, East Sikkim",
        "district": "East Sikkim",
        "altitude": "1,800 meters",
        "tradition": "Nyingma School of Tibetan Buddhism",
        "description": "Located on a hilltop overlooking Gangtok, this monastery is believed to be blessed by guardian spirits and offers panoramic views of the city.",
        "founded": "1909",
        "architecture": "Traditional Tibetan style with Chinese architectural influences",
        "spiritual_significance": "Important pilgrimage site, believed to be protected by tantric masters",
        "main_image": "https://images.unsplash.com/photo-1543341724-c6f823532cac",
        "gallery_images": [
            "https://images.unsplash.com/photo-1543341724-c6f823532cac",
            "https://images.unsplash.com/photo-1755011310512-38cfb597241c",
            "https://images.pexels.com/photos/2409032/pexels-photo-2409032.jpeg"
        ],
        "panoramic_images": [
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg",
            "https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6"
        ],
        "coordinates": {"lat": 27.3389, "lng": 88.6065},
        "highlights": ["Prayer Hall", "Ancient Statues", "City Views", "Guardian Deities"],
        "visiting_hours": "6:00 AM - 6:00 PM",
        "entrance_fee": "Free",
        "accessibility": "Easy road access from Gangtok city center",
        "cultural_importance": "Important urban monastery, center of Buddhist activities in Gangtok",
        "festivals": [
            {
                "name": "Chaam Festival",
                "date": "December/January",
                "description": "Annual masked dance festival with elaborate costumes",
                "significance": "Celebrates victory of good over evil"
            },
            {
                "name": "Losar",
                "date": "February/March",
                "description": "Tibetan New Year celebrations",
                "significance": "Beginning of new year in Tibetan calendar"
            }
        ],
        "travel_info": {
            "best_time_to_visit": "March to June, September to December",
            "nearest_airport": "Bagdogra Airport (124 km)",
            "accommodation": ["Hotels in Gangtok city", "Mayfair Spa Resort", "Hotel Sonam Delek"],
            "local_transport": "Local taxis, walking distance from MG Road",
            "permits_required": "None for the monastery itself",
            "weather_info": "Pleasant climate year-round, avoid monsoon season"
        }
    },
    {
        "name": "Tashiding Monastery",
        "location": "Tashiding, West Sikkim",
        "district": "West Sikkim",
        "altitude": "1,465 meters",
        "tradition": "Nyingma School of Tibetan Buddhism",
        "description": "Perched on a hilltop between Rathong and Rangeet rivers, this monastery is considered one of the most sacred in Sikkim.",
        "founded": "1717",
        "architecture": "Traditional architecture harmoniously blended with the natural landscape",
        "spiritual_significance": "Most sacred monastery in Sikkim, blessed by Guru Padmasambhava",
        "main_image": "https://images.unsplash.com/photo-1633538028057-838fd4e027a4",
        "gallery_images": [
            "https://images.unsplash.com/photo-1633538028057-838fd4e027a4",
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg",
            "https://images.pexels.com/photos/2408167/pexels-photo-2408167.jpeg"
        ],
        "panoramic_images": [
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg",
            "https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6"
        ],
        "coordinates": {"lat": 27.3433, "lng": 88.2167},
        "highlights": ["Sacred Chortens", "Holy Spring", "Bhumchu Festival", "River Confluence Views"],
        "visiting_hours": "6:00 AM - 6:00 PM",
        "entrance_fee": "Free",
        "accessibility": "Moderate trek from road, scenic walking path",
        "cultural_importance": "Holiest site in Sikkim, significant for all Buddhist sects",
        "festivals": [
            {
                "name": "Bhumchu Festival",
                "date": "February/March",
                "description": "Sacred water ceremony predicting the year ahead",
                "significance": "Most important festival, determines fortune for the year"
            },
            {
                "name": "Kagyat Dance",
                "date": "December",
                "description": "Traditional masked dance performances",
                "significance": "Celebrates Buddha's teachings and drives away negativity"
            }
        ],
        "travel_info": {
            "best_time_to_visit": "October to May, especially during Bhumchu Festival",
            "nearest_airport": "Bagdogra Airport (140 km)",
            "accommodation": ["Basic guest houses in Tashiding", "Hotels in nearby Geyzing"],
            "local_transport": "Shared jeeps from Geyzing, private taxis available",
            "permits_required": "Inner Line Permit for non-Indians",
            "weather_info": "Pleasant climate, can be misty, best visibility in winter"
        }
    },
    {
        "name": "Do-drul Chorten",
        "location": "Gangtok, East Sikkim",
        "district": "East Sikkim",
        "altitude": "1,650 meters",
        "tradition": "Nyingma School of Tibetan Buddhism",
        "description": "The most important stupa in Sikkim, surrounded by 108 prayer wheels and containing sacred relics and mantras.",
        "founded": "1945",
        "architecture": "Traditional Tibetan stupa architecture with golden spire",
        "spiritual_significance": "Important pilgrimage site, believed to subdue evil forces",
        "main_image": "https://images.pexels.com/photos/33262249/pexels-photo-33262249.jpeg",
        "gallery_images": [
            "https://images.pexels.com/photos/33262249/pexels-photo-33262249.jpeg",
            "https://images.pexels.com/photos/19715251/pexels-photo-19715251.jpeg",
            "https://images.unsplash.com/photo-1566499175117-c78fabf20b7d"
        ],
        "panoramic_images": [
            "https://images.pexels.com/photos/33262249/pexels-photo-33262249.jpeg",
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg"
        ],
        "coordinates": {"lat": 27.3178, "lng": 88.6094},
        "highlights": ["108 Prayer Wheels", "Golden Stupa", "Sacred Relics", "Prayer Flags"],
        "visiting_hours": "5:00 AM - 7:00 PM",
        "entrance_fee": "Free",
        "accessibility": "Easy access from Gangtok, well-maintained paths",
        "cultural_importance": "Spiritual center of Gangtok, important meditation site",
        "festivals": [
            {
                "name": "Buddha Jayanti",
                "date": "May",
                "description": "Celebrates Buddha's birth with prayers and offerings",
                "significance": "Special prayers and circumambulation of the stupa"
            },
            {
                "name": "Tse Chu",
                "date": "October",
                "description": "Sacred day for accumulating merit through prayers",
                "significance": "Believed to multiply positive karma"
            }
        ],
        "travel_info": {
            "best_time_to_visit": "Year-round, especially early morning for prayers",
            "nearest_airport": "Bagdogra Airport (124 km)",
            "accommodation": ["Hotels in Gangtok", "Nearby guest houses"],
            "local_transport": "Walking distance from city center, local taxis available",
            "permits_required": "None",
            "weather_info": "Pleasant climate, covered walkways for rainy season"
        }
    },
    {
        "name": "Khecheopalri Monastery",
        "location": "Khecheopalri, West Sikkim",
        "district": "West Sikkim",
        "altitude": "1,700 meters",
        "tradition": "Nyingma School of Tibetan Buddhism",
        "description": "Located near the sacred Khecheopalri Lake (Wishing Lake), this monastery is surrounded by pristine forests and is considered highly sacred.",
        "founded": "Unknown (ancient)",
        "architecture": "Simple traditional architecture in harmony with nature",
        "spiritual_significance": "Sacred lake monastery, fulfills devotees' wishes",
        "main_image": "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg",
        "gallery_images": [
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg",
            "https://images.unsplash.com/photo-1755011310512-38cfb597241c",
            "https://images.pexels.com/photos/2408167/pexels-photo-2408167.jpeg"
        ],
        "panoramic_images": [
            "https://images.pexels.com/photos/6576294/pexels-photo-6576294.jpeg",
            "https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6"
        ],
        "coordinates": {"lat": 27.3167, "lng": 88.2000},
        "highlights": ["Sacred Wishing Lake", "Forest Trek", "Bird Watching", "Prayer Flags"],
        "visiting_hours": "Dawn to Dusk",
        "entrance_fee": "Free",
        "accessibility": "Moderate trek through forest, well-marked trail",
        "cultural_importance": "Sacred pilgrimage site, both Buddhist and Hindu significance",
        "festivals": [
            {
                "name": "Maghe Sankranti",
                "date": "January",
                "description": "Sacred bathing and prayers at the lake",
                "significance": "Purification of sins and fulfillment of wishes"
            },
            {
                "name": "Drupka Teshi",
                "date": "July/August",
                "description": "Celebrates Buddha's first teaching",
                "significance": "Special prayers and teachings at the monastery"
            }
        ],
        "travel_info": {
            "best_time_to_visit": "March to June, September to December",
            "nearest_airport": "Bagdogra Airport (150 km)",
            "accommodation": ["Eco-lodges near lake", "Hotels in Pelling (30 km)"],
            "local_transport": "Jeeps from Pelling, then 30-minute forest walk",
            "permits_required": "Inner Line Permit for non-Indians",
            "weather_info": "Cool and misty, leeches during monsoon, beautiful in winter"
        }
    }
]

@api_router.get("/")
async def root():
    return {"message": "Welcome to Sikkim Monasteries - Virtual Heritage Tours"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/monasteries/initialize")
async def initialize_sikkim_monasteries():
    """Initialize the database with Sikkim monastery data"""
    try:
        # Check if monasteries already exist
        existing_count = await db.sikkim_monasteries.count_documents({})
        if existing_count > 0:
            return {"message": f"Database already contains {existing_count} Sikkim monasteries"}
        
        # Insert monastery data
        monasteries = []
        for data in sikkim_monasteries_data:
            monastery = SikkimMonastery(**data)
            monasteries.append(monastery.dict())
        
        result = await db.sikkim_monasteries.insert_many(monasteries)
        return {"message": f"Successfully initialized {len(result.inserted_ids)} Sikkim monasteries"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/monasteries", response_model=List[SikkimMonastery])
async def get_sikkim_monasteries(
    district: Optional[str] = Query(None, description="Filter by district"),
    tradition: Optional[str] = Query(None, description="Filter by tradition"),
    search: Optional[str] = Query(None, description="Search in name or description")
):
    """Get all Sikkim monasteries with optional filtering"""
    query = {}
    
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if tradition:
        query["tradition"] = {"$regex": tradition, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    monasteries = await db.sikkim_monasteries.find(query).to_list(length=None)
    return [SikkimMonastery(**monastery) for monastery in monasteries]

@api_router.get("/monasteries/{monastery_id}", response_model=SikkimMonastery)
async def get_monastery(monastery_id: str):
    """Get a specific Sikkim monastery by ID"""
    monastery = await db.sikkim_monasteries.find_one({"id": monastery_id})
    if not monastery:
        raise HTTPException(status_code=404, detail="Monastery not found")
    return SikkimMonastery(**monastery)

@api_router.post("/monasteries", response_model=SikkimMonastery)
async def create_monastery(monastery: MonasteryCreate):
    """Create a new Sikkim monastery"""
    new_monastery = SikkimMonastery(**monastery.dict())
    await db.sikkim_monasteries.insert_one(new_monastery.dict())
    return new_monastery

@api_router.post("/chat")
async def chat_with_sikkim_guide(request: ChatRequest):
    """Chat with AI guide about Sikkim monasteries and culture"""
    try:
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Get monastery context if monastery_id is provided
        monastery_context = ""
        if request.monastery_id:
            monastery = await db.sikkim_monasteries.find_one({"id": request.monastery_id})
            if monastery:
                monastery_context = f"""
Current Monastery Context:
Name: {monastery['name']}
Location: {monastery['location']}, {monastery['district']}
Altitude: {monastery['altitude']}
Tradition: {monastery['tradition']}
Founded: {monastery['founded']}
Description: {monastery['description']}
Architecture: {monastery['architecture']}
Spiritual Significance: {monastery['spiritual_significance']}
Cultural Importance: {monastery['cultural_importance']}
Highlights: {', '.join(monastery['highlights'])}
Visiting Hours: {monastery['visiting_hours']}
Festivals: {', '.join([f["name"] for f in monastery['festivals']])}
Travel Info: Best time - {monastery['travel_info']['best_time_to_visit']}
"""
        
        # Create system message with Sikkim expertise
        system_message = f"""You are an expert guide specializing in Sikkim monasteries, Himalayan Buddhism, and Sikkimese culture. You have deep knowledge about:

- All major monasteries in Sikkim (Rumtek, Pemayangtse, Enchey, Tashiding, Do-drul Chorten, Khecheopalri)
- Tibetan Buddhist traditions (Nyingma, Kagyu schools)
- Sikkim's unique Buddhist culture and festivals
- Himalayan geography and travel in Sikkim
- Local customs, permits, and travel logistics
- Sacred sites and pilgrimage routes

{monastery_context}

Guidelines:
- Provide detailed, accurate information about Sikkim monasteries and culture
- Include practical travel advice when relevant (permits, weather, accessibility)
- Explain Buddhist concepts and traditions respectfully
- Mention relevant festivals and their significance
- Suggest related monasteries or sites when appropriate
- Keep responses informative but conversational (2-3 paragraphs)
- Focus specifically on Sikkim's unique Buddhist heritage
"""
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=request.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get AI response
        ai_response = await chat.send_message(user_message)
        
        # Save chat message to database
        chat_message = ChatMessage(
            session_id=request.session_id,
            user_message=request.message,
            ai_response=ai_response,
            monastery_context=request.monastery_id
        )
        await db.chat_messages.insert_one(chat_message.dict())
        
        return {
            "response": ai_response,
            "session_id": request.session_id,
            "monastery_context": bool(monastery_context)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, limit: int = 20):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id}
    ).sort("timestamp", -1).limit(limit).to_list(length=None)
    
    return {
        "messages": [ChatMessage(**msg) for msg in reversed(messages)],
        "session_id": session_id
    }

@api_router.get("/districts")
async def get_districts():
    """Get list of districts with monasteries"""
    districts = await db.sikkim_monasteries.distinct("district")
    return {"districts": sorted(districts)}

@api_router.get("/traditions")
async def get_traditions():
    """Get list of Buddhist traditions"""
    traditions = await db.sikkim_monasteries.distinct("tradition")
    return {"traditions": sorted(traditions)}

@api_router.get("/festivals")
async def get_all_festivals():
    """Get all festivals celebrated across Sikkim monasteries"""
    monasteries = await db.sikkim_monasteries.find().to_list(length=None)
    all_festivals = []
    
    for monastery in monasteries:
        for festival in monastery.get('festivals', []):
            festival_info = {
                "name": festival['name'],
                "date": festival['date'],
                "description": festival['description'],
                "significance": festival['significance'],
                "monastery": monastery['name'],
                "location": monastery['location']
            }
            all_festivals.append(festival_info)
    
    return {"festivals": all_festivals}

@api_router.get("/travel-guide")
async def get_sikkim_travel_guide():
    """Get comprehensive travel guide for visiting Sikkim monasteries"""
    return {
        "permits": {
            "inner_line_permit": "Required for non-Indians visiting most areas",
            "how_to_get": "Online application or at checkpoints",
            "duration": "15-30 days",
            "documents": "Valid ID proof, passport photos"
        },
        "best_time": {
            "peak_season": "March to June, September to December",
            "monsoon": "July-August (avoid due to landslides)",
            "winter": "December-February (cold but clear views)",
            "festival_time": "February-March for major festivals"
        },
        "getting_there": {
            "nearest_airport": "Bagdogra Airport (West Bengal)",
            "nearest_railway": "New Jalpaiguri (NJP)",
            "road_access": "NH10 from West Bengal",
            "local_transport": "Shared jeeps, private taxis, government buses"
        },
        "accommodation": {
            "types": ["Luxury hotels", "Budget hotels", "Guest houses", "Homestays"],
            "booking_tips": "Book in advance during peak season",
            "monastery_stays": "Some monasteries offer basic accommodation"
        },
        "important_tips": [
            "Carry warm clothes even in summer",
            "Respect photography restrictions in monasteries",
            "Remove shoes before entering prayer halls",
            "Don't point feet towards Buddha statues",
            "Carry cash as ATMs are limited in remote areas",
            "Stay hydrated at high altitudes"
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()