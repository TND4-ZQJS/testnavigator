/**
 * Cipro.my Dashboard - Desktop Calendar Animation Timer
 */
document.addEventListener("DOMContentLoaded", function() {
    // Set your target convention trip closing date here (YYYY-MM-DDTHH:MM:SS)
    const TARGET_DATE = new Date("2026-12-31T23:59:59").getTime();

    // Elements holding values
    const elements = {
        days: document.getElementById("days-card"),
        hours: document.getElementById("hours-card"),
        mins: document.getElementById("mins-card"),
        secs: document.getElementById("secs-card")
    };

    // Tracker variable to avoid redundant animation triggers
    let currentValues = { days: "", hours: "", mins: "", secs: "" };

    function updateCardValue(container, newValue) {
        if (!container) return;
        
        const topHalf = container.querySelector(".flip-card-top");
        const bottomHalf = container.querySelector(".flip-card-bottom");
        
        // Strip current animations 
        container.classList.remove("flip-animate");
        
        // Force layout reflow execution to reset DOM animations safely
        void container.offsetWidth; 
        
        // Inject numbers into both planes and animate
        topHalf.textContent = newValue;
        bottomHalf.textContent = newValue;
        container.classList.add("flip-animate");
    }

    function updateTimer() {
        const now = new Date().getTime();
        const difference = TARGET_DATE - now;

        if (difference <= 0) {
            updateCardValue(elements.days, "00");
            updateCardValue(elements.hours, "00");
            updateCardValue(elements.mins, "00");
            updateCardValue(elements.secs, "00");
            clearInterval(timerInterval);
            return;
        }

        // Time calculations
        const d = String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, '0');
        const h = String(Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        const m = String(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const s = String(Math.floor((difference % (1000 * 60)) / 1000)).padStart(2, '0');

        // Fire physical flipping transition safely only when individual metrics change
        if (d !== currentValues.days) { updateCardValue(elements.days, d); currentValues.days = d; }
        if (h !== currentValues.hours) { updateCardValue(elements.hours, h); currentValues.hours = h; }
        if (m !== currentValues.mins) { updateCardValue(elements.mins, m); currentValues.mins = m; }
        if (s !== currentValues.secs) { updateCardValue(elements.secs, s); currentValues.secs = s; }
    }

    // Initialize timer runtime loop
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
});
