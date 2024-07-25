const pdf = require('pdf-parse');
const multipart = require('parse-multipart');

exports.handler = async function(event, context) {
  console.log('Función analyze invocada');
  console.log('Método HTTP:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers));

  if (event.httpMethod !== 'POST') {
    console.log('Método no permitido');
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Parsing multipart form data');
    const { body, headers } = event;
    const boundary = multipart.getBoundary(headers['content-type']);
    const parts = multipart.Parse(Buffer.from(body, 'base64'), boundary);

    console.log('Número de partes:', parts.length);

    if (parts.length === 0) {
      console.log('No se recibió ningún archivo');
      throw new Error('No se recibió ningún archivo');
    }

    const { data, filename } = parts[0];
    console.log('Archivo recibido:', filename);

    console.log('Analizando PDF');
    const pdfData = await pdf(data);

    console.log('PDF procesado. Número de páginas:', pdfData.numpages);

    const response = {
      message: "Análisis completado",
      filename: filename,
      numPages: pdfData.numpages,
      text: pdfData.text.slice(0, 500)
    };

    console.log('Enviando respuesta:', JSON.stringify(response));

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error en la función:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Error al procesar el PDF', details: error.message }) 
    };
  }
}