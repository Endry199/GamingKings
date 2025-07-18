document.addEventListener('DOMContentLoaded', () => {
    // ---- Lógica para el nuevo selector de moneda personalizado ----
    const customCurrencySelector = document.getElementById('custom-currency-selector');
    const selectedCurrencyDisplay = document.getElementById('selected-currency');
    const currencyOptionsDiv = document.getElementById('currency-options');
    const currencyOptions = currencyOptionsDiv.querySelectorAll('.option');

    // Función para actualizar la UI del selector y guardar la moneda
    function updateCurrencyDisplay(value, text, imgSrc) {
        selectedCurrencyDisplay.innerHTML = `<img src="${imgSrc}" alt="${text.split(' ')[2] ? text.split(' ')[2].replace(/[()]/g, '') : 'Flag'}"> <span>${text}</span> <i class="fas fa-chevron-down"></i>`;
        localStorage.setItem('selectedCurrency', value);
        // Dispatch custom event for other pages to listen
        window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: value } }));
    }

    // Inicializar el selector con la moneda guardada o por defecto
    const savedCurrency = localStorage.getItem('selectedCurrency') || 'VES'; // Por defecto VES
    let initialText = 'Bs. (VES)';
    let initialImgSrc = 'images/flag_ve.png';

    if (savedCurrency === 'USD') {
        initialText = '$ (USD)';
        initialImgSrc = 'images/flag_us.png';
    }
    updateCurrencyDisplay(savedCurrency, initialText, initialImgSrc);

    // Toggle para abrir/cerrar el selector
    selectedCurrencyDisplay.addEventListener('click', (event) => {
        event.stopPropagation(); // Evitar que el clic se propague al document
        customCurrencySelector.classList.toggle('open');
    });

    // Manejar la selección de una opción
    currencyOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const text = option.querySelector('span').textContent;
            const imgSrc = option.querySelector('img').src;
            
            updateCurrencyDisplay(value, text, imgSrc);
            customCurrencySelector.classList.remove('open'); // Cerrar el selector
        });
    });

    // Cerrar el selector si se hace clic fuera de él
    document.addEventListener('click', (event) => {
        if (!customCurrencySelector.contains(event.target)) {
            customCurrencySelector.classList.remove('open');
        }
    });

    // ---- Lógica de la barra de búsqueda (filtrado en la misma página) ----
    const searchInput = document.querySelector('.search-bar input');
    const gameGrid = document.getElementById('game-grid'); 
    const gameCards = gameGrid ? gameGrid.querySelectorAll('.game-card') : []; 

    searchInput.addEventListener('input', () => { 
        const searchTerm = searchInput.value.toLowerCase();

        if (gameGrid) {
            gameCards.forEach(card => {
                const gameName = card.querySelector('h2').textContent.toLowerCase();

                if (gameName.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    });

    // --- CÓDIGO PARA LA VERIFICACIÓN DE NICK DE FREE FIRE (APLICABLE EN freefire.html) ---

    // Elementos del formulario de recarga de Free Fire
    const form = document.getElementById('freefire-recharge-form'); // El formulario en freefire.html
    const idInput = document.getElementById('player-id'); // El campo de ID en freefire.html
    const nickDisplay = document.getElementById('nickDisplay'); // El nuevo elemento para el nick
    const submitButton = document.getElementById('confirm-recharge-btn'); // El botón de confirmación
    const verifyNickButton = document.getElementById('verifyNickBtn'); // El nuevo botón de verificación

    // Función para limpiar caracteres especiales del nickname
    function cleanNickname(nickname) {
        // Reemplaza el patrón problemático por el corazón real
        // Añade más reemplazos si aparecen otros símbolos
        return nickname.replace(/â¤ï¸/g, '❤️').replace(/âœ¨/g, '✨').trim();
    }

    // Función para verificar el Nick del jugador
    async function verifyNickname(id) {
        if (!nickDisplay) return null; // Salir si el elemento no existe (ej. no estamos en freefire.html)

        nickDisplay.textContent = 'Verificando Nick...';
        nickDisplay.style.color = 'orange';
        
        // Deshabilita el botón de verificar y el de submit temporalmente si existen
        if (verifyNickButton) verifyNickButton.disabled = true;
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`/.netlify/functions/get-ff-nick?id=${id}`);
            const data = await response.json();

            if (data.success) {
                const cleanedNick = cleanNickname(data.nickname);
                nickDisplay.textContent = `Nick: ${cleanedNick}`;
                nickDisplay.style.color = 'green';
                
                // Re-habilita el botón de submit (solo si un nick válido fue encontrado)
                if (submitButton) submitButton.disabled = false;
                
                return cleanedNick;
            } else {
                nickDisplay.textContent = `Error: ${data.message}`;
                nickDisplay.style.color = 'red';
                // Si la verificación falla, el botón de submit debe seguir deshabilitado
                if (submitButton) submitButton.disabled = true; 
                return null;
            }
        } catch (error) {
            console.error('Error al llamar a la función de Netlify:', error);
            nickDisplay.textContent = 'Error de conexión al verificar el Nick.';
            nickDisplay.style.color = 'red';
            // Si hay un error de conexión, el botón de submit debe seguir deshabilitado
            if (submitButton) submitButton.disabled = true;
            return null;
        } finally {
            // Siempre re-habilita el botón de verificar (si existe)
            if (verifyNickButton) verifyNickButton.disabled = false;
            if (verifyNickButton) verifyNickButton.textContent = 'Verificar Nick'; // Restaura el texto
        }
    }

    // --- MODIFICAR EL ENVÍO DEL FORMULARIO DE RECARGA ---
    // Esta parte solo se ejecutará si el 'form' existe en el HTML (es decir, en freefire.html)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = idInput.value;

            if (!id || id.trim() === '') {
                alert('Por favor, ingresa tu ID de Free Fire.');
                return;
            }

            // Deshabilita el botón mientras se verifica y envía
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Procesando...';
            }
            // También el botón de verificar, si existe
            if (verifyNickButton) {
                verifyNickButton.disabled = true;
                verifyNickButton.textContent = 'Procesando...';
            }


            // 1. Llama a la función de verificación del Nick (ahora es parte del flujo de submit)
            const nickname = await verifyNickname(id);

            if (nickname) {
                // Si el nick se verificó con éxito, procede con el envío a Telegram
                const telegramBotToken = 'YOUR_TELEGRAM_BOT_TOKEN'; // ¡CAMBIA ESTO!
                const chatId = 'YOUR_CHAT_ID'; // ¡CAMBIA ESTO!

                const selectedAmountElement = document.getElementById('amountSelect'); // Este ID no existe en freefire.html
                const selectedAmount = selectedAmountElement ? selectedAmountElement.value : (selectedPackage ? selectedPackage.dataset.diamonds : 'N/A'); // Usamos el paquete seleccionado
                
                const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked'); // Este elemento no existe en freefire.html
                const paymentMethodValue = selectedPaymentMethod ? selectedPaymentMethod.value : 'N/A';

                // Obtener el paquete seleccionado del script local de freefire.html
                // Ya tenemos 'selectedPackage' en el ámbito de freefire.html, pero no aquí directamente.
                // Necesitaríamos una forma de pasar la info del paquete seleccionado si el submit es aquí.
                // Para simplificar, asumiremos que selectedPackage se obtiene dentro del submit handler en freefire.html
                // o que los datos del paquete son globales/accesibles.

                // MEJORA: Para obtener el paquete seleccionado correctamente:
                // El `selectedPackage` se maneja en el script interno de `freefire.html`.
                // Necesitamos acceder a él o pasarlo. La forma más sencilla es que el script interno
                // de `freefire.html` maneje el submit, o exponer `selectedPackage` globalmente
                // o pasarlo como parte del localStorage.

                // Por ahora, estoy comentando estas líneas y asumiendo que el `freefire.html`
                // script interno se encarga del `selectedPackage`.
                // Si el submit fuera manejado completamente aquí, necesitarías que `selectedPackage`
                // fuera una variable global o que su valor se guardara en un input oculto.

                // TEMPORAL: Para el mensaje de Telegram, voy a obtener la info del paquete de una forma simple.
                // Esta parte puede necesitar un refinamiento si `selectedPackage` no es directamente accesible
                // en este script.
                const currentPackageElement = document.querySelector('.package-item.selected');
                let packageDiamonds = 'N/A';
                let packagePriceUSD = 'N/A';
                if (currentPackageElement) {
                    packageDiamonds = currentPackageElement.querySelector('span:first-child').textContent;
                    packagePriceUSD = parseFloat(currentPackageElement.dataset.priceUsd).toFixed(2);
                }
                const selectedCurrency = localStorage.getItem('selectedCurrency') || 'VES'; 
                let finalPrice = 'N/A';
                if (packagePriceUSD !== 'N/A') {
                    finalPrice = selectedCurrency === 'VES' ? (parseFloat(packagePriceUSD) * DOLLAR_RATE).toFixed(2) : parseFloat(packagePriceUSD).toFixed(2);
                }
                
                let message = `🚀 Nueva Recarga - GamingKings 🚀\n`;
                message += `-----------------------------------\n`;
                message += `🎮 ID de Free Fire: ${id}\n`;
                message += `✨ Nick Verificado: ${nickname}\n`; // Añadimos el nick verificado
                message += `💎 Paquete: ${packageDiamonds}\n`; // Añadimos el paquete de diamantes
                message += `💰 Precio (USD): $${packagePriceUSD}\n`; // Precio en USD
                message += `💲 Precio Final (${selectedCurrency}): ${selectedCurrency === 'VES' ? 'Bs.' : '$'}${finalPrice}\n`; // Precio final
                message += `-----------------------------------\n`;
                message += `Por favor, procesar esta recarga.`;

                try {
                    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
                    const telegramResponse = await fetch(telegramUrl);
                    const telegramData = await telegramResponse.json();

                    if (telegramData.ok) {
                        alert('¡Solicitud de recarga enviada con éxito! Revisa tu Telegram.');
                        form.reset();
                        if (nickDisplay) nickDisplay.textContent = '';
                        // Reiniciar el estado del paquete seleccionado si es necesario
                        const currentlySelectedPackage = document.querySelector('.package-item.selected');
                        if (currentlySelectedPackage) {
                            currentlySelectedPackage.classList.remove('selected');
                        }
                    } else {
                        alert('Hubo un error al enviar la solicitud a Telegram. Intenta de nuevo.');
                        console.error('Error de Telegram:', telegramData);
                    }
                } catch (error) {
                    console.error('Error de red al enviar a Telegram:', error);
                    alert('Error de conexión. No se pudo enviar la solicitud.');
                }
            } else {
                // Si el nick no se pudo verificar, el mensaje de error ya lo muestra verifyNickname
                alert('No se pudo verificar el Nick. Por favor, revisa la ID o intenta más tarde.');
            }

            // Habilita los botones de nuevo al finalizar
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Confirmar Recarga';
            }
            if (verifyNickButton) {
                verifyNickButton.disabled = false;
                verifyNickButton.textContent = 'Verificar Nick';
            }
        });
    }

    // --- Evento para el botón de verificar Nick por separado ---
    if (verifyNickButton) {
        verifyNickButton.addEventListener('click', async () => {
            const id = idInput.value;
            if (!id || id.trim() === '') {
                alert('Por favor, ingresa tu ID de Free Fire para verificar el Nick.');
                return;
            }
            // verifyNickname ya maneja el estado del botón
            await verifyNickname(id);
        });
    }

    // --- Lógica para el botón de confirmar recarga (disabler/enabler)
    // Mantenemos la lógica de habilitar/deshabilitar el botón de recarga aquí si no es global
    // (Ya hay una checkFormValidity en el script interno de freefire.html, lo cual es redundante)
    // Lo ideal es que el `checkFormValidity` en el script interno de `freefire.html` llame a una función
    // global o se asegure de que el botón se habilite/deshabilite correctamente.

    // Vamos a asegurar que el botón de confirmación esté deshabilitado inicialmente si no hay ID o paquete.
    // Esto ya lo hace el script interno de freefire.html, pero lo reforzamos si es necesario.
    if (confirmBtn && idInput && !idInput.value.trim()) {
        confirmBtn.disabled = true;
    }
});