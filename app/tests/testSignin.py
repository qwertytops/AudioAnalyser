import unittest, datetime
from app import createApp, db
from app.models import User
from app.testConfig import testConfig
from werkzeug.security import generate_password_hash

class TestLogin(unittest.TestCase):
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
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def testLoginWithUsername(self):
        response = self.client.post('/login', data={
            'login_id': 'fonkayponkay',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'login successful!', response.data.lower())
    def testLoginWithEmail(self):
        response = self.client.post('/login', data={
            'login_id': 'fonkay@ponkay.com',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'login successful!', response.data.lower())


########### testing invalid credentials ####################
    def testInvalidEmail(self):
        response = self.client.post('/login', data={
            'login_id': 'fonkaypon.com',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'invalid username/email or password. please try again.', response.data.lower())
    def testInvalidUsername(self):
        response = self.client.post('/login', data={
            'login_id': 'yaknopyaknof',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'invalid username/email or password. please try again.', response.data.lower())
    def testInvalidPassword(self):
        response = self.client.post('/login', data={
            'login_id': 'fonkay@ponkay.com',
            'password': '123yakonp',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'invalid username/email or password. please try again.', response.data.lower())
    
    
    def testEmptyUsernamePassword(self):
        response = self.client.post('/login', data={
            'login_id': '',
            'password': '',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'email or username', response.data.lower())
    

if __name__ == '__main__':
    unittest.main()
