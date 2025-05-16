import unittest
import time
import datetime
import multiprocessing
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException, UnexpectedAlertPresentException
from selenium.webdriver.chrome.options import Options
from werkzeug.security import generate_password_hash
import os
from app import createApp, db
from app.testConfig import testConfig
from app.models import User, AnalysisResult
localhost = "http://127.0.0.1:5000"

class TestSeleniumUpload(unittest.TestCase):

    def setUp(self):
        self.testApp = createApp(testConfig)
        self.app_ctx = self.testApp.app_context()
        self.app_ctx.push()
        db.create_all()

        #Dummy user 1
        self.user = User(
            username='Fonkayy',
            email='test1@example.com',
            passwordHash=generate_password_hash('Fonkay123'),
            createdAt=datetime.datetime.now(),
            updatedAt=datetime.datetime.now()
        )
        db.session.add(self.user)
        db.session.commit()

        #Dummy user 2
        self.user2 = User(
            username='Ponkay',
            email='test2@example.com',
            passwordHash=generate_password_hash('Ponkay123'),
            createdAt=datetime.datetime.now(),
            updatedAt=datetime.datetime.now()
        )
        db.session.add(self.user2)
        db.session.commit()

        # Dummy data
        analysis = AnalysisResult(
            createdAt=datetime.datetime.now(),
            userId=self.user.id,
            fileName='file1.txt',
            frequencyArray='[]',
            clipLength=1.0,
            maxLevel=0.5,
            highestFrequency=1000.0,
            lowestFrequency=20.0,
            fundamentalFrequency=80000.0
        )
        db.session.add(analysis)
        db.session.commit()
        self.analysis_id = analysis.id
       
        self.server_thread = multiprocessing.Process(target=self.testApp.run)
        self.server_thread.start()
        options = Options()
        
        #options.add_argument("--headless") #prevents browser popup
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)


        
        return super().setUp()
    
    def login(self):
        self.driver.get(f"{localhost}/login")  #login form in the introductory View

        login_button = self.wait.until(EC.element_to_be_clickable((By.ID, "logInButton")))
        self.driver.execute_script("arguments[0].click();", login_button)
        self.wait.until(EC.visibility_of_element_located((By.ID, "logInForm")))

        #wait for login to load
        username_field = self.wait.until(EC.presence_of_element_located((By.ID, "logInEmail")))
        password_field = self.wait.until(EC.presence_of_element_located((By.ID, "logInPassword")))
        submit_button = self.wait.until(EC.element_to_be_clickable((By.NAME, "submit")))

        #ensure input fields are empty and fill+
        username_field.clear()
        password_field.clear()
        username_field.send_keys("Fonkayy")
        password_field.send_keys("Fonkay123")
        self.driver.execute_script("arguments[0].click();", submit_button)

        
        self.wait.until(EC.url_contains("/index")) 
        time.sleep(1)



    def tearDown(self):
        self.server_thread.terminate()
        self.driver.close()
        db.session.remove()
        db.drop_all()
        self.app_ctx.pop()
  
    def testUploadNoFile(self):
        self.driver.get(f"{localhost}/upload")
        uploadButton = self.driver.find_element(By.ID, "uploadButton")
        self.assertTrue(uploadButton.is_enabled(), "upload button should work") #ensure button is enabled

        #test clicking upload button with no file selected
        try :
            self.driver.execute_script("arguments[0].click();", uploadButton)
            alert = WebDriverWait(self.driver, 5).until(EC.alert_is_present()) #wait for alert popup
            alertMessage = alert.text
             #check if alert message is correct
            self.assertIn("Please select a file before uploading", alertMessage,f"Alert was: '{alertMessage}', but should should have containd 'Please select a file before uploading'")
            time.sleep(2)
            alert.accept() #close the alert
            WebDriverWait(self.driver, 10).until_not(EC.alert_is_present())
        except UnexpectedAlertPresentException:
            self.fail("No alert appeared after clicking upload with no file selected")

    def testFileUpload(self): #veryify if file is uploaded and displays
        self.driver.get(f"{localhost}/upload")
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        uploads = os.path.join(os.getcwd(), "static", "uploads")
        os.makedirs(uploads, exist_ok=True)
        testFile = "HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEY.txt"
        uploadFile = os.path.join(uploads, testFile)
        
        with open(uploadFile, "wb") as f:
            f.write(b"foo")

        try:
            fileInput = self.wait.until(EC.visibility_of_element_located((By.ID, "formFile")))
            fileInput.send_keys(uploadFile)
            filenameDisplay = self.wait.until( EC.visibility_of_element_located((By.ID, "filename"))) 
            time.sleep(2)
            self.assertIn(testFile, filenameDisplay.text)

        finally:
            if os.path.exists(uploadFile):
                os.remove(uploadFile)
        
   
    def testShare(self):
        self.login()
        self.driver.get(f"{localhost}/share")
        analysis_select = self.wait.until(
            EC.presence_of_element_located((By.ID, "analysisSelect"))
        )
        select = Select(analysis_select)
        
        #pick the first option of select
        self.wait.until(lambda d: len(select.options) > 0)
        time.sleep(1)
        firstselect = select.options[0]
        analysis_name = firstselect.text
        select.select_by_index(0)
        
        #check if data is populated
        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.ID, "clipLengthField"), 
                "seconds"
            )
        )
        stats = [
            "clipLengthField",
            "maxLevelField",
            "highestFrequencyField",
            "lowestFrequencyField",
            "fundamentalFrequencyField"
        ]
        for data in stats:
            field = self.wait.until(
                EC.presence_of_element_located((By.ID, data))
            )
            self.assertNotEqual(field.text, "-", f"{data} not populated")
        canva = self.wait.until(
            EC.presence_of_element_located((By.ID, "oscilloscope"))
        )
        time.sleep(1)
        self.assertTrue(canva.is_displayed())

        #fill in message box
        message = self.driver.find_element(By.ID, "message")
        message.clear()
        message.send_keys("YOOOOOOOO, CHECK THIS OUT BRO!!!! THE FUNDAMENTLA FREQUENCY ON THIS BAD BOY IS 80000HZ! ISNT THAT WICKED!!!?")

        #share with user2
        senToUser = self.wait.until(EC.presence_of_element_located((By.ID, "recipientInput")))
        senToUser.clear()
        senToUser.send_keys("Ponkay")
        time.sleep(1)

        #send
        shareButton = self.wait.until(EC.element_to_be_clickable((By.ID, "shareButton")))
        self.driver.execute_script("arguments[0].click();", shareButton)
        time.sleep(2)

        #check if shareResultmodal is displayed
        modal = self.wait.until(EC.visibility_of_element_located((By.ID, "shareResultModal")))
        modalText = self.wait.until(EC.visibility_of_element_located((By.ID, "shareResultMessage"))).text

        self.assertIn("successfully", modalText.lower(), f"Expected success message but got: {modalText}")

  
    def testLightAndDark(self): 
        self.driver.get(f"{localhost}/index")
        try: #toggle handburger menu if it is displayed (<100%zoom)
            toggler = self.driver.find_element(By.CLASS_NAME, "navbar-toggler") 
            if toggler.is_displayed():
                toggler.click()
                time.sleep(1)
        except:
            pass
        toggleTheme= self.wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "theme-toggle")))
        firstTheme = self.driver.execute_script("return document.documentElement.getAttribute('data-bs-theme')")

        self.assertIn(firstTheme, ["light", "dark"], f"Unexpected: {firstTheme}")

        self.driver.execute_script("arguments[0].click();", toggleTheme)
        time.sleep(1)  

        light= self.driver.execute_script("return document.documentElement.getAttribute('data-bs-theme')")
        self.assertNotEqual(firstTheme, light, "Theme did not toggle")

        self.driver.execute_script("arguments[0].click();", toggleTheme)
        time.sleep(1)
        revert = self.driver.execute_script("return document.documentElement.getAttribute('data-bs-theme')")
        self.assertEqual(revert, firstTheme, "Did not revert back to light theme")
        
        
    def testAccountView(self):
        self.login()
        self.driver.get(f"{localhost}/account")
        #wait for the page to load
        self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "app-title")))
        title = self.driver.find_element(By.CLASS_NAME, "app-title")
        self.assertIn("Your Account", title.text)

        #make sure it shows the correct username and email
        accountUsername = self.wait.until(EC.presence_of_element_located((By.ID, "username")))
        accountEmail = self.driver.find_element(By.ID, "email")
        self.assertEqual(accountUsername.text, self.user.username)
        self.assertEqual(accountEmail.text, self.user.email)

        self.assertEqual(accountUsername.text.strip(), "Fonkayy")
        self.assertEqual(accountEmail.text.strip(), "test1@example.com")

        profilesection = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "button[data-target='profile-section']")))
        self.driver.execute_script("arguments[0].click();", profilesection)
        time.sleep(1)

        #go to history section
        historySection = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "button[data-target='history-section']")))
        self.driver.execute_script("arguments[0].click();", historySection)
        time.sleep(1)
        self.assertTrue(self.driver.find_element(By.ID, "history-section").is_displayed())
        
        #go to the 'shared with me' section
        sharedSection = self.wait.until(EC.presence_of_element_located(
        (By.CSS_SELECTOR, "button[data-target='shared-section']")))
        self.driver.execute_script("arguments[0].click();", sharedSection)
        time.sleep(1)
        self.assertTrue(self.driver.find_element(By.ID, "shared-section").is_displayed())

        #delete analysis histroy
        self.driver.execute_script("arguments[0].click();", profilesection)
        time.sleep(1)
        
        deleteHistory = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".card-body button.btn-outline-danger")))
        self.driver.execute_script("arguments[0].click();", deleteHistory)
        time.sleep(1)
        history_modal = self.wait.until(EC.visibility_of_element_located((By.ID, "deleteHistoryModal")))
        time.sleep(1)
        self.assertTrue(history_modal.is_displayed())


        deleteButton = history_modal.find_element(By.CSS_SELECTOR, ".btn-danger") #delete button in popup
        self.driver.execute_script("arguments[0].click();", deleteButton)

        #back to shared section
        self.driver.execute_script("arguments[0].click();", sharedSection)
        time.sleep(1)

        #back to history section. To check if it actually deleted
        self.driver.execute_script("arguments[0].click();", historySection)
        time.sleep(1)


        closeButton = history_modal.find_element(By.CSS_SELECTOR, ".btn-close")
        self.driver.execute_script("arguments[0].click();", closeButton)
        time.sleep(1)

        #Delete account
        self.driver.execute_script("arguments[0].click();", profilesection)
        time.sleep(1)
        deleteAccount = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "button[data-bs-target='#deleteAccountModal']")))
        self.driver.execute_script("arguments[0].click();", deleteAccount)
        account_modal = self.wait.until(EC.visibility_of_element_located((By.ID, "deleteAccountModal")))
        self.assertTrue(account_modal.is_displayed())


if __name__ == "__main__":
    unittest.main()