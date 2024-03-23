class NexradSites {
    constructor() {

       this.init();
    }

    init() {
        let foiReqUrl = 'http://76.187.247.4:8282/sensorhub/sos?service=SOS&version=2.0&request=GetFeatureOfInterest&responseFormat=application/json';
        // // let foiReqUrl = 'http://localhost:8282/sensorhub/sos?service=SOS&version=2.0&request=GetFeatureOfInterest&responseFormat=application/json';

        fetch(foiReqUrl).then((response) => response.json()).then((json) => {
            console.log(json);
            this.sites = json;
        });
    }

    getSite(id) {
        let site =  this.sites.find(s => s.properties.name === id);
        console.log('getSite(): site = ' + site.properties.name);
        return site;
    }

    getSiteLocation(id) {
        let site =  this.getSite(id);
        if(!site) {
            console.log('nv.gsl: cannot find site for ' + id);
            return;
        }
        return {
            x: site.geometry.coordinates[0],
            y: site.geometry.coordinates[1],
            z: site.geometry.coordinates[2]
        };
    }

}
export default NexradSites;
