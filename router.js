const route = (event) => {
    event = event || window.event;
    event.preventDefault();
    window.history.pushState({}, "", event.currentTarget.href);
    handleLocation();
};

const handleLocation = async () => {
    const path = window.location.pathname;
    console.log("Current path:", path);

    let fileToFetch = "index.html";

    // Simple routing logic mapping URL segments to files
    if (path.endsWith("about") || path.endsWith("about.html")) fileToFetch = "about.html";
    if (path.endsWith("community") || path.endsWith("community.html")) fileToFetch = "community.html";
    if (path.endsWith("leaderboard") || path.endsWith("leaderboard.html")) fileToFetch = "leaderboard.html";
    if (path.endsWith("profile") || path.endsWith("profile.html")) fileToFetch = "profile.html";
    if (path.endsWith("/") || path.endsWith("index.html")) fileToFetch = "index.html";

    try {
        const response = await fetch(fileToFetch);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Extract content from main tag
        const newMain = doc.querySelector('main');
        if (newMain) {
            document.querySelector('main').innerHTML = newMain.innerHTML;
        } else {
            console.warn("No main tag found in fetched page, loading fallback.");
        }

        // Post-load hooks - run after content is loaded
        const runPageScripts = () => {
            // Always update auth UI on page change
            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }

            // Page-specific initializations
            const isLeaderboard = path.includes('leaderboard');
            if (isLeaderboard && window.loadLeaderboards) {
                // Retry loading leaderboards in case of DOM delay
                window.loadLeaderboards();
                setTimeout(window.loadLeaderboards, 300);
            }

            if (path.includes('profile') && window.initProfile) {
                window.initProfile();
            }

            // Re-initialize particles if they exist
            if (typeof createParticles === 'function' && document.querySelector('.particles-container')) {
                createParticles();
            }
        };

        setTimeout(runPageScripts, 50);
        setTimeout(runPageScripts, 200);

    } catch (e) {
        console.error("Error loading page", e);
    }
};

window.onpopstate = handleLocation;
window.route = route;

// Handle initial load
document.addEventListener("DOMContentLoaded", () => {
    handleLocation();
});
