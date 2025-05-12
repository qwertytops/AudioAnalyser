// csrf.js - Shared CSRF utilities
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// For fetch requests
function addCsrfHeader(headers = {}) {
    return {
        ...headers,
        'X-CSRFToken': getCsrfToken()
    };
}