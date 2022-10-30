import { Settings } from "./settings";

export abstract class AbstractConfiguration {
    public abstract getSettings(): Settings
}