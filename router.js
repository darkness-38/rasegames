const route = (event) => {
    event = event || window.event;
    event.preventDefault();
    window.history.pushState({}, "", event.currentTarget.href);
    handleLocation();
};

const handleLocation = async () => {
    const path = window.location.pathname;
    console.log("Current path:", path);

    // Special handling for the game route
    // We use .includes to matching to be robust against file protocols or subdirectories
    if (path.indexOf("/games/rase-clicker") !== -1) {
        const main = document.querySelector('main');
        main.innerHTML = `
            <iframe src="/shrekClicker/index.html" 
                    style="width: 100%; height: 90vh; border: none; display: block; border-radius: 24px;" 
                    title="Rase Clicker">
            </iframe>`;
        return;
    }

    if (path.indexOf("/games/snake") !== -1) {
        const main = document.querySelector('main');
        main.innerHTML = `
            <iframe src="/snakeGame/index.html" 
                    style="width: 100%; height: 90vh; border: none; display: block; border-radius: 24px;" 
                    title="Neon Snake">
            </iframe>`;
        return;
    }

    if (path.indexOf("/games/cyber-runner") !== -1) {
        const main = document.querySelector('main');
        main.innerHTML = `
            <iframe src="/runnerGame/index.html" 
                    style="width: 100%; height: 90vh; border: none; display: block; border-radius: 24px;" 
                    title="Cyber Runner">
            </iframe>`;
        return;
    }

    let fileToFetch = "index.html";

    // Simple routing logic mapping URL segments to files
    if (path.endsWith("about") || path.endsWith("about.html")) fileToFetch = "about.html";
    if (path.endsWith("community") || path.endsWith("community.html")) fileToFetch = "community.html";
    if (path.endsWith("leaderboard") || path.endsWith("leaderboard.html")) fileToFetch = "leaderboard.html";
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
