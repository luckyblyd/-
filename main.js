document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('mahjongBoard');
    
    const maxItems = 5;
    const activeSlots = [null, null, null, null, null];

    function updateLayout() {
        const hasActive = activeSlots.some(s => s !== null && s !== 'loading');
        if (hasActive) {
            document.body.classList.add('playing');
        } else {
            document.body.classList.remove('playing');
        }
    }

    // Cache object to store loaded Blobs and prevent massive data usage
    const assetCache = {};

    async function loadAsset(index) {
        if (assetCache[index]) {
            return assetCache[index] === 'failed' ? null : assetCache[index];
        }

        // If local file directly opened (file:///)
        if (window.location.protocol === 'file:') {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    assetCache[index] = { local: true, index };
                    resolve(assetCache[index]);
                };
                img.onerror = () => {
                    assetCache[index] = 'failed';
                    resolve(null);
                };
                img.src = `assets/${index}.gif`;
            });
        }

        // If hosted on GitHub Pages or local server (http/https)
        try {
            const gifResp = await fetch(`assets/${index}.gif`);
            if (!gifResp.ok) throw new Error('GIF loads failed');
            
            // Fetch entirely into memory ONCE
            const gifBlob = await gifResp.blob();
            
            assetCache[index] = {
                local: false,
                gifBlob: gifBlob,
                wavSrc: `assets/${index}.wav` // Audio caches perfectly by standard HTML5
            };
            return assetCache[index];
        } catch (err) {
            assetCache[index] = 'failed';
            return null;
        }
    }

    async function handlePlayInteraction(index, keyElement) {
        const slotIndex = activeSlots.indexOf(null);
        if (slotIndex === -1) return;

        // Visual feedback immediately
        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => keyElement.classList.remove('active'), 200);
        }

        // Lock slot so rapid clicks don't race for the exact same block
        activeSlots[slotIndex] = 'loading';

        const asset = await loadAsset(index);
        
        // If slot was overridden somehow or asset doesn't exist
        if (activeSlots[slotIndex] !== 'loading') return;
        if (!asset) {
            activeSlots[slotIndex] = null;
            updateLayout();
            return;
        }

        spawnKuso(asset, slotIndex);
    }

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

    const pianoKeys = document.querySelectorAll('.piano li');
    pianoKeys.forEach(keyEl => {
        keyEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const index = parseInt(keyEl.getAttribute('data-note'), 10);
            handlePlayInteraction(index, keyEl);
        });
    });

    function spawnKuso(asset, slotIndex) {
        let gifUrl, wavUrl;
        
        if (asset.local) {
            // Local fallback: use time-stamp (zero network overhead locally)
            gifUrl = `assets/${asset.index}.gif?t=${new Date().getTime()}`;
            wavUrl = `assets/${asset.index}.wav`;
        } else {
            // Web environment: generate a unique URL for the Blob.
            // This forces the browser to restart the GIF from frame 0 instantly!
            gifUrl = URL.createObjectURL(asset.gifBlob);
            wavUrl = asset.wavSrc;
        }

        const itemContainer = document.createElement('div');
        itemContainer.className = `kuso-item slot-${slotIndex}`;
        
        const img = new Image();
        img.src = gifUrl;
        itemContainer.appendChild(img);
        
        const audio = new Audio();
        audio.src = wavUrl;
        audio.volume = 0.8;
        itemContainer.appendChild(audio);
        
        activeSlots[slotIndex] = itemContainer;
        board.appendChild(itemContainer);
        updateLayout();
        
        requestAnimationFrame(() => {
            itemContainer.classList.add('active');
        });

        audio.play().catch(err => {
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
                            
                            // Prevent major memory leaks by destroying the local URL!
                            if (!asset.local) {
                                URL.revokeObjectURL(gifUrl);
                            }
                        }
                    }, 400); // Wait for css transition to finish
                }
            }, delay);
        };

        audio.addEventListener('ended', () => cleanup(0));
        audio.addEventListener('error', () => cleanup(0));
        img.onerror = () => cleanup(0);
    }
});
