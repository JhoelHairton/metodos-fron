import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar los componentes necesarios de Chart.js
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Upload = () => {
    const [file, setFile] = useState(null);
    const [methods, setMethods] = useState([]);
    const [numPredictions, setNumPredictions] = useState(0);
    const [chartData, setChartData] = useState(null);
   // const [precisionResults, setPrecisionResults] = useState(null);

    // Manejar la carga del archivo CSV
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Manejar la selección de métodos de interpolación
    const handleMethodChange = (e) => {
        const selectedMethods = Array.from(e.target.selectedOptions, option => option.value);
        setMethods(selectedMethods);
    };

    // Manejar el cambio del número de predicciones futuras
    const handleNumPredictionsChange = (e) => {
        setNumPredictions(e.target.value);
    };

    // Subir el archivo CSV al backend
    const handleUpload = async () => {
        if (!file) {
            alert("Por favor, selecciona un archivo.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log(response.data.message);
        } catch (error) {
            console.error("Error al cargar el archivo:", error);
        }
    };

    // Comparar métodos de interpolación y mostrar los resultados en un gráfico
    const handleCompare = async () => {
        if (methods.length === 0) {
            alert("Por favor, selecciona al menos un método.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/compare', {
                methods,
                num_predictions: parseInt(numPredictions, 10),
            });

            // Preparar los datos para el gráfico
            const datasets = response.data.results.map((result, index) => ({
                label: `Método: ${methods[index]}`,
                data: [...result.historical, ...result.future],
                borderColor: ['blue', 'green', 'red', 'orange', 'purple'][index],
                fill: false,
            }));

            const chartData = {
                labels: [...response.data.historical_x, ...response.data.future_x],
                datasets: datasets,
            };
            setChartData(chartData);  // Guardar los datos del gráfico
        } catch (error) {
            console.error("Error al aplicar los métodos:", error);
        }
    };

    // Exportar los resultados del gráfico como PDF
    const exportPDF = async () => {
        const chartElement = document.getElementById('chart');
        const canvas = await html2canvas(chartElement);
        const imageData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF();
        pdf.setFontSize(18);
        pdf.text('Reporte de Predicciones de Consumo Energético', 20, 20);
        pdf.addImage(imageData, 'PNG', 15, 40, 180, 160);

        pdf.setFontSize(12);
        pdf.text(`Métodos seleccionados: ${methods.join(', ')}`, 20, 220);
        pdf.text(`Número de predicciones futuras: ${numPredictions}`, 20, 230);

        pdf.save('reporte_predicciones.pdf');
    };

    return (
        <div>
            <h2>Predicción de Consumo Energético</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Cargar Archivo</button>

            <div>
                <h3>Selecciona Métodos de Interpolación</h3>
                <select multiple={true} value={methods} onChange={handleMethodChange}>
                    <option value="lagrange">Interpolación de Lagrange</option>
                    <option value="newton">Diferencias Divididas de Newton</option>
                    <option value="least_squares_linear">Mínimos Cuadrados (Lineal)</option>
                    <option value="least_squares_poly">Mínimos Cuadrados (Polinómico)</option>
                    <option value="cubic_spline">Spline Cúbico</option>
                </select>

                <div>
                    <label htmlFor="numPredictions">Número de Predicciones Futuras:</label>
                    <input 
                        type="number" 
                        id="numPredictions" 
                        value={numPredictions} 
                        onChange={handleNumPredictionsChange} 
                    />
                </div>

                <button onClick={handleCompare}>Comparar Métodos</button>

                {chartData && (
                    <div>
                        <h3>Comparación de Métodos</h3>
                        <div id="chart">
                            <Line data={chartData} />
                        </div>
                        <button onClick={exportPDF}>Exportar como PDF</button>
                    </div>
                )}

                <button onClick={handleCompare}>Validar Métodos</button>
            </div>
        </div>
    );
};

export default Upload;
