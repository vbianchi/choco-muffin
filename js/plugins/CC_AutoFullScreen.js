/*:
@author Coelocanth
@plugindesc Start game in full screen mode.
@target MZ

@help This plugin lets you start the game in full screen.

Use the plugin parameters to set the default to full screen or windowed, and
customise the menu option to give the player control over this setting.

ISC License

Copyright (c) 2020, Coelocanth

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

@param default
@text default full screen
@type boolean
@on full screen
@off windowed
@default true

@param Scene_Options
@text options menu

@param optionCommandEnable
@parent Scene_Options
@text add full screen option
@type boolean
@default true

@param textOptionCommand
@parent Scene_Options
@text option name
@default Full Screen

*/
var Imported = Imported || {};
Imported["CC_AutoFullScreen"] = true;
(() => {
    const params = PluginManager.parameters("CC_AutoFullScreen");

    _Scene_Boot_resizeScreen = Scene_Boot.prototype.resizeScreen;
    Scene_Boot.prototype.resizeScreen = function() {
        _Scene_Boot_resizeScreen.call(this);
        if(ConfigManager.ccFullScreen) {
            Graphics._requestFullScreen();
        }
    }

    if(eval(params["optionCommandEnable"])) {
        _Scene_Options_maxCommands = Scene_Options.prototype.maxCommands;
        Scene_Options.prototype.maxCommands = function() {
            return _Scene_Options_maxCommands.call(this) + 1;
        }

        _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
        Window_Options.prototype.addGeneralOptions = function() {
            _Window_Options_addGeneralOptions.call(this);
            this.addCommand(params["textOptionCommand"], "ccFullScreen");
        }

        _Window_Options_setConfigValue = Window_Options.prototype.setConfigValue;
        Window_Options.prototype.setConfigValue = function(symbol, value) {
            if(symbol === "ccFullScreen") {
                if(value && !Graphics._isFullScreen()) {
                    Graphics._requestFullScreen();
                }
                if(!value && Graphics._isFullScreen()) {
                    Graphics._cancelFullScreen();
                }
            }
            _Window_Options_setConfigValue.apply(this, arguments);
        }
    }

    // This default when there is no config
    ConfigManager.ccFullScreen = eval(params["default"]);

    _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        var config = _ConfigManager_makeData.call(this);
        config.ccFullScreen = this.ccFullScreen;
        return config;
    }

    _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        // This default when there is config but the setting is missing
        this.ccFullScreen = this.readFlag(config, "ccFullScreen", eval(params["default"]));
    }

})();
