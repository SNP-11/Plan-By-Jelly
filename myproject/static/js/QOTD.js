document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const modal = document.getElementById('quote-modal');
    const openModalBtn = document.getElementById('open-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const quoteText = document.getElementById('quote-text');

    // Set the quote of the day
    const quoteOfTheDay = "The only way to do great work is to love what you do. - Steve Jobs";

    // Function to open the modal
    function openModal() {
        quoteText.textContent = quoteOfTheDay; // Add the quote to the modal
        modal.classList.remove('hidden'); // Show the modal
        openModalBtn.classList.remove('hidden')
    }

    // Function to close the modal
    function closeModal() {
        modal.classList.add('hidden'); // Hide the modal
    }

    // Open the modal on page load
    openModal();

    // Event listeners
    openModalBtn.addEventListener('click', openModal); // Open modal on button click
    closeModalBtn.addEventListener('click', closeModal); // Close modal on button click

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
});
