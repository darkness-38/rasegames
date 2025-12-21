// Navbar Component - Shared across all pages
function createNavbar(activePage = '') {
    const navLinks = [
        { href: '/pages/games', text: 'Games', id: 'games' },
        { href: '/pages/challenges', text: 'Challenges', id: 'challenges' },
        { href: '/pages/leaderboard', text: 'Leaderboard', id: 'leaderboard' }
    ];

    const linksHtml = navLinks.map(link => {
        const isActive = activePage === link.id;
        const activeClass = isActive
            ? 'text-white text-glow border-b-2 border-primary py-5'
            : 'text-gray-300 hover:text-white hover:text-glow';
        return `<a class="${activeClass} text-sm font-medium transition-colors no-underline" href="${link.href}">${link.text}</a>`;
    }).join('\n');

    return `
        <div class="sticky top-0 z-50 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
            <div class="flex h-16 items-center justify-between px-6 lg:px-20 max-w-[1440px] mx-auto w-full">
                <!-- Logo -->
                <a href="/" class="flex items-center gap-3 no-underline">
                    <div class="flex items-center justify-center size-8 rounded-lg bg-primary/20 text-primary">
                        <span class="material-symbols-outlined" style="font-size: 20px;">sports_esports</span>
                    </div>
                    <h2 class="text-white text-xl font-bold tracking-tight">Rase<span class="text-primary">Games</span></h2>
                </a>
                <!-- Nav Links (Desktop) -->
                <div class="hidden md:flex items-center gap-8">
                    ${linksHtml}
                </div>
                <!-- Actions -->
                <div class="flex items-center gap-4">
                    <a href="/pages/games" class="hidden md:flex h-9 items-center px-4 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-bold transition-all no-underline">
                        All Games
                    </a>
                    <!-- User Display (dynamic) -->
                    <div id="user-display" class="flex items-center gap-3">
                        <button onclick="showAuthModal()" class="h-9 px-4 rounded-lg bg-primary hover:bg-primary-glow text-white text-sm font-bold transition-all">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Footer Component
function createFooter() {
    return `
        <footer class="w-full border-t border-white/5 bg-[#0b0f17] py-8">
            <div class="px-6 lg:px-20 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div class="flex flex-col gap-2">
                    <h3 class="text-white font-bold text-lg">Rase<span class="text-primary">Games</span></h3>
                </div>
                <div class="flex gap-8">
                    <a class="text-gray-500 hover:text-white transition-colors text-sm no-underline" href="/pages/about">About</a>
                </div>
            </div>
        </footer>
    `;
}

// Auto-inject navbar
document.addEventListener('DOMContentLoaded', function () {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    if (navPlaceholder) {
        const activePage = navPlaceholder.dataset.active || '';
        navPlaceholder.outerHTML = createNavbar(activePage);
    }

    if (footerPlaceholder) {
        footerPlaceholder.outerHTML = createFooter();
    }
});
