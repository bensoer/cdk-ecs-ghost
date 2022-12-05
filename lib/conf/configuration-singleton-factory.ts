import { Settings } from "./settings"
import { Configuration } from "../../conf/configuration"
import { ISettings } from "./isettings"


/**
 * ConfigurationSingletonFactory is a singleton that resolves Configuration settings
 * for a given stack. As a Singleton, configuration can be imported from anywhere,
 * provided the given account and region are given. A unique Configuration, for each account
 * and region is returned, but always the same one for the same account and region
 * combination
 * 
 * Essentially, account and region specific configurations can be accessed from
 * anywhere in the code project
 */
export class ConfigurationSingletonFactory {

    private static instanceMap: Map<string, ISettings<Settings>> = new Map<string, ISettings<Settings>>()

    private constructor(){

    }

    public static getInstance(account:string, region:string): ISettings<Settings>{
        if(!ConfigurationSingletonFactory.instanceMap.has(`${account}-${region}`)){
            ConfigurationSingletonFactory.instanceMap.set(`${account}-${region}`, new Configuration())
        }
        return ConfigurationSingletonFactory.instanceMap.get(`${account}-${region}`)!
    }
}