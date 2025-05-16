import unittest
import time
import datetime
import multiprocessing
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException, UnexpectedAlertPresentException
from selenium.webdriver.chrome.options import Options
from werkzeug.security import generate_password_hash
import os
from app import createApp, db
from app.testConfig import testConfig
from app.models import User
localhost = "http://127.0.0.1:5000"

class TestSeleniumUpload(unittest.TestCase):

    def setUp(self):
        self.testApp = createApp(testConfig)
        self.app_ctx = self.testApp.app_context()
        self.app_ctx.push()
        db.create_all()
        self.user = User(
            username='testuser',
            email='testuser@example.com',
            passwordHash=generate_password_hash('Password123'),
            createdAt=datetime.datetime.now(),
            updatedAt=datetime.datetime.now()
        )
        db.session.add(self.user)
        db.session.commit()
       
       
        self.server_thread = multiprocessing.Process(target=self.testApp.run)
        self.server_thread.start()
        options = Options()
        
        options.add_argument("--headless") #somereasn does allow popup
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)


        
        return super().setUp()
    
    def login(self):
        self.driver.get("localhost/login")
        self.driver.find_element(By.NAME, "login_id").send_keys("testuser")
        self.driver.find_element(By.NAME, "password").send_keys("Password123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
        self.wait.until(EC.url_contains("/account"))

    def tearDown(self):
        self.server_thread.terminate()
        self.driver.close()
        db.session.remove()
        db.drop_all()
        self.app_ctx.pop()
        
   
    def testUploadNoFile(self):
        self.driver.get(f"{localhost}/upload")
        upload_btn = self.driver.find_element(By.ID, "uploadButton")
        self.assertTrue(upload_btn.is_enabled(), "Upload button should be enabled")
        try :
            self.driver.execute_script("arguments[0].click();", upload_btn)
            alert = WebDriverWait(self.driver, 5).until(EC.alert_is_present())
            alertMessage = alert.text
            self.assertIn("Please select a file before uploading", alertMessage, 
                         f"Alert was: '{alertMessage}', but should should have containd 'Please select a file before uploading'")
            time.sleep(2)
            alert.accept()
            WebDriverWait(self.driver, 10).until_not(EC.alert_is_present())
        except UnexpectedAlertPresentException:
            self.fail("No alert appeared after clicking upload with no file selected")

    def testFileUpload(self):
        self.driver.get(f"{localhost}/upload")
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        uploads = os.path.join(os.getcwd(), "static", "uploads")
        os.makedirs(uploads, exist_ok=True)
        test_filename = "test_display.txt"
        uploadFile = os.path.join(uploads, test_filename)
        
        with open(uploadFile, "wb") as f:
            f.write(b"foo")

        try:
            file_input = self.wait.until(EC.visibility_of_element_located((By.ID, "formFile")))
            file_input.send_keys(uploadFile)
            filenameDisplay = self.wait.until( EC.visibility_of_element_located((By.ID, "filename"))) # verify display
            self.assertIn(test_filename, filenameDisplay.text)

        finally:
            if os.path.exists(uploadFile):
                os.remove(uploadFile)
    
        

       
        
    

if __name__ == "__main__":
    unittest.main()