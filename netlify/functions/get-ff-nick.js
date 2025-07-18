const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    const { id } = event.queryStringParameters;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing Free Fire ID' })
        };
    }

    const scrapeUrl = `https://www.freefiremania.com.br/cuenta/${id}.html`;

    try {
        const response = await axios.get(scrapeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        let nickname = '';
        // Buscamos el <li> con la clase 'list-group-item' que contenga el texto 'Nombre:'
        const listItemWithNickname = $('li.list-group-item').filter(function() {
            // Aseguramos que el <li> contenga el texto "Nombre:"
            return $(this).text().includes('Nombre:');
        });

        if (listItemWithNickname.length > 0) {
            // Obtenemos todo el texto del <li> (esto incluirá "Nombre: ELY.❤️!!")
            const fullText = listItemWithNickname.text().trim();
            
            // Buscamos la posición del prefijo "Nombre:"
            const prefix = 'Nombre:';
            const prefixIndex = fullText.indexOf(prefix);

            if (prefixIndex !== -1) {
                // Extraemos el texto después del prefijo y lo limpiamos de espacios extra
                nickname = fullText.substring(prefixIndex + prefix.length).trim();
            }
        }

        if (nickname) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, nickname: nickname })
            };
        } else {
            // Si no se encuentra el nickname después de procesar, podría ser una ID inválida,
            // o la estructura de la página cambió, o el scraper fue bloqueado/falló.
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Nickname not found for this ID or page structure changed. (Possible anti-bot measure or invalid ID)' })
            };
        }

    } catch (error) {
        console.error('Scraping error:', error.message);
        let errorMessage = 'Error al verificar la ID. Intenta de nuevo.';
        if (error.response) {
            if (error.response.status === 404) {
                errorMessage = 'ID de Free Fire no encontrada o inválida en Free Fire Mania.';
            } else if (error.response.status === 403 || error.response.status === 429) {
                errorMessage = 'Acceso a Free Fire Mania bloqueado (posible medida anti-bot). Intenta más tarde.';
            } else {
                 errorMessage = `Error de red o servidor: ${error.response.status}.`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'La solicitud de verificación excedió el tiempo límite.';
        }
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ success: false, message: errorMessage })
        };
    }
};