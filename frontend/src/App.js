import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { MapPin, Calendar, Clock, DollarSign, Globe, MessageCircle, Search, Camera, Mountain, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VirtualTourViewer = ({ monastery, onClose }) => {
  const [currentView, setCurrentView] = useState('exterior');
  const [tourPoints, setTourPoints] = useState([
    { id: 'exterior', name: 'Exterior View', image: monastery.tour_image },
    { id: 'interior', name: 'Interior', image: monastery.panorama_image },
    { id: 'courtyard', name: 'Courtyard', image: monastery.tour_image },
    { id: 'temple', name: 'Main Temple', image: monastery.panorama_image }
  ]);
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-900/90 to-orange-900/90 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white">{monastery.name}</h2>
          <p className="text-amber-100">{monastery.location}</p>
        </div>
        <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/20">
          Close Tour
        </Button>
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <img 
            src={tourPoints.find(p => p.id === currentView)?.image || monastery.tour_image}
            alt={`${monastery.name} - ${currentView}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
        </div>
        
        {/* Tour Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Virtual Tour Points</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tourPoints.map((point) => (
                <Button
                  key={point.id}
                  onClick={() => setCurrentView(point.id)}
                  variant={currentView === point.id ? "default" : "outline"}
                  className={`${currentView === point.id 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'border-white/30 text-white hover:bg-white/20'
                  } transition-all duration-200`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {point.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Interactive Hotspots */}
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <MapPin className="w-4 h-4 inline mr-1" />
            Sacred Hall
          </div>
        </div>
        
        <div className="absolute top-1/3 right-1/3 transform translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <Star className="w-4 h-4 inline mr-1" />
            Prayer Wheel
          </div>
        </div>
      </div>
    </div>
  );
};

const MonasteryCard = ({ monastery, onStartTour, onLearnMore }) => {
  return (
    <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm">
      <div className="relative overflow-hidden">
        <img 
          src={monastery.tour_image} 
          alt={monastery.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button 
            onClick={() => onStartTour(monastery)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Virtual Tour
          </Button>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-gray-800 group-hover:text-amber-700 transition-colors">
          {monastery.name}
        </CardTitle>
        <CardDescription className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {monastery.location}, {monastery.country}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
          {monastery.tradition}
        </Badge>
        
        <p className="text-sm text-gray-600 line-clamp-2">
          {monastery.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            Founded: {monastery.founded || 'Ancient'}
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {monastery.visiting_hours}
          </span>
        </div>
        
        <Button 
          onClick={() => onLearnMore(monastery)}
          variant="outline" 
          className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          Learn More
        </Button>
      </CardContent>
    </Card>
  );
};

const MonasteryDetails = ({ monastery, onClose, onStartTour }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId] = useState(() => 'session_' + Date.now());
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = newMessage;
    setNewMessage('');
    
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    
    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        session_id: sessionId,
        monastery_id: monastery.id
      });
      
      setChatMessages(prev => [...prev, { type: 'ai', message: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { type: 'ai', message: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative mb-8">
        <img 
          src={monastery.panorama_image} 
          alt={monastery.name}
          className="w-full h-64 object-cover rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-bold text-white mb-2">{monastery.name}</h1>
          <p className="text-amber-200 text-lg flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {monastery.location}, {monastery.country}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="spiritual">Spiritual</TabsTrigger>
          <TabsTrigger value="visit">Visit Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mountain className="w-5 h-5 mr-2 text-amber-600" />
                About {monastery.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{monastery.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Tradition</h4>
                  <Badge className="bg-amber-100 text-amber-800">{monastery.tradition}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Founded</h4>
                  <p className="text-gray-600">{monastery.founded || 'Ancient times'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {monastery.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-amber-500" />
                    <span className="text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture">
          <Card>
            <CardHeader>
              <CardTitle>Architectural Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{monastery.architecture}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spiritual">
          <Card>
            <CardHeader>
              <CardTitle>Spiritual Significance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{monastery.spiritual_significance}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-600" />
                  Visiting Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Opening Hours</h4>
                  <p className="text-gray-600">{monastery.visiting_hours}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Entrance Fee</h4>
                  <p className="text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {monastery.entrance_fee}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {monastery.languages.map((lang, index) => (
                      <Badge key={index} variant="outline" className="flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Ask Our AI Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4 p-4 border rounded-lg bg-gray-50">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center">Ask me anything about {monastery.name}!</p>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-3 rounded-lg ${
                            msg.type === 'user' 
                              ? 'bg-amber-600 text-white' 
                              : 'bg-white text-gray-800 shadow-sm border'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white text-gray-800 shadow-sm border p-3 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask about history, architecture, visiting tips..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                  />
                  <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex space-x-4">
        <Button 
          onClick={() => onStartTour(monastery)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8"
        >
          <Camera className="w-4 h-4 mr-2" />
          Start Virtual Tour
        </Button>
        <Button onClick={onClose} variant="outline">
          Back to Gallery
        </Button>
      </div>
    </div>
  );
};

const Home = () => {
  const [monasteries, setMonasteries] = useState([]);
  const [filteredMonasteries, setFilteredMonasteries] = useState([]);
  const [selectedMonastery, setSelectedMonastery] = useState(null);
  const [tourMonastery, setTourMonastery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedTradition, setSelectedTradition] = useState('');
  const [countries, setCountries] = useState([]);
  const [traditions, setTraditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize monasteries
        await axios.post(`${API}/monasteries/initialize`);
        
        // Fetch monasteries
        const monasteryResponse = await axios.get(`${API}/monasteries`);
        setMonasteries(monasteryResponse.data);
        setFilteredMonasteries(monasteryResponse.data);
        
        // Fetch filter options
        const [countriesResponse, traditionsResponse] = await Promise.all([
          axios.get(`${API}/countries`),
          axios.get(`${API}/traditions`)
        ]);
        
        setCountries(countriesResponse.data.countries);
        setTraditions(traditionsResponse.data.traditions);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    let filtered = monasteries;

    if (searchTerm) {
      filtered = filtered.filter(monastery =>
        monastery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monastery.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monastery.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter(monastery => monastery.country === selectedCountry);
    }

    if (selectedTradition) {
      filtered = filtered.filter(monastery => monastery.tradition === selectedTradition);
    }

    setFilteredMonasteries(filtered);
  }, [searchTerm, selectedCountry, selectedTradition, monasteries]);

  const handleStartTour = (monastery) => {
    setTourMonastery(monastery);
  };

  const handleLearnMore = (monastery) => {
    setSelectedMonastery(monastery);
  };

  if (tourMonastery) {
    return <VirtualTourViewer monastery={tourMonastery} onClose={() => setTourMonastery(null)} />;
  }

  if (selectedMonastery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
        <MonasteryDetails 
          monastery={selectedMonastery} 
          onClose={() => setSelectedMonastery(null)}
          onStartTour={handleStartTour}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-800 text-lg">Loading monastic heritage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1601825915519-0dd631a2d58d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxoZXJpdGFnZXxlbnwwfHx8fDE3NTY4MjIxODZ8MA&ixlib=rb-4.1.0&q=85"
            alt="Heritage"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Discover Sacred
              <span className="block text-amber-400">Heritage</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Immerse yourself in virtual tours of the world's most magnificent monasteries. 
              Experience centuries of spiritual wisdom and architectural beauty from anywhere.
            </p>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
              <Camera className="w-5 h-5 mr-2" />
              Begin Your Journey
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search monasteries, locations, or traditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/90"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={selectedTradition}
                onChange={(e) => setSelectedTradition(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Traditions</option>
                {traditions.map(tradition => (
                  <option key={tradition} value={tradition}>{tradition}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Monasteries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredMonasteries.map((monastery) => (
            <MonasteryCard
              key={monastery.id}
              monastery={monastery}
              onStartTour={handleStartTour}
              onLearnMore={handleLearnMore}
            />
          ))}
        </div>

        {filteredMonasteries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No monasteries found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;