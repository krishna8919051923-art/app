import React, { useState, useEffect, useRef } from 'react';
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
import { MapPin, Calendar, Clock, DollarSign, Globe, MessageCircle, Search, Camera, Mountain, Star, Navigation, RotateCcw, ZoomIn, ZoomOut, Move, Maximize2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PanoramicViewer = ({ images, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
    
    // For 360 rotation effect
    const rotationSpeed = 0.5;
    setRotation(prev => prev + (e.movementX * rotationSpeed));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed))));
  };

  const resetView = () => {
    setRotation(0);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1));
      if (e.key === 'r' || e.key === 'R') resetView();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-900/90 to-orange-900/90 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">360° Panoramic View</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              size="sm"
              variant="outline"
              className="text-white border-white hover:bg-white/20"
            >
              ←
            </Button>
            <span className="text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </span>
            <Button
              onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === images.length - 1}
              size="sm"
              variant="outline"
              className="text-white border-white hover:bg-white/20"
            >
              →
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setZoom(zoom => Math.max(0.5, zoom - 0.2))}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white/20"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setZoom(zoom => Math.min(3, zoom + 0.2))}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white/20"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            onClick={resetView}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/20">
            <Maximize2 className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* Panoramic Image Container */}
      <div 
        className="flex-1 relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={images[currentImageIndex]}
          alt={`Panoramic view ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-100"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          draggable={false}
        />
        
        {/* Virtual Hotspots */}
        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <MapPin className="w-4 h-4 inline mr-1" />
            Prayer Hall
          </div>
        </div>
        
        <div className="absolute top-1/2 right-1/3 transform translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <Star className="w-4 h-4 inline mr-1" />
            Sacred Altar
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <Navigation className="w-4 h-4 inline mr-1" />
            Meditation Area
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-white text-sm flex items-center space-x-4">
            <span><Move className="w-4 h-4 inline mr-1" />Drag to explore</span>
            <span><ZoomIn className="w-4 h-4 inline mr-1" />Scroll to zoom</span>
            <span><Navigation className="w-4 h-4 inline mr-1" />Click hotspots</span>
            <span className="text-amber-400">ESC to exit | R to reset</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const VirtualTourViewer = ({ monastery, onClose }) => {
  const [currentView, setCurrentView] = useState('gallery');
  const [tourPoints] = useState([
    { id: 'exterior', name: 'Exterior View', images: monastery.gallery_images },
    { id: 'interior', name: 'Interior', images: monastery.gallery_images.slice(1) },
    { id: 'panoramic', name: '360° Panoramic', images: monastery.panoramic_images },
    { id: 'details', name: 'Architectural Details', images: monastery.gallery_images }
  ]);
  
  const [showPanorama, setShowPanorama] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const currentTourPoint = tourPoints.find(p => p.id === currentView) || tourPoints[0];

  if (showPanorama) {
    return (
      <PanoramicViewer 
        images={monastery.panoramic_images} 
        onClose={() => setShowPanorama(false)} 
      />
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-900/90 to-orange-900/90 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white">{monastery.name}</h2>
          <p className="text-amber-100">{monastery.location} • {monastery.altitude}</p>
        </div>
        <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/20">
          Close Tour
        </Button>
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <img 
            src={currentTourPoint.images[currentImageIndex] || monastery.main_image}
            alt={`${monastery.name} - ${currentView}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
        </div>
        
        {/* Image Navigation */}
        {currentTourPoint.images.length > 1 && (
          <div className="absolute top-1/2 left-4 right-4 flex justify-between items-center">
            <Button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              ←
            </Button>
            <Button
              onClick={() => setCurrentImageIndex(Math.min(currentTourPoint.images.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === currentTourPoint.images.length - 1}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              →
            </Button>
          </div>
        )}
        
        {/* Tour Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Virtual Tour Experience</h3>
              <Button
                onClick={() => setShowPanorama(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                360° Panoramic View
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {tourPoints.map((point) => (
                <Button
                  key={point.id}
                  onClick={() => {
                    setCurrentView(point.id);
                    setCurrentImageIndex(0);
                  }}
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
            
            {/* Image Counter */}
            {currentTourPoint.images.length > 1 && (
              <div className="text-center text-white/70 text-sm">
                Image {currentImageIndex + 1} of {currentTourPoint.images.length}
              </div>
            )}
          </div>
        </div>
        
        {/* Interactive Hotspots for current view */}
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <MapPin className="w-4 h-4 inline mr-1" />
            Main Hall
          </div>
        </div>
        
        <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-600 text-white px-3 py-2 rounded-full text-sm animate-pulse cursor-pointer hover:bg-amber-700 transition-colors">
            <Star className="w-4 h-4 inline mr-1" />
            Buddha Statue
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
          src={monastery.main_image} 
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
        <Badge className="absolute top-3 right-3 bg-orange-600/90 text-white">
          {monastery.altitude}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-gray-800 group-hover:text-amber-700 transition-colors">
          {monastery.name}
        </CardTitle>
        <CardDescription className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {monastery.location}
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
            Founded: {monastery.founded}
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
    <div className="max-w-6xl mx-auto">
      <div className="relative mb-8">
        <img 
          src={monastery.main_image} 
          alt={monastery.name}
          className="w-full h-64 object-cover rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-bold text-white mb-2">{monastery.name}</h1>
          <p className="text-amber-200 text-lg flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {monastery.location} • {monastery.altitude}
          </p>
          <p className="text-amber-100 mt-1">{monastery.district}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
          <TabsTrigger value="festivals">Festivals</TabsTrigger>
          <TabsTrigger value="travel">Travel Guide</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mountain className="w-5 h-5 mr-2 text-amber-600" />
                About {monastery.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{monastery.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Tradition</h4>
                  <Badge className="bg-amber-100 text-amber-800">{monastery.tradition}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Founded</h4>
                  <p className="text-gray-600">{monastery.founded}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Architecture</h4>
                  <p className="text-gray-600">{monastery.architecture}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Accessibility</h4>
                  <p className="text-gray-600">{monastery.accessibility}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spiritual Significance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{monastery.spiritual_significance}</p>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Cultural Importance</h4>
                <p className="text-gray-700">{monastery.cultural_importance}</p>
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

        <TabsContent value="culture">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-amber-600" />
                Ask Our Sikkim Expert
              </CardTitle>
              <CardDescription>
                Get detailed information about {monastery.name}, Sikkim Buddhist culture, and local traditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80 mb-4 p-4 border rounded-lg bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Ask me anything about {monastery.name} and Sikkim's Buddhist heritage!</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>• "Tell me about the history of this monastery"</p>
                      <p>• "What festivals are celebrated here?"</p>
                      <p>• "How do I get permits to visit?"</p>
                      <p>• "What's the best time to visit Sikkim?"</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
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
                  placeholder="Ask about history, culture, visiting tips..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="festivals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {monastery.festivals.map((festival, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg text-amber-700">{festival.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {festival.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{festival.description}</p>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-1">Significance</h4>
                    <p className="text-sm text-gray-700">{festival.significance}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="travel">
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
                  <h4 className="font-semibold text-gray-800 mb-1">Accessibility</h4>
                  <p className="text-gray-600">{monastery.accessibility}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Travel Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Best Time to Visit</h4>
                  <p className="text-sm text-gray-600">{monastery.travel_info.best_time_to_visit}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Nearest Airport</h4>
                  <p className="text-sm text-gray-600">{monastery.travel_info.nearest_airport}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Local Transport</h4>
                  <p className="text-sm text-gray-600">{monastery.travel_info.local_transport}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Permits Required</h4>
                  <p className="text-sm text-gray-600">{monastery.travel_info.permits_required}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Weather Info</h4>
                  <p className="text-sm text-gray-600">{monastery.travel_info.weather_info}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monastery.gallery_images.map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-lg">
                <img 
                  src={image} 
                  alt={`${monastery.name} view ${index + 1}`}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
              </div>
            ))}
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
          Back to Monasteries
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
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTradition, setSelectedTradition] = useState('');
  const [districts, setDistricts] = useState([]);
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
        const [districtsResponse, traditionsResponse] = await Promise.all([
          axios.get(`${API}/districts`),
          axios.get(`${API}/traditions`)
        ]);
        
        setDistricts(districtsResponse.data.districts);
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

    if (selectedDistrict) {
      filtered = filtered.filter(monastery => monastery.district === selectedDistrict);
    }

    if (selectedTradition) {
      filtered = filtered.filter(monastery => monastery.tradition === selectedTradition);
    }

    setFilteredMonasteries(filtered);
  }, [searchTerm, selectedDistrict, selectedTradition, monasteries]);

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
          <p className="text-amber-800 text-lg">Loading Sikkim monasteries...</p>
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
            src="https://images.unsplash.com/photo-1687074106203-f3dad46d9eb6"
            alt="Sikkim Monastery with Himalayas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Discover Sikkim's
              <span className="block text-amber-400">Sacred Monasteries</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Explore the mystical monasteries of Sikkim nestled in the Himalayas. 
              Experience ancient Buddhist wisdom, stunning architecture, and spiritual tranquility through immersive virtual tours.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
                <Camera className="w-5 h-5 mr-2" />
                Start Virtual Journey
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/20 px-8 py-3 text-lg">
                <Mountain className="w-5 h-5 mr-2" />
                Explore Culture
              </Button>
            </div>
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
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* Sikkim Info Section */}
      <div className="bg-white/60 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Discover Sikkim's Buddhist Heritage</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nestled in the Eastern Himalayas, Sikkim is home to some of the most sacred Buddhist monasteries, 
              each telling a unique story of faith, architecture, and cultural preservation.
            </p>
          </div>
        </div>
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