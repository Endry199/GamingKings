const axios = require('axios');

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
    // Estos valores los configurarás en el panel de Netlify, NO los pongas directamente aquí.
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('ERROR: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están configurados en las variables de entorno de Netlify.');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error de configuración del servidor. Contacta al soporte.' })
        };
    }

    // Construir el mensaje para Telegram
    const mensaje = `
        🎮 *GamingKings - Nueva Solicitud de Recarga* 🎮

        ---
        *Detalles del Pedido:*
        Juego: *${Juego}*
        ID de Jugador: \`${ID_Jugador}\`
        Paquete: *${Paquete_Diamantes}*
        Precio (USD): $${Precio_USD}
        Precio Final: ${Moneda === 'VES' ? 'Bs.' : '$'}${Precio_Final} (${Moneda})
        Método de Pago: *${Metodo_Pago.toUpperCase()}*
        Número de Referencia: \`${Numero_Referencia}\`
        ---

        _Por favor, verifica el pago y procesa la recarga._
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
        console.error('Error al enviar mensaje a Telegram:', error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo o contacta al soporte.' })
        };
    }
};