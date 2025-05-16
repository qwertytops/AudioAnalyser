import unittest
from app import createApp, db
from app.models import User
from app.testConfig import testConfig

class TestSignup(unittest.TestCase):
    def setUp(self):
        self.app = createApp(testConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        self.client = self.app.test_client()
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def testSignup(self):
        response = self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com', 'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'Account created successfully!', response.data)
        user = User.query.filter_by(username='FonkayPonkay').first()
        self.assertIsNotNone(user) 
        self.assertEqual(user.email, 'fonkay@ponkay.com')
    
    def testDuplicateSignup(self):
        self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)

        response = self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'fonkayponkay', response.data.lower())
        self.assertIn(b'already taken', response.data.lower())
        self.assertIn(b'fonkay@ponkay.com', response.data.lower())
        self.assertIn(b'is already registered', response.data.lower()) 
    def testPasswordHashed(self):
        self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        user = User.query.filter_by(username='FonkayPonkay').first()
        self.assertIsNotNone(user)
        self.assertNotEqual(user.passwordHash, 'ponkay123') 

############ testing format  ######################
    def testInvalidEmail(self):
        response = self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'invali-email',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'please enter a valid email address', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='InvalidEmailUser').first())
    def testInvalidUsername(self):
        response = self.client.post('/signUp', data={
            'username': 'Fo',
            'email': 'fonkay@ponkay.com',
            'password': 'ponkay123',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'username must be at least 3 characters long.', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='InvalidEmailUser').first())
    def testInvalidPassword(self):
        response = self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com',
            'password': 'po',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'password must be at least 8 characters long', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='InvalidEmailUser').first())
    def testInvalidPasswordNoNumber(self):
        response = self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com',
            'password': 'fonkayponkay',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'password must contain both letters and numbers.', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='InvalidEmailUser').first())
    def testInvalidPasswordNoLetter(self):
        response = self.client.post('/signUp', data={
            'username': 'FonkayPonkay',
            'email': 'fonkay@ponkay.com',
            'password': '12345678907',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'password must contain both letters and numbers.', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='InvalidEmailUser').first())
        
############ testing empty fields######################

    def testEmptyUsername(self):
        response = self.client.post('/signUp', data={
            'username': '',
            'email': 'fonkay@gmal.com',
            'password': 'secretsauce',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'this field is required.', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='').first())
        self.assertIsNone(User.query.filter_by(email='').first())
    def testEmptyEmail(self):
        response = self.client.post('/signUp', data={
            'username': 'fonkay',
            'email': '',
            'password': 'secretsauce',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'this field is required.', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='').first())
        self.assertIsNone(User.query.filter_by(email='').first())
    def testEmptyPassword(self):
        response = self.client.post('/signUp', data={
            'username': 'fonkay',
            'email': 'fonkay@gmal.com',
            'password': '',
            'submit': True
        }, follow_redirects=True)
        self.assertIn(b'this field is required.', response.data.lower())
        self.assertIsNone(User.query.filter_by(username='').first())
        self.assertIsNone(User.query.filter_by(email='').first())




if __name__ == '__main__':
    unittest.main()
