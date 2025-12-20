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

    // Route matching - order matters, more specific routes first
    if (path === "/" || path === "/index.html") {
        fileToFetch = "index.html";
    } else if (path === "/games" || path === "/games.html") {
        fileToFetch = "games.html";
    } else if (path === "/about" || path === "/about.html") {
        fileToFetch = "about.html";
    } else if (path === "/community" || path === "/community.html") {
        fileToFetch = "community.html";
    } else if (path === "/leaderboard" || path === "/leaderboard.html") {
        fileToFetch = "leaderboard.html";
    } else if (path === "/profile" || path === "/profile.html") {
        fileToFetch = "profile.html";
    } else {
        // Unknown route - show 404
        fileToFetch = "404.html";
    }

    try {
        const response = await fetch(fileToFetch);

        // If fetch fails (404), load 404 page
        if (!response.ok) {
            const notFoundResponse = await fetch("404.html");
            const notFoundText = await notFoundResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(notFoundText, 'text/html');
            const newMain = doc.querySelector('main');
            if (newMain) {
                document.querySelector('main').innerHTML = newMain.innerHTML;
            }
            return;
        }

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');


        const newMain = doc.querySelector('main');
        if (newMain) {
            document.querySelector('main').innerHTML = newMain.innerHTML;
        } else {
            console.warn("No main tag found in fetched page, loading fallback.");
        }


        const runPageScripts = () => {

            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }


            const isLeaderboard = path.includes('leaderboard');
            if (isLeaderboard && window.loadLeaderboards) {

                window.loadLeaderboards();
                setTimeout(window.loadLeaderboards, 300);
            }

            if (path.includes('profile') && window.initProfile) {
                window.initProfile();
            }


            if (typeof createParticles === 'function' && document.querySelector('.particles-container')) {
                createParticles();
            }
        };

        setTimeout(runPageScripts, 50);
        setTimeout(runPageScripts, 200);

    } catch (e) {
        console.error("Error loading page", e);
        // On error, try to load 404 page
        try {
            const notFoundResponse = await fetch("404.html");
            const notFoundText = await notFoundResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(notFoundText, 'text/html');
            const newMain = doc.querySelector('main');
            if (newMain) {
                document.querySelector('main').innerHTML = newMain.innerHTML;
            }
        } catch (e2) {
            console.error("Could not load 404 page", e2);
        }
    }
};

window.onpopstate = handleLocation;
window.route = route;


document.addEventListener("DOMContentLoaded", () => {
    handleLocation();
});
