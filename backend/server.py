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

class Monastery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    country: str
    tradition: str
    description: str
    founded: Optional[str] = None
    architecture: str
    spiritual_significance: str
    tour_image: str
    panorama_image: str
    coordinates: Dict[str, float]
    highlights: List[str]
    visiting_hours: str
    entrance_fee: str
    languages: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MonasteryCreate(BaseModel):
    name: str
    location: str
    country: str
    tradition: str
    description: str
    founded: Optional[str] = None
    architecture: str
    spiritual_significance: str
    tour_image: str
    panorama_image: str
    coordinates: Dict[str, float]
    highlights: List[str]
    visiting_hours: str
    entrance_fee: str
    languages: List[str]

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

# Monastery Data
monastery_data = [
    {
        "name": "Potala Palace",
        "location": "Lhasa, Tibet",
        "country": "Tibet/China",
        "tradition": "Tibetan Buddhism",
        "description": "Former residence of the Dalai Lama, this iconic palace is a masterpiece of Tibetan architecture.",
        "founded": "7th century",
        "architecture": "Traditional Tibetan architecture with red and white walls",
        "spiritual_significance": "Sacred center of Tibetan Buddhism, symbol of Tibetan identity",
        "tour_image": "https://images.unsplash.com/photo-1566241619114-948b5a7df53c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxtb25hc3Rlcnl8ZW58MHx8fHwxNzU2ODIyMTczfDA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1566241619114-948b5a7df53c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxtb25hc3Rlcnl8ZW58MHx8fHwxNzU2ODIyMTczfDA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 29.6558, "lng": 91.1165},
        "highlights": ["Red Palace", "White Palace", "Jewel Garden", "Sacred Chapels"],
        "visiting_hours": "9:00 AM - 6:00 PM",
        "entrance_fee": "200 CNY",
        "languages": ["English", "Tibetan", "Chinese"]
    },
    {
        "name": "Meteora Monasteries",
        "location": "Kalambaka, Greece",
        "country": "Greece",
        "tradition": "Eastern Orthodox",
        "description": "Spectacular monasteries built on top of rock pillars, representing a unique architectural achievement.",
        "founded": "14th century",
        "architecture": "Byzantine architecture on natural rock formations",
        "spiritual_significance": "Center of Eastern Orthodox monasticism, UNESCO World Heritage site",
        "tour_image": "https://images.unsplash.com/photo-1578556881767-c2cf0bfc9ea3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxtb25hc3Rlcnl8ZW58MHx8fHwxNzU2ODIyMTczfDA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1578556881767-c2cf0bfc9ea3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxtb25hc3Rlcnl8ZW58MHx8fHwxNzU2ODIyMTczfDA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 39.7153, "lng": 21.6301},
        "highlights": ["Great Meteoron", "Varlaam Monastery", "Roussanou Monastery", "Rock Formations"],
        "visiting_hours": "9:00 AM - 5:00 PM",
        "entrance_fee": "3 EUR per monastery",
        "languages": ["English", "Greek", "German", "French"]
    },
    {
        "name": "Shaolin Temple",
        "location": "Henan Province, China",
        "country": "China",
        "tradition": "Chan Buddhism",
        "description": "Birthplace of Kung Fu and Chan Buddhism, famous for martial arts and meditation practices.",
        "founded": "495 AD",
        "architecture": "Traditional Chinese Buddhist temple architecture",
        "spiritual_significance": "Origin of Zen Buddhism and martial arts philosophy",
        "tour_image": "https://images.unsplash.com/photo-1603766806347-54cdf3745953?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHx0ZW1wbGV8ZW58MHx8fHwxNzU2ODIyMTk1fDA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1603766806347-54cdf3745953?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHx0ZW1wbGV8ZW58MHx8fHwxNzU2ODIyMTk1fDA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 34.5088, "lng": 112.9362},
        "highlights": ["Hall of Heavenly Kings", "Pagoda Forest", "Martial Arts Performances", "Meditation Grounds"],
        "visiting_hours": "8:00 AM - 6:00 PM",
        "entrance_fee": "100 CNY",
        "languages": ["English", "Chinese", "Japanese"]
    },
    {
        "name": "Alcobaca Monastery",
        "location": "Alcobaca, Portugal",
        "country": "Portugal",
        "tradition": "Catholic Cistercian",
        "description": "Stunning Gothic monastery with beautiful arched corridors and rich medieval history.",
        "founded": "1153",
        "architecture": "Gothic and Cistercian architecture",
        "spiritual_significance": "Important pilgrimage site and center of Cistercian spirituality",
        "tour_image": "https://images.unsplash.com/photo-1596474541260-307057e82146?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxtb25hc3Rlcnl8ZW58MHx8fHwxNzU2ODIyMTczfDA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1596474541260-307057e82146?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxtb25hc3Rlcnl8ZW58MHx8fHwxNzU2ODIyMTczfDA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 39.5459, "lng": -8.9778},
        "highlights": ["Gothic Church", "Royal Tombs", "Kitchen", "Cloister"],
        "visiting_hours": "9:00 AM - 7:00 PM",
        "entrance_fee": "6 EUR",
        "languages": ["English", "Portuguese", "Spanish", "French"]
    },
    {
        "name": "Angkor Wat",
        "location": "Siem Reap, Cambodia",
        "country": "Cambodia",
        "tradition": "Hindu/Buddhist",
        "description": "World's largest religious monument, originally Hindu temple complex dedicated to Vishnu.",
        "founded": "Early 12th century",
        "architecture": "Classical Khmer architecture",
        "spiritual_significance": "Sacred Hindu temple later converted to Buddhist use",
        "tour_image": "https://images.unsplash.com/photo-1616428090830-59bd09d9f272?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxoZXJpdGFnZXxlbnwwfHx8fDE3NTY4MjIxODZ8MA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1616428090830-59bd09d9f272?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxoZXJpdGFnZXxlbnwwfHx8fDE3NTY4MjIxODZ8MA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 13.4125, "lng": 103.8670},
        "highlights": ["Central Tower", "Bas-reliefs", "Reflecting Pools", "Library Buildings"],
        "visiting_hours": "5:00 AM - 6:00 PM",
        "entrance_fee": "37 USD",
        "languages": ["English", "Khmer", "French", "Chinese"]
    },
    {
        "name": "Tiger's Nest Monastery",
        "location": "Paro, Bhutan",
        "country": "Bhutan",
        "tradition": "Tibetan Buddhism",
        "description": "Sacred monastery perched on a cliff face, one of Bhutan's most iconic landmarks.",
        "founded": "1692",
        "architecture": "Traditional Bhutanese architecture",
        "spiritual_significance": "Sacred meditation site where Guru Rinpoche meditated",
        "tour_image": "https://images.unsplash.com/photo-1524443169398-9aa1ceab67d5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHx0ZW1wbGV8ZW58MHx8fHwxNzU2ODIyMTk1fDA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1524443169398-9aa1ceab67d5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHx0ZW1wbGV8ZW58MHx8fHwxNzU2ODIyMTk1fDA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 27.4919, "lng": 89.3642},
        "highlights": ["Cliff-side Location", "Sacred Caves", "Prayer Wheels", "Mountain Views"],
        "visiting_hours": "8:00 AM - 1:00 PM, 2:00 PM - 6:00 PM",
        "entrance_fee": "Free",
        "languages": ["English", "Dzongkha", "Hindi"]
    },
    {
        "name": "Rila Monastery",
        "location": "Rila Mountains, Bulgaria",
        "country": "Bulgaria",
        "tradition": "Eastern Orthodox",
        "description": "Bulgaria's largest and most famous Eastern Orthodox monastery, known for its colorful frescoes.",
        "founded": "10th century",
        "architecture": "Bulgarian Renaissance architecture",
        "spiritual_significance": "Most important monastery in Bulgaria, national symbol",
        "tour_image": "https://images.unsplash.com/photo-1573352763925-82bd5dfc31d1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHw0fHx0ZW1wbGV8ZW58MHx8fHwxNzU2ODIyMTk1fDA&ixlib=rb-4.1.0&q=85",
        "panorama_image": "https://images.unsplash.com/photo-1573352763925-82bd5dfc31d1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHw0fHx0ZW1wbGV8ZW58MHx8fHwxNzU2ODIyMTk1fDA&ixlib=rb-4.1.0&q=85",
        "coordinates": {"lat": 42.1333, "lng": 23.3397},
        "highlights": ["Hrelyo's Tower", "Church Frescoes", "Museum", "Library"],
        "visiting_hours": "9:00 AM - 5:00 PM",
        "entrance_fee": "Free",
        "languages": ["English", "Bulgarian", "Russian"]
    },
    {
        "name": "Hemis Monastery",
        "location": "Ladakh, India",
        "country": "India",
        "tradition": "Tibetan Buddhism",
        "description": "Largest and wealthiest monastery in Ladakh, famous for its annual festival and ancient artifacts.",
        "founded": "1630",
        "architecture": "Ladakhi Buddhist architecture",
        "spiritual_significance": "Important center of Drukpa Lineage Buddhism",
        "tour_image": "https://images.pexels.com/photos/910368/pexels-photo-910368.jpeg",
        "panorama_image": "https://images.pexels.com/photos/910368/pexels-photo-910368.jpeg",
        "coordinates": {"lat": 34.2685, "lng": 77.6193},
        "highlights": ["Main Temple", "Museum", "Festival Ground", "Sacred Relics"],
        "visiting_hours": "8:00 AM - 1:00 PM, 2:00 PM - 6:00 PM",
        "entrance_fee": "50 INR",
        "languages": ["English", "Hindi", "Ladakhi"]
    }
]

@api_router.get("/")
async def root():
    return {"message": "Welcome to Monastic Heritage - Virtual Tours Platform"}

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
async def initialize_monasteries():
    """Initialize the database with monastery data"""
    try:
        # Check if monasteries already exist
        existing_count = await db.monasteries.count_documents({})
        if existing_count > 0:
            return {"message": f"Database already contains {existing_count} monasteries"}
        
        # Insert monastery data
        monasteries = []
        for data in monastery_data:
            monastery = Monastery(**data)
            monasteries.append(monastery.dict())
        
        result = await db.monasteries.insert_many(monasteries)
        return {"message": f"Successfully initialized {len(result.inserted_ids)} monasteries"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/monasteries", response_model=List[Monastery])
async def get_monasteries(
    country: Optional[str] = Query(None, description="Filter by country"),
    tradition: Optional[str] = Query(None, description="Filter by tradition"),
    search: Optional[str] = Query(None, description="Search in name or description")
):
    """Get all monasteries with optional filtering"""
    query = {}
    
    if country:
        query["country"] = {"$regex": country, "$options": "i"}
    if tradition:
        query["tradition"] = {"$regex": tradition, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    monasteries = await db.monasteries.find(query).to_list(length=None)
    return [Monastery(**monastery) for monastery in monasteries]

@api_router.get("/monasteries/{monastery_id}", response_model=Monastery)
async def get_monastery(monastery_id: str):
    """Get a specific monastery by ID"""
    monastery = await db.monasteries.find_one({"id": monastery_id})
    if not monastery:
        raise HTTPException(status_code=404, detail="Monastery not found")
    return Monastery(**monastery)

@api_router.post("/monasteries", response_model=Monastery)
async def create_monastery(monastery: MonasteryCreate):
    """Create a new monastery"""
    new_monastery = Monastery(**monastery.dict())
    await db.monasteries.insert_one(new_monastery.dict())
    return new_monastery

@api_router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """Chat with AI guide about monasteries"""
    try:
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Get monastery context if monastery_id is provided
        monastery_context = ""
        if request.monastery_id:
            monastery = await db.monasteries.find_one({"id": request.monastery_id})
            if monastery:
                monastery_context = f"""
Current Monastery Context:
Name: {monastery['name']}
Location: {monastery['location']}, {monastery['country']}
Tradition: {monastery['tradition']}
Description: {monastery['description']}
Founded: {monastery.get('founded', 'Unknown')}
Architecture: {monastery['architecture']}
Spiritual Significance: {monastery['spiritual_significance']}
Highlights: {', '.join(monastery['highlights'])}
Visiting Hours: {monastery['visiting_hours']}
"""
        
        # Create system message with monastery expertise
        system_message = f"""You are an expert monastery guide and spiritual heritage specialist. You have deep knowledge about monasteries, temples, and spiritual sites worldwide. You provide engaging, educational, and respectful information about religious and cultural heritage.

{monastery_context}

Guidelines:
- Be informative and engaging
- Respect all religious traditions
- Provide historical and cultural context
- Suggest related monasteries or spiritual sites when relevant
- If asked about practical visiting information, provide helpful details
- Keep responses concise but informative (2-3 paragraphs max)
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

@api_router.get("/countries")
async def get_countries():
    """Get list of countries with monasteries"""
    countries = await db.monasteries.distinct("country")
    return {"countries": sorted(countries)}

@api_router.get("/traditions")
async def get_traditions():
    """Get list of religious traditions"""
    traditions = await db.monasteries.distinct("tradition")
    return {"traditions": sorted(traditions)}

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