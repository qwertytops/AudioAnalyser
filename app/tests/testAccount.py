import unittest, datetime
from app import createApp, db
from app.models import User, AnalysisResult
from app.testConfig import testConfig
from werkzeug.security import generate_password_hash

class TestAccount(unittest.TestCase):
    def setUp(self):
        self.app = createApp(testConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.user = User(
            username='fonkayponkay',
            email='fonkay@ponkay.com',
            passwordHash=generate_password_hash('ponkay123'),
            createdAt=datetime.datetime(1964, 3, 1),  
            updatedAt=datetime.datetime.now()
        )
        db.session.add(self.user)
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

    def testUploadRender(self):
        response = self.client.get('/upload')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Upload', response.data)
        
    
    def testNoLogin(self):
        resp = self.client.get('/account', follow_redirects=False)
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/signUp', resp.headers['Location'])

    def testAccountAnalysis(self):
        a1 = AnalysisResult(
            createdAt=datetime.datetime.now(),
            userId=self.user.id,
            fileName='first.wav',
            frequencyArray=[1,2,3],
            clipLength=1.0,
            maxLevel=-10,
            highestFrequency=100,
            lowestFrequency=10,
            fundamentalFrequency=50
        )
        a2 = AnalysisResult(
            createdAt=datetime.datetime.now(),
            userId=self.user.id,
            fileName='second.wav',
            frequencyArray=[4,5,6],
            clipLength=2.0,
            maxLevel=-20,
            highestFrequency=200,
            lowestFrequency=20,
            fundamentalFrequency=60
        )
        db.session.add_all([a1, a2])
        db.session.commit()

        self.login()
        resp = self.client.get('/account')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'first.wav', resp.data)
        self.assertIn(b'second.wav', resp.data)

    def testLogout(self):
        self.login()
        resp = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        
if __name__ == '__main__':
    unittest.main()
