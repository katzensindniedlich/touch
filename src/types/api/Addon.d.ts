import type { ComponentType, JSX } from 'react'


/**
 * The base data of an addon in Betterdiscord.
 */
export interface AddonBaseData {
    /**
     * The author of the addon.  
     * If not specified, *Unknown Author* will be translated appropriately and used instead.
     */
    readonly author: string

    /**
     * The version of the addon.  
     * If not specified, *???* will be used instead.
     */
    readonly version: string

    /**
     * The description of the addon.  
     * If not specified, *Description not provided.* will be translated appropriately and used instead.
     */
    readonly description: string

    /**
     * The id of the addon.  
     * Equal to {@link AddonData.name} when specified, else {@link AddonData.filename}.
     */
    readonly id: string

    /**
     * The slug of {@link AddonData.filename}.
     */
    readonly slug: string

     /**
      * The filename of the addon with extension.
      */
    readonly filename: string

    /**
     * Represents the timestamp when the addon file was created since the POSIX epoch, in milliseconds.  
     * Equal to `fs.statSync(filename).atimeMs`
     */
    readonly added: number

    /**
     * Represents the timestamp when the addon file is modified last time since the POSIX epoch, in milliseconds.  
     * Equal to `fs.statSync(filename).mtimeMs`
     */
    readonly modified: number

    /**
     * The size of the addon file in bytes.  
     * Equal to `fs.statSync(filename).size`
     */
    readonly size: number

    /**
     * Indicates that the addon could not be loaded successfully.
     */
    readonly partial?: true

    /**
     * The name of the addon.  
     * Optional with format `jsdoc`.
     */
    readonly name?: string

    /**
     * The format of the addon metadata.
     */
    readonly format: 'json' | 'jsdoc'

    /**
     * Additional userdefined addon metadata, could be empty.  
     * Old metadata with format `json` is loaded with `JSON.parse`.  
     * New `jsdoc` metadata are only readed and not interpreted.
     */
    readonly [key: string]: unknown
}


/**
 * The interal data of an addon in Betterdiscord.
 */
export interface AddonData extends AddonBaseData {
    /**
     * The content of the addon file, utf8 encoded.
     */
    readonly fileContent: string
}


/**
 * Cant use Omit with index signatures sadly,
 * so a little workaround.
 */
interface _NamedAddonBase extends AddonBaseData  {
    /**
     * The name of the addon.
     */
    readonly name: string
}


/**
 * Plugin metadata, that will be passed to the
 * {@link PluginData.exports | exported object} of the plugin-file.
 */
export interface PluginMetadata extends _NamedAddonBase {}


/**
 * BetterDiscords internal theme data.
 */
export interface ThemeData extends _NamedAddonBase {
    /**
     * The css content of the addon file,
     * similar to {@link AddonData.fileContent}.
     */
    readonly css: string
}


/**
 * The plugin thats expected to be exported from the plugin-file.
 */
export interface PluginInterface {
    /**
     * A method to overwrite {@link PluginData.name}.
     * @deprecated
     * @returns The new name.
     */
    getName?(): string

    /**
     * A method to overwrite {@link PluginData.author}.
     * @deprecated
     * @returns The new name of the author.
     */
    getAuthor?(): string

    /**
     * A method to overwrite {@link PluginData.description}.
     * @deprecated
     * @returns The new Description.
     */
    getDescription?(): string

    /**
     * A method to overwrite {@link PluginData.version}.
     * @deprecated
     * @returns The new version.
     */
    getVersion?(): string

    /**
     * Called from BetterDiscord when the plugin is activated (including after reloads).
     */
    start(): void

    /**
     * Called from BetterDiscord when the plugin is deactivated.
     */
    stop(): void

    /**
     * Called from BetterDiscord when the plugin is loaded.
     * @deprecated
     */
    load?(): void

    /**
     * This function allows your plugins to have a settings panel displayed through BetterDiscord.
     * @returns Either an HTMLElement or a React element.
     */
    getSettingsPanel?(): HTMLElement | JSX.Element | ComponentType

    /**
     * This function is called from BetterDiscord on every mutation of the document.
     */
    observer?(mutation: MutationRecord): void

    /**
     * This function is called from BetterDiscord every time the view is *switched*.  
     * A better way to look at this is every time the user navigates such as changing the channel or server.
     */
    onSwitch?(): void
}


interface ExternalPlugin extends PluginInterface {
    /**
     * External plugin properties, unknown.
     */
    [key: string]: unknown
}


/**
 * A class constructing a BetterDiscord plugin.
 */
export interface PluginClass<
    Prototype extends PluginInterface = PluginInterface
> {
    prototype: Prototype
    new (meta: PluginMetadata): Prototype
}


interface ExternalPluginClass extends PluginClass<ExternalPlugin> {
    /**
    * External plugin class properties, unknown.
    */
    [key: string]: unknown
}


/**
 * The expected plugin file export.
 */
export type PluginExport<
    interface extends PluginInterface = PluginInterface,
    Class extends PluginClass = PluginClass<interface>
> = (
    Class | ((meta: PluginMetadata) => interface)
)


/**
 * The interal data of a plugin installed in Betterdiscord.  
 * Also contains all properties from the plugin metadata comment.  
 * Instances are accessible through the {@link BdApi.Plugins} API.
 */
export interface PluginData extends _NamedAddonBase {
    /**
     * The exports of the plugin-file.
     */
    exports: PluginExport<ExternalPlugin, ExternalPluginClass>

    /**
     * The created Instance of the exported plugin from {@link PluginData.exports}.
     */
    instance: ExternalPlugin
}


/**
 * `AddonAPI` is a utility class for working
 * with {@link PluginData | Plugins} and {@link ThemeData | Themes} ({@link AddonData | Addons}).  
 * Instances are accessible through {@link BdApi.Plugins} and {@link BdApi.Themes}.
 *
 * @see https://docs.betterdiscord.app/api/addonapi
 */
export interface AddonAPI<AddonType extends AddonBaseData = AddonData> {
    /**
     * The path to the addon folder.
     * @readonly
     */
    get folder(): string

    /**
     * Disables the given addon.
     * @param addon - {@link AddonData.id}, {@link AddonData.filename} or addon object.
     */
    disable(addon: string | AddonType): void

    /**
     * Enables the given addon.
     * @param addon - {@link AddonData.id}, {@link AddonData.filename} or addon object.
     */
    enable(addon: string | AddonType): void

    /**
     * Gets a particular addon.
     * @param addon - {@link AddonData.id} or {@link AddonData.filename}.
     * @returns Addon instance when found.
     */
    get(addon: string): AddonType | undefined

    /**
     * Gets all addons of this type.
     * @returns Array of all addon instances.
     */
    getAll(): AddonType[]

    /**
     * Determines if a particular adon is enabled.
     * @param addon - {@link AddonData.id} or {@link AddonData.filename}.
     */
    isEnabled(addon: string): boolean

    /**
     * Reloads if a particular addon is enabled.
     * @param addon - {@link AddonData.id}, {@link AddonData.filename} or addon object.
     * @returns False when cloud not unloaded or not found, or may thrown Error, otherwise void.
     */
    reload(addon: string | AddonType): false | Error | undefined

    /**
     * Toggles if a particular addon is enabled.
     * @param addon - Just the {@link AddonData.id}.
     */
    toggle(addon: string): void
}


/**
 * A utility class for working with {@link ThemeData | Themes}.  
 * Instance is accessible with {@link BdApi.Themes}.
 */
export type ThemesAPI = AddonAPI<ThemeData>


/**
 * A utility class for working with {@link PluginData | Plugins}.  
 * Instance is accessible with {@link BdApi.Plugins}.
 */
export type PluginsAPI = AddonAPI<PluginData>