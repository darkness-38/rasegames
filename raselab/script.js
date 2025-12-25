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


/* --- Experiments Auto-Discovery --- */
// List of experiment folder names - add new experiments here
const experimentFolders = [
    'orbitals',
    'states-of-matter',
    'coulombs-law',
    'ph-scale',
    'balancing-equations',
    'gas-properties',
    'gas-properties',
    'diffusion',
    'effusion'
];

let experimentsData = [];

async function loadExperiments() {
    const experiments = [];

    for (const folder of experimentFolders) {
        try {
            const response = await fetch(`./experiments/${folder}/manifest.json`);
            if (response.ok) {
                const manifest = await response.json();
                experiments.push({
                    id: experiments.length + 1,
                    folder: folder, // Store folder for translation lookup
                    ...manifest,
                    link: `./experiments/${folder}/index.html`
                });
            }
        } catch (err) {
            console.warn(`Could not load manifest for ${folder}:`, err);
        }
    }

    // Sort by order if specified
    experiments.sort((a, b) => (a.order || a.id) - (b.order || b.id));

    return experiments;
}

async function initExperiments() {
    const grid = document.getElementById('experiments-grid');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!grid) return;

    // Load experiments from manifest files
    experimentsData = await loadExperiments();
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
    if (!grid) return;

    grid.innerHTML = '';

    if (experiments.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">No experiments found.</div>`;
        return;
    }

    experiments.forEach(ex => {
        // CamelCase conversion for translation keys
        const camelKey = ex.folder.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        // Translation Lookups
        const title = (window.i18n && window.i18n.t(`experiments.${camelKey}.title`)) || ex.title;
        const desc = (window.i18n && window.i18n.t(`experiments.${camelKey}.description`)) || ex.desc;
        const subject = (window.i18n && window.i18n.t(`raselab.${ex.subject.toLowerCase()}`)) || ex.subject;
        const difficulty = (window.i18n && window.i18n.t(`common.difficulty.${ex.difficulty.toLowerCase()}`)) || ex.difficulty;
        const startText = (window.i18n && window.i18n.t('raselab.startExperiment')) || 'Start Experiment';

        const card = document.createElement('div');
        card.className = "group flex flex-col rounded-xl bg-white dark:bg-[#1e2330] overflow-hidden border border-[#e5e7eb] dark:border-[#2a3140] hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:shadow-primary/10";

        const buttonContent = ex.link
            ? `<a href="${ex.link}" class="flex items-center justify-center w-full h-11 gap-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25">
                    <span class="material-symbols-outlined text-[20px]">play_arrow</span>
                    ${startText}
                </a>`
            : `<button class="flex items-center justify-center w-full h-11 gap-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25">
                    <span class="material-symbols-outlined text-[20px]">play_arrow</span>
                    ${startText}
                </button>`;

        const subjectBadgeClass = ex.subject === 'Physics'
            ? 'bg-purple-500/20 text-purple-200 border-purple-500/30'
            : 'bg-teal-500/20 text-teal-200 border-teal-500/30';

        card.innerHTML = `
            <div class="h-48 w-full bg-cover bg-center relative overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style='background-image: url("${ex.image}");'></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#1e2330] to-transparent opacity-60"></div>
                <div class="absolute top-3 left-3 flex gap-2">
                    <span class="px-2.5 py-1 rounded-md ${subjectBadgeClass} text-xs font-bold backdrop-blur-md flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">${ex.icon}</span> ${subject}
                    </span>
                </div>
                <div class="absolute top-3 right-3">
                    <span class="px-2 py-1 rounded-md bg-black/40 text-white/80 text-xs font-medium backdrop-blur-md">${difficulty}</span>
                </div>
            </div>
            <div class="flex flex-col p-5 gap-3 flex-1 relative bg-white dark:bg-[#1e2330]">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">${title}</h3>
                <p class="text-sm text-[#637588] dark:text-[#9da6b9] leading-relaxed line-clamp-2">${desc}</p>
                <div class="mt-auto pt-4 w-full">
                    ${buttonContent}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

