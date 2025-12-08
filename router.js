const route = (event) => {
    event = event || window.event;
    event.preventDefault();
    window.history.pushState({}, "", event.currentTarget.href);
    handleLocation();
};

const routes = {
    404: "/404.html",
    "/": "/index.html",
    "/about": "/about.html",
    "/community": "/community.html",
};

const handleLocation = async () => {
    const path = window.location.pathname;
    const routePath = routes[path] || routes[404]; // Fallback? Need to be careful with local file system paths vs server paths.

    // For local file testing without a proper server, simple path matching might be tricky if we want "clean URLs".
    // For a simple implementation on local file system or standard web server:

    // Actually, for this specific request "URL Routing", usually implies standard browser history API.
    // However, since we are likely running mostly from files or a basic server, we need to be careful.
    // But let's verify existing structure.

    // Ideally, we fetch the content of the target page and replace the 'main' content.

    let html = "";
    try {
        // Map clean paths to actual files
        let fileToFetch = "index.html"; // Default
        if (path.endsWith("about") || path.endsWith("about.html")) fileToFetch = "about.html";
        if (path.endsWith("community") || path.endsWith("community.html")) fileToFetch = "community.html";
        if (path === "/" || path.endsWith("index.html")) fileToFetch = "index.html";

        const response = await fetch(fileToFetch);
        const text = await response.text();

        // Extract content from body/main to avoid full HTML replacement issues
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        // Assuming 'main' tag holds the page content
        const newContent = doc.querySelector('main').innerHTML;

        document.querySelector('main').innerHTML = newContent;

        // Re-initialize particles if needed, or other scripts?
        // If we replace content, script tags inside might not run automatically.
        // For now, let's assume static content mostly.

    } catch (e) {
        console.error("Error loading page", e);
    }
};

window.onpopstate = handleLocation;
window.route = route;

// Handle initial load
// handleLocation();
// Commented out initial load to prevent immediate overwrite if logic is slightly off,
// usually we call this or bind it to DOMContentLoaded
