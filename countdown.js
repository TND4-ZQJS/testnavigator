/**
 * Cipro.my Dashboard - Clean Apple Metric Counter
 */
document.addEventListener("DOMContentLoaded", function() {
    // Target convention deadline date setup
    const TARGET_DATE = new Date("2026-12-31T23:59:59").getTime();

    // DOM Target Nodes
    const dVal = document.getElementById("days-val");
    const hVal = document.getElementById("hours-val");
    const mVal = document.getElementById("mins-val");
    const sVal = document.getElementById("secs-val");

    function updateTimer() {
        const now = new Date().getTime();
        const difference = TARGET_DATE - now;

        if (difference <= 0) {
            if (dVal) dVal.textContent = "00";
            if (hVal) hVal.textContent = "00";
            if (mVal) mVal.textContent = "00";
            if (sVal) sVal.textContent = "00";
            clearInterval(timerInterval);
            return;
        }

        // Time processing calculations
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // String value conversions using standard pad structures
        if (dVal) dVal.textContent = String(days).padStart(2, '0');
        if (hVal) hVal.textContent = String(hours).padStart(2, '0');
        if (mVal) mVal.textContent = String(minutes).padStart(2, '0');
        if (sVal) sVal.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
});
