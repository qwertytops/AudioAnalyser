// Function to handle the final form submission
function submitSignUp() {
    const username = document.getElementById("signUpUsername").value;
    const password = document.getElementById("signUpPassword").value;
    const email = document.getElementById("signUpEmail").value;

    if (username === "" || password === "" || email === "") {
        alert("Please fill in all fields.");
        return;
    }

    // Submit the form to the server
    document.getElementById("signUpForm").submit();
}

document.addEventListener('DOMContentLoaded', function() {
    // Store the referring page in a hidden input if it doesn't exist
    if (!document.getElementById('referrerPage')) {
        const referrerInput = document.createElement('input');
        referrerInput.type = 'hidden';
        referrerInput.id = 'referrerPage';
        referrerInput.name = 'referrer'; // Give it a name so it's included in form submission
        referrerInput.value = document.referrer || "/";
        document.querySelector('form').appendChild(referrerInput);
    }

    // Add event listener for the "Create Account" button
    document.getElementById('createAccountBtn').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default form submission
        
        // Get form values
        const email = document.getElementById('signUpEmail').value;
        const username = document.getElementById('signUpUsername').value;
        const password = document.getElementById('signUpPassword').value;
        
        // Validate form (basic validation)
        if (!email || !username || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        // Update confirmation modal with user details
        document.getElementById('confirmEmail').textContent = email;
        document.getElementById('confirmUsername').textContent = username;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('confirmSignUpModal'));
        modal.show();
    });
    
    // Add event listener for the confirm button in the modal
    document.getElementById('confirmSignUp').addEventListener('click', function() {
        // Submit the form to the server
        document.querySelector('form').submit();
    });
});