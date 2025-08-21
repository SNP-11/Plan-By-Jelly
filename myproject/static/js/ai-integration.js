// AI Integration for Task Management
class TaskAI {
    constructor() {
        this.isLoading = false;
    }

    // Get AI-powered duration suggestion
    async getDurationSuggestion(taskDescription, age = 13) {
        if (!taskDescription.trim()) {
            return null;
        }

        try {
            this.isLoading = true;
            console.log('Requesting AI suggestion for:', taskDescription);

            const response = await fetch('/ai/suggest-duration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task: taskDescription,
                    age: age
                })
            });

            console.log('AI suggestion response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI suggestion failed:', errorText);
                throw new Error(`Failed to get AI suggestion: ${response.status}`);
            }

            const result = await response.json();
            console.log('AI suggestion result:', result);
            return result;
        } catch (error) {
            console.error('AI Duration Suggestion Error:', error);
            console.error('Error details:', error.message);
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    // Validate task completion and get AI-calculated points
    async validateTaskCompletion(taskData) {
        try {
            const response = await fetch('/ai/calculate-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task_description: taskData.label,
                    estimated_duration: taskData.estimated_duration,
                    actual_duration: taskData.actual_duration,
                    urgency: taskData.urgency
                })
            });

            if (!response.ok) {
                throw new Error('Failed to calculate points');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('AI Points Calculation Error:', error);
            // Fallback to default points
            return {
                completion_valid: true,
                suggested_points: 10,
                feedback: "Good job completing your task!",
                performance_score: 3,
                confidence: 0.5
            };
        }
    }

    // Show AI suggestion in the UI
    showDurationSuggestion(suggestion, targetElement) {
        if (!suggestion || !targetElement) return;

        // Remove existing suggestion
        const existingSuggestion = document.querySelector('.ai-suggestion');
        if (existingSuggestion) {
            existingSuggestion.remove();
        }

        // Create suggestion element
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'ai-suggestion';
        suggestionDiv.innerHTML = `
            <div class="ai-suggestion-content">
                <div class="ai-icon">🤖</div>
                <div class="ai-text">
                    <strong>AI Suggestion:</strong> ${suggestion.suggested_minutes} minutes
                    <br><small>Subject: ${suggestion.subject}</small>
                </div>
                <button class="ai-accept-btn" onclick="taskAI.acceptSuggestion(${suggestion.suggested_minutes})">
                    Use This
                </button>
                <button class="ai-dismiss-btn" onclick="taskAI.dismissSuggestion()">
                    ✕
                </button>
            </div>
        `;

        // Add styles to match project color scheme
        suggestionDiv.style.cssText = `
            background: #f5f5f5;
            color: #1a1a1a;
            padding: 12px;
            border-radius: 8px;
            margin: 8px 0;
            box-shadow: 0 2px 10px rgba(26,26,26,0.1);
            border: 1px solid rgba(26,26,26,0.1);
            animation: slideIn 0.3s ease-out;
        `;

        // Insert after target element
        targetElement.parentNode.insertBefore(suggestionDiv, targetElement.nextSibling);
    }

    // Accept AI suggestion
    acceptSuggestion(minutes) {
        const startTimeInput = document.getElementById('start_time');
        const endTimeInput = document.getElementById('end_time');

        if (startTimeInput && endTimeInput) {
            // Get the current start time or set to now if empty
            let startTime;
            if (startTimeInput.value) {
                // Parse the existing start time (handle both formats)
                if (startTimeInput.value.includes('--')) {
                    // Flatpickr format: "8/21--12:00 PM"
                    const [datePart, timePart] = startTimeInput.value.split('--');
                    const [month, day] = datePart.split('/');
                    const currentYear = new Date().getFullYear();
                    const standardFormat = `${month}/${day}/${currentYear} ${timePart}`;
                    startTime = new Date(standardFormat);
                } else {
                    // Standard format: "2025-08-21 12:00"
                    startTime = new Date(startTimeInput.value.replace(' ', 'T'));
                }
            } else {
                // If no start time set, use current time
                startTime = new Date();
            }

            // Calculate end time by adding suggested minutes
            const endTime = new Date(startTime.getTime() + (minutes * 60000));

            console.log("AI Suggestion Debug:");
            console.log("- Start time object:", startTime);
            console.log("- End time object:", endTime);
            console.log("- Start time hours:", startTime.getHours());
            console.log("- End time hours:", endTime.getHours());

            // Use Flatpickr to set the dates (this will format them correctly)
            if (startTimeInput._flatpickr) {
                console.log("Using Flatpickr setDate for start time");
                startTimeInput._flatpickr.setDate(startTime);
                console.log("Start time value after Flatpickr:", startTimeInput.value);
            } else {
                // Fallback: format manually in Flatpickr format (n/j--H:i K)
                console.log("Using manual formatting for start time");
                const startFormatted = this.formatDateForFlatpickr(startTime);
                console.log("Start time manually formatted:", startFormatted);
                startTimeInput.value = startFormatted;
            }

            if (endTimeInput._flatpickr) {
                console.log("Using Flatpickr setDate for end time");
                endTimeInput._flatpickr.setDate(endTime);
                console.log("End time value after Flatpickr:", endTimeInput.value);
            } else {
                // Fallback: format manually in Flatpickr format (n/j--H:i K)
                console.log("Using manual formatting for end time");
                const endFormatted = this.formatDateForFlatpickr(endTime);
                console.log("End time manually formatted:", endFormatted);
                endTimeInput.value = endFormatted;
            }

            // Visual feedback
            endTimeInput.style.background = '#e8f5e8';
            startTimeInput.style.background = '#e8f5e8';
            setTimeout(() => {
                endTimeInput.style.background = '';
                startTimeInput.style.background = '';
            }, 1500);

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.innerHTML = `✅ Set ${minutes} minutes from ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}`;
            successMsg.style.cssText = `
                color: #28a745;
                font-size: 12px;
                margin-top: 5px;
                font-weight: bold;
            `;
            endTimeInput.parentNode.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
        }

        this.dismissSuggestion();
    }

    // Helper function to format date in Flatpickr format (n/j--H:i K)
    formatDateForFlatpickr(date) {
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate(); // 1-31
        let hours = date.getHours(); // 0-23
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // Convert to 12-hour format
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const hoursStr = String(hours); // Don't pad with zero for Flatpickr format

        console.log(`Formatting date: ${date} -> ${month}/${day}--${hoursStr}:${minutes} ${ampm}`);
        return `${month}/${day}--${hoursStr}:${minutes} ${ampm}`;
    }

    // Dismiss AI suggestion
    dismissSuggestion() {
        const suggestion = document.querySelector('.ai-suggestion');
        if (suggestion) {
            suggestion.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => suggestion.remove(), 300);
        }
    }

    // Enhanced task completion with AI validation
    async completeTaskWithAI(taskData) {
        const currentTime = Math.floor(Date.now() / 1000);
        const startTime = taskData.start_time;
        const estimatedDuration = taskData.end_time - taskData.start_time;
        const actualDuration = currentTime - startTime;

        // Get AI validation
        const validationResult = await this.validateTaskCompletion({
            label: taskData.label,
            estimated_duration: estimatedDuration,
            actual_duration: actualDuration,
            urgency: taskData.urgency
        });

        // Mark task as completed in database
        try {
            const response = await fetch('/complete_task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `id=${taskData.id}`
            });

            if (!response.ok) {
                console.error('Failed to mark task as completed in database');
            }
        } catch (error) {
            console.error('Error marking task as completed:', error);
        }

        // Show feedback to user
        this.showCompletionFeedback(validationResult);

        // Update points with smooth animation
        const currentPoints = parseInt(localStorage.getItem("comp_points") || "0");
        const newPoints = currentPoints + validationResult.suggested_points;
        localStorage.setItem("comp_points", newPoints);

        // Animate points update
        const pointsElement = $("#comp_points");
        pointsElement.css('transition', 'all 0.3s ease-out');
        pointsElement.css('transform', 'scale(1.1)');
        pointsElement.text(newPoints);
        setTimeout(() => {
            pointsElement.css('transform', 'scale(1)');
        }, 300);

        // Update streaks
        this.updateStreaks();

        return validationResult;
    }

    // Show completion feedback
    showCompletionFeedback(result) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'completion-feedback';
        feedbackDiv.innerHTML = `
            <div class="feedback-content">
                <div class="points-earned">+${result.suggested_points} points!</div>
                <div class="feedback-message">${result.feedback}</div>
                <div class="performance-indicator">
                    Performance: ${'⭐'.repeat(result.performance_score)}
                </div>
            </div>
        `;

        feedbackDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${result.performance_score >= 4 ? '#4CAF50' : result.performance_score >= 3 ? '#FF9800' : '#f44336'};
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(feedbackDiv);

        // Store reference for potential early removal
        this.currentFeedback = feedbackDiv;

        // Auto-remove after normal duration with smooth animation
        setTimeout(() => {
            if (feedbackDiv.parentNode) {
                feedbackDiv.style.animation = 'slideOutRight 0.5s ease-in';
                setTimeout(() => {
                    if (feedbackDiv.parentNode) {
                        feedbackDiv.remove();
                    }
                }, 500);
            }
        }, 2500);
    }

    // Method to dismiss current feedback early if needed
    dismissCurrentFeedback() {
        if (this.currentFeedback && this.currentFeedback.parentNode) {
            this.currentFeedback.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (this.currentFeedback && this.currentFeedback.parentNode) {
                    this.currentFeedback.remove();
                }
            }, 300);
        }
    }

    // Update streaks logic
    updateStreaks() {
        let streaks = parseInt(localStorage.getItem("streaks") || "0");
        let lastStreak = localStorage.getItem("last_streak") || "0";
        let currentTime = Math.floor(Date.now() / 1000);
        let lastStreakTime = parseInt(lastStreak);

        if (lastStreakTime < (currentTime - 86400)) { // 24 hours
            localStorage.setItem("streaks", streaks + 1);
            localStorage.setItem("last_streak", currentTime);
            $("#streaks").text(streaks + 1);
        }
    }

    // Get AI insights
    async getInsights() {
        try {
            const response = await fetch('/ai/insights', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get insights');
            }

            const insights = await response.json();
            return insights;
        } catch (error) {
            console.error('AI Insights Error:', error);
            return null;
        }
    }

    // Show insights modal
    showInsights(insights) {
        if (!insights) {
            alert('Unable to load insights. Please try again later.');
            return;
        }

        // Create insights modal
        const modal = document.createElement('div');
        modal.className = 'insights-modal';
        modal.innerHTML = `
            <div class="insights-modal-content">
                <div class="insights-header">
                    <h3>🤖 Your AI Study Insights</h3>
                    <button class="insights-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="insights-body">
                    <div class="insights-stats">
                        <div class="stat-card">
                            <div class="stat-number">${insights.total_tasks}</div>
                            <div class="stat-label">Tasks Completed</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${insights.performance_score}</div>
                            <div class="stat-label">Performance Score</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${insights.patterns.variety_score}</div>
                            <div class="stat-label">Subject Variety</div>
                        </div>
                    </div>
                    <div class="insights-section">
                        <h4>📊 Your Patterns</h4>
                        <p><strong>Most Common Subject:</strong> ${insights.most_common_subject}</p>
                        <p><strong>Urgency Ratio:</strong> ${insights.patterns.urgency_ratio}% urgent tasks</p>
                    </div>
                    <div class="insights-section">
                        <h4>💡 AI Recommendations</h4>
                        <ul>
                            ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        `;

        document.body.appendChild(modal);
    }
}

// Initialize AI helper
const taskAI = new TaskAI();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(300px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(300px); opacity: 0; }
    }
    
    .ai-suggestion-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .ai-icon {
        font-size: 24px;
        color: #1a1a1a;
    }

    .ai-text {
        flex: 1;
        font-size: 14px;
        color: #1a1a1a;
    }

    .ai-accept-btn, .ai-dismiss-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }

    .ai-accept-btn {
        background: #1a1a1a;
        color: #f5f5f5;
        border: 1px solid #333;
    }

    .ai-accept-btn:hover {
        background: #333;
        color: white;
    }

    .ai-dismiss-btn {
        background: rgba(26,26,26,0.1);
        color: #1a1a1a;
        width: 24px;
        height: 24px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(26,26,26,0.2);
    }

    .ai-dismiss-btn:hover {
        background: rgba(26,26,26,0.2);
    }
    
    .completion-feedback {
        font-family: Arial, sans-serif;
    }
    
    .points-earned {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 8px;
    }
    
    .feedback-message {
        font-size: 14px;
        margin-bottom: 8px;
    }
    
    .performance-indicator {
        font-size: 12px;
        opacity: 0.9;
    }

    /* Checkmark button hover effect */
    #checkmark {
        transition: all 0.2s ease-in-out !important;
        cursor: pointer !important;
    }

    #checkmark:hover {
        transform: scale(1.05) !important;
        filter: brightness(1.1) !important;
    }

    #checkmark:active {
        transform: scale(0.98) !important;
        transition: all 0.1s ease-in-out !important;
    }

    /* Smooth modal transitions */
    .modal {
        transition: opacity 0.3s ease-in-out !important;
    }

    .modal-content {
        transition: all 0.3s ease-in-out !important;
    }

    /* Task completion animations - Balloon Pop Effect */
    .task-completing {
        transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        transform: scale(1.2) !important;
        opacity: 0.8 !important;
        filter: brightness(1.2) !important;
    }

    .task-popping {
        transition: all 0.1s ease-in !important;
        transform: scale(0) !important;
        opacity: 0 !important;
        filter: blur(2px) !important;
    }

    /* Add a subtle bounce effect to tasks on hover */
    .task-div:hover {
        transition: transform 0.2s ease-out !important;
        transform: scale(1.02) !important;
    }

    .insights-modal-content {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        color: #1a1a1a;
        border: 2px solid rgba(26,26,26,0.1);
    }

    .insights-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid rgba(26,26,26,0.1);
        padding-bottom: 12px;
    }

    .insights-header h3 {
        margin: 0;
        color: #1a1a1a;
    }

    .insights-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .insights-close:hover {
        color: #1a1a1a;
    }

    .insights-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
    }

    .stat-card {
        flex: 1;
        min-width: 120px;
        background: #1a1a1a;
        color: #f5f5f5;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid rgba(26,26,26,0.2);
    }

    .stat-number {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #f5f5f5;
    }

    .stat-label {
        font-size: 12px;
        opacity: 0.8;
        color: #ccc;
    }

    .insights-section {
        margin-bottom: 20px;
    }

    .insights-section h4 {
        color: #1a1a1a;
        margin-bottom: 12px;
        font-size: 16px;
    }

    .insights-section ul {
        list-style: none;
        padding: 0;
    }

    .insights-section li {
        background: rgba(26,26,26,0.05);
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        border-left: 4px solid #1a1a1a;
        color: #1a1a1a;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* AI Suggestion Button Hover Effects */
    #ai-suggest-btn:hover {
        background: rgba(245,245,245,0.2) !important;
        border-color: rgba(245,245,245,0.5) !important;
        transform: scale(1.02) !important;
        box-shadow: 0 2px 8px rgba(245,245,245,0.1) !important;
    }

    #ai-suggest-btn:active {
        transform: scale(0.98) !important;
    }

    /* Task completion notification styles */
    .task-completion-notification {
        font-family: Arial, sans-serif;
        border-left: 4px solid #2E7D32;
    }

    .task-completion-notification .completion-header {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
    }

    .task-completion-notification .task-name {
        color: #E8F5E8;
        font-style: italic;
    }

    .task-completion-notification .xp-earned {
        font-size: 20px;
        font-weight: bold;
        color: #FFD700;
        margin-bottom: 8px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .task-completion-notification .suggestion {
        font-size: 13px;
        opacity: 0.9;
        line-height: 1.4;
        background: rgba(255,255,255,0.1);
        padding: 6px 8px;
        border-radius: 4px;
        margin-top: 8px;
    }
`;
document.head.appendChild(style);

// Set up AI insights button when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const insightsBtn = document.getElementById('ai-insights-btn');
    if (insightsBtn) {
        insightsBtn.addEventListener('click', async function() {
            insightsBtn.innerHTML = '🤖 Loading...';
            insightsBtn.disabled = true;

            try {
                const insights = await taskAI.getInsights();
                if (insights) {
                    taskAI.showInsights(insights);
                }
            } catch (error) {
                console.error('Error loading insights:', error);
                alert('Failed to load insights. Please try again.');
            } finally {
                insightsBtn.innerHTML = '🤖 AI Insights';
                insightsBtn.disabled = false;
            }
        });
    }
});
