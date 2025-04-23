import { useState } from "react";
import CesiumViewer from "./CesiumViewer";
import * as WorkspaceAPI from "trimble-connect-workspace-api";

function App() {
  const [coordinates, setCoordinates] = useState<{ x: number; y: number; z: number } | null>(null);

  async function triggerGetSelection() {
    try {
      const api = await WorkspaceAPI.connect(window.parent, (_event: any, _data: any) => {
        // Callback de conexión (puede dejarse vacío o usar para debug)
      });

      const selection = await api.viewer.getSelection();
      if (selection.length === 0) {
        console.warn("No hay selección.");
        return;
      }

      const firstModelObjects = selection[0];

      if (firstModelObjects.objectRuntimeIds === undefined) {
        console.warn("El objeto no tiene objectRuntimeIds.");
        return;
      }

      const bbox = await api.viewer.getObjectBoundingBoxes(
        firstModelObjects.modelId,
        firstModelObjects.objectRuntimeIds
      );

      console.log("📦 BoundingBox recibido:", bbox);

      if (bbox && bbox.length > 0) {
        const boundingBoxData = bbox[0];

        if (boundingBoxData && boundingBoxData.boundingBox) {
          const { min, max } = boundingBoxData.boundingBox;
          const x = (min.x + max.x) / 2;
          const y = (min.y + max.y) / 2;
          const z = (min.z + max.z) / 2;

          const center = { x, y, z };
          console.log("🎯 Centro del bounding box:", center);
          setCoordinates(center);
        } else {
          console.warn("boundingBoxData no tiene la propiedad 'boundingBox'.");
        }
      } else {
        console.warn("No se recibió un bounding box válido.");
      }
    } catch (error) {
      console.error("❌ Error al obtener la selección:", error);
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ENCABEZADO CON BOTÓN */}
      <div style={{ padding: "0.1rem", background: "#fff", zIndex: 10 }}>
        <h1 style ={{fontSize: "30px", color: "blue"}}>Trimble Connect + Cesium.js</h1>
        <button onClick={triggerGetSelection}>Obtener selección de Trimble Connect</button>
      </div>

      {/* VISOR OCUPA EL RESTO */}
      <div style={{ flex: 1 }}>
        <CesiumViewer coordinates={coordinates} />
      </div>
    </div>
  );
}

export default App;