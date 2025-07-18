const axios = require('axios');

// Función para escapar caracteres especiales de MarkdownV2
// Esta regex es muy completa, pero Telegram a veces es quisquilloso.
function escapeMarkdownV2(text) {
    if (typeof text !== 'string') {
        text = String(text); // Asegurarse de que sea una cadena
    }
    // Lista de caracteres especiales en MarkdownV2 que requieren ser escapados
    // Esta regex incluye el guion '-' que es el origen del problema.
    // También escapa caracteres como '.', '(', ')', etc.
    const specialChars = /[_\*\[\]\(\)~`>#+\-=\|\{\}\.!]/g;
    return text.replace(specialChars, '\\$&');
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método no permitido. Solo POST.' })
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Solicitud inválida. El cuerpo debe ser JSON.' })
        };
    }

    const {
        Juego,
        ID_Jugador,
        Paquete_Diamantes,
        Precio_USD,
        Precio_Final,
        Moneda,
        Metodo_Pago,
        Numero_Referencia
    } = data;

    if (!Juego || !ID_Jugador || !Paquete_Diamantes || !Metodo_Pago || !Numero_Referencia) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Faltan campos obligatorios en la solicitud.' })
        };
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('ERROR: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están configurados en las variables de entorno de Netlify.');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error de configuración del servidor. Contacta al soporte.' })
        };
    }

    // Escapar solo los datos dinámicos *antes* de construir el mensaje
    const game = Juego; // No es necesario escapar aquí si lo haremos al final
    const playerId = ID_Jugador;
    const packageDiamonds = Paquete_Diamantes;
    const priceUSD = Precio_USD;
    const finalPrice = Precio_Final;
    const currency = Moneda;
    const paymentMethod = Metodo_Pago.toUpperCase();
    const referenceNumber = Numero_Referencia;

    // Construir el mensaje base sin escapar (solo para variables interpoladas)
    // Usaremos un escape final sobre todo el mensaje
    const rawMensaje = `
🎮 *GamingKings - Nueva Solicitud de Recarga* 🎮

---
*Detalles del Pedido:*
Juego: *${game}*
ID de Jugador: \`${playerId}\`
Paquete: *${packageDiamonds}*
Precio (USD): $${priceUSD}
Precio Final: ${currency === 'VES' ? 'Bs.' : '$'}${finalPrice} (${currency})
Método de Pago: *${paymentMethod}*
Número de Referencia: \`${referenceNumber}\`
---

_Por favor, verifica el pago y procesa la recarga._
    `;

    // AHORA: Escapar el mensaje COMPLETO antes de enviarlo a Telegram
    const mensajeEscapadoFinal = escapeMarkdownV2(rawMensaje);

    // *** DEPURACIÓN: Imprime el mensaje final en los logs de Netlify ***
    console.log('Mensaje final a enviar a Telegram (escapado):', mensajeEscapadoFinal);
    // *******************************************************************

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensajeEscapadoFinal, // Enviamos el mensaje YA escapado
            parse_mode: 'MarkdownV2' // Telegram lo interpretará como MarkdownV2
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Solicitud de recarga enviada a Telegram con éxito.' })
        };
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo o contacta al soporte.' })
        };
    }
};