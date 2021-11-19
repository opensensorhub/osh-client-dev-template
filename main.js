import CesiumView from './osh-js/source/core/ui/view/map/CesiumView.js';
import {
    Cartesian3,
    CesiumTerrainProvider,
    Cesium3DTileset,
    EllipsoidTerrainProvider,
    Ion,
    IonResource
} from 'cesium';
import * as Cesium from "cesium";
import SosGetResultJson from "./osh-js/source/core/datasource/SosGetResultJson";
import PointMarkerLayer from "./osh-js/source/core/ui/layer/PointMarkerLayer";
import PolygonLayer from "./osh-js/source/core/ui/layer/PolygonLayer";
import FFMPEGView from "./osh-js/source/core/ui/view/video/FFMPEGView";
import SosGetResultVideo from "./osh-js/source/core/datasource/SosGetResultVideo";
import ChartJsView from './osh-js/source/core/ui/view/chart/ChartJsView.js';
import CurveLayer from './osh-js/source/core/ui/layer/CurveLayer.js';
import DataSynchronizer from './osh-js/source/core/timesync/DataSynchronizer'

window.CESIUM_BASE_URL = './';

Ion.defaultAccessToken = '';

let server = "ogct17.georobotix.io:8443/sensorhub/sos";
let start = "now";
let end = "2100-01-01Z";
let offeringId = "urn:osh:sensor:uas:predator001";
let locProperty = "http://www.opengis.net/def/property/OGC/0/SensorLocation";
let orientationProperty = "http://www.opengis.net/def/property/OGC/0/PlatformOrientation";

let dataSources = [];

// UAV

// -------- UAV LOCATION AND ORIENTATION
let uavLocDataSource = new SosGetResultJson("UAV-Location", {
    protocol: "wss",
    service: "SOS",
    endpointUrl: server,
    offeringID: offeringId,
    observedProperty: locProperty,
    startTime: start,
    endTime: end,
});

dataSources.push(uavLocDataSource);
// uavLocDataSource.connect();

let uavAttitudeDataSource = new SosGetResultJson("UAV-Attitude", {
    protocol: "wss",
    service: "SOS",
    endpointUrl: server,
    offeringID: offeringId,
    observedProperty: orientationProperty,
    startTime: start,
    endTime: end,
});

dataSources.push(uavAttitudeDataSource);
// uavAttitudeDataSource.connect();

// style it with a moving point marker
let uavPointMarker = new PointMarkerLayer({
    labelOffset: [0, -30],
    getLocation: {
        dataSourceIds: [uavLocDataSource.getId()],
        handler: function (rec){
            return{
                x: rec.location.lon,
                y: rec.location.lat,
                z: rec.location.alt
            }
        }

    },
    getOrientation: {
        dataSourceIds: [uavAttitudeDataSource.getId()],
        handler: function (rec){
            return{
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

let uavVideoDS = new SosGetResultVideo("UAV-Video",{
    protocol: "wss",
    service: "SOS",
    endpointUrl: server,
    offeringID: offeringId,
    observedProperty: "http://sensorml.com/ont/swe/property/VideoFrame",
    startTime: start,
    endTime: end,
})

let uavVideo = new FFMPEGView({
    container: 'video-window',
    css: 'video-h264',
    name: 'UAV Video',
    framerate:25,
    showTime: false,
    showStats: false,
    dataSourceId: uavVideoDS.id
})

dataSources.push(uavVideoDS);
// uavVideoDS.connect();

// ------- UAV ALTITUDE - CHART ------- //

// #region snippet_curve_layer
let altitudeLayerCurve = new CurveLayer({
    dataSourceId: uavLocDataSource.id,
    getValues: (rec, timeStamp) => {
        return {
            x: timeStamp,
            y: rec.location.alt
        }
    },
    name: 'ALTITUDE'
});
// #endregion snippet_curve_layer

// show it in video view
let altitudeChartView = new ChartJsView({
    container: 'alt-chart-window',
    layers: [ altitudeLayerCurve],
    css: "chart-view",
    chartjsProps: {
        chartProps: {
            scales: {
                yAxes: [{
                    scaleLabel: {
                        labelString: "Altitude"
                    },
                    ticks: {
                        maxTicksLimit: 5
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        labelString: "Time"
                    },
                    ticks: {
                        maxTicksLimit: 7
                    }
                }],
            }
        },
        datasetsProps: {
            backgroundColor: 'rgba(141,242,246, 0.1)'
        }
    }
});

// ------- UAV Field of Regard ------- //

let uavForDataSource = new SosGetResultJson("UAV-FOR", {
    protocol: "wss",
    service: "SOS",
    endpointUrl: server,
    offeringID: "urn:osh:process:georef",
    observedProperty: "http://sensorml.com/ont/misb0601/property/GeoRefImageFrame",
    startTime: start,
    endTime: end,
});

dataSources.push(uavForDataSource);
// uavForDataSource.connect();

let boundedDrapingLayer = new PolygonLayer({
    opacity: .5,
    getVertices: {
        dataSourceIds: [uavForDataSource.getId()],
        handler: function (rec){
            return [
                rec.ulc.lon,
                rec.ulc.lat,
                rec.llc.lon,
                rec.llc.lat,
                rec.lrc.lon,
                rec.lrc.lat,
                rec.urc.lon,
                rec.urc.lat,
            ];
        }
    },
});

// ------- UAV Tracking Target ------- //

let suvForDataSource = new SosGetResultJson("SUV-TARGET", {
    protocol: "wss",
    service: "SOS",
    endpointUrl: server,
    offeringID: "urn:osh:process:vmti",
    observedProperty: "http://sensorml.com/ont/swe/property/TargetLocation",
    startTime: start,
    endTime: end,
});

dataSources.push(suvForDataSource);
// suvForDataSource.connect();

// style it with a moving point marker
let suvPointMarker = new PointMarkerLayer({
    labelOffset: [0, -30],
    getLocation: {
        dataSourceIds: [suvForDataSource.getId()],
        handler: function (rec){
            return{
                x: rec.location.lon,
                y: rec.location.lat,
            }
        }

    },
    icon: 'images/suv.glb',
    iconSize: [32, 64],
    name: "SUV Location",
    label: "SUV",
    iconScale: .0000000000001,
    color: '#FFFFFF',
    opacity: .25,
    orientation: {
        heading: 90
    }
});

// #region snippet_cesium_location_view
// create Cesium view
let cesiumView = new CesiumView({
    container: 'cesium-container',
    cesiumProps: {
        viewerProps :{ 
            baseLayerPicker: true,
            // imageryProviderViewModels: imageryProviders,
            // selectedImageryProviderViewModel: imageryProviders[6],
            timeline: true,
            homeButton: false,
            navigationInstructionsInitiallyVisible: false,
            navigationHelpButton: false,
            geocoder: true,
            fullscreenButton: false,
            showRenderLoopErrors: true,
            animation: true,
            scene3DOnly: true, // for draw layer
            }
    },
    layers: [uavPointMarker, boundedDrapingLayer, suvPointMarker]
});

// cesiumView.viewer.terrainProvider = new CesiumTerrainProvider({
//     url: IonResource.fromAssetId(1,
//         {accessToken: Ion.defaultAccessToken}
//     ),
//     requestWaterMask: true,
//     requestVertexNormals: true
//   });
//
//   cesiumView.viewer.imageryLayers.addImageryProvider(
//       new Cesium.TileMapServiceImageryProvider({
//         url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
//       })
//   );
//
//   cesiumView.viewer.scene.primitives.add(
//       new Cesium3DTileset({
//         url: IonResource.fromAssetId(596882,
//             {accessToken: Ion.defaultAccessToken}
//         )
//       }));

  cesiumView.viewer.camera.setView({
    destination: Cartesian3.fromDegrees(-86.67128902952935, 34.70690480206765, 10000)
  });

// start streaming
let masterTimeController = new DataSynchronizer({
    replaySpeed: 1,
    intervalRate: 5,
    dataSources: dataSources
  });

masterTimeController.connect();
