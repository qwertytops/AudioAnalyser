import unittest, datetime
from app import createApp, db
import os, io
from app.models import User
from app.testConfig import testConfig
from werkzeug.security import generate_password_hash
from werkzeug.datastructures import MultiDict #helps to simulatee upload form data

class TestUpload(unittest.TestCase):
    def setUp(self):
        self.app = createApp(testConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        
        db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    def testUploadRender(self):
        response = self.client.get('/upload')
        self.assertEqual(response.status_code, 200) #rendered successfully
        text = response.data.decode('utf-8')
        #check key elements in the page
        self.assertRegex(text, r'id\s*=\s*"dragDrop"',
                         msg="Missing dragDrop container")
        self.assertRegex(text, r'id\s*=\s*"uploadButton"',
                         msg="Missing Upload button with id=uploadButton")
    
    def testFileUpload(self): #checks whether files are uploaded
        upload_folder = self.app.config['UPLOAD_FOLDER'] #reads upload folder
        data = MultiDict([
            ('files', (io.BytesIO(b"a"), 'test1.wav')), #simulate file in memory allocating 1 byte each
            ('files', (io.BytesIO(b"b"), 'test2.wav')),
        ])
        response = self.client.post('/upload', data=data, content_type='multipart/form-data', follow_redirects=False) # Http request
        self.assertEqual(response.status_code, 302)
        self.assertIn('/analysis?files=test1.wav,test2.wav', response.headers['Location']) #check if redirect is successful
        self.assertTrue(os.path.exists(os.path.join(upload_folder, 'test1.wav'))) #check if file exists
        self.assertTrue(os.path.exists(os.path.join(upload_folder, 'test2.wav')))

   
    def testUploadsCleanup(self):
        upload_folder = self.app.config['UPLOAD_FOLDER']
        testfile = os.path.join(upload_folder, 'fonkaytest.txt')
        with open(testfile, 'w'): pass
        response = self.client.post('/cleanupFiles')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload.get('status'), 'success')
        self.assertFalse(os.path.exists(testfile))
    
    def testEmptyFile(self): #should skip empty files
        upload_folder = self.app.config['UPLOAD_FOLDER']
        data = MultiDict([
            ('files', (io.BytesIO(b"a"), '')),
            ('files', (io.BytesIO(b"b"), 'test2.wav')),
        ])
        response = self.client.post('/upload', data=data, content_type='multipart/form-data', follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertIn('/analysis?files=test2.wav', response.headers['Location'])
        self.assertTrue(os.path.exists(os.path.join(upload_folder, 'test2.wav')))
    




    


    
    

    

        
        

if __name__ == '__main__':
    unittest.main()