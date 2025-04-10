document.addEventListener('DOMContentLoaded', () => {
    const slidesContainer = document.querySelector('.slides-container');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.dots-container');
    const sliderNavigation = document.getElementById('sliderNavigation');

    // === Elementos del Modal de Video ===
    const videoModal = document.getElementById('videoModal');
    const closeVideoModalBtn = document.getElementById('closeVideoModal');
    const localVideoPlayer = document.getElementById('localVideoPlayer'); // Referencia a <video>
    const videoTriggerButtons = document.querySelectorAll('.video-trigger');
    // ====================================

    let currentIndex = 0;
    let isAnimating = false;
    const totalSlides = slides.length;
    let dots = [];

    // --- Basic Checks ---
    if (!slidesContainer || !prevBtn || !nextBtn || !dotsContainer || totalSlides === 0) {
        console.error("Error: Slider components not found. Aborting script.");
        if (sliderNavigation) sliderNavigation.style.display = 'none';
        return;
    }
    if (!videoModal || !closeVideoModalBtn || !localVideoPlayer) {
        console.warn("Warning: Video modal components (or video player) not found. Video functionality disabled.");
    }

    // --- Core Functions (Slider) ---
    function createDots() {
        dotsContainer.innerHTML = '';
        if (totalSlides <= 1) {
             dotsContainer.style.display = 'none';
             if(prevBtn) prevBtn.classList.add('hidden');
             if(nextBtn) nextBtn.classList.add('hidden');
            return;
        }
        const slideCount = slides.length;
        console.log("Total slides detected:", slideCount);

        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        }
        dots = Array.from(dotsContainer.querySelectorAll('.dot'));
         if (dots.length > 0) dotsContainer.style.display = 'flex';
     }

    function goToSlide(index) {
        const slideCount = slides.length;
        if (index < 0 || index >= slideCount || isAnimating || index === currentIndex) {
            return;
        }

        isAnimating = true;
        const currentSlide = slides[currentIndex];
        const nextSlide = slides[index];
        const offset = -index * (100 / slideCount);
        slidesContainer.style.transform = `translateX(${offset}%)`;

        const transitionDurationCSS = getComputedStyle(slidesContainer).transitionDuration;
        const transitionDuration = transitionDurationCSS ? parseFloat(transitionDurationCSS) * 1000 : 600;
        const animationFallbackTimeout = transitionDuration + 100;

        let transitionEndFired = false;
        const transitionEndHandler = (event) => {
            if (event.target !== slidesContainer || event.propertyName !== 'transform') return;
            if (transitionEndFired) return;
            transitionEndFired = true;
            slidesContainer.removeEventListener('transitionend', transitionEndHandler);

            if (currentSlide) currentSlide.classList.remove('active');
            if (nextSlide) nextSlide.classList.add('active');
            updateDots(index);
            updateButtonVisibility(index);

            currentIndex = index;
            isAnimating = false;
        };
        slidesContainer.addEventListener('transitionend', transitionEndHandler);

        setTimeout(() => {
            if (!transitionEndFired && isAnimating) {
                console.warn("Slider transition fallback triggered for index:", index);
                slidesContainer.removeEventListener('transitionend', transitionEndHandler);

                if (currentSlide) currentSlide.classList.remove('active');
                if (nextSlide) nextSlide.classList.add('active');
                updateDots(index);
                updateButtonVisibility(index);

                currentIndex = index;
                isAnimating = false;
            }
        }, animationFallbackTimeout);
    }

    function updateDots(activeIndex) {
        if (!dots || dots.length === 0) return;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
            dot.setAttribute('aria-current', i === activeIndex ? 'step' : 'false');
        });
    }

    function updateButtonVisibility(activeIndex) {
        const slideCount = slides.length;
        if (!prevBtn || !nextBtn) return;
        const isFirst = activeIndex === 0;
        const isLast = activeIndex === slideCount - 1;

        prevBtn.classList.toggle('hidden', isFirst);
        prevBtn.disabled = isFirst;

        nextBtn.classList.toggle('hidden', isLast);
        nextBtn.disabled = isLast;
    }

    // --- Funciones del Modal de Video (para MP4 Local) ---
    function openVideoModal(videoSrc) {
        if (!videoModal || !localVideoPlayer) {
            console.error("Modal or video player element not found.");
            return;
        }
        localVideoPlayer.src = videoSrc;
        localVideoPlayer.load(); // Carga la fuente
        localVideoPlayer.play().catch(error => {
            console.log("Video autoplay prevented:", error);
            // Los controles del navegador permitirán al usuario iniciar
        });
        videoModal.classList.add('show');
    }

    function closeVideoModal() {
        if (!videoModal || !localVideoPlayer) return;
        localVideoPlayer.pause(); // Pausa la reproducción
        localVideoPlayer.removeAttribute('src'); // Elimina la fuente
        localVideoPlayer.load(); // Resetea el estado del player
        videoModal.classList.remove('show');
    }

    // --- Event Listeners ---
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    dotsContainer.addEventListener('click', (e) => {
        const targetDot = e.target.closest('.dot');
        if (targetDot) {
            const index = parseInt(targetDot.dataset.index, 10);
            if (!isNaN(index)) {
                goToSlide(index);
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (isAnimating) return;
         // Cerrar modal con Escape y bloquear flechas del slider
         if (videoModal && videoModal.classList.contains('show')) {
            if (e.key === 'Escape') {
                closeVideoModal();
            }
            return;
         }

        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'BUTTON' ||
            activeEl.isContentEditable
        );
         const isNavFocused = sliderNavigation && sliderNavigation.contains(activeEl);

        if (!isInputFocused || isNavFocused) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToSlide(currentIndex + 1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToSlide(currentIndex - 1);
            }
        }
    });

    // === Event Listeners para el Modal (para MP4 Local) ===
    if (videoTriggerButtons.length > 0 && videoModal) {
        videoTriggerButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Leer data-video-src
                const videoSrc = button.dataset.videoSrc;
                // Verificar si la ruta es válida (no placeholder)
                if (videoSrc && !videoSrc.includes('tu_video_')) { // Ajusta 'tu_video_' si usaste otro placeholder
                    openVideoModal(videoSrc);
                } else {
                    console.warn('Local video source path missing or placeholder used for button:', button);
                    alert('Por favor, configura la ruta correcta al archivo MP4 en el HTML (data-video-src).');
                }
            });
        });
    }

    if (closeVideoModalBtn && videoModal) {
        closeVideoModalBtn.addEventListener('click', closeVideoModal);
    }

    if (videoModal) {
        // Cerrar modal al hacer clic fuera del contenido
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }
    // =====================================

    // --- Initialization ---
    createDots();
    if (slides.length > 0) {
        if (!slides[0].classList.contains('active')) {
             slides.forEach(s => s.classList.remove('active'));
             slides[0].classList.add('active');
        }
        updateDots(0);
        updateButtonVisibility(0);
    } else {
        if(sliderNavigation) sliderNavigation.style.display = 'none';
    }
});