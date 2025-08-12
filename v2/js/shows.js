// Shows Module for DWC v2 - Tour and show listings with ticket links
class ShowsModule {
    constructor() {
        this.shows = [];
        this.upcomingShows = [];
        this.pastShows = [];
        
        this.init();
    }

    async init() {
        await this.loadShows();
        this.processShows();
        this.createShowsUI();
        this.setupEventListeners();
    }

    async loadShows() {
        try {
            // Try loading from Worker if live data is enabled
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    console.log('Attempting to load shows from Worker...');
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/shows`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.shows = await response.json();
                        console.log('Shows loaded from Worker:', this.shows.length);
                        return;
                    }
                } catch (workerError) {
                    console.warn('Failed to load shows from Worker, falling back to local JSON:', workerError);
                }
            }

            // Fallback to local JSON
            const response = await fetch('./data/shows.json');
            if (!response.ok) {
                throw new Error(`Failed to load shows: ${response.status}`);
            }
            this.shows = await response.json();
            console.log('Shows loaded from local JSON:', this.shows.length);
        } catch (error) {
            console.error('Error loading shows:', error);
            this.shows = [];
        }
    }

    processShows() {
        const now = new Date();
        
        this.upcomingShows = this.shows
            .filter(show => new Date(show.dateISO) > now)
            .sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
            
        this.pastShows = this.shows
            .filter(show => new Date(show.dateISO) <= now)
            .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
    }

    createShowsUI() {
        // Create shows section
        const showsSection = document.createElement('section');
        showsSection.className = 'shows-section';
        showsSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-calendar-alt"></i>
                    Tour Dates
                </h2>
                <button id="shows-toggle" class="section-toggle-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="shows-content visible" id="shows-content">
                <div class="shows-tabs">
                    <button class="tab-btn active" data-tab="upcoming">
                        Upcoming Shows (${this.upcomingShows.length})
                    </button>
                    <button class="tab-btn" data-tab="past">
                        Past Shows (${this.pastShows.length})
                    </button>
                </div>
                <div class="shows-lists">
                    <div class="shows-list active" id="upcoming-shows">
                        ${this.renderShowsList(this.upcomingShows, 'upcoming')}
                    </div>
                    <div class="shows-list" id="past-shows">
                        ${this.renderShowsList(this.pastShows, 'past')}
                    </div>
                </div>
            </div>
        `;

        // Insert after videos section or lyrics container, or inside #tab-shows if tabs exist
        const tabShows = document.querySelector('#tab-shows');
        if (tabShows) {
            // If tabs exist, append inside the shows tab
            tabShows.appendChild(showsSection);
        } else {
            // Fallback to existing logic
            const videosSection = document.querySelector('.videos-section');
            const lyricsContainer = document.querySelector('.lyrics-container');
            const insertAfter = videosSection || lyricsContainer;
            
            if (insertAfter) {
                insertAfter.parentNode.insertBefore(showsSection, insertAfter.nextSibling);
            } else {
                document.querySelector('.main-content').appendChild(showsSection);
            }
        }
    }

    renderShowsList(shows, type) {
        if (shows.length === 0) {
            return `
                <div class="no-shows">
                    <i class="fas fa-calendar-times"></i>
                    <p>No ${type} shows</p>
                </div>
            `;
        }

        return shows.map(show => this.renderShowItem(show, type)).join('');
    }

    renderShowItem(show, type) {
        const date = new Date(show.dateISO);
        const formattedDate = this.formatDate(date);
        const formattedTime = this.formatTime(date);
        const isPast = type === 'past';
        const canBuyTickets = !isPast && (show.tickets?.length > 0 || show.ticketUrl) && !show.soldOut;

        return `
            <div class="show-item ${isPast ? 'past' : ''} ${show.soldOut ? 'sold-out' : ''}" 
                 data-show-id="${show.id}">
                <div class="show-date">
                    <div class="date-month">${date.toLocaleDateString('en', { month: 'short' })}</div>
                    <div class="date-day">${date.getDate()}</div>
                    <div class="date-year">${date.getFullYear()}</div>
                </div>
                <div class="show-details">
                    <div class="show-location">
                        <h3 class="venue-name">${show.venue}</h3>
                        <p class="city-country">${show.city}, ${show.country}</p>
                    </div>
                    <div class="show-time">
                        <i class="fas fa-clock"></i>
                        ${formattedTime}
                    </div>
                    ${show.note ? `<div class="show-note">${show.note}</div>` : ''}
                </div>
                <div class="show-actions">
                    ${this.renderShowActions(show, canBuyTickets, isPast)}
                </div>
            </div>
        `;
    }

    renderShowActions(show, canBuyTickets, isPast) {
        if (isPast) {
            return `
                <div class="show-status past-show">
                    <i class="fas fa-check-circle"></i>
                    Past Show
                </div>
            `;
        }

        if (show.soldOut) {
            return `
                <div class="show-status sold-out">
                    <i class="fas fa-times-circle"></i>
                    Sold Out
                </div>
            `;
        }

        if (canBuyTickets) {
            // Check if show has multiple tickets array
            if (show.tickets && Array.isArray(show.tickets) && show.tickets.length > 0) {
                const ticketButtons = show.tickets.map(ticket => `
                    <a href="${ticket.url}" target="_blank" rel="noopener noreferrer" 
                       class="ticket-btn small">
                        <i class="fas fa-ticket-alt"></i>
                        ${ticket.label}
                    </a>
                `).join('');
                
                return `
                    <div class="ticket-badge-group">
                        ${ticketButtons}
                    </div>
                `;
            } else if (show.ticketUrl) {
                // Fallback to single ticket URL
                return `
                    <a href="${show.ticketUrl}" target="_blank" rel="noopener noreferrer" 
                       class="ticket-btn">
                        <i class="fas fa-ticket-alt"></i>
                        Get Tickets
                    </a>
                `;
            }
        }

        return `
            <div class="show-status coming-soon">
                <i class="fas fa-hourglass-half"></i>
                Coming Soon
            </div>
        `;
    }

    setupEventListeners() {
        // Section toggle
        const toggleBtn = document.getElementById('shows-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSection());
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.shows-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Show interactions
        const showItems = document.querySelectorAll('.show-item');
        showItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger on ticket button clicks
                if (!e.target.closest('.ticket-btn')) {
                    this.showDetails(item.dataset.showId);
                }
            });
        });
    }

    toggleSection() {
        const content = document.getElementById('shows-content');
        const toggleBtn = document.getElementById('shows-toggle');
        
        if (content) {
            const isVisible = content.classList.contains('visible');
            content.classList.toggle('visible', !isVisible);
            
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.shows-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.shows-list').forEach(list => {
            list.classList.toggle('active', list.id === `${tabName}-shows`);
        });
    }

    showDetails(showId) {
        const show = this.shows.find(s => s.id === showId);
        if (!show) return;

        // Create modal for show details
        const modal = document.createElement('div');
        modal.className = 'modal show-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Show Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="show-details-content">
                        <div class="show-main-info">
                            <h4>${show.venue}</h4>
                            <p class="location">${show.city}, ${show.country}</p>
                            <p class="date-time">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(new Date(show.dateISO))}
                                <i class="fas fa-clock"></i>
                                ${this.formatTime(new Date(show.dateISO))}
                            </p>
                            ${show.note ? `<p class="note">${show.note}</p>` : ''}
                        </div>
                        <div class="show-status-info">
                            ${this.renderShowActions(show, 
                                !this.isPastShow(show) && (show.tickets?.length > 0 || show.ticketUrl) && !show.soldOut, 
                                this.isPastShow(show))}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.modal-close');
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('en', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    isPastShow(show) {
        return new Date(show.dateISO) <= new Date();
    }

    // Get show data
    getShows() {
        return this.shows;
    }

    getUpcomingShows() {
        return this.upcomingShows;
    }

    getPastShows() {
        return this.pastShows;
    }

    getShow(showId) {
        return this.shows.find(s => s.id === showId) || null;
    }

    // Admin method for updating shows
    updateShows(newShows) {
        this.shows = newShows;
        this.processShows();
        this.renderShows();
    }
}

// Export for use in main app
window.ShowsModule = ShowsModule;