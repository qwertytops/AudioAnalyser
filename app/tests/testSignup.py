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
        self.assertIsNotNone(user) #verify that the user is stored in the database
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

        self.assertIn(b'', response.data.lower())  



if __name__ == '__main__':
    unittest.main()
