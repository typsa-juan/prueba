// CesiumViewer.tsx
import { useEffect, useRef, useState } from "react";
import proj4 from "proj4";
import * as Cesium from "cesium";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface Props {
  coordinates: Coordinates | null;
}

const CesiumViewer = ({ coordinates }: Props) => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [orthoVisible, setOrthoVisible] = useState(true);
  const dataSourcesRef = useRef<Record<string, Cesium.DataSource>>({});
  const orthoLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  const utm17S = "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs";
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

  const convertUTMToLatLon = (x: number, y: number) => {
    const [lon, lat] = proj4(utm17S, wgs84, [x, y]);
    return { lat, lon };
  };

  const capas = [
    {
      url: `${import.meta.env.BASE_URL}data/ColectoresTr10Paquete03.geojson`,
      name: "Colectores PQ3",
      color: Cesium.Color.YELLOW.withAlpha(0.4),
    },
    {
      url: `${import.meta.env.BASE_URL}data/EjeDrenesPaq3.geojson`,
      name: "Eje Drenes Paquete 3",
      color: Cesium.Color.CYAN.withAlpha(0.4),
    },
    {
      url: `${import.meta.env.BASE_URL}data/TanquesRetencion.geojson`,
      name: "TRAP200",
      color: Cesium.Color.RED.withAlpha(0.4),
    },
    {
      url: `${import.meta.env.BASE_URL}data/EstructurasDrenPaq3.geojson`,
      name: "Estructuras especiales",
      color: Cesium.Color.GREEN.withAlpha(0.4),
    },
  ];

  const geojsonIonAssets = [
    {
      id: 3326798,
      name: "Colectores - Cesium Ion",
      color: Cesium.Color.YELLOW.withAlpha(0.3),
    },
    {
        id: 3326980,
        name: "Estructuras Especiales - Cesium Ion",
        color: Cesium.Color.RED.withAlpha(0.3),
      },
      {
        id: 3326983,
        name: "Eje Dren - Cesium Ion",
        color: Cesium.Color.RED.withAlpha(0.3),
      },
  ];

  useEffect(() => {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ZDZiZTc0Ny0yMWJjLTRkYWEtYjA5OC1mNDg5ZmU0MGQ0NjEiLCJpZCI6MjkwMzY1LCJpYXQiOjE3NDM2MDM4MTB9.zDzBjVMs4ZdupOkiv7fxTLF_zDlvgmfwkxzvn7L2jpM";

    if (!viewerRef.current && containerRef.current) {
      const viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
      });
      viewerRef.current = viewer;

      // Ortofoto Cesium Ion
      Cesium.IonImageryProvider.fromAssetId(3326380).then((provider) => {
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        orthoLayerRef.current = layer;
      });

      // Capas GeoJSON locales
      capas.forEach(({ url, color }) => {
        Cesium.GeoJsonDataSource.load(url, {
          stroke: color,
          fill: color,
          strokeWidth: 2,
          clampToGround: true,
        })
          .then((ds) => {
            viewer.dataSources.add(ds);
            dataSourcesRef.current[url] = ds;
            setLayerVisibility((prev) => ({ ...prev, [url]: true }));
          })
          .catch((err) => console.error(`Error cargando ${url}:`, err));
      });

      // Capas GeoJSON Cesium Ion
 geojsonIonAssets.forEach(({ id, color }) => {
  Cesium.IonResource.fromAssetId(id).then((resource) => {
    Cesium.GeoJsonDataSource.load(resource, {
      stroke: color,
      fill: color,
      strokeWidth: 2,
      clampToGround: true,
    })
            .then((ds) => {
              viewer.dataSources.add(ds);
              const key = `ion-${id}`;
              dataSourcesRef.current[key] = ds;
              setLayerVisibility((prev) => ({ ...prev, [key]: true }));
            })
            .catch((err) => console.error(`Error GeoJSON Ion (${id}):`, err));
        });
      });
    }
  }, []);

  useEffect(() => {
    if (viewerRef.current && coordinates) {
      const { x, y, z } = coordinates;
      const { lat, lon } = convertUTMToLatLon(x, y);

      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, z + 100),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-20),
        },
      });
    }
  }, [coordinates]);

  useEffect(() => {
    Object.entries(layerVisibility).forEach(([url, visible]) => {
      const ds = dataSourcesRef.current[url];
      if (ds) ds.show = visible;
    });
  }, [layerVisibility]);

  useEffect(() => {
    if (orthoLayerRef.current) {
      orthoLayerRef.current.show = orthoVisible;
    }
  }, [orthoVisible]);

  return (
    <>
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "#fff",
        padding: "0.8rem",
        borderRadius: "0.5rem",
        zIndex: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        maxHeight: "90vh",
        overflowY: "auto",
        minWidth: "220px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Capas visibles</h3>

        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            <input
              type="checkbox"
              checked={orthoVisible}
              onChange={(e) => setOrthoVisible(e.target.checked)}
            />{" "}
            Ortofoto (Cesium Ion)
          </label>
        </div>

        {capas.map(({ url, name }) => (
          <div key={url} style={{ marginBottom: "0.5rem" }}>
            <label>
              <input
                type="checkbox"
                checked={layerVisibility[url] ?? true}
                onChange={(e) =>
                  setLayerVisibility((prev) => ({
                    ...prev,
                    [url]: e.target.checked,
                  }))
                }
              />{" "}
              {name}
            </label>
          </div>
        ))}

        {geojsonIonAssets.map(({ id, name }) => {
          const key = `ion-${id}`;
          return (
            <div key={key} style={{ marginBottom: "0.5rem" }}>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility[key] ?? true}
                  onChange={(e) =>
                    setLayerVisibility((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />{" "}
                {name}
              </label>
            </div>
          );
        })}
      </div>

      <div
        ref={containerRef}
        style={{ position: "fixed", height: "100%", width: "100%", zIndex: 0 }}
      />
    </>
  );
};

export default CesiumViewer;