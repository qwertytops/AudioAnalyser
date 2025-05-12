function setupAccountLinkLock() {
  document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const accountLink = document.querySelector('.navbar-nav .nav-link[href="/account"]');
    
    // Flag to track if Account link was clicked
    let accountLinkClicked = false;
    
    // Check if we're currently on the account page
    if (window.location.pathname === '/account') {
      // Disable all other nav links if we're on the account page
      disableOtherNavLinks();
      accountLinkClicked = true;
    }
    
    // Add click event listener to Account link
    if (accountLink) {
      accountLink.addEventListener('click', function(event) {
        // Don't disable links if they're already disabled
        if (!accountLinkClicked) {
          accountLinkClicked = true;
          
          // Set a flag in localStorage to remember the state across page loads
          localStorage.setItem('accountLinkClicked', 'true');
          
          // Disable other navigation links
          disableOtherNavLinks();
        }
      });
    }
    
    // Check localStorage on page load to see if Account was previously clicked
    if (localStorage.getItem('accountLinkClicked') === 'true') {
      accountLinkClicked = true;
      disableOtherNavLinks();
    }
    
    // Function to disable all navigation links except Account
    function disableOtherNavLinks() {
      navLinks.forEach(link => {
        if (link.getAttribute('href') !== '/account') {
          // Disable the link
          link.style.pointerEvents = 'none';
          link.style.opacity = '0.5';
          link.style.cursor = 'not-allowed';
          
          // Prevent default behavior when clicked
          link.addEventListener('click', function(e) {
            e.preventDefault();
            return false;
          });
          
          // Add a title attribute for tooltip explanation
          link.setAttribute('title', 'Navigation locked while in Account section');
        }
      });
      
      // Highlight the account link to show it's active
      if (accountLink) {
        accountLink.classList.add('active');
        accountLink.style.fontWeight = 'bold';
      }
    }
    
    // Add a function to reset navigation (can be called if needed)
    window.resetNavigation = function() {
      accountLinkClicked = false;
      localStorage.removeItem('accountLinkClicked');
      
      navLinks.forEach(link => {
        if (link.getAttribute('href') !== '/account') {
          link.style.pointerEvents = '';
          link.style.opacity = '';
          link.style.cursor = '';
          
          // Remove the click event listener
          link.replaceWith(link.cloneNode(true));
        }
      });
      
      if (accountLink) {
        accountLink.classList.remove('active');
        accountLink.style.fontWeight = '';
      }
    };
  });
}

// Initialize the functionality
setupAccountLinkLock();
