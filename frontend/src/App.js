import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    console.log('Archivo seleccionado:', selectedFile.name);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Iniciando llamada a la función analyze');
      
      const response = await axios.post('/.netlify/functions/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta recibida:', response.data);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error al llamar a la función:', error);
      setError('Hubo un error al analizar el archivo. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Analizador de Informes de Laboratorio</h1>
      </header>
      <main>
        <div className="file-input">
          <input type="file" onChange={handleFileChange} accept=".pdf" />
        </div>
        <button onClick={handleAnalyze} disabled={!file || isLoading}>
          {isLoading ? 'Analizando...' : 'Analizar'}
        </button>
        {error && <p className="error-message">{error}</p>}
        {analysis && (
          <div className="analysis-results">
            <h2>Resultados del Análisis:</h2>
            <pre>{JSON.stringify(analysis, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;