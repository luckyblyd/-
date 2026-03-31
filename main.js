document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('mahjongBoard');
    
    const maxItems = 5;
    const activeSlots = [null, null, null, null, null];

    function updateLayout() {
        // Find if there is any active or loading video
        const hasActive = activeSlots.some(s => s !== null && s !== 'loading');
        if (hasActive) {
            document.body.classList.add('playing');
        } else {
            document.body.classList.remove('playing');
        }
    }

    function handlePlayInteraction(index, keyElement) {
        // Find an empty slot FIRST
        const slotIndex = activeSlots.indexOf(null);
        if (slotIndex === -1) {
            return;
        }

        // Add visual feedback to key manually (important for mobile)
        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => keyElement.classList.remove('active'), 200);
        }

        spawnKuso(index, slotIndex);
    }

    // Key event listener for standard keys
    const keyMap = {
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
        '6': 6, '7': 7, '8': 8, '9': 9, '0': 10,
        '-': 11, '=': 12,
        'q': 1, 'w': 2, 'e': 3, 'r': 4, 't': 5,
        'y': 6, 'u': 7, 'i': 8, 'o': 9, 'p': 10
    };

    document.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const key = e.key.toLowerCase();
        
        if (keyMap.hasOwnProperty(key)) {
            const index = keyMap[key];
            const keyEl = document.querySelector(`.piano li[data-note="${index}"]`);
            handlePlayInteraction(index, keyEl);
        }
    });

    // Piano key clicks (mouse & touch)
    const pianoKeys = document.querySelectorAll('.piano li');
    pianoKeys.forEach(keyEl => {
        keyEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const index = parseInt(keyEl.getAttribute('data-note'), 10);
            handlePlayInteraction(index, keyEl);
        });
    });

    function spawnKuso(index, slotIndex) {
        // Reserve the slot immediately so rapid taps don't double-book
        activeSlots[slotIndex] = 'loading';
        
        const cacheBuster = new Date().getTime();
        const gifSrc = `assets/${index}.gif?t=${cacheBuster}`;
        const wavSrc = `assets/${index}.wav`;

        // Load the image first to check if it exists (silent fail)
        const img = new Image();
        
        img.onload = () => {
            // Check if slot was somehow cleared while loading
            if (activeSlots[slotIndex] !== 'loading') return;

            const itemContainer = document.createElement('div');
            itemContainer.className = `kuso-item slot-${slotIndex}`;
            
            itemContainer.appendChild(img);
            
            const audio = document.createElement('audio');
            audio.src = wavSrc;
            audio.volume = 0.8; 
            
            itemContainer.appendChild(audio);
            
            // Re-claim the slot officially
            activeSlots[slotIndex] = itemContainer;
            board.appendChild(itemContainer);
            updateLayout();
            
            requestAnimationFrame(() => {
                itemContainer.classList.add('active');
            });

            audio.play().catch(err => {
                // Ignore autoplay policy errors silently
                cleanup(0);
            });

            const cleanup = (delay = 0) => {
                setTimeout(() => {
                    if (board.contains(itemContainer)) {
                        itemContainer.classList.remove('active');
                        setTimeout(() => {
                            if (board.contains(itemContainer)) {
                                board.removeChild(itemContainer);
                                activeSlots[slotIndex] = null;
                                updateLayout();
                            }
                        }, 400); // match css transition
                    }
                }, delay);
            };

            audio.addEventListener('ended', () => {
                cleanup(0);
            });
            
            audio.addEventListener('error', () => {
                cleanup(0);
            });
        };

        img.onerror = () => {
            // Silently fail: asset probably doesn't exist or isn't extracted yet
            if (activeSlots[slotIndex] === 'loading') {
                activeSlots[slotIndex] = null;
                updateLayout();
            }
        };

        img.src = gifSrc;
    }
});
