import React, { useState } from "react";
import axios from "axios";

// 📍 Diccionario de ubicaciones simuladas
const cityCoordinates: Record<string, [number, number]> = {
    "Madrid": [40.4168, -3.7038],
    "Barcelona": [41.3851, 2.1734],
    "Zaragoza": [41.6488, -0.8891],
    "Valencia": [39.4699, -0.3763]
};

// 📖 Estructura de un libro
interface Book {
    title: string;
    author_name: string[];
    first_publish_year: number;
    key: string;
    location: string; 
}

// 🛠 Definir estructura de respuesta de Google Books API
interface GoogleBooksResponse {
    items: {
        id: string;
        volumeInfo: {
            title: string;
            authors?: string[];
            publishedDate?: string;
        };
    }[];
}

// 🎯 Definir propiedades del componente
interface BookSearchProps {
    onSearchResults: (books: Book[]) => void;
}

const BookSearch: React.FC<BookSearchProps> = ({ onSearchResults }) => {
    const [title, setTitle] = useState('');
    const [city, setCity] = useState('Madrid');  
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!title) {
            setError("Por favor, ingresa un título de libro.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // 📌 Buscar todos los libros con el título exacto
            const response = await axios.get<GoogleBooksResponse>(
                `https://www.googleapis.com/books/v1/volumes?q=intitle:"${title}"&langRestrict=es&maxResults=10`
            );

            if (!response.data.items || response.data.items.length === 0) {
                setError("No se encontraron libros con este título.");
                return;
            }

            // 📍 Convertir los resultados en un array de libros
            const books: Book[] = response.data.items.map((bookData) => ({
                title: bookData.volumeInfo.title,
                author_name: bookData.volumeInfo.authors || ["Desconocido"],
                first_publish_year: bookData.volumeInfo.publishedDate ? parseInt(bookData.volumeInfo.publishedDate) : 0,
                key: bookData.id,
                location: city 
            }));

            // 📌 Pasamos los resultados al componente padre
            onSearchResults(books); 
        } catch (error) {
            console.error('Error al obtener los libros:', error);
            setError("Ocurrió un error al buscar el libro. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Buscar libro exacto por título"
            />
            <button onClick={handleSearch} disabled={loading}>Buscar</button>
            {loading && <p>Cargando...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default BookSearch;
