class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.spotlight = null;

        // Tutorial steps configuration
        this.steps = [
            {
                target: '#toggleButton',
                title: 'Welcome to Your Task Manager! 🎉',
                content: 'This is your sidebar menu button. Click it to access different sections like Calendar, Achievements, and Settings.',
                position: 'right',
                action: 'highlight'
            },
            {
                target: '#header',
                title: 'Track Your Progress 📊',
                content: 'Here you can see your current streak and points. Complete tasks to earn points and maintain your streak!',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '.week-navigation',
                title: 'Navigate Between Weeks 📅',
                content: 'Use these arrows to navigate between different weeks. You can plan tasks for future weeks or review past ones.',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '#day1 .weekdays',
                title: 'Weekly View 📋',
                content: 'This is your weekly task view. Each column represents a day of the week, starting with Sunday.',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '#openModalBtn',
                title: 'Add New Tasks ➕',
                content: 'Click this plus button to create a new task. Let\'s open it to see the task creation interface!',
                position: 'top',
                action: 'highlight',
                beforeShow: () => {
                    // Ensure modal is closed before this step
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "none";
                    }
                }
            },
            {
                target: '.sunday-modal-content',
                title: 'Task Creation Interface 📝',
                content: 'This is your task creation hub! Here you can set task details, times, urgency levels, and mark tasks as favorites with the star.',
                position: 'left',
                action: 'highlight',
                beforeShow: () => {
                    // Open the modal for this step
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '#urgency',
                title: 'Set Task Priority 🎯',
                content: 'Choose the urgency level for your task: Very Important, Important, or Not Important. This helps you prioritize your work!',
                position: 'bottom',
                action: 'highlight',
                beforeShow: () => {
                    // Ensure modal stays open
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '#label-input',
                title: 'Give your task a name',
                content: 'Type in what you want to call your task!',
                position: 'bottom',
                action:'highlight',
                beforeShow: () => {
                    const modal = document.getElementById("myModal");
                    if (modal){
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '.star-label',
                title: 'Save as Routine ⭐',
                content: 'Click the star to save this task as a routine! Routine tasks can be quickly added again in the future.',
                position: 'right',
                action: 'highlight',
                beforeShow: () => {
                    // Ensure modal stays open
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '.task-input-group',
                title: 'Schedule Your Task ⏰',
                content: 'Set the start and end times for your task using these date/time pickers. This helps you plan your day effectively!',
                position: 'top',
                action: 'highlight',
                beforeShow: () => {
                    // Ensure modal stays open
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '#addButton',
                title: 'Create Your Task ✅',
                content: 'Once you\'ve filled in the details, click this add button to create your task. It will appear in the appropriate day column!',
                position: 'left',
                action: 'highlight',
                beforeShow: () => {
                    // Ensure modal stays open
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '#removeButton',
                title: 'Delete Your Task ❌',
                content: 'If you don\'t want to complete the task, you can delete it!',
                position:'left',
                action: 'highlight',
                beforeShow: () => {
                    const modal = document.getElementById("myModal");
                    if (modal){
                        modal.style.display = "block";
                    }
                }
            },
            {
                target: '#sideMenu',
                title: 'Explore More Features 🚀',
                content: 'Don\'t forget to explore the sidebar menu for Calendar view, Timeout sessions, and Achievements! You can also restart this tutorial anytime.',
                position: 'right',
                action: 'highlight',
                beforeShow: () => {
                    // Open the sidebar for this step
                    const sideMenu = document.getElementById("sideMenu");
                    if (sideMenu) {
                        sideMenu.style.display = "block";
                    }
                }
            },
            {
                target: '.schedule-wrapper',
                title: 'Your Weekly Dashboard 📊',
                content: 'This is your main workspace! Tasks will appear here organized by day. You can drag and interact with your tasks once you create them.',
                position: 'top',
                action: 'highlight',
                beforeShow: () => {
                    // Close the sidebar and modal for this step
                    const sideMenu = document.getElementById("sideMenu");
                    if (sideMenu) {
                        sideMenu.style.display = "none";
                    }
                    const modal = document.getElementById("myModal");
                    if (modal) {
                        modal.style.display = "none";
                    }
                }
            }
        ];
    }

    // Check if tutorial should be shown
    shouldShowTutorial() {
        // Get current user from session (if available) or use a general key
        const currentUser = this.getCurrentUser();
        const tutorialKey = currentUser ? `tutorial_completed_${currentUser}` : 'tutorial_completed';
        const tutorialCompleted = localStorage.getItem(tutorialKey);
        return !tutorialCompleted || tutorialCompleted !== 'true';
    }

    // Get current user identifier (you can modify this based on your session management)
    getCurrentUser() {
        // Try to get username from any available source
        // This could be from a global variable, session storage, or DOM element
        if (typeof window.currentUser !== 'undefined') {
            return window.currentUser;
        }

        // Alternative: try to get from a meta tag or hidden element
        const userMeta = document.querySelector('meta[name="current-user"]');
        if (userMeta) {
            return userMeta.getAttribute('content');
        }

        // Fallback: use a general identifier
        return null;
    }

    // Initialize tutorial
    init() {
        if (this.shouldShowTutorial()) {
            this.showWelcomeModal();
        }
    }

    // Show welcome modal
    showWelcomeModal() {
        const currentUser = this.getCurrentUser();
        const userName = currentUser ? currentUser : 'there';

        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'tutorial-overlay tutorial-fade-in';
        welcomeModal.innerHTML = `
            <div class="tutorial-welcome">
                <h2>Welcome ${userName}! 👋</h2>
                <p>Since this is your first time logging in, we'd love to show you around! This quick tour will help you understand all the key features of your new task management system.</p>
                <div class="tutorial-welcome-buttons">
                    <button class="tutorial-btn tutorial-btn-primary" onclick="tutorial.startTutorial()">
                        Start Tutorial
                    </button>
                    <button class="tutorial-btn tutorial-btn-secondary" onclick="tutorial.skipTutorial()">
                        Skip for Now
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(welcomeModal);
        welcomeModal.style.display = 'block';
        this.overlay = welcomeModal;
    }

    // Start the tutorial
    startTutorial() {
        if (this.overlay) {
            this.overlay.remove();
        }

        this.currentStep = 0;
        this.isActive = true;
        this.createTutorialElements();
        this.showStep(0);
    }

    // Skip tutorial
    skipTutorial() {
        this.completeTutorial();
    }

    // Create tutorial overlay elements
    createTutorialElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';

        // Create spotlight
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'tutorial-spotlight';

        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';

        this.overlay.appendChild(this.spotlight);
        this.overlay.appendChild(this.tooltip);
        document.body.appendChild(this.overlay);
        this.overlay.style.display = 'block';
    }

    // Show specific step
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.completeTutorial();
            return;
        }

        const step = this.steps[stepIndex];

        // Execute beforeShow action if exists first
        if (step.beforeShow) {
            step.beforeShow();
        }

        // Small delay to ensure DOM changes from beforeShow are applied
        setTimeout(() => {
            const target = document.querySelector(step.target);

            if (!target) {
                console.warn(`Tutorial target not found: ${step.target}`);
                console.log('Available elements:', document.querySelectorAll(step.target.split(' ')[0]));
                this.nextStep();
                return;
            }

            console.log(`Tutorial targeting: ${step.target}`, target);

            // Position spotlight on target
            this.positionSpotlight(target);

            // Position and populate tooltip
            this.positionTooltip(target, step);

            // Add pulse effect to target
            target.classList.add('tutorial-pulse');

            // Remove pulse effect after animation
            setTimeout(() => {
                target.classList.remove('tutorial-pulse');
            }, 2000);
        }, 100);
    }

    // Position spotlight around target element
    positionSpotlight(target) {
        const rect = target.getBoundingClientRect();
        let padding = 10;

        // Special handling for modal elements - use larger padding
        if (target.closest('#myModal') || target.classList.contains('sunday-modal-content')) {
            padding = 15;
        }

        this.spotlight.style.left = (rect.left - padding) + 'px';
        this.spotlight.style.top = (rect.top - padding) + 'px';
        this.spotlight.style.width = (rect.width + padding * 2) + 'px';
        this.spotlight.style.height = (rect.height + padding * 2) + 'px';
    }

    // Position tooltip relative to target
    positionTooltip(target, step) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        // Clear previous position classes
        this.tooltip.className = 'tutorial-tooltip';

        let left, top;

        switch (step.position) {
            case 'top':
                left = rect.left + (rect.width / 2) - (350 / 2);
                top = rect.top - tooltipRect.height - 20;
                this.tooltip.classList.add('top');
                break;
            case 'bottom':
                left = rect.left + (rect.width / 2) - (350 / 2);
                top = rect.bottom + 20;
                this.tooltip.classList.add('bottom');
                break;
            case 'left':
                left = rect.left - 350 - 20;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                this.tooltip.classList.add('left');
                break;
            case 'right':
                left = rect.right + 20;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                this.tooltip.classList.add('right');
                break;
            default:
                left = rect.right + 20;
                top = rect.top;
                this.tooltip.classList.add('right');
        }

        // Ensure tooltip stays within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - 360));
        top = Math.max(10, Math.min(top, window.innerHeight - 200));

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';

        // Populate tooltip content
        this.populateTooltip(step);
    }

    // Populate tooltip with step content
    populateTooltip(step) {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;

        this.tooltip.innerHTML = `
            <div class="tutorial-header">${step.title}</div>
            <div class="tutorial-content">${step.content}</div>
            <div class="tutorial-progress">
                <span>Step ${this.currentStep + 1} of ${this.steps.length}</span>
                <div class="tutorial-progress-bar">
                    <div class="tutorial-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="tutorial-controls">
                <button class="tutorial-btn tutorial-btn-skip" onclick="tutorial.skipTutorial()">
                    Skip Tutorial
                </button>
                <div>
                    ${this.currentStep > 0 ?
                        '<button class="tutorial-btn tutorial-btn-secondary" onclick="tutorial.prevStep()">Previous</button>' :
                        ''
                    }
                    <button class="tutorial-btn tutorial-btn-primary" onclick="tutorial.nextStep()">
                        ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;
    }

    // Go to next step
    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.completeTutorial();
        } else {
            this.showStep(this.currentStep);
        }
    }

    // Go to previous step
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    // Complete tutorial
    completeTutorial() {
        const currentUser = this.getCurrentUser();
        const tutorialKey = currentUser ? `tutorial_completed_${currentUser}` : 'tutorial_completed';
        localStorage.setItem(tutorialKey, 'true');
        this.isActive = false;

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        // Hide sidebar if it was opened during tutorial
        const sideMenu = document.getElementById("sideMenu");
        if (sideMenu) {
            sideMenu.style.display = "none";
        }

        // Hide modal if it was opened during tutorial
        const modal = document.getElementById("myModal");
        if (modal) {
            modal.style.display = "none";
        }

        // Show completion message
        this.showCompletionMessage();
    }

    // Show completion message
    showCompletionMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Poppins', sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        const currentUser = this.getCurrentUser();
        const userName = currentUser ? currentUser : 'there';

        message.innerHTML = `
            <div>🎉 Welcome aboard, ${userName}! Tutorial completed!</div>
            <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
                💡 You're all set! Click the + button to create your first task!
            </div>
        `;

        document.body.appendChild(message);

        // Add click to dismiss
        message.addEventListener('click', () => {
            message.remove();
        });

        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 6000);
    }

    // Trigger task creation demo (optional enhancement)
    triggerTaskDemo() {
        const addButton = document.getElementById('openModalBtn');
        if (addButton) {
            // Highlight the add button
            addButton.classList.add('tutorial-pulse');
            setTimeout(() => {
                addButton.classList.remove('tutorial-pulse');
            }, 3000);
        }
    }

    // Reset tutorial (for testing or user request)
    resetTutorial() {
        const currentUser = this.getCurrentUser();
        const tutorialKey = currentUser ? `tutorial_completed_${currentUser}` : 'tutorial_completed';
        localStorage.removeItem(tutorialKey);
        if (this.overlay) {
            this.overlay.remove();
        }
        this.init();
    }
}

// Initialize tutorial system
const tutorial = new TutorialSystem();

// Auto-start tutorial when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        tutorial.init();
    }, 1000);
});
