/**
 * RaseLab Shared Logic
 * Handles Dark Mode, Search, Filtering, and Mobile Sidebar
 */

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initMobileSidebar();
    initExperiments();
    initNavigationHighlighter();
});

/* --- Dark Mode Logic --- */
function initDarkMode() {
    const html = document.documentElement;
    const toggleBtns = document.querySelectorAll('.dark-mode-toggle'); // Using class to support multiple buttons if needed

    // Check saved preference or system preference
    if (localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    toggleBtns.forEach(btn => {
        // Set initial icon
        updateToggleIcon(btn);

        btn.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateToggleIcon(btn);
        });
    });
}

function updateToggleIcon(btn) {
    const isDark = document.documentElement.classList.contains('dark');
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) {
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
}

/* --- Mobile Sidebar Logic --- */
function initMobileSidebar() {
    const menuBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('aside');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('absolute');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('h-full');
            sidebar.classList.toggle('w-64');
            // Check if we need better mobile drawer implementation logic, 
            // but for now toggling hidden on the existing aside for mobile view.

            // Actually, the current Tailwind classes verify: 'hidden md:flex'.
            // To show it on mobile we can remove 'hidden' and add specific styling.
            if (sidebar.classList.contains('hidden')) {
                sidebar.classList.remove('hidden');
                sidebar.classList.add('flex', 'absolute', 'inset-y-0', 'left-0', 'z-50', 'w-64');
            } else {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex', 'absolute', 'inset-y-0', 'left-0', 'z-50', 'w-64');
            }
        });

        // Close sidebar when clicking outside on mobile (simple version)
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && !sidebar.classList.contains('hidden') && window.innerWidth < 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex', 'absolute', 'inset-y-0', 'left-0', 'z-50', 'w-64');
            }
        });
    }
}

/* --- Active Navigation Highlighter --- */
function initNavigationHighlighter() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('aside a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Reset styles to default inactive
        link.className = "flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-[#9da6b9] hover:bg-slate-100 dark:hover:bg-[#1e2330] transition-colors";
        const icon = link.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.classList.remove('text-primary', 'dark:text-white', 'font-variation-settings-fill');
            icon.style.fontVariationSettings = "";
        }
        const text = link.querySelector('p');
        if (text) {
            text.classList.remove('font-bold');
            text.classList.add('font-medium');
        }

        // Apply active styles if matches
        if (href === currentPath || (currentPath === '' && href === 'index.html') || (href === './' + currentPath)) {
            link.className = "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-white";
            if (icon) {
                icon.classList.add('text-primary', 'dark:text-white', 'font-variation-settings-fill');
                icon.style.fontVariationSettings = "'FILL' 1";
            }
            if (text) {
                text.classList.remove('font-medium');
                text.classList.add('font-bold');
            }
        }
    });
}


/* --- Experiments Data & Search --- */
const experimentsData = [
    {
        id: 1,
        title: "Newton's Laws",
        subject: "Physics",
        difficulty: "Easy",
        desc: "Visualize force, mass, and acceleration relationships in a frictionless environment with interactive blocks.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDklBeLiXq8CLzTzBkUWYqr1YJlFj8VtuCIkxv-BB7tOO3Phu5RHlqtzDdBMrgo_F4GB8Ir6uMsbtEumppkBLR-JmUYlKopAG6Aa_Yxda0YTjmn2iEDVv1QYKenniq67e9ua1-YGsuyrC5ctosLJVzWIFw4nwSLQ9ECcdl5qmsZ2b51clHEnbtCzkWkAn2BEycoKbRyBF9Dx4I-k7naswa-11s-8BMO7hbcc8quQ1VTjJYVaFT_fzBslN-Suhn-j-P2Wf7QTDb7is_4",
        colorClass: "purple",
        icon: "rocket_launch"
    },
    {
        id: 2,
        title: "Acid-Base Titration",
        subject: "Chemistry",
        difficulty: "Medium",
        desc: "Simulate pH changes in real-time as you mix acids and bases. Identify the equivalence point accurately.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7q-cQM4gEbGALjdnYckYd-LOaqPdCf9l6-k0_SZPO2utwQeIvb_hVyqPwzalAUFxvMflZFR2_K9cJM8nVjsUk5GA2tMfK554uh73P8kx23PX_aN77pArjj1L6FukhTiB6b5mLa68-1Vwfx7uMfxJb9gRkEUq5Q3dyv-_mzEddkGtIlQJHMsGQhCrWoB-XKusyGR_1XtdCQyUnT--zYNfJ50uvOGHPPmTGQES9UQ4HIV2e99oypu3lBzeKD8x4eBOk1JbT3PBDzb0M",
        colorClass: "teal",
        icon: "science"
    },
    {
        id: 3,
        title: "Circuit Builder",
        subject: "Physics",
        difficulty: "Medium",
        desc: "Drag and drop components to build series and parallel circuits. Measure voltage and current in real-time.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXm2yVHkKHgWo_twvK54gCxIIw02t3h6ztzAP68V7T9mRmzWoub-q7t3YnOQpWbDCprpdhZV88soBjjHP6VgGGxL0pihmqeywteFEuSMVnGf-zgDzKagh8DoYBT1wP_5fyGqA2yJnRJd2hB79a3hEJ0lxbtguj1wSPT6l7NesofIkqUtBikiyXZKNSwxE1iBlp93vAcjy3VijdavKtSaon6K9WUUmMHK1u0uHDHOCASGzAPOD2uTjN5bPkNJFdDkcn9FjM2A42pS2N",
        colorClass: "purple",
        icon: "rocket_launch"
    },
    {
        id: 4,
        title: "Periodic Trends",
        subject: "Chemistry",
        difficulty: "Hard",
        desc: "Investigate electronegativity, ionization energy, and atomic radius across different groups and periods.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh7qOiYnfPksqfORzYjODHCkEeiso_2DA5rhlldCIZtDqsvru2BFklDL9fIZUhE7kt80bNKyLGb1U44YFSb4zTIv5gHAxMoTA-qRTV9A1apUScuvNCW54tlAezfe5xOAD0gGAqz49R_vCpYfdtDvAxLdDUVVTOjZiZlLvvotyI3HuTiObiEiw6TTkk4lRg_-wuL6EQz64fJCi5oziuGmX8JSkQPLc-gEMttqvDEhvT6eYaepLPPhMjcx-zi9YWqxeWhdiXtBUqRke0",
        colorClass: "teal",
        icon: "science"
    },
    {
        id: 5,
        title: "Projectile Motion",
        subject: "Physics",
        difficulty: "Hard",
        desc: "Launch objects at various angles and speeds. Analyze the trajectory, range, and height data.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDp2e9vxabBVT9K3I1kOfNrFfn3MpZKRFQ5Us6PzAkKCwCPQACwaikMrdewKtGA-rXJyOeOlP4YzJmpfxz2bKfOeY8n6peVF2jNUOMxOvc52MWUk8milGRXzEtvtCuSP1TLAupdXjBfcvOGI9uOkFC6nnz0jkPw0tpSQxYMV27Nmf035hTSANv21_nrUqLcWBuXMhrTK3A9Rodva0LgIaQhdpf2pQb5GlCnmfKQsYnuXAKmVX3j3o7tKwho6BTNHI0ZDGqzO5GLgqP",
        colorClass: "purple",
        icon: "rocket_launch"
    },
    {
        id: 6,
        title: "Molecular Geometry",
        subject: "Chemistry",
        difficulty: "Medium",
        desc: "Explore VSEPR theory by building molecules and observing their 3D shapes and bond angles.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzQdXU1MVjQdjud1UBj5mtTWMjDAzJ8M73E392VL4DjuWvzmDdKrH5mASqjP8-Zl6Tb6dxklKxln-z7LLWEV7_fxNI0B3ZGQghfzUzJQKu3LxpmwIw8fezt1I3NC28QifM1jukaLWudQTX5OV9NApmRGh8UvXB-OLCc5I83Izff9_0-mx1Fgvkf7-9zj9DsP4FyxtBnO6GfSxeQerYFKgKs5if8IHo2XBJshbYBENbsg3a6A1y3KiVkx9kKAttqP2PIBgYWTWWRbpO",
        colorClass: "teal",
        icon: "science"
    },
    {
        id: 7,
        title: "Atomik Orbitaller",
        subject: "Chemistry",
        difficulty: "Medium",
        desc: "3D orbital görselleştirme ile s, p, d orbitallerini keşfedin. Elektron konfigürasyonları oluşturun.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh7qOiYnfPksqfORzYjODHCkEeiso_2DA5rhlldCIZtDqsvru2BFklDL9fIZUhE7kt80bNKyLGb1U44YFSb4zTIv5gHAxMoTA-qRTV9A1apUScuvNCW54tlAezfe5xOAD0gGAqz49R_vCpYfdtDvAxLdDUVVTOjZiZlLvvotyI3HuTiObiEiw6TTkk4lRg_-wuL6EQz64fJCi5oziuGmX8JSkQPLc-gEMttqvDEhvT6eYaepLPPhMjcx-zi9YWqxeWhdiXtBUqRke0",
        colorClass: "teal",
        icon: "blur_circular",
        link: "./experiments/orbitals/index.html"
    },
    {
        id: 8,
        title: "Gaz Yasaları",
        subject: "Chemistry",
        difficulty: "Medium",
        desc: "Boyle, Charles, Gay-Lussac ve İdeal Gaz yasalarını interaktif simülasyonlarla keşfedin.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7q-cQM4gEbGALjdnYckYd-LOaqPdCf9l6-k0_SZPO2utwQeIvb_hVyqPwzalAUFxvMflZFR2_K9cJM8nVjsUk5GA2tMfK554uh73P8kx23PX_aN77pArjj1L6FukhTiB6b5mLa68-1Vwfx7uMfxJb9gRkEUq5Q3dyv-_mzEddkGtIlQJHMsGQhCrWoB-XKusyGR_1XtdCQyUnT--zYNfJ50uvOGHPPmTGQES9UQ4HIV2e99oypu3lBzeKD8x4eBOk1JbT3PBDzb0M",
        colorClass: "teal",
        icon: "bubble_chart",
        link: "./experiments/gas-laws/index.html"
    }
];

function initExperiments() {
    const grid = document.getElementById('experiments-grid');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!grid) return; // Not on experiments page

    // Initial Render
    renderExperiments(experimentsData);

    // Search Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = experimentsData.filter(ex =>
                ex.title.toLowerCase().includes(query) ||
                ex.desc.toLowerCase().includes(query) ||
                ex.subject.toLowerCase().includes(query)
            );
            renderExperiments(filtered);
        });
    }

    // Filter Buttons
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterBtns.forEach(b => {
                    b.classList.remove('bg-primary', 'text-white');
                    b.classList.add('bg-white', 'dark:bg-[#1e2330]', 'text-slate-600', 'dark:text-white');
                });

                // Add active to clicked
                btn.classList.remove('bg-white', 'dark:bg-[#1e2330]', 'text-slate-600', 'dark:text-white');
                btn.classList.add('bg-primary', 'text-white');

                const filter = btn.dataset.filter;
                if (filter === 'all') {
                    renderExperiments(experimentsData);
                } else {
                    const filtered = experimentsData.filter(ex => ex.subject === filter);
                    renderExperiments(filtered);
                }
            });
        });
    }
}

function renderExperiments(experiments) {
    const grid = document.getElementById('experiments-grid');
    grid.innerHTML = '';

    if (experiments.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">No experiments found.</div>`;
        return;
    }

    experiments.forEach(ex => {
        const card = document.createElement('div');
        card.className = "group flex flex-col rounded-xl bg-white dark:bg-[#1e2330] overflow-hidden border border-[#e5e7eb] dark:border-[#2a3140] hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:shadow-primary/10";

        const buttonContent = ex.link
            ? `<a href="${ex.link}" class="flex items-center justify-center w-full h-11 gap-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25">
                    <span class="material-symbols-outlined text-[20px]">play_arrow</span>
                    Deneyi Başlat
                </a>`
            : `<button class="flex items-center justify-center w-full h-11 gap-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25">
                    <span class="material-symbols-outlined text-[20px]">play_arrow</span>
                    Start Experiment
                </button>`;

        card.innerHTML = `
            <div class="h-48 w-full bg-cover bg-center relative group-hover:scale-105 transition-transform duration-500"
                style='background-image: url("${ex.image}");'>
                <div class="absolute inset-0 bg-gradient-to-t from-[#1e2330] to-transparent opacity-60"></div>
                <div class="absolute top-3 left-3 flex gap-2">
                    <span class="px-2.5 py-1 rounded-md bg-${ex.colorClass}-500/20 text-${ex.colorClass}-200 border border-${ex.colorClass}-500/30 text-xs font-bold backdrop-blur-md flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">${ex.icon}</span> ${ex.subject}
                    </span>
                </div>
                <div class="absolute top-3 right-3">
                    <span class="px-2 py-1 rounded-md bg-black/40 text-white/80 text-xs font-medium backdrop-blur-md">${ex.difficulty}</span>
                </div>
            </div>
            <div class="flex flex-col p-5 gap-3 flex-1 relative bg-white dark:bg-[#1e2330]">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">${ex.title}</h3>
                <p class="text-sm text-[#637588] dark:text-[#9da6b9] leading-relaxed line-clamp-2">${ex.desc}</p>
                <div class="mt-auto pt-4 w-full">
                    ${buttonContent}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
