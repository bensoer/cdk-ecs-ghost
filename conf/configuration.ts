import { Defaults } from '../lib/conf/defaults'
import { Settings } from "../lib/conf/settings"



export class Configuration extends Defaults {

    public getSettings(): Settings {
        const defaults = super.getSettings()

        defaults.domainName = 'localhost' // specify your domain name here

        /**
         * Change and overwrite any default settings here before returning the Settings object.
         * To see defaults, see lib/conf/configuration-defaults.ts
         * For a breakdown of all settings, see lib/conf/settings.ts
         */

        return defaults
    }

}