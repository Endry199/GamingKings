const axios = require('axios');

// Función para escapar caracteres especiales de MarkdownV2
function escapeMarkdownV2(text) {
    // Caracteres especiales que deben ser escapados en MarkdownV2
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

    // Escapar todos los datos variables antes de insertarlos en el mensaje
    const escapedJuego = escapeMarkdownV2(Juego);
    const escapedID_Jugador = escapeMarkdownV2(ID_Jugador);
    const escapedPaquete_Diamantes = escapeMarkdownV2(Paquete_Diamantes);
    const escapedPrecio_USD = escapeMarkdownV2(String(Precio_USD)); // Convertir a string para escapar
    const escapedPrecio_Final = escapeMarkdownV2(String(Precio_Final)); // Convertir a string para escapar
    const escapedMoneda = escapeMarkdownV2(Moneda);
    const escapedMetodo_Pago = escapeMarkdownV2(Metodo_Pago.toUpperCase());
    const escapedNumero_Referencia = escapeMarkdownV2(Numero_Referencia);


    // Construir el mensaje para Telegram con los valores escapados
    const mensaje = `
        🎮 *GamingKings \\- Nueva Solicitud de Recarga* 🎮

        \\---
        *Detalles del Pedido:*
        Juego: *${escapedJuego}*
        ID de Jugador: \`${escapedID_Jugador}\`
        Paquete: *${escapedPaquete_Diamantes}*
        Precio (USD): \\$${escapedPrecio_USD}
        Precio Final: ${escapedMoneda === 'VES' ? 'Bs\\.' : '\\$'}${escapedPrecio_Final} \\(${escapedMoneda}\\)
        Método de Pago: *${escapedMetodo_Pago}*
        Número de Referencia: \`${escapedNumero_Referencia}\`
        \\---

        _Por favor\\, verifica el pago y procesa la recarga\\._
    `;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensaje,
            parse_mode: 'MarkdownV2'
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