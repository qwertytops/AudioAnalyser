function submitSignUp() {
    const username = document.getElementById("signUpUsername").value;
    const password = document.getElementById("signUpPassword").value;
    const email = document.getElementById("signUpEmail").value;

    if (username === "" || password === "" || email === "") {
        alert("Please fill in all fields.");
        return;
    }

    const userData = {
        username: username,
        password: password,
        email: email
    };


    localStorage.setItem(email, JSON.stringify(userData));
    
    // Get the redirect URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    // Default to the referring page if no redirect parameter, and home page as a fallback
    const destinationUrl = redirectUrl || document.referrer || "/";
    
    // Redirect the user
    window.location.href = destinationUrl;
}

// On page load, store the referring page in a hidden input
document.addEventListener('DOMContentLoaded', function() {
    // Create a hidden input to store the referring page if it doesn't exist
    if (!document.getElementById('referrerPage')) {
        const referrerInput = document.createElement('input');
        referrerInput.type = 'hidden';
        referrerInput.id = 'referrerPage';
        referrerInput.value = document.referrer || "/";
        document.getElementById('signUpForm').appendChild(referrerInput);
    }
});


    // Add event listener for the sign up button
    document.getElementById('openSignUpModal').addEventListener('click', function() {
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
        // Call the original submit function
        submitSignUp();
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmSignUpModal'));
        modal.hide();
    });