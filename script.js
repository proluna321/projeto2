document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const toggleCameraBtn = document.getElementById('toggleCamera');
    const uploadBtn = document.getElementById('uploadBtn');
    const chooseFileBtn = document.getElementById('chooseFile');
    const addTextBtn = document.getElementById('addTextBtn');
    const cameraView = document.getElementById('cameraView');
    const imagePreview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    const placeholder = document.getElementById('placeholder');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const cameraMenu = document.getElementById('cameraMenu');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const switchCameraBtn = document.getElementById('switchCamera');
    const exitCameraBtn = document.getElementById('exitCamera');
    const mediaContainer = document.querySelector('.media-container');
    const filtersContainer = document.getElementById('filtersContainer');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterIntensity = document.getElementById('filterIntensity');
    const textToolbar = document.getElementById('textToolbar');
    const textColor = document.getElementById('textColor');
    const changeFont = document.getElementById('changeFont');
    const changeAlign = document.getElementById('changeAlign');
    const finishText = document.getElementById('finishText');

    // Variáveis globais
    let stream = null;
    let currentImage = null;
    const scriptUrl = "https://script.google.com/macros/s/AKfycbx_QNWJB10INetzQBj9mV3spD8qlhO4xFgsmXE_WGkUVKOkOOut_7hle7QY4aTZnDNv2w/exec";
    let activeTextElement = null;
    const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', 'Impact'];
    let currentFontIndex = 0;
    const alignments = [
        { name: 'center', icon: 'fa-align-center' },
        { name: 'left', icon: 'fa-align-left' },
        { name: 'right', icon: 'fa-align-right' }
    ];
    let currentAlignIndex = 0;
    let currentFilter = 'none';
    let currentFilterIntensity = 100;
    let isCameraActive = false;
    let currentFacingMode = 'environment';
    let textElementsData = []; // Armazena dados normalizados dos textos

    // Função para verificar se é dispositivo móvel
    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod|Touch/.test(navigator.userAgent);
    }

    // Habilitar botão de texto e filtros quando houver imagem
    function checkImageForTextAndFilters() {
        const hasImage = imagePreview.style.display === 'block';
        addTextBtn.disabled = !hasImage;
        filtersContainer.style.display = hasImage ? 'block' : 'none';
    }

    // Observar mudanças na imagem
    const observer = new MutationObserver(checkImageForTextAndFilters);
    observer.observe(imagePreview, { attributes: true, attributeFilter: ['style'] });
    observer.observe(cameraView, { attributes: true, attributeFilter: ['style'] });

    // Ajustar orientação da câmera
    function adjustCameraOrientation() {
        if (!isCameraActive || !isMobileDevice()) return;
        const isLandscape = window.innerWidth > window.innerHeight;
        cameraView.classList.toggle('landscape', isLandscape);
        cameraView.style.objectFit = isLandscape ? 'cover' : 'contain';
        cameraView.style.transform = 'translate(-50%, -50%)';
    }

    // Atualizar posições normalizadas dos textos
    function updateTextPositions() {
        const imgPreviewRect = imagePreview.getBoundingClientRect();
        textElementsData.forEach((data, index) => {
            const textElement = document.querySelectorAll('.draggable-text')[index];
            if (textElement) {
                textElement.style.left = `${data.x * 100}%`;
                textElement.style.top = `${data.y * 100}%`;
            }
        });
    }

    // Evento de mudança de orientação ou redimensionamento
    if (isMobileDevice()) {
        window.addEventListener('orientationchange', () => {
            adjustCameraOrientation();
            updateTextPositions();
        });
        window.addEventListener('resize', () => {
            adjustCameraOrientation();
            updateTextPositions();
        });
    }

    // ========== FUNCIONALIDADES DE TEXTO ==========
    function addTextElement(initialText, xNorm = 0.5, yNorm = 0.5) {
        const textElement = document.createElement('div');
        textElement.className = 'draggable-text text-active';
        textElement.contentEditable = true;
        textElement.textContent = initialText || 'Texto';
        textElement.style.color = textColor.value;
        textElement.style.fontSize = '24px';
        textElement.style.fontFamily = fonts[currentFontIndex];
        textElement.style.textAlign = alignments[currentAlignIndex].name;
        textElement.style.left = `${xNorm * 100}%`;
        textElement.style.top = `${yNorm * 100}%`;
        textElement.style.transform = 'translate(-50%, -50%)';
        textElement.style.whiteSpace = 'pre-wrap';

        // Armazenar dados normalizados
        textElementsData.push({
            x: xNorm,
            y: yNorm,
            text: initialText || 'Texto',
            color: textColor.value,
            fontSize: 24,
            fontFamily: fonts[currentFontIndex],
            textAlign: alignments[currentAlignIndex].name,
            scale: 1,
            rotation: 0
        });

        makeTextManipulable(textElement, textElementsData.length - 1);

        textElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTextElement(textElement, textElementsData.length - 1);
            if (isMobileDevice()) textElement.focus();
        });

        textElement.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            selectTextElement(textElement, textElementsData.length - 1);
            textElement.focus();
        }, { passive: false });

        mediaContainer.appendChild(textElement);
        selectTextElement(textElement, textElementsData.length - 1);
        textElement.focus();
    }

    function selectTextElement(element, index) {
        if (activeTextElement) {
            activeTextElement.classList.remove('text-active');
            activeTextElement.contentEditable = false;
        }
        activeTextElement = element;
        element.classList.add('text-active');
        element.contentEditable = true;
        textToolbar.style.display = 'block';

        const data = textElementsData[index];
        textColor.value = rgbToHex(data.color) || '#000000';
        currentFontIndex = fonts.indexOf(data.fontFamily);
        if (currentFontIndex === -1) currentFontIndex = 0;
        changeFont.textContent = fonts[currentFontIndex];
        currentAlignIndex = alignments.findIndex(align => align.name === data.textAlign);
        if (currentAlignIndex === -1) currentAlignIndex = 0;
        changeAlign.innerHTML = `<i class="fas ${alignments[currentAlignIndex].icon}"></i>`;
    }

    function makeTextManipulable(element, index) {
        let isDragging = false;
        let isPinching = false;
        let initialX = 0;
        let initialY = 0;
        let initialDistance = 0;
        let initialAngle = 0;

        function startManipulation(e) {
            e.preventDefault();
            e.stopPropagation();

            const isMobile = isMobileDevice();
            const data = textElementsData[index];

            if (isMobile && e.type === 'touchstart' && e.touches.length === 2) {
                isPinching = true;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                initialAngle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
                element.classList.add('dragging');
            } else if (e.type === 'touchstart' || e.type === 'mousedown') {
                isDragging = true;
                const event = e.type === 'touchstart' ? e.touches[0] : e;
                const rect = imagePreview.getBoundingClientRect();
                initialX = event.clientX - (data.x * rect.width + rect.left);
                initialY = event.clientY - (data.y * rect.height + rect.top);
                element.classList.add('dragging');
            }

            element.style.userSelect = 'none';
            document.body.style.userSelect = 'none';
            element.style.cursor = isPinching ? 'grabbing' : 'move';
        }

        function manipulate(e) {
            if (!isDragging && !isPinching) return;

            e.preventDefault();
            e.stopPropagation();

            const rect = imagePreview.getBoundingClientRect();
            const data = textElementsData[index];

            if (isPinching && e.type === 'touchmove' && e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                const currentAngle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);

                const scaleFactor = currentDistance / initialDistance;
                data.scale = Math.max(0.5, Math.min(data.scale * scaleFactor, 3));
                const angleDiff = (currentAngle - initialAngle) * (180 / Math.PI);
                data.rotation = (data.rotation + angleDiff) % 360;

                element.style.transform = `translate(-50%, -50%) scale(${data.scale}) rotate(${data.rotation}deg)`;
                initialDistance = currentDistance;
                initialAngle = currentAngle;
            } else if (isDragging) {
                const event = e.type === 'touchmove' ? e.touches[0] : e;
                data.x = (event.clientX - initialX - rect.left) / rect.width;
                data.y = (event.clientY - initialY - rect.top) / rect.height;

                // Limitar dentro da imagem
                data.x = Math.max(0, Math.min(data.x, 1));
                data.y = Math.max(0, Math.min(data.y, 1));

                element.style.left = `${data.x * 100}%`;
                element.style.top = `${data.y * 100}%`;
            }
        }

        function stopManipulation() {
            isDragging = false;
            isPinching = false;
            element.style.userSelect = '';
            document.body.style.userSelect = '';
            element.style.cursor = 'move';
            element.classList.remove('dragging');
        }

        element.addEventListener('mousedown', startManipulation);
        document.addEventListener('mousemove', manipulate);
        document.addEventListener('mouseup', stopManipulation);

        element.addEventListener('touchstart', startManipulation, { passive: false });
        document.addEventListener('touchmove', manipulate, { passive: false });
        document.addEventListener('touchend', stopManipulation);
        document.addEventListener('touchcancel', stopManipulation);

        element.addEventListener('dragstart', (e) => e.preventDefault());
    }

    textColor.addEventListener('input', () => {
        if (activeTextElement) {
            const index = Array.from(document.querySelectorAll('.draggable-text')).indexOf(activeTextElement);
            textElementsData[index].color = textColor.value;
            activeTextElement.style.color = textColor.value;
        }
    });

    changeFont.addEventListener('click', () => {
        currentFontIndex = (currentFontIndex + 1) % fonts.length;
        changeFont.textContent = fonts[currentFontIndex];
        if (activeTextElement) {
            const index = Array.from(document.querySelectorAll('.draggable-text')).indexOf(activeTextElement);
            textElementsData[index].fontFamily = fonts[currentFontIndex];
            activeTextElement.style.fontFamily = fonts[currentFontIndex];
        }
    });

    changeAlign.addEventListener('click', () => {
        currentAlignIndex = (currentAlignIndex + 1) % alignments.length;
        changeAlign.innerHTML = `<i class="fas ${alignments[currentAlignIndex].icon}"></i>`;
        if (activeTextElement) {
            const index = Array.from(document.querySelectorAll('.draggable-text')).indexOf(activeTextElement);
            textElementsData[index].textAlign = alignments[currentAlignIndex].name;
            activeTextElement.style.textAlign = alignments[currentAlignIndex].name;
        }
    });

    finishText.addEventListener('click', () => {
        if (activeTextElement) {
            const index = Array.from(document.querySelectorAll('.draggable-text')).indexOf(activeTextElement);
            textElementsData[index].text = activeTextElement.textContent;
            activeTextElement.classList.remove('text-active');
            activeTextElement.contentEditable = false;
            activeTextElement = null;
            textToolbar.style.display = 'none';
        }
    });

    mediaContainer.addEventListener('click', (e) => {
        if (e.target === mediaContainer) {
            if (activeTextElement) {
                const index = Array.from(document.querySelectorAll('.draggable-text')).indexOf(activeTextElement);
                textElementsData[index].text = activeTextElement.textContent;
                activeTextElement.classList.remove('text-active');
                activeTextElement.contentEditable = false;
                activeTextElement = null;
                textToolbar.style.display = 'none';
            }
        }
    });

    function rgbToHex(rgb) {
        if (!rgb) return '#000000';
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb;
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
    }

    // ========== FUNCIONALIDADES DE CÂMERA E IMAGEM ==========
    toggleCameraBtn.addEventListener('click', async () => {
        if (!isCameraActive) {
            try {
                resetStatus();
                placeholder.style.display = 'none';
                imagePreview.style.display = 'none';
                
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: currentFacingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    } 
                });
                
                cameraView.srcObject = stream;
                cameraView.style.display = 'block';
                cameraMenu.style.display = 'block';
                mediaContainer.classList.add('fullscreen');
                uploadBtn.disabled = true;
                addTextBtn.disabled = true;
                
                isCameraActive = true;
                adjustCameraOrientation();
                
                cameraView.onloadedmetadata = () => {
                    cameraView.style.width = '100%';
                    cameraView.style.height = '100%';
                    cameraView.style.maxWidth = '100%';
                    cameraView.style.maxHeight = '100%';
                    adjustCameraOrientation();
                };
                
                showStatus("Câmera ativada. Use os botões para capturar, alternar ou sair.", 'info');
            } catch (err) {
                showError("Erro ao acessar a câmera: " + err.message);
                mediaContainer.classList.remove('fullscreen');
            }
        }
    });

    capturePhotoBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const videoWidth = cameraView.videoWidth;
        const videoHeight = cameraView.videoHeight;
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
        
        cameraView.style.transition = '0.3s';
        cameraView.style.filter = 'brightness(2)';
        setTimeout(() => {
            cameraView.style.filter = 'brightness(1)';
        }, 300);
        
        currentImage = canvas.toDataURL('image/jpeg', 0.9);
        imagePreview.src = currentImage;
        imagePreview.style.display = 'block';
        cameraView.style.display = 'none';
        cameraMenu.style.display = 'none';
        mediaContainer.classList.remove('fullscreen');
        
        const containerRect = mediaContainer.getBoundingClientRect();
        const aspectRatio = videoWidth / videoHeight;
        let newWidth = containerRect.width;
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > containerRect.height) {
            newHeight = containerRect.height;
            newWidth = newHeight * aspectRatio;
        }
        
        imagePreview.style.width = `${newWidth}px`;
        imagePreview.style.height = `${newHeight}px`;
        imagePreview.style.maxWidth = '100%';
        imagePreview.style.maxHeight = '100%';
        imagePreview.style.transform = 'translate(-50%, -50%)';
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        isCameraActive = false;
        uploadBtn.disabled = false;
        addTextBtn.disabled = false;
        
        showStatus("Foto capturada. Clique em 'Enviar para o Drive'.", 'info');
        updateTextPositions();
    });

    switchCameraBtn.addEventListener('click', async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            
            cameraView.srcObject = stream;
            cameraView.style.display = 'block';
            
            cameraView.onloadedmetadata = () => {
                cameraView.style.width = '100%';
                cameraView.style.height = '100%';
                cameraView.style.maxWidth = '100%';
                cameraView.style.maxHeight = '100%';
                adjustCameraOrientation();
            };
            
            showStatus(`Câmera alternada para ${currentFacingMode === 'environment' ? 'traseira' : 'frontal'}.`, 'info');
        } catch (err) {
            showError("Erro ao alternar câmera: " + err.message);
        }
    });

    exitCameraBtn.addEventListener('click', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        cameraView.style.display = 'none';
        cameraMenu.style.display = 'none';
        placeholder.style.display = 'flex';
        mediaContainer.classList.remove('fullscreen');
        isCameraActive = false;
        uploadBtn.disabled = true;
        addTextBtn.disabled = true;
        resetStatus();
    });

    chooseFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                resetStatus();
                placeholder.style.display = 'none';
                currentImage = event.target.result;
                imagePreview.src = currentImage;
                imagePreview.style.display = 'block';
                cameraView.style.display = 'none';
                cameraMenu.style.display = 'none';
                mediaContainer.classList.remove('fullscreen');
                
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                }
                
                uploadBtn.disabled = false;
                addTextBtn.disabled = false;
                
                showStatus("Imagem selecionada. Clique em 'Enviar para o Drive'.", 'info');
                updateTextPositions();
            };
            reader.readAsDataURL(file);
        } else {
            showError("Por favor, selecione um arquivo de imagem válido.");
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });

    function applyFilter() {
        if (!currentImage) return;
        
        const intensity = currentFilterIntensity / 100;
        let filterValue = currentFilter;
        
        if (currentFilter !== 'none') {
            filterValue = currentFilter.replace(/([\d.]+)(%|px|deg)/g, (match, number, unit) => {
                return `${parseFloat(number) * intensity}${unit}`;
            });
        }
        
        imagePreview.style.filter = filterValue;
    }

    filterIntensity.addEventListener('input', () => {
        currentFilterIntensity = filterIntensity.value;
        applyFilter();
    });

    addTextBtn.addEventListener('click', (e) => {
        const existingText = document.querySelector('.draggable-text');
        if (existingText) return;

        const isMobile = isMobileDevice();
        let xNorm = 0.5;
        let yNorm = 0.5;
        
        if (isMobile && e.type === 'touchstart') {
            const touch = e.touches[0];
            const rect = imagePreview.getBoundingClientRect();
            xNorm = (touch.clientX - rect.left) / rect.width;
            yNorm = (touch.clientY - rect.top) / rect.height;
            xNorm = Math.max(0, Math.min(xNorm, 1));
            yNorm = Math.max(0, Math.min(yNorm, 1));
        }
        
        addTextElement('', xNorm, yNorm);
    });

    uploadBtn.addEventListener('click', async () => {
        if (!currentImage) {
            showError("Nenhuma imagem para enviar");
            return;
        }
        
        try {
            uploadBtn.disabled = true;
            showStatus("Enviando imagem...", 'info');
            progressContainer.style.display = 'block';
            
            simulateUploadProgress();
            
            const canvas = document.createElement('canvas');
            const img = new Image();
            
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = currentImage;
            });
            
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            ctx.filter = imagePreview.style.filter || 'none';
            ctx.drawImage(img, 0, 0);
            
            textElementsData.forEach(data => {
                const x = data.x * canvas.width;
                const y = data.y * canvas.height;
                const scaledFontSize = data.fontSize * Math.min(canvas.width / imagePreview.getBoundingClientRect().width, canvas.height / imagePreview.getBoundingClientRect().height);
                
                ctx.font = `${scaledFontSize}px ${data.fontFamily}`;
                ctx.fillStyle = data.color;
                ctx.textAlign = data.textAlign;
                ctx.textBaseline = 'middle';
                
                // Ajustar para o translate(-50%, -50%)
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.font = ctx.font;
                const textMetrics = tempCtx.measureText(data.text);
                const textWidth = textMetrics.width;
                const textHeight = scaledFontSize; // Aproximação da altura do texto
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(data.rotation * Math.PI / 180);
                ctx.scale(data.scale, data.scale);
                ctx.fillText(data.text, -textWidth / 2, 0);
                ctx.restore();
            });
            
            const finalImage = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = finalImage.split(',')[1];
            
            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: base64Data
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showStatus(`Imagem enviada com sucesso como ${result.fileName}!`, 'success');
                uploadBtn.disabled = true;
                currentImage = null;
                
                setTimeout(() => {
                    resetInterface();
                }, 5000);
            } else {
                showError("Erro ao enviar: " + (result.error || "Desconhecido"));
                uploadBtn.disabled = false;
            }
        } catch (err) {
            showError("Falha no envio: " + err.message);
            uploadBtn.disabled = false;
        } finally {
            progressContainer.style.display = 'none';
        }
    });

    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = 'status';
        if (type === 'success') statusDiv.classList.add('success');
        else if (type === 'error') statusDiv.classList.add('error');
        statusDiv.style.display = 'block';
    }

    function showError(message) {
        showStatus(message, 'error');
    }

    function resetStatus() {
        statusDiv.style.display = 'none';
    }

    function resetInterface() {
        placeholder.style.display = 'flex';
        imagePreview.style.display = 'none';
        cameraView.style.display = 'none';
        cameraMenu.style.display = 'none';
        mediaContainer.classList.remove('fullscreen');
        resetStatus();
        uploadBtn.disabled = true;
        addTextBtn.disabled = true;
        fileInput.value = '';
        document.querySelectorAll('.draggable-text').forEach(el => el.remove());
        textElementsData = [];
        textToolbar.style.display = 'none';
        imagePreview.style.filter = 'none';
        currentFilter = 'none';
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
        filterIntensity.value = 100;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        isCameraActive = false;
    }

    function simulateUploadProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            updateProgress(progress);
        }, 300);
    }

    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${Math.round(percent)}%`;
    }

    // Inicializar
    addTextBtn.disabled = true;
    uploadBtn.disabled = true;
});