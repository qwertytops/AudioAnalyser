import unittest, datetime
from app import createApp, db
from app.models import User
from app.testConfig import testConfig
from werkzeug.security import generate_password_hash

class TestAnalysis(unittest.TestCase):
    def setUp(self):
        self.app = createApp(testConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        user = User(
            username='fonkayponkay',
            email='fonkay@ponkay.com',
            passwordHash=generate_password_hash('ponkay123'),
            createdAt=datetime.datetime(1964, 3, 1),  
            updatedAt=datetime.datetime.now()
        )
        db.session.add(user)
        db.session.commit()
        self.client = self.app.test_client()
    def login(self):
        return self.client.post('/login', data={
            'login_id': 'fonkayponkay',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def testAnalysisRoute(self):
        response = self.client.get('/analysis')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<select id="fileselect"', response.data.lower())
        self.assertIn(b'select a file', response.data.lower())

        
    def testAnalysisRouteNoFiles(self):
        with self.client as c:
            response = c.get('/analysis')
            self.assertEqual(response.status_code, 200)
            with c.session_transaction() as sess:
                flashes = sess.get('_flashes', [])
        self.assertIn(('message', 'No files uploaded'), flashes)
    
    def testSaveLoggedIn(self):
        self.login()
        data = {
            'filename': 'fonkay.wav',
            'frequencyArray': [200, 400, 700],
            'clipLength': 10.5,
            'maxLevel': 0.8,
            'highestFrequency': 2000,
            'lowestFrequency': 20,
            'fundamentalFrequency': 440
        }
        response = self.client.post('/save', json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'analysis saved successfully', response.data.lower())

        
        from app.models import AnalysisResult 
        result = AnalysisResult.query.filter_by(fileName='fonkay.wav').first() #check if data is stored in the database
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result.clipLength, 10.5)

    def testSaveNotLoggedIn(self):
        data = {
            'filename': 'fonkaaaaaaay.wav',
            'frequencyArray': [200, 400, 700],
            'clipLength': 10.5,
            'maxLevel': 0.8,
            'highestFrequency': 2000,
            'lowestFrequency': 20,
            'fundamentalFrequency': 440
        }
        response = self.client.post('/save', json=data)
        self.assertEqual(response.status_code, 401)
        self.assertIn(b'user not logged in', response.data.lower())

    

    


    
    

    

        
        

if __name__ == '__main__':
    unittest.main()