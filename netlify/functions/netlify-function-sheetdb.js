// netlify/functions/manage-sheetdb.js

// Accede a las variables de entorno de Netlify
// ¡IMPORTANTE! Configura estas variables en el panel de Netlify (Site settings > Build & deploy > Environment)
// SHEETDB_CARDS_URL = https://sheetdb.io/api/v1/TU_ID_DE_TU_HOJA_DE_CARTAS
// SHEETDB_SEALED_PRODUCTS_URL = https://sheetdb.io/api/v1/TU_ID_DE_TU_HOJA_DE_PRODUCTOS_SELLADOS

const SHEETDB_CONFIG = {
    cards_url: process.env.SHEETDB_CARDS_URL,
    sealed_products_url: process.env.SHEETDB_SEALED_PRODUCTS_URL,
};

// NOTA IMPORTANTE: La verificación de autenticación basada en contraseña se ha ELIMINADO TEMPORALMENTE
// para permitir el despliegue en Netlify y la integración inicial con Firebase Auth.
// En un entorno de producción, DEBES implementar la verificación del token de Firebase Auth aquí.
// Esto se hará en un paso posterior para asegurar las operaciones de escritura.

exports.handler = async (event, context) => {
    // Configura CORS
    const headers = {
        'Access-Control-Allow-Origin': '*', // Reemplaza '*' con el dominio de tu Netlify en producción (ej. https://tudominio.netlify.app)
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', // 'Authorization' para el token de Firebase Auth
        'Content-Type': 'application/json'
    };

    // Manejar pre-vuelos OPTIONS para CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: headers,
            body: ''
        };
    }

    // --- TEMPORALMENTE: NO HAY VERIFICACIÓN DE AUTENTICACIÓN AQUÍ ---
    // En un paso posterior, se agregará la verificación del token de Firebase Auth aquí.
    // Por ahora, cualquier petición que llegue a esta función será procesada.
    // Esto es solo para permitir que el despliegue de Netlify sea exitoso y probar el login de Firebase.
    // const idToken = event.headers.authorization?.split('Bearer ')[1];
    // if (!idToken) {
    //     return {
    //         statusCode: 401,
    //         headers: headers,
    //         body: JSON.stringify({ success: false, message: 'No autorizado. Se requiere token de autenticación.' })
    //     };
    // }
    // Aquí iría la lógica para verificar el token con Firebase Admin SDK.
    // -----------------------------------------------------------------

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ success: false, message: 'Formato de JSON inválido.' })
        };
    }

    const { action, data, id, entityType } = body;

    let targetUrl = '';
    if (entityType === 'cards') {
        targetUrl = SHEETDB_CONFIG.cards_url;
    } else if (entityType === 'sealedProducts') {
        targetUrl = SHEETDB_CONFIG.sealed_products_url;
    } else {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ success: false, message: 'Tipo de entidad no válido para esta función.' })
        };
    }

    if (!targetUrl) {
        console.error(`URL de SheetDB no configurada para ${entityType}.`);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ success: false, message: 'Error de configuración del servidor: URL de SheetDB no definida.' })
        };
    }

    let sheetdbResponse;
    try {
        switch (action) {
            case 'add':
                sheetdbResponse = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: data })
                });
                break;
            case 'update':
                if (!id) {
                    return {
                        statusCode: 400,
                        headers: headers,
                        body: JSON.stringify({ success: false, message: 'ID requerido para actualizar.' })
                    };
                }
                let id_field = 'id';
                if (entityType === 'sealedProducts') {
                    id_field = 'id_producto';
                }
                sheetdbResponse = await fetch(`${targetUrl}/${id_field}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: data })
                });
                break;
            case 'delete':
                if (!id) {
                    return {
                        statusCode: 400,
                        headers: headers,
                        body: JSON.stringify({ success: false, message: 'ID requerido para eliminar.' })
                    };
                }
                let delete_id_field = 'id';
                if (entityType === 'sealedProducts') {
                    delete_id_field = 'id_producto';
                }
                sheetdbResponse = await fetch(`${targetUrl}/${delete_id_field}/${id}`, {
                    method: 'DELETE'
                });
                break;
            default:
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ success: false, message: 'Acción no válida.' })
                };
        }

        const result = await sheetdbResponse.json();
        if (!sheetdbResponse.ok) {
            console.error(`Error de SheetDB para ${action} ${entityType}:`, result);
            return {
                statusCode: sheetdbResponse.status,
                headers: headers,
                body: JSON.stringify({ success: false, message: `Error en la operación de SheetDB: ${result.message || 'Error desconocido'}`, details: result })
            };
        }

        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ success: true, message: `Operación de ${entityType} '${action}' completada.`, data: result })
        };

    } catch (error) {
        console.error(`Error en la función manage-sheetdb para la acción '${action}' y entidad '${entityType}':`, error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ success: false, message: 'Error interno del servidor.', error: error.message })
        };
    }
};
