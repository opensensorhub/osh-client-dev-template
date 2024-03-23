// @ts-ignore
import {
    Cartesian3,
    Cartographic,
    Color,
    HeadingPitchRoll,
    Ion,
    Matrix3,
    SceneMode,
    Transforms,
    Terrain,
    PointPrimitiveCollection
} from '@cesium/engine';
import '@cesium/engine/Source/Widget/CesiumWidget.css';
// @ts-ignore
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView.js';
import { isDefined } from 'osh-js/source/core/utils/Utils';

class NexradView extends CesiumView {
    constructor(properties) {
        super({
            supportedLayers: ['marker', 'drapedImage', 'polyline', 'ellipse', 'polygon', 'coplanarPolygon', 'frustum', 'nexrad'],
            ...properties
        });
    }
    beforeAddingItems(options) {
        super.beforeAddingItems(options);
        this.reflectivityColorMap = [
            Color.fromBytes(100, 100, 100),
            Color.fromBytes(204, 255, 255),
            Color.fromBytes(204, 153, 204),
            Color.fromBytes(153, 102, 153),
            Color.fromBytes(102, 51, 102),
            Color.fromBytes(204, 204, 153),
            Color.fromBytes(153, 153, 102),
            Color.fromBytes(100, 100, 100),
            Color.fromBytes(4, 233, 231),
            Color.fromBytes(1, 159, 244),
            Color.fromBytes(3, 0, 244),
            Color.fromBytes(2, 253, 2),
            Color.fromBytes(1, 197, 1),
            Color.fromBytes(0, 142, 0),
            Color.fromBytes(253, 248, 2),
            Color.fromBytes(229, 188, 0),
            Color.fromBytes(253, 149, 0),
            Color.fromBytes(253, 0, 0),
            Color.fromBytes(212, 0, 0),
            Color.fromBytes(188, 0, 0),
            Color.fromBytes(248, 0, 253),
            Color.fromBytes(152, 84, 198),
            Color.fromBytes(253, 253, 253)
        ];

        // Some of this is handled by siteMap now and can be removed
        this.pointCollection = new PointPrimitiveCollection();
        this.viewer.scene.primitives.add(this.pointCollection);
        this.radialSet = new Set();
        this.radialCount = 0;
        this.prevElevation = 0.0;
        this.elevationNumber = 0;
        this.prevElevationNumber;
        // Using elevations from GR2 analyst (they round to tenths)- the actual elevation value returned with each radial
        // may vary from these values slightly, especially when radar is changing elevations
        // Also these values are specific to VCP 212 and 215 (precip modes), 
        // so need to figure out how to cleanly support other VCP modes (clear air)
        this.elevations = [0.5, 0.9, 1.3, 1.8, 2.4, 3.1, 4.0, 5.1, 6.4, 8.0, 10.0, 12.4, 15.6, 19.5];

        // Initialize siteMap and state
        this.siteMap = new Map();
        let siteState = this.addSite(this.properties.activeSite);
        siteState.activeElevationNumber = this.properties.activeElevation;
    }

    Radials(elevationNumber, elevationAngle, radials) {
        this.elevationNumber = elevationNumber;
        this.elevationAngle = elevationAngle;
        this.radials = radials;
    }

    async setData(dataSourceId, data) {
        const values = data.values;
        for (let i = 0; i < values.length; i++) {
            const d = values[i];
            if (data.type === 'nexrad') {
                await this.updateNexrad(d);
            }
        }
    }

    addSite(siteId) {
        let siteState = {
            activeElevationNumber: 1, // use if only one elevation
            prevElevationNumber: 0,
            radials: null
        }
        this.siteMap.set(this.activeSite, siteState);
        siteState.radials = new Set();
        return siteState;
    }

    async updateNexrad(props) {
        if (!isDefined(props.location)) {
            return;
        }

        if (props.siteId.localeCompare(this.activeSite)) {
            // console.log('checkSite: ' + props.stieId + ' != ' + this.activeSite);
            return;
        }

        let siteState = this.siteMap.get(this.activeSite);
        if (!siteState) {
            console.log('activeSite not in siteMap. Adding now: ') + this.activeSite;
            siteState = this.addSite(this.activeSite);
        }

        let DTR = Math.PI / 180;

        // Check for elevation change
        if (props.elevationNumber != siteState.prevElevationNumber) {
            // console.log('NexradView elevation change: ' + props.elevationNumber + ", " + siteState.prevElevationNumber);
            if (props.elevationNumber == 1) {
                console.log('NexradView volume change');  // check this condition
                // TODO FIX for new ptprim collection
                if (siteState.radials) {
                    siteState.radials.forEach(radial => {
                        this.viewer.scene.primitives.remove(radial);
                    });
                }
                siteState.radials = new Set();
                //
                this.pointCollection.removeAll();
            }
        }
        this.prevElevation = props.elevation;
        siteState.prevElevationNumber = props.elevationNumber;

        // Check if this elevation should be rendered and return if not
        if (siteState.activeElevationNumber == 1 && props.elevationNumber > 1) 
            return;

        // create Transform from Radar coords to ECEF
        let radarLoc = Cartesian3.fromDegrees(props.location.x, props.location.y, props.location.z);
        // var lla = Cartographic.fromCartesian(radarLoc);
        let verticalScale = 3.0;
        let quat = Transforms.headingPitchRollQuaternion(radarLoc,
            new HeadingPitchRoll((props.azimuth - 90) * DTR, (props.elevation * verticalScale * DTR)));
        let rotM = Matrix3.fromQuaternion(quat);

        let points = new PointPrimitiveCollection();
        let dist0 = props.rangeToCenterOfFirstRefGate;
        let step = props.refGateSize;

        for (let i = 0; i < props.reflectivity.length; i++) {

            let val = props.reflectivity[i];

            // min lower value is -32, but raising lower thereshold here masks out lower values and
            // makes display a little cleaner
            // if (val < -32 || val > 94.5) {
            if (val < 10 || val > 94.5) {
                continue;
            }

            let gatePos = new Cartesian3(dist0 + i * step, 0, 0);
            Matrix3.multiplyByVector(rotM, gatePos, gatePos);

            //  points is pointPrimitive collection of all points along a single radial
            // points.add({
            this.pointCollection.add({
                position: Cartesian3.add(radarLoc, gatePos, gatePos),
                color: this.getReflectivityColor(val),
                pixelSize: 5
            });
        }

        // this.radialCount++;
        // siteState.radials.add(points);
        // this.viewer.scene.primitives.add(points);  
        this.viewer.scene.requestRender();

        let productTime = document.getElementById('product-time');
        productTime.innerHTML = 'Product Time: ' + props.productTime;

        // if (this.pointCollection.length % 1000 == 0)
            // console.log('\t** numPoints: ' + this.pointCollection.length);
    }

    getReflectivityColor(val) {
        let index = Math.floor((val + 30) / 5) + 1;
        return this.reflectivityColorMap[index];
    }

    setElevationNumber(elevationNumber) {
        let currentSite = this.siteMap.get(this.activeSite);
        if(!currentSite) {
            currentSite = this.addSite(this.activeSite);
        }
        currentSite.activeElevationNumber = elevationNumber;
        //
        if(currentSite) {
            console.log('Remove old radials from ' + this.activeSite);
            if (currentSite.radials) {
                currentSite.radials.forEach(radial => {
                    this.viewer.scene.primitives.remove(radial);
                });
                this.viewer.scene.requestRender();
            }
            currentSite.radials = new Set();
        }
    }

    setActiveSite(site) {
        // remove existing radials
        let currentSite = this.siteMap.get(this.activeSite);
        if(currentSite) {
            this.pointCollection.removeAll();

            // console.log('Remove old radials from ' + this.activeSite);
            // if (currentSite.radials) {
            //     currentSite.radials.forEach(radial => {
            //         this.viewer.scene.primitives.remove(radial);
            //     });
            //     this.viewer.scene.requestRender();
            // }
            // currentSite.radials = new Set();

        }

        this.activeSite = site;
        //console.log('Site changed: ' + event.target.value);

        let siteState = this.siteMap.get(this.activeSite);
        if (!siteState) {
            console.log('activeSite not in siteMap. Adding now: ') + this.activeSite;
            siteState = {
                activeElevationNumber: 0, // use if only one elevation
                prevElevationNumber: 0,
                radials: null
            }
            siteState.radials = new Set();
            this.siteMap.set(this.activeSite, siteState);
        }

    }

    // TODO: support various VCP modes
    // getClosestElevation(actualEl) {
    //     let prevDelta = 1000.0; 
    //     this.elevations.forEach(vcpEl => {
    //         var delta = Math.abs(actualEl - vcpEl);
    //         if(delta)
    //     }); 
    // }
}

export default NexradView;