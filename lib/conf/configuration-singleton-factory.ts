import { Configuration } from "../../conf/configuration"
import { AbstractConfiguration } from "./abstract-configuration"

export class ConfigurationSingletonFactory {
    private static instance?:AbstractConfiguration

    private constructor(){

    }

    public static getInstance(): AbstractConfiguration{
        if(ConfigurationSingletonFactory.instance == undefined){
            ConfigurationSingletonFactory.instance = new Configuration()
        }
        return ConfigurationSingletonFactory.instance
    }
}