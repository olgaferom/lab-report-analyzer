import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const onFileChange = (event) => {
    const selectedFile = event.target.files[0];
    console.log('File selected:', selectedFile);
    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully');
    setNumPages(numPages);
  };

  const analyzeReport = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo PDF primero.');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      console.log('Enviando solicitud a la función analyze');
      console.log('Archivo a enviar:', file);
      const response = await axios.post('/.netlify/functions/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Respuesta completa:', response);
      console.log('Datos de la respuesta:', response.data);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error al analizar el informe:', error);
      console.error('Detalles del error:', error.response ? error.response.data : 'No hay detalles disponibles');
      setError(`Error al analizar el informe: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <h1>Analizador de Informes de Laboratorio</h1>
      <input type="file" onChange={onFileChange} accept=".pdf" />
      {error && <p style={{color: 'red'}}>{error}</p>}
      {file && (
        <div>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('Error al cargar el PDF:', error);
              setError(`Error al cargar el PDF: ${error.message}`);
            }}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          {numPages && <p>Página {pageNumber} de {numPages}</p>}
          <button onClick={analyzeReport}>Analizar Informe</button>
        </div>
      )}
      {analysis && (
        <div>
          <h2>Resultados del Análisis:</h2>
          <p>Nombre del archivo: {analysis.filename}</p>
          <p>Número de páginas: {analysis.numPages}</p>
          <p>Extracto del texto:</p>
          <pre>{analysis.text}</pre>
        </div>
      )}
    </div>
  );
}

export default App;