import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MoveMapProps {
    center: [number, number];
}

const MoveMap: React.FC<MoveMapProps> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        console.log("[MoveMap] Recibido nuevo centro:", center);
        
        if (center) {
            // Esperar un breve momento para asegurar que el mapa está completamente cargado
            setTimeout(() => {
                console.log("[MoveMap] Aplicando nuevo centro:", center);
                map.setView(center, 5); // Fijamos el zoom a 5 para una mejor visualización
                map.invalidateSize(); // Forzar redibujado
            }, 100);
        }
    }, [center, map]);

    return null;
};

export default MoveMap;
