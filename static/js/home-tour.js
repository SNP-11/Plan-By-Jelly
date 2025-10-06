// Lightweight guided tour for homeG.html
// No external dependencies beyond jQuery already on the page

(function () {
  const uid = (document.querySelector('meta[name="uid"]')?.getAttribute('content') || 'anon') + '';
  const LS_KEY_COMPLETED = `home_tour_completed_${uid}`;
  const LS_KEY_DISMISSED = `home_tour_dismissed_${uid}`;

  let state = {
    stepIndex: 0,
    steps: [],
    overlay: null,
    tooltip: null,
    highlight: null,
    currentTarget: null,
    welcome: null,
    isActive: false,
  };

  // Public API
  window.startTutorial = startTutorial;

  // Auto-offer tutorial on first visit after login
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const completed = localStorage.getItem(LS_KEY_COMPLETED);
      const dismissed = localStorage.getItem(LS_KEY_DISMISSED);
      // Offer once if not completed or dismissed
      if (!completed && !dismissed) {
        showWelcomeModal();
      }

      // Bind help button too (in case inline onclick is removed later)
      const helpBtn = document.getElementById('helpButton');
      if (helpBtn) helpBtn.addEventListener('click', () => startTutorial({ force: true }));
    } catch (e) {
      console.warn('Tutorial auto-offer error:', e);
    }
  });

  function showWelcomeModal() {
    const modal = document.createElement('div');
    modal.className = 'tour-welcome-modal';
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <h2>Welcome to Jelly!</h2>
      <p>Want a quick, 1-minute tour of the home page? We'll show you how to add tasks, use AI time suggestions, earn points, and more.</p>
      <div class="welcome-buttons">
        <button class="start-tour">Start Tour</button>
        <button class="skip-tour">No thanks</button>
      </div>
    `;

    document.body.appendChild(modal);
    state.welcome = modal;

    modal.querySelector('.start-tour').addEventListener('click', () => {
      dismissWelcome(false); // don't mark dismissed if they start
      startTutorial();
    });
    modal.querySelector('.skip-tour').addEventListener('click', () => {
      dismissWelcome(true);
    });
  }

  function dismissWelcome(markDismissed) {
    if (state.welcome) {
      state.welcome.remove();
      state.welcome = null;
    }
    if (markDismissed) {
      localStorage.setItem(LS_KEY_DISMISSED, '1');
    }
  }

  function buildSteps() {
    // Define the key UI walkthrough steps
    const steps = [
      {
        el: '#toggleButton',
        title: 'Menu 🍔',
        text: 'Click here to open the side menu. From there you can jump to Calendar, Timeout, Achievements, PB&J, or Log out.',
        placement: 'right'
      },
      {
        el: '#header',
        title: 'Points & Streaks ⚡🔥',
        text: 'Track your streaks and points here. Completing tasks earns XP and grows your streak when you show up daily!',
        placement: 'bottom'
      },
      {
        el: '#ai-insights-btn',
        title: 'AI Insights 🤖✨',
        text: 'Click to see personalized study recommendations based on your recent completions.',
        placement: 'bottom'
      },
      {
        el: '#prevWeek',
        title: 'Navigate Weeks ⏭️',
        text: 'Use these arrows to move between weeks. Your tasks update to match the selected week.',
        placement: 'bottom'
      },
      {
        el: '#openModalBtn',
        title: 'Add a Task ➕',
        text: 'Click the + button to add a new task for this day. We will open it for you next.',
        placement: 'top',
        onBefore: ensureTaskModalOpen
      },
      { el: '#label-input', title: 'Task Title 📝', text: 'Type what you want to do here (e.g., "Math homework" or "Soccer practice").', placement: 'bottom' },
      { el: '#ai-suggest-btn', title: 'Smart Time 🤖⏱️', text: 'Let AI suggest a realistic time based on your task and age.', placement: 'bottom' },
      { el: '#start_time', title: 'Start Time ⏰', text: 'Pick when you want to start. Uses a friendly date/time picker.', placement: 'bottom' },
      { el: '#end_time', title: 'End Time 🏁', text: 'Pick when you want to finish. The duration can be set by AI or by you.', placement: 'bottom' },
      { el: '#addButton', title: 'Add to Schedule 📅', text: 'Click to add this task to your schedule for the selected day.', placement: 'bottom' },
      { el: 'label[for="save_task"]', title: 'Save as Favorite ⭐', text: 'Star this to save the task so you can add it quickly next time.', placement: 'bottom' },
      { el: '#completion-button', title: 'Complete Task ✅', text: 'When you finish, hit Complete to earn XP. AI helps score your effort fairly.', placement: 'top' },
      {
        el: '#sideMenu a[href="/reward"]',
        title: 'Achievements 🏆',
        text: 'Visit Achievements to see rewards and progress. Keep the streak going!',
        placement: 'right',
        onAfter: ensureTaskModalClosed
      }
    ];
    return steps;
  }

  async function ensureTaskModalOpen() {
    const modal = document.getElementById('myModal');
    if (!modal) return;

    // If your app uses a custom modal, we trigger the open button.
    const btn = document.getElementById('openModalBtn');
    if (btn) btn.click();

    // Wait a short moment for DOM changes
    await waitFor(() => isModalVisible(modal), 600);
  }

  function ensureTaskModalClosed() {
    const modal = document.getElementById('myModal');
    if (!modal) return;
    // Try to close using the close icon
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) closeBtn.click();
  }

  function isModalVisible(el) {
    const style = window.getComputedStyle(el);
    const display = style.display !== 'none';
    const visible = el.offsetParent !== null || display;
    return visible;
  }

  function waitFor(cond, timeout = 800) {
    return new Promise(resolve => {
      const start = Date.now();
      const t = setInterval(() => {
        if (cond()) {
          clearInterval(t);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(t);
          resolve(false);
        }
      }, 50);
    });
  }

  function startTutorial(opts = {}) {
    if (state.isActive) return;

    state.steps = buildSteps();
    state.stepIndex = 0;
    state.isActive = true;

    createOverlay();
    createTooltip();
    showStep(0);

    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
  }

  function endTutorial({ markCompleted = true } = {}) {
    if (!state.isActive) return;

    // Remove highlight classes from any current target
    if (state.currentTarget && state.currentTarget.classList) {
      state.currentTarget.classList.remove('tour-pop', 'tour-pop-anim');
    }

    // Hide highlight
    if (state.highlight) {
      state.highlight.remove();
      state.highlight = null;
    }

    if (state.overlay) state.overlay.remove();
    if (state.tooltip) state.tooltip.remove();

    state.isActive = false;
    state.overlay = null;
    state.tooltip = null;
    state.currentTarget = null;

    document.removeEventListener('keydown', onKeyDown);

    if (markCompleted) {
      try { localStorage.setItem(LS_KEY_COMPLETED, '1'); } catch (_) {}
      // Small celebration toast
      const toast = document.createElement('div');
      toast.className = 'tour-celebrate';
      toast.textContent = '🎉 Tour complete! You\'re ready to roll.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2400);
    }
  }

  function onKeyDown(e) {
    if (!state.isActive) return;
    if (e.key === 'Escape') return endTutorial({ markCompleted: false });
    if (e.key === 'Enter' || e.key === 'ArrowRight') return nextStep();
    if (e.key === 'ArrowLeft') return prevStep();
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);
    state.overlay = overlay;

    // Floating highlight ring that does not affect layout
    const highlight = document.createElement('div');
    highlight.className = 'tour-highlight';
    highlight.style.display = 'none';
    document.body.appendChild(highlight);
    state.highlight = highlight;
  }

  // Position the floating spotlight ring over the target without changing layout
  function positionHighlight(target) {
    if (!state.highlight || !target) return;
    const pad = 8;
    const rect = target.getBoundingClientRect();
    const top = Math.round(rect.top + window.scrollY - pad);
    const left = Math.round(rect.left + window.scrollX - pad);
    const width = Math.round(rect.width + pad * 2);
    const height = Math.round(rect.height + pad * 2);

    state.highlight.style.display = 'block';
    state.highlight.style.top = top + 'px';
    state.highlight.style.left = left + 'px';
    state.highlight.style.width = width + 'px';
    state.highlight.style.height = height + 'px';

    // Try to mirror element border radius for a nicer fit
    const br = window.getComputedStyle(target).borderRadius;
    state.highlight.style.borderRadius = br && br !== '0px' ? br : '10px';
  }


  function createTooltip() {
    const tip = document.createElement('div');
    tip.className = 'tour-tooltip arrow-bottom';
    tip.setAttribute('role', 'dialog');
    tip.innerHTML = `
      <h3></h3>
      <p></p>
      <div class="tour-buttons">
        <span class="tour-progress"></span>
        <div class="tour-nav">
          <button class="tour-prev">Back</button>
          <button class="tour-next">Next</button>
          <button class="tour-skip">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(tip);

    tip.querySelector('.tour-prev').addEventListener('click', prevStep);
    tip.querySelector('.tour-next').addEventListener('click', nextStep);
    tip.querySelector('.tour-skip').addEventListener('click', () => endTutorial({ markCompleted: false }));

    state.tooltip = tip;
  }


  function prevStep() {
    if (state.stepIndex <= 0) return;
    showStep(state.stepIndex - 1);
  }

  function nextStep() {
    if (state.stepIndex >= state.steps.length - 1) {
      return endTutorial({ markCompleted: true });
    }
    showStep(state.stepIndex + 1);
  }

  async function showStep(index) {
    const prev = state.steps[state.stepIndex];
    // Optional: call onAfter for previous step
    if (prev && typeof prev.onAfter === 'function') {
      try { prev.onAfter(); } catch (e) { console.warn('tour onAfter error', e); }
    }

    state.stepIndex = index;
    const step = state.steps[index];

    // Optional: call onBefore for this step (e.g., open modal)
    if (step && typeof step.onBefore === 'function') {
      try { await step.onBefore(); } catch (e) { console.warn('tour onBefore error', e); }
    }

    const target = step?.el ? document.querySelector(step.el) : null;
    elevate(target, true);

    // Update tooltip content
    const tip = state.tooltip;
    tip.querySelector('h3').textContent = step.title || '';
    tip.querySelector('p').innerHTML = step.text || '';
    tip.querySelector('.tour-progress').textContent = `${index + 1} / ${state.steps.length}`;

    // Position near target
    positionTooltip(target, step.placement || 'bottom');

    // Focus for accessibility
    tip.setAttribute('tabindex', '-1');
    tip.focus();

    // Reposition on resize/scroll
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
  }

  function onReposition() {
    if (!state.isActive) return;
    const step = state.steps[state.stepIndex];
    if (!step) return;
    const target = step.el ? document.querySelector(step.el) : null;
    if (target) positionHighlight(target);
    positionTooltip(target, step.placement || 'bottom');
  }

  function positionTooltip(target, placement) {
    const tip = state.tooltip;

    // Reset arrow class
    tip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');

    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = vh / 2 - tip.offsetHeight / 2;
    let left = vw / 2 - tip.offsetWidth / 2;

    if (target) {
      // no auto scroll; keep element position while highlighted
      const rect = target.getBoundingClientRect();
      switch (placement) {
        case 'top':
          top = Math.max(8, rect.top - tip.offsetHeight - margin);
          left = Math.min(vw - tip.offsetWidth - 8, Math.max(8, rect.left + rect.width / 2 - tip.offsetWidth / 2));
          tip.classList.add('arrow-bottom');
          break;
        case 'left':
          top = Math.min(vh - tip.offsetHeight - 8, Math.max(8, rect.top + rect.height / 2 - tip.offsetHeight / 2));
          left = Math.max(8, rect.left - tip.offsetWidth - margin);
          tip.classList.add('arrow-right');
          break;
        case 'right':
          top = Math.min(vh - tip.offsetHeight - 8, Math.max(8, rect.top + rect.height / 2 - tip.offsetHeight / 2));
          left = Math.min(vw - tip.offsetWidth - 8, rect.right + margin);
          tip.classList.add('arrow-left');
          break;
        case 'bottom':
        default:
          top = Math.min(vh - tip.offsetHeight - 8, rect.bottom + margin);
          left = Math.min(vw - tip.offsetWidth - 8, Math.max(8, rect.left + rect.width / 2 - tip.offsetWidth / 2));
          tip.classList.add('arrow-top');
          break;
      }
    }

    tip.style.top = `${Math.round(top + window.scrollY)}px`;
    tip.style.left = `${Math.round(left + window.scrollX)}px`;
  }

  function elevate(target, enable) {
    // Remove classes from previous
    if (state.currentTarget && state.currentTarget.classList) {
      state.currentTarget.classList.remove('tour-pop', 'tour-pop-anim');
    }

    state.currentTarget = target || null;

    if (target && enable) {
      target.classList.add('tour-pop');
      // Retrigger the pop animation
      target.classList.remove('tour-pop-anim');
      void target.offsetWidth; // force reflow
      target.classList.add('tour-pop-anim');
      positionHighlight(target);
    } else if (state.highlight) {
      state.highlight.style.display = 'none';
    }
  }
})();

