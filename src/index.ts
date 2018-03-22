import request = require("request-promise-native")

export class SimpleHTTPSwitch {
    private status_url: string
    private set_on_url: string
    private set_off_url: string
    private on_if_this: string
    private off_if_this: string
    private log: any
    private http_method: any
    private default_state_off: any
    private name: any
    constructor(log: any, config: any) {
        this.log = log
        /*
            example_config = {
                "status_url":"http://192.168.1.14:8081/status/power_stat",
                "set_on_url":"http://192.168.1.14:8081/send/KEY_POWER",
                "set_off_url":"http://192.168.1.14:8081/send/KEY_POWER2",
                "on_if_this": "ON",
                "off_if_this": "OFF",
                "name": "Anlage"
            }
        */

        // URLs
        this.status_url = config["status_url"]
        this.set_on_url = config["set_on_url"]
        this.set_off_url = config["set_off_url"]

        // HTTP Stuff
        this.http_method = config["http_method"] || "GET"

        // State Stuff
        this.on_if_this = config["on_if_this"]
        this.off_if_this = config["off_if_this"]

        // General
        this.name = config["name"]
    }
    makeRequest(url: string) {
        return request(url, {
            method: this.http_method,
            json: true
        })
    }
    getPowerState(callback: (error: Error | null, state?: boolean) => void) {
        this.makeRequest(this.status_url)
            .then(res => {
                let ret = JSON.parse(res.body)
                if (ret == this.on_if_this) {
                    callback(null, true)
                } else if (ret == this.off_if_this) {
                    callback(null, false)
                } else {
                    callback(Error("Status not known"))
                }
                this.log(
                    `[${this.name}] HTTP power state get function succeeded! (${
                        res.body
                    })`
                )
            })
            .catch(err => {
                this.log(
                    `[${
                        this.name
                    }] HTTP power power state get function failed! (${err})`
                )
                callback(err)
            })
    }
    getServices() {
        let informationService = new Service.AccessoryInformation()

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Dock51 UG")
            .setCharacteristic(Characteristic.Model, "Dock51 HTTP Switch")
            .setCharacteristic(Characteristic.SerialNumber, "de.dock51.mk1")

        let switchService = new Service.Switch()
        switchService
            .getCharacteristic(Characteristic.On)
            .on("get", this.getPowerState.bind(this))
            .on("set", this.setPowerState.bind(this))

        return [switchService]
    }

    setPowerState(powerOn: boolean, callback: (error?: Error) => void) {
        let body

        this.makeRequest(powerOn ? this.set_on_url : this.set_off_url)
            .then(res => {
                this.log(
                    `[${this.name}] HTTP power function succeeded! (${
                        res.body
                    })`
                )
                callback()
            })
            .catch(err => {
                this.log("HTTP power function failed")
                callback(err)
            })
    }
    identify(callback: (error?: Error) => void) {
        this.log("Identify requested!")
        callback() // success
    }
}

var Service: any, Characteristic: any
export default function(homebridge: any) {
    let hap = homebridge.hap
    Service = hap.Service
    Characteristic = hap.Characteristic
    homebridge.registerAccessory(
        "homebridge-http-simple-switch",
        "SimpleHttpSwitch",
        SimpleHTTPSwitch
    )
}