document.addEventListener('DOMContentLoaded', () => {
    // Get modal and close button elements
    const modal = document.getElementById('quote-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const quoteText = document.getElementById('quote-text');

    // Set the quote of the day
    const quoteOfTheDay = "The only way to do great work is to love what you do. - Steve Jobs";

    // Function to open the modal
    function openQOTDModal() {
        quoteText.textContent = quoteOfTheDay; // Add the quote
        modal.classList.remove('hidden'); // Show modal
    }

    // Function to close the modal
    function closeQOTDModal() {
        modal.classList.add('hidden'); // Hide modal
    }

    // Open modal on page load
    openQOTDModal();

    // Close modal when close button is clicked
    closeModalBtn.addEventListener('click', closeQOTDModal);

    // Close modal when clicking outside the content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeQOTDModal();
    });
});
