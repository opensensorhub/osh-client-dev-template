/*
 * Copyright (c) 2024.  Botts Innovative Research, Inc.
 * All Rights Reserved
 *
 * opensensorhub/osh-viewer is licensed under the
 *
 * Mozilla Public License 2.0
 * Permissions of this weak copyleft license are conditioned on making available source code of licensed
 * files and modifications of those files under the same license (or in certain cases, one of the GNU licenses).
 * Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 * However, a larger work using the licensed work may be distributed under different terms and without
 * source code for files added in the larger work.
 *
 */
import React, {useEffect, useState} from "react";

// @ts-ignore
import {
    Cartesian2,
    Cartesian3, Color, HorizontalOrigin, LabelStyle,
    SceneMode,
    Terrain,
} from "@cesium/engine";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
// @ts-ignore
import DataSynchronizer from 'osh-js/source/core/timesync/DataSynchronizer';
// @ts-ignore
import {Mode} from "osh-js/source/core/datasource/Mode";
// @ts-ignore
import SosGetResult from "osh-js/source/core/datasource/sos/SosGetResult.datasource"

// @ts-ignore
import NexradView from "./NexradView";
// @ts-ignore
import NexradSites from "./NexradSites";
// @ts-ignore
import NexradLayer from "./NexradLayer";

import "./styles.css";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";

const App = () => {

    let [prevElevationNumber, setPrevElevationNumber] = useState<number>();
    let [elevation, setElevation]: [number, (value: (((prevState: number) => number) | number)) => void] = useState<number>(1);
    let [activeSite, setActiveSite]: [string, (value: (((prevState: string) => string) | string)) => void] = useState<string>('KEWX');
    let [nexradView, setNexradView] = useState<NexradView>();
    let [nexradSites, setNexradSites] = useState<NexradSites>();
    let [currentLabel, setCurrentLabel] = useState<any>();

    useEffect(() => {

        let server = "76.187.247.4:8282/sensorhub/sos";
        let offeringId = "urn:osh:sensor:weather:nexrad";
        let observedProperty = "http://sensorml.com/ont/swe/propertyx/NexradRadial";
        let start = new Date((Date.now() - 600000)).toISOString();
        let end = "2024-12-31T23:59:59Z";
        let secure = false;
        let replaySpeed = 10;

        let dataSources = [];

        let nexradDataSource = new SosGetResult('nexrad-data', {
            protocol: 'ws',
            service: 'SOS',
            tls: secure,
            endpointUrl: server,
            offeringID: offeringId,
            observedProperty: observedProperty,
            mode: Mode.REPLAY, // requires DataSynchronizer
            replaySpeed: replaySpeed,
            reconnectTimeout: 1000 * 120, // 2 mimutes
            startTime: start,
            endTime: end,
        })

        dataSources.push(nexradDataSource);

        setNexradSites(new NexradSites());

        let nexradLayer = new NexradLayer({
            dataSourceIds: [nexradDataSource.id],
            getSiteId: (rec: { siteId: any; }) => {
                return rec.siteId;
            },
            getElevationNumber: (rec: { elevationNumber: any; }) => {
                return rec.elevationNumber;
            },
            getLocation: (rec: { location: { lon: any; lat: any; alt: any; }; }) => {
                return {
                    x: rec.location.lon,
                    y: rec.location.lat,
                    z: rec.location.alt
                };
            },
            getAzimuth: (rec: { azimuth: any; }) => {
                return rec.azimuth;
            },
            getElevation: (rec: { elevationNumber: React.SetStateAction<number>; elevation: any; }) => {
                // Check to see if radar has completed a sweep and changed elevation
                if (rec.elevationNumber != prevElevationNumber) {
                    // setPrevElevation(rec.elevation);
                    setPrevElevationNumber(rec.elevationNumber);
                }
                return rec.elevation;
            },
            getRangeToCenterOfFirstRefGate: (rec: { rangeToCenterOfFirstRefGate: any; }) => {
                return rec.rangeToCenterOfFirstRefGate;
            },
            getRefGateSize: (rec: { refGateSize: any; }) => {
                return rec.refGateSize;
            },
            getReflectivity: (rec: { Reflectivity: any; }) => {
                return rec.Reflectivity;
            },
            getProductTime: (rec: { timestamp: string | number | Date; }) => {
                return new Date(rec.timestamp).toISOString(); // rec.timestamp == timestamp
            },

            allowBillboardRotation: true,
        });  // end NexradLayer

        // create Cesium view
        let nexradView = new NexradView({
            container: 'cesium-container',
            layers: [nexradLayer],
            activeSite: activeSite,
            activeElevation: elevation,
            options: {
                viewerProps: {
                    terrain: Terrain.fromWorldTerrain(),
                    sceneMode: SceneMode.SCENE3D,
                    // infoBox: false,
                    // geocoder: false,
                    timeline: false,
                    animation: false,
                    homeButton: false,
                    scene3DOnly: true,
                    // baseLayerPicker: false,
                    // sceneModePicker: false,
                    fullscreenButton: false,
                    // projectionPicker: false,
                    // selectionIndicator: false,
                    navigationHelpButton: true,
                    navigationInstructionsInitiallyVisible: true
                }
            }
        });

        setNexradView(nexradView);

        let baseLayerPicker = nexradView.viewer.baseLayerPicker;

        let imageryProviders = baseLayerPicker.viewModel.imageryProviderViewModels;

        baseLayerPicker.viewModel.selectedImagery =
            imageryProviders.find((imageProviders: any) => imageProviders.name === "Bing Maps Roads");

        let terrainProviders = baseLayerPicker.viewModel.terrainProviderViewModels;

        baseLayerPicker.viewModel.selectedTerrain =
            terrainProviders.find((terrainProviders: any) => terrainProviders.name === "Cesium World Terrain");

        let viewer = nexradView.viewer;

        viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(-86.67128902952935, 34.70690480206765, 10000)
        });

        // start streaming
        let masterTimeController = new DataSynchronizer({
            replaySpeed: 1,
            intervalRate: 5,
            dataSources: dataSources
        });

        masterTimeController.connect().then();

    }, [])

    let getSiteLabel = (position: { x: number; y: number; }, siteId: any) => {

        let label = {

            position: Cartesian3.fromDegrees(position.x, position.y),
            point: {
                pixelSize: 8,
                color: Color.RED,
            },
            label: {
                text: siteId,
                font: "20px monospace",
                fillColor: Color.RED,
                outlineColor: Color.BLACK,
                style: LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 3,
                HorizontalOrigin: HorizontalOrigin.RIGHT,
                pixelOffset: new Cartesian2(32, 8),
            },
        };
        return label;
    }

    let handleSiteChange = (event: SelectChangeEvent) => {

        nexradView.setActiveSite(event.target.value);
        let siteLoc = nexradSites.getSiteLocation(event.target.value);
        let label = getSiteLabel(siteLoc, event.target.value);
        if (!currentLabel) {

            setCurrentLabel(nexradView.viewer.entities.add(label));

        } else {

            currentLabel.position = Cartesian3.fromDegrees(siteLoc.x, siteLoc.y);
            currentLabel.label.text = event.target.value;
        }

        nexradView.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(siteLoc.x, siteLoc.y, 600000),
            duration: 1.0
        });
    }

    let handleElevationChange = (event: SelectChangeEvent) => {

        nexradView.setElevationNumber(event.target.value);
    }

    return (
        <div id="container">
            <div id="top" className={"flex-container"}>
                <FormControl fullWidth>
                    <InputLabel id="siteLabel">Site</InputLabel>
                    <Select
                        labelId="siteLabel"
                        id="site"
                        value={activeSite}
                        label="Site"
                        onChange={event => {
                            handleSiteChange(event);
                            setActiveSite(event.target.value)
                        }}
                        className={"flex-child"}
                    >
                        <MenuItem value={"KEWX"}>KEWX</MenuItem>
                        <MenuItem value={"KHGX"}>KHGX</MenuItem>
                        <MenuItem value={"KHTX"}>KHTX</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth>
                    <InputLabel id="elevLabel">Elevation</InputLabel>
                    <Select
                        labelId="elevLabel"
                        id="elevations"
                        value={elevation == 0 ? "0" : "1"}
                        label="Elevations"
                        onChange={event => {
                            handleElevationChange(event);
                            setElevation(Number(event.target.value));
                        }}
                        className={"flex-child"}
                    >
                        <MenuItem value={"1"}>0.5</MenuItem>
                        <MenuItem value={"0"}>ALL</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth>
                    <InputLabel id="product-time" className={"flex-child"}>Product Time: -----</InputLabel>
                </FormControl>
            </div>
            <div id="hero">
                <div id="cesium-container"></div>
            </div>
        </div>
    );
};

export default App;