document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const toggleCameraBtn = document.getElementById('toggleCamera');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const switchCameraBtn = document.getElementById('switchCamera');
    const exitCameraBtn = document.getElementById('exitCamera');
    const cameraView = document.getElementById('cameraView');
    const imagePreview = document.getElementById('imagePreview');
    const mediaContainer = document.querySelector('.media-container');
    const cameraMenu = document.getElementById('cameraMenu');
    const placeholder = document.getElementById('placeholder');
    const uploadBtn = document.getElementById('uploadBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    const statusDiv = document.getElementById('status');

    // Variáveis globais
    let stream = null;
    let isCameraActive = false;
    let currentFacingMode = 'environment';
    let currentImage = null;

    // Função para verificar se é dispositivo móvel
    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod|Touch/.test(navigator.userAgent);
    }

    // Função para ajustar a orientação da câmera
    function adjustCameraOrientation() {
        if (!isCameraActive || !isMobileDevice()) return;

        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
            cameraView.classList.add('landscape');
            cameraView.style.objectFit = 'cover';
            cameraView.style.transform = 'translate(-50%, -50%)';
        } else {
            cameraView.classList.remove('landscape');
            cameraView.style.objectFit = 'contain';
            cameraView.style.transform = 'translate(-50%, -50%)';
        }
    }

    // Função para ajustar a posição do texto na mudança de orientação
    function adjustTextPosition() {
        if (!isMobileDevice()) return;

        const textElements = document.querySelectorAll('.draggable-text');
        if (textElements.length === 0) return;

        const containerRect = mediaContainer.getBoundingClientRect();
        const imgPreviewRect = imagePreview.getBoundingClientRect();

        textElements.forEach(textElement => {
            const leftPercent = parseFloat(textElement.style.left) / 100;
            const topPercent = parseFloat(textElement.style.top) / 100;

            const isImageMode = imagePreview.style.display === 'block';
            const referenceRect = isImageMode ? imgPreviewRect : containerRect;

            let newLeft = leftPercent * referenceRect.width;
            let newTop = topPercent * referenceRect.height;

            if (isImageMode) {
                newLeft += referenceRect.left - containerRect.left;
                newTop += referenceRect.top - containerRect.top;
            }

            textElement.style.left = `${(newLeft / containerRect.width) * 100}%`;
            textElement.style.top = `${(newTop / containerRect.height) * 100}%`;
        });
    }

    // Função para iniciar a câmera
    async function startCamera() {
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
                    adjustTextPosition();
                };
                
                showStatus("Câmera ativada. Use os botões para capturar, alternar ou sair.", 'info');
            } catch (err) {
                showError("Erro ao acessar a câmera: " + err.message);
                mediaContainer.classList.remove('fullscreen');
            }
        }
    }

    // Função para capturar foto
    function capturePhoto() {
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
        adjustTextPosition();
    }

    // Função para alternar câmera
    async function switchCamera() {
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
                adjustTextPosition();
            };
            
            showStatus(`Câmera alternada para ${currentFacingMode === 'environment' ? 'traseira' : 'frontal'}.`, 'info');
        } catch (err) {
            showError("Erro ao alternar câmera: " + err.message);
        }
    }

    // Função para encerrar a câmera
    function stopCamera() {
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
        adjustTextPosition();
    }

    // Função para renderizar texto no canvas (usada pelo script.js)
    function renderTextOnCanvas(canvas, img, imgPreviewRect, containerRect) {
        const ctx = canvas.getContext('2d');
        const scaleX = canvas.width / imgPreviewRect.width;
        const scaleY = canvas.height / imgPreviewRect.height;

        const textElements = document.querySelectorAll('.draggable-text');
        textElements.forEach(textElement => {
            const text = textElement.textContent;
            const color = textElement.style.color || '#000000';
            const fontSize = parseInt(textElement.style.fontSize) || 24;
            const fontFamily = textElement.style.fontFamily || 'Arial';
            const textAlign = textElement.style.textAlign || 'center';
            
            const textRect = textElement.getBoundingClientRect();
            
            const relativeX = textRect.left - imgPreviewRect.left + (textRect.width / 2);
            const relativeY = textRect.top - imgPreviewRect.top + (textRect.height / 2);
            
            const x = relativeX * scaleX;
            const y = relativeY * scaleY;
            const scaledFontSize = fontSize * Math.min(scaleX, scaleY);
            
            ctx.font = `${scaledFontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'middle';

            const transform = textElement.style.transform.match(/scale\(([^)]+)\)|rotate\(([^)]+)\)/g) || [];
            let scale = 1;
            let rotation = 0;
            transform.forEach(t => {
                if (t.includes('scale')) {
                    scale = parseFloat(t.match(/scale\(([^)]+)\)/)[1]) || 1;
                }
                if (t.includes('rotate')) {
                    rotation = parseFloat(t.match(/rotate\(([^)]+)\)/)[1]) || 0;
                }
            });

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.scale(scale, scale);
            ctx.fillText(text, 0, 0);
            ctx.restore();
        });
    }

    // Funções de status (reutilizadas de script.js)
    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = 'status';
        
        if (type === 'success') {
            statusDiv.classList.add('success');
        } else if (type === 'error') {
            statusDiv.classList.add('error');
        }
        
        statusDiv.style.display = 'block';
    }

    function showError(message) {
        showStatus(message, 'error');
    }

    function resetStatus() {
        statusDiv.style.display = 'none';
    }

    // Eventos
    toggleCameraBtn.addEventListener('click', startCamera);
    capturePhotoBtn.addEventListener('click', capturePhoto);
    switchCameraBtn.addEventListener('click', switchCamera);
    exitCameraBtn.addEventListener('click', stopCamera);

    if (isMobileDevice()) {
        window.addEventListener('orientationchange', () => {
            adjustCameraOrientation();
            adjustTextPosition();
        });
        window.addEventListener('resize', () => {
            adjustCameraOrientation();
            adjustTextPosition();
        });
    }

    // Exportar funções e variáveis necessárias
    window.cameraUtils = {
        startCamera,
        capturePhoto,
        switchCamera,
        stopCamera,
        renderTextOnCanvas,
        getCurrentImage: () => currentImage,
        setCurrentImage: (value) => { currentImage = value; },
        isCameraActive: () => isCameraActive
    };
});