function signUp() {
    // Get user input values
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate input fields
    if (!username || !email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    // Simulate sign-up process
    console.log('Signing up user:', { username, email });

    // Redirect or show success message
    alert('Sign-up successful! Welcome, ' + username);
    window.location.href = '/dashboard'; // Redirect to dashboard or desired page
}

// Example usage in navigation bar
document.getElementById('signUpButton').addEventListener('click', signUp);
