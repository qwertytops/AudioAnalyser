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
    alert("Sign up successful! Redirecting...");
    
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


