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
    alert("Sign up successful! Redirecting to log in page...");
    window.location.href = "/";
}
