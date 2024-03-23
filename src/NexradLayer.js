import Layer from 'osh-js/source/core/ui/layer/Layer';
import {assertObject, hasValue, isDefined} from 'osh-js/source/core/utils/Utils';

class NexradLayer extends Layer {
    constructor(properties) {
        super(properties);
        this.type = 'nexrad';
    }
    // call by super class
    init(properties=this.properties) {
        super.init(properties);
        const props = {
            siteId: null,
            location: null,
            productTime: null,
            azimuth: null,
            elevation: null,
            elevationNumber: null,
            rangeToCenterOfFirstRefGate: null,
            refGateSize: null,
            reflectivity: null
        };

        if (hasValue(properties.siteId)) {
            props.siteId = properties.siteId;
        }

        if (hasValue(properties.location)) {
            assertObject(properties.location, "location");
            props.location = properties.location;
        }

        if (isDefined(properties.azimuth)) {
            props.azimuth = properties.azimuth;
        }

        if (isDefined(properties.elevation)) {
            props.elevation = properties.elevation;
        }

        if (isDefined(properties.elevationNumber)) {
            props.elevationNumber = properties.elevationNumber;
        }

        if (isDefined(properties.rangeToCenterOfFirstRefGate)) {
            props.rangeToCenterOfFirstRefGate = properties.rangeToCenterOfFirstRefGate;
        }

        if (isDefined(properties.refGateSize)) {
            props.refGateSize = properties.refGateSize;
        }

        if (isDefined(properties.reflectivity)) {
            props.reflectivity = properties.reflectivity;
        }

        this.definedId('nexradId', props);

        if (this.checkFn("getSiteId")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('siteId',await this.getFunc('getSiteId')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getSiteId'), fn);
        }

        if (this.checkFn("getElevationNumber")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('elevationNumber',await this.getFunc('getElevationNumber')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getElevationNumber'), fn);
        }

        if (this.checkFn("getLocation")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('location',await this.getFunc('getLocation')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getLocation'), fn);
        }

        if (this.checkFn("getAzimuth")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('azimuth',await this.getFunc('getAzimuth')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getAzimuth'), fn);
        }

        if (this.checkFn("getElevation")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('elevation',await this.getFunc('getElevation')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getElevation'), fn);
        }

        if (this.checkFn("getRangeToCenterOfFirstRefGate")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('rangeToCenterOfFirstRefGate',await this.getFunc('getRangeToCenterOfFirstRefGate')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getRangeToCenterOfFirstRefGate'), fn);
        }

        if (this.checkFn("getRefGateSize")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('refGateSize',await this.getFunc('getRefGateSize')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getRefGateSize'), fn);
        }

        if (this.checkFn("getReflectivity")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('reflectivity',await this.getFunc('getReflectivity')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getReflectivity'), fn);
        }

        if (this.checkFn("getProductTime")) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('productTime',await this.getFunc('getProductTime')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getProductTime'), fn);
        }
    }
}

export default NexradLayer;
