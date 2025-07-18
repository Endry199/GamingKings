const axios = require('axios');

// Función para escapar caracteres especiales de MarkdownV2
// Escapa todos los caracteres que son especiales en MarkdownV2
// Se ha mejorado la expresión regular para ser más exhaustiva y correcta para MarkdownV2
function escapeMarkdownV2(text) {
    if (typeof text !== 'string') {
        text = String(text); // Asegurarse de que sea una cadena
    }
    // Lista de caracteres especiales en MarkdownV2 que requieren ser escapados
    // Se incluye el guion '-' que fue la causa del error.
    const specialChars = /[_\*\[\]\(\)~`>#+\-=\|\{\}\.!]/g;
    return text.replace(specialChars, '\\$&');
}

exports.handler = async (event, context) => {
    // Asegurarse de que la solicitud es POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método no permitido. Solo POST.' })
        };
    }

    let data;
    try {
        // Parsear el cuerpo de la solicitud JSON
        data = JSON.parse(event.body);
    } catch (error) {
        // Si el JSON es inválido
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Solicitud inválida. El cuerpo debe ser JSON.' })
        };
    }

    // Extraer los datos del formulario que vienen del frontend
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

    // Validar que los campos esenciales existan
    if (!Juego || !ID_Jugador || !Paquete_Diamantes || !Metodo_Pago || !Numero_Referencia) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Faltan campos obligatorios en la solicitud.' })
        };
    }

    // **IMPORTANTE: Usa variables de entorno para el token y la ID de chat por seguridad**
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
    // Convertir a String() por si acaso el valor no es una cadena (ej. números)
    const escapedJuego = escapeMarkdownV2(Juego);
    const escapedID_Jugador = escapeMarkdownV2(ID_Jugador);
    const escapedPaquete_Diamantes = escapeMarkdownV2(Paquete_Diamantes);
    const escapedPrecio_USD = escapeMarkdownV2(Precio_USD);
    const escapedPrecio_Final = escapeMarkdownV2(Precio_Final);
    const escapedMoneda = escapeMarkdownV2(Moneda);
    const escapedMetodo_Pago = escapeMarkdownV2(Metodo_Pago.toUpperCase());
    const escapedNumero_Referencia = escapeMarkdownV2(Numero_Referencia);

    // Construir el mensaje para Telegram con los valores escapados
    // Asegúrate de escapar también los caracteres fijos que son especiales en MarkdownV2,
    // como los guiones, paréntesis, puntos, etc., si aparecen en texto fijo.
    const mensaje = `
🎮 *GamingKings \\- Nueva Solicitud de Recarga* 🎮

\\---
*Detalles del Pedido:*
Juego: *${escapedJuego}*
ID de Jugador: \`${escapedID_Jugador}\`
Paquete: *${escapedPaquete_Diamantes}*
Precio \\(USD\\): \\$${escapedPrecio_USD}
Precio Final: ${escapedMoneda === 'VES' ? 'Bs\\.' : '\\$'}${escapedPrecio_Final} \\(${escapedMoneda}\\)
Método de Pago: *${escapedMetodo_Pago}*
Número de Referencia: \`${escapedNumero_Referencia}\`
\\---

_Por favor\\, verifica el pago y procesa la recarga\\._
    `;

    try {
        // Enviar el mensaje a Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensaje,
            parse_mode: 'MarkdownV2' // Usamos MarkdownV2 para formato de texto
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Solicitud de recarga enviada a Telegram con éxito.' })
        };
    } catch (error) {
        // Mejorar el log de errores para ver el detalle de Telegram
        console.error('Error al enviar mensaje a Telegram:', error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo o contacta al soporte.' })
        };
    }
};