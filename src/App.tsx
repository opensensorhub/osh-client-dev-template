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
import React, {useEffect} from "react";

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
import {Mode} from "osh-js/source/core/datasource/Mode";
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

const App = () => {

    useEffect(() => {
        // Ion.defaultAccessToken = '';

        let server = "api.georobotix.io/ogc/t18/api";
        let start = new Date((Date.now() - 600000)).toISOString();
        let end = "2024-12-31T23:59:59Z";
        let secure = true;
        let locationInfoDsId = "o7pce3e60s0ie";
        let attitudeInfoDsId = "mlme3gtdfepvc";
        let videoDsId = "h225hesual08g";
        let fovDsId = "iabpf1ivua1qm";
        let suvDsId = "";

        let dataSources = [];

        // UAV

        // -------- UAV LOCATION AND ORIENTATION

        let uavLocDataSource = new SweApi("UAV-Location", {
            protocol: "wss",
            endpointUrl: server,
            resource: `/datastreams/${locationInfoDsId}/observations`,
            startTime: start,
            endTime: end,
            mode: Mode.REPLAY,
            tls: secure
        });

        dataSources.push(uavLocDataSource);

        let uavAttitudeDataSource = new SweApi("UAV-Attitude", {
            protocol: "wss",
            endpointUrl: server,
            resource: `/datastreams/${attitudeInfoDsId}/observations`,
            startTime: start,
            endTime: end,
            mode: Mode.REPLAY,
            tls: secure
        });

        dataSources.push(uavAttitudeDataSource);

        // style it with a moving point marker
        let uavPointMarker = new PointMarkerLayer({
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
        });

        uavPointMarker.props.markerId = "UAV UAS";
        uavPointMarker.props.description = "UAV UAS";

        // --- UAV VIDEO

        let uavVideoDS = new SweApi("UAV-Video", {
            protocol: "wss",
            endpointUrl: server,
            resource: `/datastreams/${videoDsId}/observations`,
            startTime: start,
            endTime: end,
            mode: Mode.REPLAY,
            tls: secure,
            responseFormat: 'application/swe+binary'
        })

        let videoDataLayer = new VideoDataLayer({
            dataSourceId: [uavVideoDS.getId()],
            getFrameData: (rec: any) => {
                return rec.img
            },
            getTimestamp: (rec: any) => {
                return rec.timestamp
            }
        });

        let videoView = new VideoView({
            container: 'video-window',
            css: 'video-h264',
            name: "UAV Video",
            framerate: 25,
            showTime: false,
            showStats: false,
            layers: [videoDataLayer]
        });

        dataSources.push(uavVideoDS);

        // ------- UAV Field of Regard ------- //

        let uavForDataSource = new SweApi("UAV-FOR", {
            protocol: "wss",
            endpointUrl: server,
            resource: `/datastreams/${fovDsId}/observations`,
            startTime: start,
            endTime: end,
            mode: Mode.REPLAY,
            tls: secure
        });

        dataSources.push(uavForDataSource);

        let boundedDrapingLayer = new PolygonLayer({
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
        });

        // // ------- UAV Tracking Target ------- //
        //
        // let suvForDataSource = new SweApi("SUV-TARGET", {
        //     protocol: "wss",
        //     endpointUrl: server,
        //     resource: `/datastreams/${suvDsId}/observations`,
        //     startTime: start,
        //     endTime: end,
        //     mode: Mode.REPLAY,
        //     tls: secure
        // });
        //
        // dataSources.push(suvForDataSource);
        // // suvForDataSource.connect();
        //
        // // style it with a moving point marker
        // let suvPointMarker = new PointMarkerLayer({
        //     labelOffset: [0, -30],
        //     getLocation: {
        //         dataSourceIds: [suvForDataSource.getId()],
        //         handler: function (rec: any) {
        //             return {
        //                 x: rec.location.lon,
        //                 y: rec.location.lat,
        //             }
        //         }
        //
        //     },
        //     icon: 'images/suv.glb',
        //     iconSize: [32, 64],
        //     name: "SUV Location",
        //     label: "SUV",
        //     iconScale: .0000000000001,
        //     color: '#FFFFFF',
        //     opacity: .25,
        //     orientation: {
        //         heading: 90
        //     }
        // });

        // #region snippet_cesium_location_view
        // create Cesium view
        let cesiumView = new CesiumView({
            container: 'cesium-container',
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

        let baseLayerPicker = cesiumView.viewer.baseLayerPicker;

        let imageryProviders = baseLayerPicker.viewModel.imageryProviderViewModels;

        baseLayerPicker.viewModel.selectedImagery =
            imageryProviders.find((imageProviders: any) => imageProviders.name === "Bing Maps Aerial");

        let terrainProviders = baseLayerPicker.viewModel.terrainProviderViewModels;

        baseLayerPicker.viewModel.selectedTerrain =
            terrainProviders.find((terrainProviders: any) => terrainProviders.name === "Cesium World Terrain");

        let viewer = cesiumView.viewer;

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

export default App;