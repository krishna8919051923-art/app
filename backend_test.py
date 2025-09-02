import requests
import sys
import json
from datetime import datetime

class MonasteryAPITester:
    def __init__(self, base_url="https://monastic-guide.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = f"test_session_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.status_code < 400 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_initialize_monasteries(self):
        """Test monastery initialization"""
        return self.run_test("Initialize Monasteries", "POST", "monasteries/initialize", 200)

    def test_get_monasteries(self):
        """Test getting all monasteries"""
        success, response = self.run_test("Get All Monasteries", "GET", "monasteries", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} monasteries")
            if len(response) > 0:
                print(f"   First monastery: {response[0].get('name', 'Unknown')}")
        return success, response

    def test_get_monastery_by_id(self, monastery_id):
        """Test getting specific monastery"""
        return self.run_test(
            f"Get Monastery by ID", 
            "GET", 
            f"monasteries/{monastery_id}", 
            200
        )

    def test_search_monasteries(self):
        """Test monastery search functionality"""
        test_cases = [
            ("Rumtek", "search=Rumtek"),
            ("Nyingma", "search=Nyingma"), 
            ("Gangtok", "search=Gangtok")
        ]
        
        for search_term, params in test_cases:
            success, response = self.run_test(
                f"Search Monasteries - {search_term}",
                "GET",
                f"monasteries?{params}",
                200
            )
            if success and isinstance(response, list):
                print(f"   Search '{search_term}' returned {len(response)} results")

    def test_filter_by_district(self):
        """Test filtering by district"""
        test_cases = [
            ("East Sikkim", "district=East Sikkim"),
            ("West Sikkim", "district=West Sikkim")
        ]
        
        for district, params in test_cases:
            success, response = self.run_test(
                f"Filter by District - {district}",
                "GET",
                f"monasteries?{params}",
                200
            )
            if success and isinstance(response, list):
                print(f"   {district} filter returned {len(response)} results")

    def test_filter_by_tradition(self):
        """Test filtering by tradition"""
        test_cases = [
            ("Nyingma", "tradition=Nyingma"),
            ("Kagyu", "tradition=Kagyu")
        ]
        
        for tradition, params in test_cases:
            success, response = self.run_test(
                f"Filter by Tradition - {tradition}",
                "GET",
                f"monasteries?{params}",
                200
            )
            if success and isinstance(response, list):
                print(f"   {tradition} filter returned {len(response)} results")

    def test_get_districts(self):
        """Test getting districts list"""
        return self.run_test("Get Districts", "GET", "districts", 200)

    def test_get_traditions(self):
        """Test getting traditions list"""
        return self.run_test("Get Traditions", "GET", "traditions", 200)
    
    def test_get_festivals(self):
        """Test getting all festivals"""
        return self.run_test("Get All Festivals", "GET", "festivals", 200)
    
    def test_get_travel_guide(self):
        """Test getting travel guide"""
        return self.run_test("Get Travel Guide", "GET", "travel-guide", 200)

    def test_ai_chat(self, monastery_id=None):
        """Test AI chat functionality"""
        chat_data = {
            "message": "Tell me about the history of this monastery",
            "session_id": self.session_id,
            "monastery_id": monastery_id
        }
        
        success, response = self.run_test(
            "AI Chat Integration",
            "POST",
            "chat",
            200,
            data=chat_data
        )
        
        if success:
            if 'response' in response:
                print(f"   AI Response length: {len(response['response'])} characters")
                print(f"   AI Response preview: {response['response'][:100]}...")
            else:
                print("   Warning: No 'response' field in AI chat response")
        
        return success, response

    def test_chat_history(self):
        """Test getting chat history"""
        return self.run_test(
            "Get Chat History",
            "GET",
            f"chat/history/{self.session_id}",
            200
        )

def main():
    print("🏛️  Virtual Monastery Tours - Backend API Testing")
    print("=" * 60)
    
    tester = MonasteryAPITester()
    
    # Test basic endpoints
    print("\n📡 Testing Basic API Endpoints...")
    tester.test_root_endpoint()
    
    # Initialize data
    print("\n🗄️  Testing Database Initialization...")
    tester.test_initialize_monasteries()
    
    # Test monastery endpoints
    print("\n🏛️  Testing Monastery Endpoints...")
    success, monasteries = tester.test_get_monasteries()
    
    monastery_id = None
    if success and monasteries and len(monasteries) > 0:
        monastery_id = monasteries[0].get('id')
        if monastery_id:
            tester.test_get_monastery_by_id(monastery_id)
    
    # Test search and filtering
    print("\n🔍 Testing Search and Filtering...")
    tester.test_search_monasteries()
    tester.test_filter_by_country()
    tester.test_filter_by_tradition()
    
    # Test filter options
    print("\n📋 Testing Filter Options...")
    tester.test_get_countries()
    tester.test_get_traditions()
    
    # Test AI chat integration
    print("\n🤖 Testing AI Chat Integration...")
    tester.test_ai_chat(monastery_id)
    tester.test_chat_history()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())