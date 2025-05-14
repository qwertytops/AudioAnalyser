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

    def testUploadRender(self):
        response = self.client.get('/upload')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Upload', response.data)
        
        

if __name__ == '__main__':
    unittest.main()
