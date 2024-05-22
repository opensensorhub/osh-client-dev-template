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
import React, { useEffect, useMemo, useRef } from "react";

// @ts-ignore
import {
    Cartesian3,
    Ion,
    SceneMode,
    Terrain,
} from "@cesium/engine";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
// @ts-ignore
import CesiumView from "osh-js/source/core/ui/view/map/CesiumView.js";
// @ts-ignore
import DataSynchronizer from 'osh-js/source/core/timesync/DataSynchronizer';
// @ts-ignore
import { Mode } from "osh-js/source/core/datasource/Mode";
// @ts-ignore
import PointMarkerLayer from "osh-js/source/core/ui/layer/PointMarkerLayer";
// @ts-ignore
import PolygonLayer from "osh-js/source/core/ui/layer/PolygonLayer";
// @ts-ignore
import SweApi from "osh-js/source/core/datasource/sweapi/SweApi.datasource";
// @ts-ignore
import VideoDataLayer from "osh-js/source/core/ui/layer/VideoDataLayer";
// @ts-ignore
import VideoView from "osh-js/source/core/ui/view/video/VideoView";

export default function App() {
    // A Cesium Ion access token can be obtained for free from https://ion.cesium.com/.
    // Do not commit your access token to a public repository.
    // Ion.defaultAccessToken = '';

    const server = "api.georobotix.io/ogc/t18/api";
    const start = useMemo(() => new Date((Date.now() - 600000)).toISOString(), []);
    const end = "2024-12-31T23:59:59Z";
    const secure = true;
    const locationInfoDsId = "o7pce3e60s0ie";
    const attitudeInfoDsId = "mlme3gtdfepvc";
    const videoDsId = "h225hesual08g";
    const fovDsId = "iabpf1ivua1qm";

    //#region Data Sources
    /**
     * UAV Location data source
     * 
     * @remarks This data source will be used by the point marker layer to display the UAV's location.
     */
    const uavLocDataSource = useMemo(() => new SweApi("UAV-Location", {
        protocol: "wss",
        endpointUrl: server,
        resource: `/datastreams/${locationInfoDsId}/observations`,
        startTime: start,
        endTime: end,
        mode: Mode.REPLAY,
        tls: secure
    }), []);

    /**
     * UAV Attitude data source
     * 
     * @remarks This data source will be used by the point marker layer to display the UAV's orientation.
     */
    const uavAttitudeDataSource = useMemo(() => new SweApi("UAV-Attitude", {
        protocol: "wss",
        endpointUrl: server,
        resource: `/datastreams/${attitudeInfoDsId}/observations`,
        startTime: start,
        endTime: end,
        mode: Mode.REPLAY,
        tls: secure
    }), []);

    /**
     * UAV Video data source
     * 
     * @remarks This data source will be used by the video view to display the UAV's video stream.
     */
    const uavVideoDataSource = useMemo(() => new SweApi("UAV-Video", {
        protocol: "wss",
        endpointUrl: server,
        resource: `/datastreams/${videoDsId}/observations`,
        startTime: start,
        endTime: end,
        mode: Mode.REPLAY,
        tls: secure,
        responseFormat: 'application/swe+binary'
    }), []);

    /**
     * UAV Field of Regard data source
     * 
     * @remarks This data source will be used by the bounded draping layer to display the UAV's field of regard.
     */
    const uavForDataSource = useMemo(() => new SweApi("UAV-FOR", {
        protocol: "wss",
        endpointUrl: server,
        resource: `/datastreams/${fovDsId}/observations`,
        startTime: start,
        endTime: end,
        mode: Mode.REPLAY,
        tls: secure
    }), []);

    /**
     * Data Sources
     * 
     * @remarks This array contains all the data sources that will be used by the master time controller.
     */
    const dataSources = useMemo(() => {
        return [
            uavLocDataSource,
            uavAttitudeDataSource,
            uavVideoDataSource,
            uavForDataSource
        ];
    }, [uavLocDataSource, uavAttitudeDataSource, uavVideoDataSource, uavForDataSource]);
    //#endregion

    //#region Layers
    /**
     * UAV Point Marker Layer
     * 
     * @remarks This layer will be used by the Cesium view to display the UAV's location and orientation.
     */
    const uavPointMarker = useMemo(() => new PointMarkerLayer({
        labelOffset: [0, -30],
        getLocation: {
            dataSourceIds: [uavLocDataSource.getId()],
            handler: function (rec: any) {
                return {
                    x: rec.location.lon,
                    y: rec.location.lat,
                    z: rec.location.alt
                }
            }

        },
        getOrientation: {
            dataSourceIds: [uavAttitudeDataSource.getId()],
            handler: function (rec: any) {
                return {
                    heading: rec.attitude.heading - 90.0
                }
            }
        },
        icon: 'images/uav.glb',
        iconSize: [32, 64],
        name: "UAV Location",
        label: "UAV",
        iconScale: .05,
        color: '#FF8000'
    }), [uavLocDataSource]);

    /**
     * Bounded Draping Layer
     * 
     * @remarks This layer will be used by the Cesium view to display the UAV's field of regard.
     */
    const boundedDrapingLayer = useMemo(() => new PolygonLayer({
        opacity: .5,
        getVertices: {
            dataSourceIds: [uavForDataSource.getId()],
            handler: function (rec: any) {
                return [
                    rec.geoRef.ulc.lon,
                    rec.geoRef.ulc.lat,
                    rec.geoRef.llc.lon,
                    rec.geoRef.llc.lat,
                    rec.geoRef.lrc.lon,
                    rec.geoRef.lrc.lat,
                    rec.geoRef.urc.lon,
                    rec.geoRef.urc.lat,
                ];
            }
        },
    }), [uavForDataSource]);

    /**
     * UAV Video Data Layer
     * 
     * @remarks This layer will be used by the video view to display the UAV's video stream.
     */
    const videoDataLayer = useMemo(() => new VideoDataLayer({
        dataSourceId: [uavVideoDataSource.getId()],
        getFrameData: (rec: any) => {
            return rec.img
        },
        getTimestamp: (rec: any) => {
            return rec.timestamp
        }
    }), [uavVideoDataSource]);
    //#endregion

    /**
     * Master Time Controller
     * 
     * @remarks This object will synchronize all the data sources and control the replay speed.
     */
    const masterTimeController = useMemo(() => new DataSynchronizer({
        replaySpeed: 1,
        intervalRate: 5,
        dataSources: dataSources
    }), [dataSources]);

    // Set the marker ID and description for the UAV point marker
    useEffect(() => {
        uavPointMarker.props.markerId = "UAV UAS";
        uavPointMarker.props.description = "UAV UAS";
    }, [uavPointMarker])

    // Create the video view with the UAV video data layer
    useEffect(() => {
        const videoView = new VideoView({
            container: "video-window",
            css: 'video-h264',
            name: "UAV Video",
            framerate: 25,
            showTime: false,
            showStats: false,
            layers: [videoDataLayer]
        });
    }, [])

    // Create the Cesium view with the UAV point marker and bounded draping layers
    useEffect(() => {
        const cesiumView = new CesiumView({
            container: "cesium-container",
            layers: [uavPointMarker, boundedDrapingLayer],
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

        // Set the imagery and terrain providers
        const baseLayerPicker = cesiumView.viewer.baseLayerPicker;

        const imageryProviders = baseLayerPicker.viewModel.imageryProviderViewModels;
        baseLayerPicker.viewModel.selectedImagery =
            imageryProviders.find((imageProviders: any) => imageProviders.name === "Bing Maps Aerial");

        const terrainProviders = baseLayerPicker.viewModel.terrainProviderViewModels;
        baseLayerPicker.viewModel.selectedTerrain =
            terrainProviders.find((terrainProviders: any) => terrainProviders.name === "Cesium World Terrain");

        // Center the camera on the UAV
        cesiumView.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(-86.67128902952935, 34.70690480206765, 10000)
        });
    }, [])

    // Start streaming
        masterTimeController.connect();
    }, [])

    return (
        <div id="container">
            <div id="left">
                <div id="cesium-container"></div>
            </div>
            <div id="right">
                <div className="title">UAV Video Stream</div>
                <div id="video-window"></div>
            </div>
        </div>
    );
};