/**
 * Cipro.my Dashboard - Convention Trip Countdown
 * Handles real-time ticking for the target closing window
 */
document.addEventListener("DOMContentLoaded", function() {
    // Set your target convention trip closing date here (YYYY-MM-DDTHH:MM:SS)
    const TARGET_DATE = new Date("2026-12-31T23:59:59").getTime();

    // Cache elements for maximum rendering performance
    const dVal = document.getElementById("days-val");
    const hVal = document.getElementById("hours-val");
    const mVal = document.getElementById("mins-val");
    const sVal = document.getElementById("secs-val");
    const statusDiv = document.getElementById("countdown-status");

    function updateTimer() {
        const now = new Date().getTime();
        const difference = TARGET_DATE - now;

        // If the countdown is over
        if (difference <= 0) {
            if (dVal) dVal.textContent = "00";
            if (hVal) hVal.textContent = "00";
            if (mVal) mVal.textContent = "00";
            if (sVal) sVal.textContent = "00";
            if (statusDiv) statusDiv.style.display = "block";
            clearInterval(timerInterval);
            return;
        }

        // Time Calculations
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Render values padded with leading zeros (e.g., '05' instead of '5')
        if (dVal) dVal.textContent = String(days).padStart(2, '0');
        if (hVal) hVal.textContent = String(hours).padStart(2, '0');
        if (mVal) mVal.textContent = String(minutes).padStart(2, '0');
        if (sVal) sVal.textContent = String(seconds).padStart(2, '0');
    }

    // Run immediately on script execution to prevent a 1-second blank flash
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
});
