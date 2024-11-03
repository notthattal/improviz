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

document.addEventListener('DOMContentLoaded', () => {
    initializePanel();
    renderCards();
    initializeMobileHandlers();

    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            resetPanelState();
        }
    });
});

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

        toggleButton.style.transform = isPanelOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
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
    });

    return card;
}

function updateMainPanel(topic) {
    const mainTitle = document.getElementById('mainTitle');
    mainTitle.textContent = topic.title;
}
