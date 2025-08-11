// Admin Module for DWC v2 - Content management with Worker integration
class DWCAdmin {
    constructor() {
        this.contentTypes = ['profile', 'tracks', 'playlists', 'gallery', 'videos', 'shows', 'links'];
        this.data = {};
        this.currentTab = 'profile';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadAllContent();
        this.populateEditors();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Global actions
        document.getElementById('load-from-worker')?.addEventListener('click', () => {
            this.loadFromWorker();
        });

        document.getElementById('save-to-worker')?.addEventListener('click', () => {
            this.saveToWorker();
        });

        document.getElementById('export-all')?.addEventListener('click', () => {
            this.exportAll();
        });

        document.getElementById('import-all')?.addEventListener('click', () => {
            this.importAll();
        });

        // Individual save buttons
        this.contentTypes.forEach(type => {
            document.getElementById(`save-${type}`)?.addEventListener('click', () => {
                this.saveContent(type);
            });
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update content panels
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-content`);
        });

        this.currentTab = tabId;
    }

    async loadAllContent() {
        this.showStatus('Loading content...', 'warning');
        
        for (const type of this.contentTypes) {
            try {
                await this.loadContent(type);
            } catch (error) {
                console.error(`Failed to load ${type}:`, error);
            }
        }
        
        this.showStatus('Content loaded successfully', 'success');
    }

    async loadContent(type) {
        try {
            // Try Worker first if configured
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/${type}`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.data[type] = await response.json();
                        console.log(`${type} loaded from Worker`);
                        return;
                    }
                } catch (error) {
                    console.warn(`Worker load failed for ${type}, trying local:`, error);
                }
            }

            // Fallback to local JSON
            const response = await fetch(`../data/${type}.json`);
            if (response.ok) {
                this.data[type] = await response.json();
                console.log(`${type} loaded from local JSON`);
            } else {
                throw new Error(`Failed to load ${type}: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            this.data[type] = type === 'profile' ? {} : [];
        }
    }

    populateEditors() {
        this.contentTypes.forEach(type => {
            const editor = document.getElementById(`${type}-editor`);
            if (editor && this.data[type]) {
                editor.value = JSON.stringify(this.data[type], null, 2);
            }
        });
    }

    async loadFromWorker() {
        if (!window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
            this.showStatus('Worker proxy not configured', 'error');
            return;
        }

        this.showStatus('Loading all content from Worker...', 'warning');
        
        try {
            await this.loadAllContent();
            this.populateEditors();
            this.showStatus('Successfully loaded all content from Worker', 'success');
        } catch (error) {
            this.showStatus(`Failed to load from Worker: ${error.message}`, 'error');
        }
    }

    async saveToWorker() {
        if (!window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
            this.showStatus('Worker proxy not configured', 'error');
            return;
        }

        this.showStatus('Saving all content to Worker...', 'warning');
        
        try {
            // Update data from editors
            this.updateDataFromEditors();
            
            // Save each content type
            for (const type of this.contentTypes) {
                await this.saveContentToWorker(type);
            }
            
            this.showStatus('Successfully saved all content to Worker', 'success');
        } catch (error) {
            this.showStatus(`Failed to save to Worker: ${error.message}`, 'error');
        }
    }

    async saveContent(type) {
        try {
            // Update data from editor
            const editor = document.getElementById(`${type}-editor`);
            if (editor) {
                this.data[type] = JSON.parse(editor.value);
            }

            // Save to Worker if configured
            if (window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                await this.saveContentToWorker(type);
                this.showStatus(`${type} saved to Worker successfully`, 'success');
            } else {
                // Local save (just update memory for now)
                this.showStatus(`${type} updated locally (Worker not configured)`, 'warning');
            }
        } catch (error) {
            this.showStatus(`Failed to save ${type}: ${error.message}`, 'error');
        }
    }

    async saveContentToWorker(type) {
        if (!window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
            throw new Error('Worker proxy not configured');
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        // Add authentication token if configured
        if (window.DWC_CONFIG?.CONTENT_WRITE_TOKEN) {
            headers['X-Content-Token'] = window.DWC_CONFIG.CONTENT_WRITE_TOKEN;
        }

        const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/${type}`, {
            method: 'POST',
            mode: 'cors',
            headers,
            body: JSON.stringify(this.data[type])
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Worker save failed (${response.status}): ${errorText}`);
        }

        console.log(`${type} saved to Worker successfully`);
    }

    updateDataFromEditors() {
        this.contentTypes.forEach(type => {
            const editor = document.getElementById(`${type}-editor`);
            if (editor) {
                try {
                    this.data[type] = JSON.parse(editor.value);
                } catch (error) {
                    console.error(`Invalid JSON in ${type} editor:`, error);
                    throw new Error(`Invalid JSON in ${type} editor`);
                }
            }
        });
    }

    exportAll() {
        try {
            this.updateDataFromEditors();
            
            const exportData = {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                data: this.data
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dwc-v2-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatus('Export completed successfully', 'success');
        } catch (error) {
            this.showStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    importAll() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (importData.data) {
                        this.data = importData.data;
                        this.populateEditors();
                        this.showStatus(`Import completed successfully (version: ${importData.version || 'unknown'})`, 'success');
                    } else {
                        throw new Error('Invalid export file format');
                    }
                } catch (error) {
                    this.showStatus(`Import failed: ${error.message}`, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    showStatus(message, type = 'success') {
        const container = document.getElementById('status-container');
        if (!container) return;

        // Remove existing status messages
        container.innerHTML = '';

        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message status-${type}`;
        statusDiv.innerHTML = `
            <i class="fas fa-${this.getStatusIcon(type)}"></i>
            ${message}
        `;

        container.appendChild(statusDiv);

        // Auto-remove after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 5000);
        }
    }

    getStatusIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    // Validate JSON in editors
    validateEditor(type) {
        const editor = document.getElementById(`${type}-editor`);
        if (!editor) return false;

        try {
            JSON.parse(editor.value);
            editor.style.borderColor = 'rgba(0, 245, 255, 0.3)';
            return true;
        } catch (error) {
            editor.style.borderColor = '#e74c3c';
            this.showStatus(`Invalid JSON in ${type} editor: ${error.message}`, 'error');
            return false;
        }
    }

    // Real-time JSON validation
    setupEditorValidation() {
        this.contentTypes.forEach(type => {
            const editor = document.getElementById(`${type}-editor`);
            if (editor) {
                editor.addEventListener('blur', () => {
                    this.validateEditor(type);
                });
            }
        });
    }

    // Preview changes before saving
    previewChanges(type) {
        if (!this.validateEditor(type)) return;

        const editor = document.getElementById(`${type}-editor`);
        try {
            const newData = JSON.parse(editor.value);
            const oldData = this.data[type];
            
            // Simple diff comparison
            const changes = this.computeChanges(oldData, newData);
            console.log(`Changes for ${type}:`, changes);
            
            // You could show a modal with changes preview here
            return changes;
        } catch (error) {
            this.showStatus(`Preview failed: ${error.message}`, 'error');
            return null;
        }
    }

    computeChanges(oldData, newData) {
        // Simple change detection - in a real app you'd want a proper diff library
        const changes = {
            added: [],
            modified: [],
            removed: []
        };

        if (Array.isArray(newData) && Array.isArray(oldData)) {
            // For arrays (tracks, playlists, etc.)
            const oldIds = oldData.map(item => item.id);
            const newIds = newData.map(item => item.id);
            
            changes.added = newIds.filter(id => !oldIds.includes(id));
            changes.removed = oldIds.filter(id => !newIds.includes(id));
            
            // Check for modifications
            newData.forEach(newItem => {
                const oldItem = oldData.find(item => item.id === newItem.id);
                if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    changes.modified.push(newItem.id);
                }
            });
        } else {
            // For objects (profile)
            if (JSON.stringify(oldData) !== JSON.stringify(newData)) {
                changes.modified.push('profile');
            }
        }

        return changes;
    }
}

// Initialize admin when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dwcAdmin = new DWCAdmin();
});