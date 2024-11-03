const lectureTopics = [
    {
        id: 1,
        title: "Linear Regression",
        description: "Fundamental concepts of linear regression and its applications",
        date: "2024-03-15"
    },
    {
        id: 2,
        title: "Decision Trees",
        description: "Understanding decision trees and their implementation",
        date: "2024-03-16"
    },
    {
        id: 3,
        title: "Neural Networks",
        description: "Introduction to neural networks and deep learning",
        date: "2024-03-17"
    },
    {
        id: 4,
        title: "Support Vector Machines",
        description: "SVM algorithms and kernel methods",
        date: "2024-03-18"
    }
];

let isPanelOpen = true;
let selectedTopicId = null;
let isMobile = window.innerWidth <= 768;
let currentCardIndex = 0;
let transcriptChunks = [];

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    initializePanel();
    renderCards();
    initializeCardNavigation();
    initializeMobileHandlers();
    initializeTranscriptPanel();
    adjustMainContentWidth();

    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            resetPanelState();
        }
        adjustMainContentWidth();
    });
});

function adjustMainContentWidth() {
    const mainContent = document.querySelector('.main-content');
    const leftPanel = document.getElementById('leftPanel');

    if (!isMobile) {
        const leftPanelWidth = isPanelOpen ? '300px' : '64px';
        mainContent.style.marginLeft = leftPanelWidth;
        mainContent.style.width = `calc(100% - ${leftPanelWidth} - 20%)`; // 20% for transcript panel
    } else {
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
    }
}

function initializePanel() {
    const toggleButton = document.getElementById('togglePanel');
    const leftPanel = document.getElementById('leftPanel');
    const panelContent = document.querySelectorAll('.panel-content');

    toggleButton.addEventListener('click', () => {
        isPanelOpen = !isPanelOpen;

        if (isMobile) {
            leftPanel.style.transform = isPanelOpen ?
                'translateY(0)' :
                'translateY(calc(100% - 64px))';
        } else {
            if (!isPanelOpen) {
                leftPanel.classList.add('panel-collapsed');
                panelContent.forEach(element => {
                    element.style.display = 'none';
                });
            } else {
                leftPanel.classList.remove('panel-collapsed');
                setTimeout(() => {
                    panelContent.forEach(element => {
                        element.style.display = 'block';
                    });
                }, 150);
            }
        }

        adjustMainContentWidth();
        toggleButton.style.transform = isPanelOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
}

function initializeCardNavigation() {
    const leftArrow = document.querySelector('.right-arrow');
    const rightArrow = document.querySelector('.left-arrow');

    leftArrow.addEventListener('click', () => navigateCards('next')); // Reversed
    rightArrow.addEventListener('click', () => navigateCards('prev')); // Reversed

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') navigateCards('next'); // Reversed
        if (e.key === 'ArrowRight') navigateCards('prev'); // Reversed
    });
}

function navigateCards(direction) {
    const cards = document.querySelectorAll('.visualization-card');
    if (cards.length === 0) return;

    // Reverse navigation direction to make newer cards accessible with right arrow
    if (direction === 'prev' && currentCardIndex < cards.length - 1) {
        currentCardIndex++;
    } else if (direction === 'next' && currentCardIndex > 0) {
        currentCardIndex--;
    }

    updateCardPositions();
    updateNavigationArrows();
}

function updateCardPositions() {
    const cards = document.querySelectorAll('.visualization-card');
    const totalCards = cards.length;

    cards.forEach((card, index) => {
        card.classList.remove('active', 'prev', 'next', 'hidden');

        if (index === currentCardIndex) {
            card.classList.add('active');
        } else if (index === currentCardIndex - 1) {
            card.classList.add('next'); // Reversed
        } else if (index === currentCardIndex + 1) {
            card.classList.add('prev'); // Reversed
        } else {
            card.classList.add('hidden');
        }
    });

    updateNavigationArrows();
}

function updateNavigationArrows() {
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    const cards = document.querySelectorAll('.visualization-card');

    if (leftArrow && rightArrow) {
        leftArrow.style.opacity = currentCardIndex > 0 ? '1' : '0.5';
        rightArrow.style.opacity = currentCardIndex < cards.length - 1 ? '1' : '0.5';
    }
}

function initializeMobileHandlers() {
    const panel = document.getElementById('leftPanel');
    const handle = document.querySelector('.drawer-handle');
    let startY = 0;
    let currentTranslate = 0;

    if (handle) {
        handle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            currentTranslate = panel.getBoundingClientRect().top;
        });

        handle.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - startY;
            const newTranslate = Math.max(0, Math.min(deltaY + currentTranslate, window.innerHeight - 64));
            panel.style.transform = `translateY(${newTranslate}px)`;
        });

        handle.addEventListener('touchend', () => {
            const currentPosition = panel.getBoundingClientRect().top;
            const threshold = window.innerHeight * 0.25;

            if (currentPosition > threshold) {
                panel.style.transform = 'translateY(calc(100% - 64px))';
                isPanelOpen = false;
            } else {
                panel.style.transform = 'translateY(0)';
                isPanelOpen = true;
            }
        });
    }
}

function initializeTranscriptPanel() {
    const transcriptPanel = document.querySelector('.transcript-panel');
    if (transcriptPanel) {
        transcriptPanel.scrollTop = transcriptPanel.scrollHeight;
    }
}

function resetPanelState() {
    const leftPanel = document.getElementById('leftPanel');
    const panelContent = document.querySelectorAll('.panel-content');

    if (isMobile) {
        leftPanel.style.transform = 'translateY(calc(100% - 64px))';
        isPanelOpen = false;
    } else {
        leftPanel.style.transform = '';
        leftPanel.style.width = isPanelOpen ? '300px' : '64px';
        panelContent.forEach(element => {
            element.style.display = isPanelOpen ? 'block' : 'none';
        });
    }
    adjustMainContentWidth();
}

function renderCards() {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = '';

    lectureTopics.forEach(topic => {
        const card = createTopicCard(topic);
        cardContainer.appendChild(card);
    });
}

function createTopicCard(topic) {
    const card = document.createElement('div');
    card.className = `card p-4 rounded-lg shadow cursor-pointer 
                     ${selectedTopicId === topic.id ? 'selected' : ''}`;

    card.innerHTML = `
        <h3 class="font-bold text-lg mb-2 text-primary">${topic.title}</h3>
        <p class="text-gray-600 text-sm mb-2">${topic.description}</p>
        <p class="text-secondary text-xs">${new Date(topic.date).toLocaleDateString()}</p>
    `;

    card.addEventListener('click', () => {
        selectedTopicId = topic.id;
        updateMainPanel(topic);

        document.querySelectorAll('.card').forEach(c =>
            c.classList.remove('selected'));
        card.classList.add('selected');

        if (isMobile) {
            isPanelOpen = false;
            const leftPanel = document.getElementById('leftPanel');
            leftPanel.style.transform = 'translateY(calc(100% - 64px))';
        }
    });

    return card;
}

function updateMainPanel(topic) {
    const mainTitle = document.getElementById('mainTitle');
    mainTitle.textContent = topic.title;
}

// Export functions for use in app.js
window.addTranscriptChunk = function(text, status = 'current') {
    const transcriptContainer = document.getElementById('transcript');
    const chunk = document.createElement('div');
    chunk.className = `transcript-chunk transcript-${status}`;
    chunk.textContent = text;

    // Update previous chunks' status
    const existingChunks = transcriptContainer.children;
    if (existingChunks.length > 0) {
        existingChunks[existingChunks.length - 1].className =
            'transcript-chunk transcript-recent';

        if (existingChunks.length > 1) {
            existingChunks[existingChunks.length - 2].className =
                'transcript-chunk transcript-processed';
        }
    }

    transcriptContainer.appendChild(chunk);
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
};

window.updateCardPositions = updateCardPositions;