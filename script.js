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
    const gameGrid = document.getElementById('game-grid'); // Obtener el contenedor de la cuadrícula de juegos
    // Asegurarse de que gameCards se obtenga solo si gameGrid existe, para evitar errores en otras páginas.
    const gameCards = gameGrid ? gameGrid.querySelectorAll('.game-card') : []; 

    // Usar el evento 'input' para filtrar en tiempo real a medida que el usuario escribe
    searchInput.addEventListener('input', () => { 
        const searchTerm = searchInput.value.toLowerCase();

        // Solo ejecutar la lógica de filtrado si estamos en la página que tiene el 'game-grid'
        if (gameGrid) {
            gameCards.forEach(card => {
                const gameName = card.querySelector('h2').textContent.toLowerCase(); // Obtener el nombre del juego

                if (gameName.includes(searchTerm)) {
                    card.style.display = 'flex'; // Mostrar la tarjeta si coincide
                } else {
                    card.style.display = 'none'; // Ocultar la tarjeta si no coincide
                }
            });
        }
    });

    // --- NUEVO CÓDIGO PARA LA VERIFICACIÓN DE NICK DE FREE FIRE ---

    // Asegúrate de que estos elementos existan en tu freefire.html
    // Si estás modificando index.html para la lógica de recarga (lo cual no es lo ideal,
    // normalmente la recarga va en la página específica del juego como freefire.html)
    // entonces necesitarías los IDs aquí. Por ahora, asumo que esto va en freefire.html
    // o que estos IDs existen en tu index.html si es una SPA.
    const form = document.getElementById('rechargeForm'); // Tu formulario principal (debe existir en el HTML relevante)
    const idInput = document.getElementById('playerId'); // El campo donde el usuario ingresa la ID (debe existir en el HTML relevante)
    const nickDisplay = document.getElementById('nickDisplay'); // Un elemento nuevo (por ejemplo, un <span> o <p>) donde se mostrará el nick
    const submitButton = document.getElementById('submitBtn'); // Tu botón de envío del formulario (debe existir en el HTML relevante)
    const verifyNickButton = document.getElementById('verifyNickBtn'); // Botón opcional para verificar el nick por separado

    // Función para limpiar caracteres especiales del nickname
    function cleanNickname(nickname) {
        // Puedes ajustar esto para más caracteres si es necesario
        return nickname.replace(/â¤ï¸/g, '❤️').replace(/âœ¨/g, '✨').trim();
    }

    // Función para verificar el Nick del jugador
    async function verifyNickname(id) {
        if (!nickDisplay) return null; // Asegúrate de que el elemento exista antes de continuar

        nickDisplay.textContent = 'Verificando Nick...';
        nickDisplay.style.color = 'orange';

        try {
            // Llama a nuestra Netlify Function para el scraping
            const response = await fetch(`/.netlify/functions/get-ff-nick?id=${id}`);
            const data = await response.json();

            if (data.success) {
                const cleanedNick = cleanNickname(data.nickname);
                nickDisplay.textContent = `Nick: ${cleanedNick}`;
                nickDisplay.style.color = 'green';
                return cleanedNick; // Retorna el nick limpio
            } else {
                nickDisplay.textContent = `Error: ${data.message}`;
                nickDisplay.style.color = 'red';
                return null;
            }
        } catch (error) {
            console.error('Error al llamar a la función de Netlify:', error);
            nickDisplay.textContent = 'Error de conexión al verificar el Nick.';
            nickDisplay.style.color = 'red';
            return null;
        }
    }

    // --- MODIFICAR EL ENVÍO DEL FORMULARIO (Si este script se usa en la página de recarga) ---
    // Esta parte solo se ejecutará si el 'form' existe en el HTML donde se carga este script
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = idInput.value;

            if (!id || id.trim() === '') {
                alert('Por favor, ingresa tu ID de Free Fire.');
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Procesando...';
            }

            const nickname = await verifyNickname(id);

            if (nickname) {
                // Aquí deberías tener tu token de bot y chat ID
                const telegramBotToken = 'YOUR_TELEGRAM_BOT_TOKEN'; // ¡CAMBIA ESTO!
                const chatId = 'YOUR_CHAT_ID'; // ¡CAMBIA ESTO!

                const selectedAmount = document.getElementById('amountSelect') ? document.getElementById('amountSelect').value : 'N/A';
                const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
                const paymentMethodValue = selectedPaymentMethod ? selectedPaymentMethod.value : 'N/A';

                let message = `🚀 Nueva Recarga - GamingKings 🚀\n`;
                message += `-----------------------------------\n`;
                message += `🎮 ID de Free Fire: ${id}\n`;
                message += `✨ Nick Verificado: ${nickname}\n`; // Añadimos el nick verificado
                message += `💰 Monto: ${selectedAmount}\n`;
                message += `💳 Método de Pago: ${paymentMethodValue}\n`;
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
                    } else {
                        alert('Hubo un error al enviar la solicitud a Telegram. Intenta de nuevo.');
                        console.error('Error de Telegram:', telegramData);
                    }
                } catch (error) {
                    console.error('Error de red al enviar a Telegram:', error);
                    alert('Error de conexión. No se pudo enviar la solicitud.');
                }
            } else {
                alert('No se pudo verificar el Nick. Por favor, revisa la ID o intenta más tarde.');
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Recargar Ahora';
            }
        });
    }

    // --- OPCIONAL: Añadir evento al botón de verificar Nick por separado ---
    if (verifyNickButton) {
        verifyNickButton.addEventListener('click', async () => {
            const id = idInput.value;
            if (!id || id.trim() === '') {
                alert('Por favor, ingresa tu ID de Free Fire para verificar el Nick.');
                return;
            }
            verifyNickButton.disabled = true;
            verifyNickButton.textContent = 'Verificando...';
            await verifyNickname(id);
            verifyNickButton.disabled = false;
            verifyNickButton.textContent = 'Verificar Nick';
        });
    }
});