class AchievementSystem {
    constructor() {
        this.achievements = {
            // Sage Level Achievements
            sage_traveler: { name: "Traveler", description: "Earned 50 XP", threshold: 50, type: "xp", icon: "🌟" },
            sage_journeyor: { name: "Journeyor", description: "Earned 250 XP", threshold: 250, type: "xp", icon: "⭐" },
            sage_explorer: { name: "Explorer", description: "Earned 700 XP", threshold: 700, type: "xp", icon: "🏆" },
            sage_king: { name: "King", description: "Earned 1000 XP", threshold: 1000, type: "xp", icon: "👑" },
            
            // Streak Achievements
            streak_3: { name: "Streak Starter", description: "3-day streak", threshold: 3, type: "streak", icon: "🔥" },
            streak_7: { name: "Week Warrior", description: "7-day streak", threshold: 7, type: "streak", icon: "⚡" },
            streak_14: { name: "Fortnight Fighter", description: "14-day streak", threshold: 14, type: "streak", icon: "💪" },
            streak_30: { name: "Monthly Master", description: "30-day streak", threshold: 30, type: "streak", icon: "🎯" },
            
            // Task Completion Achievements
            task_tamer: { name: "Task Tamer", description: "Complete 10 tasks", threshold: 10, type: "tasks", icon: "✅" },
            goal_getter: { name: "Goal Getter", description: "Complete 100 tasks", threshold: 100, type: "tasks", icon: "🎖️" },
            task_master: { name: "Task Master", description: "Complete 500 tasks", threshold: 500, type: "tasks", icon: "🏅" },
            
            // Routine Achievements
            routine_builder: { name: "Routine Builder", description: "Create 5 saved tasks", threshold: 5, type: "routines", icon: "🔄" },
            routine_master: { name: "Routine Master", description: "Create 20 saved tasks", threshold: 20, type: "routines", icon: "🎪" },
            
            // Special Achievements
            first_task: { name: "Getting Started", description: "Complete your first task", threshold: 1, type: "tasks", icon: "🚀" },
            first_routine: { name: "Routine Rookie", description: "Create your first saved task", threshold: 1, type: "routines", icon: "⭐" }
        };
        
        this.notificationQueue = [];
        this.isShowingNotification = false;
    }

    // Check for new achievements and show notifications
    checkAchievements() {
        const currentStats = this.getCurrentStats();
        const newAchievements = [];

        // Check each achievement
        for (const [achievementId, achievement] of Object.entries(this.achievements)) {
            if (this.hasEarnedAchievement(achievementId, achievement, currentStats)) {
                if (!this.isAchievementUnlocked(achievementId)) {
                    newAchievements.push({ id: achievementId, ...achievement });
                    this.markAchievementUnlocked(achievementId);
                }
            }
        }

        // Show notifications for new achievements
        newAchievements.forEach(achievement => {
            this.queueNotification(achievement);
        });

        this.processNotificationQueue();
    }

    // Get current user stats from localStorage
    getCurrentStats() {
        return {
            xp: parseInt(localStorage.getItem("comp_points") || "0"),
            streak: parseInt(localStorage.getItem("streaks") || "0"),
            tasks: parseInt(localStorage.getItem("completed_tasks") || "0"),
            routines: parseInt(localStorage.getItem("routines") || "0")
        };
    }

    // Check if user has earned a specific achievement
    hasEarnedAchievement(achievementId, achievement, stats) {
        const statValue = stats[achievement.type];
        return statValue >= achievement.threshold;
    }

    // Check if achievement is already unlocked
    isAchievementUnlocked(achievementId) {
        const unlockedAchievements = JSON.parse(localStorage.getItem("unlocked_achievements") || "[]");
        return unlockedAchievements.includes(achievementId);
    }

    // Mark achievement as unlocked
    markAchievementUnlocked(achievementId) {
        const unlockedAchievements = JSON.parse(localStorage.getItem("unlocked_achievements") || "[]");
        if (!unlockedAchievements.includes(achievementId)) {
            unlockedAchievements.push(achievementId);
            localStorage.setItem("unlocked_achievements", JSON.stringify(unlockedAchievements));
        }
    }

    // Add notification to queue
    queueNotification(achievement) {
        this.notificationQueue.push(achievement);
    }

    // Process notification queue
    processNotificationQueue() {
        if (this.isShowingNotification || this.notificationQueue.length === 0) {
            return;
        }

        const achievement = this.notificationQueue.shift();
        this.showAchievementNotification(achievement);
    }

    // Show achievement notification
    showAchievementNotification(achievement) {
        this.isShowingNotification = true;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
                <div class="achievement-close" onclick="achievementSystem.closeNotification(this)">×</div>
            </div>
            <div class="achievement-progress-bar">
                <div class="achievement-progress-fill"></div>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Trigger animations
        setTimeout(() => {
            notification.classList.add('show');
            
            // Animate progress bar
            const progressFill = notification.querySelector('.achievement-progress-fill');
            progressFill.style.width = '100%';
        }, 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.closeNotification(notification);
        }, 5000);

        // Play achievement sound (optional)
        this.playAchievementSound();
    }

    // Close notification
    closeNotification(element) {
        const notification = element.closest ? element.closest('.achievement-notification') : element;
        
        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.isShowingNotification = false;
            
            // Process next notification in queue
            setTimeout(() => {
                this.processNotificationQueue();
            }, 500);
        }, 300);
    }

    // Play achievement sound (optional)
    playAchievementSound() {
        try {
            // Create a simple achievement sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Silently fail if audio context is not available
            console.log('Achievement sound not available');
        }
    }

    // Get achievement progress for display
    getAchievementProgress(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return 0;

        const stats = this.getCurrentStats();
        const currentValue = stats[achievement.type];
        return Math.min((currentValue / achievement.threshold) * 100, 100);
    }

    // Get all unlocked achievements
    getUnlockedAchievements() {
        return JSON.parse(localStorage.getItem("unlocked_achievements") || "[]");
    }

    // Reset all achievements (for testing)
    resetAchievements() {
        localStorage.removeItem("unlocked_achievements");
        console.log("All achievements reset!");
    }

    // Manual trigger for testing
    triggerTestAchievement() {
        const testAchievement = {
            id: "test",
            name: "Test Achievement",
            description: "This is a test notification",
            icon: "🧪"
        };
        this.showAchievementNotification(testAchievement);
    }
}

// Initialize achievement system
const achievementSystem = new AchievementSystem();

// Export for global access
window.achievementSystem = achievementSystem;
