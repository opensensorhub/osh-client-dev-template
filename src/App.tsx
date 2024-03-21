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
        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMDE5MzJmNC1hMTQ5LTQxOTEtODJiOC00ZDM4YTZiMDFhYTUiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI0NTJ9.uTTE9gv7JB3y_XzV7FTmBcKUAOMYyOZ97h03_gasO7c';

        let server = "localhost:8282/sensorhub/api";
        let start = "2017-08-21T14:27:53Z";
        let end = "2100-01-01Z";
        let secure = false;
        let locationInfoDsId = "r5adq419u4h4c";
        let attitudeInfoDsId = "v9353nsml40cu";
        let videoDsId = "";
        let fovDsId = "";
        let suvDsId = "";

        let dataSources = [];

        // UAV

        // -------- UAV LOCATION AND ORIENTATION

        let uavLocDataSource = new SweApi("UAV-Location", {
            protocol: "wss",
            service: "SOS",
            endpointUrl: server,
            resource: `/datastreams/${locationInfoDsId}/observations`,
            startTime: start,
            endTime: end,
            mode: Mode.REPLAY,
            tls: secure
        });

        dataSources.push(uavLocDataSource);
        // uavLocDataSource.connect();

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
        // uavAttitudeDataSource.connect();

        // style it with a moving point marker
        let uavPointMarker = new PointMarkerLayer({
            labelOffset: [0, -30],
            getLocation: {
                dataSourceIds: [uavLocDataSource.getId()],
                handler: function (rec: any) {
                    return {
                        x: rec.loc.lon,
                        y: rec.loc.lat,
                        z: rec.loc.alt
                    }
                }

            },
            getOrientation: {
                dataSourceIds: [uavAttitudeDataSource.getId()],
                handler: function (rec: any) {
                    return {
                        heading: rec.attitude.yaw - 90.0
                    }
                }
            },
            icon: 'images/drone.glb',
            iconSize: [32, 64],
            name: "UAV Location",
            label: "UAV",
            iconScale: .05,
            color: '#FF8000'
        });

        uavPointMarker.props.markerId = "UAV UAS";
        uavPointMarker.props.description = "UAV UAS";

        // // --- UAV VIDEO
        //
        // let uavVideoDS = new SweApi("UAV-Video", {
        //     protocol: "wss",
        //     endpointUrl: server,
        //     resource: `/datastreams/${videoDsId}/observations`,
        //     startTime: start,
        //     endTime: end,
        //     mode: Mode.REPLAY,
        //     tls: secure
        // })
        //
        // let videoDataLayer = new VideoDataLayer({
        //     dataSourceId: [uavVideoDS.getId()],
        //     getFrameData: (rec: any) => {
        //         return rec.img
        //     },
        //     getTimestamp: (rec: any) => {
        //         return rec.timestamp
        //     }
        // });
        //
        // let videoView = new VideoView({
        //     container: 'video-window',
        //     css: 'video-h264',
        //     name: "UAV Video",
        //     framerate: 25,
        //     showTime: false,
        //     showStats: false,
        //     layers: [videoDataLayer]
        // });
        //
        // dataSources.push(uavVideoDS);
        // // uavVideoDS.connect();
        //
        // // ------- UAV Field of Regard ------- //
        //
        // let uavForDataSource = new SweApi("UAV-FOR", {
        //     protocol: "wss",
        //     endpointUrl: server,
        //     resource: `/datastreams/${fovDsId}/observations`,
        //     startTime: start,
        //     endTime: end,
        //     mode: Mode.REPLAY,
        //     tls: secure
        // });
        //
        // dataSources.push(uavForDataSource);
        // // uavForDataSource.connect();
        //
        // let boundedDrapingLayer = new PolygonLayer({
        //     opacity: .5,
        //     getVertices: {
        //         dataSourceIds: [uavForDataSource.getId()],
        //         handler: function (rec: any) {
        //             return [
        //                 rec.ulc.lon,
        //                 rec.ulc.lat,
        //                 rec.llc.lon,
        //                 rec.llc.lat,
        //                 rec.lrc.lon,
        //                 rec.lrc.lat,
        //                 rec.urc.lon,
        //                 rec.urc.lat,
        //             ];
        //         }
        //     },
        // });
        //
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
            // layers: [uavPointMarker, boundedDrapingLayer, suvPointMarker],
            layers: [uavPointMarker],
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
            {/*<div id="left">*/}
                <div id="cesium-container"></div>
            {/*</div>*/}
            {/*<div id="right">*/}
            {/*    <div className="title">UAV Video Stream</div>*/}
            {/*    <div id="video-window"></div>*/}
            {/*</div>*/}
        </div>
    );
};

export default App;