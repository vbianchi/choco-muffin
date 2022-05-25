// ==================================================
// Cae_DashOpts.js
// ==================================================

/**
 * @file Cae_DashOpts.js (RMMZ)
 * Dash options: speed, frame-skip, event dashing, etc.
 * @author Caethyril
 * @version 1.0
 */

//#region Plugin header
/*:
 * @target MZ
 * @plugindesc v1.0 - Dash options: speed, frame-skip, event dashing, etc.
 * @author Caethyril
 * @url https://forums.rpgmakerweb.com/index.php?threads/caethyrils-mz-plugins.125657/
 * 
 * @help Features:
 *   Each feature is optional!
 * 
 *    - Set how much faster dashing characters move.
 *       -> Change this mid-game with a plugin command.
 *       -> Change this per-character with script calls.
 *      (Note that setting dash speed to 0 effectively disables dashing.)
 *    - Tell events to start/stop dashing with a script call.
 *    - Dashing characters can skip the standing frame of their walk animation.
 * 
 * Script calls:
 * 
 *   In a move route:
 *      this._dashSpeed = 2;
 *        - the moved character will now move at +2 speed when dashing
 *      this._isDashing = true;
 *        - the moved character will dash until further notice
 *        - swap "true" for "false" to stop dashing
 *        - this only applies to non-player characters
 * 
 *   In a Script command:
 *      this.character(0)._dashSpeed = 0.5;
 *        - "This Event" will now move at +0.5 speed when dashing
 *      this.character(5)._isDashing = true;
 *        - event ID 5 will dash until further notice
 * 
 *   Note that typically events will reset when the player leaves the map.
 * 
 * Plugin Command:
 *   Set Dash Speed   - set the default dash speed mid-game.
 *   Reset Dash Speed - reset the default dash speed to the parameter value.
 *
 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Terms of use:
 *   This plugin is free to use and/or modify, under these conditions:
 *     - None of the original plugin header is removed.
 *     - Credit is given to Caethyril for the original work.
 * 
 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Compatibility:
 *   Overrides: Game_CharacterBase:
 *                realMoveSpeed
 *              Game_Player:
 *                realMoveSpeed
 *   Aliases:   Game_CharacterBase:
 *                updatePattern, isDashing
 *              DataManager:
 *                createGameObjects, makeSaveContents, extractSaveContents
 *   This plugin adds data to save files iff its Add Save Data param = true.
 * 
 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Changelog:
 *   v1.0 (2020-09-13): Initial release! Rewrite/extension of my RMMV snippets.
 * 
 * @command Set Dash Speed
 * @desc Sets the default dash speed.
 * 
 * @arg Value
 * @type number
 * @min -20
 * @max  20
 * @decimals 2
 * @desc Additional speed applied when dashing. 0 = no dashing.
 * Default: 1
 * @default 1.00
 * 
 * @command Reset Dash Speed
 * @desc Resets the dash speed to the plugin parameter value.
 * 
 * @param Dash Extra Speed
 * @type number
 * @min -20
 * @max  20
 * @decimals 2
 * @desc Additional speed applied when dashing. 0 = no dashing.
 * Default: 1
 * @default 1.00
 * 
 * @param Skip Standing Frame
 * @type boolean
 * @desc If true, dashing characters will skip the standing frame of their walking animation.
 * @default false
 * 
 * @param Add Save Data
 * @type boolean
 * @desc If true, the dash speed value will be saved.
 * Unnecessary unless using the plugin command.
 * @default false
 * 
 * @param --- Advanced ---
 * @type select
 * @desc Advanced internal configuration options.
 * 
 * @param Property: dashSpeed
 * @parent --- Advanced ---
 * @type string
 * @desc Name of the property used to store a character's personal dash speed.
 * @default _dashSpeed
 * 
 * @param Property: isDashing
 * @parent --- Advanced ---
 * @type string
 * @desc Name of the property used to store whether a NPC is dashing or not.
 * @default _isDashing
 * 
 * @param Property: Save
 * @parent --- Advanced ---
 * @type string
 * @desc Name of the property used to save data to file.
 * @default Cae_DashOpts
 */
//#endregion

(function() {
'use strict';

    const NAMESPACE   = 'DashOpts';
    const PLUGIN_NAME = 'Cae_' + NAMESPACE;
    const ERR_PRE     = PLUGIN_NAME + '.js ';
    const ERR_NOPARAM = ERR_PRE + 'could not find its parameters!\nCheck the plugin file is named correctly and try again.';
    const WARN_BADVAL = ERR_PRE + 'could not use value "%1" for %2 "%3". Reverting to default: "%4".';

    window.CAE = window.CAE || {};      // Author namespace

    (($, U) => {

        Object.defineProperty($, 'VERSION', { value: 1.0 });    // Version declaration
        window.Imported = window.Imported || {};                // Import namespace
        Imported[PLUGIN_NAME] = $.VERSION;                      // Import declaration

    // ======== Utility (share) ======== //
    // ======== Parameter stuff ======== //

        void (p => {

            if (!p) { SceneManager.showDevTools(); throw new Error(ERR_NOPARAM); };

            $.parse = {
                bool:   function(name) { return p[name] === 'true'; },
                num:    function(name) { return Number(p[name]) || 0; },
                arr:    function(name) { return JSON.parse(p[name] || '[]'); },
                prop:   function(name, dFault = '_' + name) {
                    const prop = p['Property: ' + name];
                    if (!prop) {
                        console.warn(WARN_BADVAL.format(prop, 'property', name, dFault));
                        return dFault;
                    }
                    return prop;
                }
            };

            $.setDashSpeed = function(value) {
                $.dashSpeed = value === undefined ? $.parse.num('Dash Extra Speed') : Number(value);
            };

            $.dashNoStand = $.parse.bool('Skip Standing Frame');
            $.save        = $.parse.bool('Add Save Data');

            Object.defineProperty($, 'P_DASHSPD', { value: $.parse.prop('dashSpeed') });
            Object.defineProperty($, 'P_DASHING', { value: $.parse.prop('isDashing') });
            Object.defineProperty($, 'P_SAVE',    { value: $.parse.prop('Save', PLUGIN_NAME) });

        })($.params = PluginManager.parameters(PLUGIN_NAME));

    // ========= Init Routines ========= //

        $._init = function() { $.setDashSpeed(); }
        $._init();

    // ======== Utility (local) ======== //

        /** Returns number of stepping frames, because maxPattern is for ping-pong anims (0,1,2,1). */
        $.patternCount = function() { return 3; };

        /**
         * @param {Game_CharacterBase} char - Game_CharacterBase reference
         * @returns {Number} Additive dash speed for this character.
         */
        $.dashMoveSpeed = function(char) { return char[$.P_DASHSPD] || $.dashSpeed; };

        /**
         * @param {Object} contents - Aggregate save contents
         * @returns {Object} Save contents including plugin data.
         */
        $.mkSave = function(contents) {
            contents[$.P_SAVE] = $.dashSpeed;
            return contents;
        };

        /**
         * Extracts plugin data from provided save contents.
         * @param {Object} contents - Save contents from file
         */
        $.exSave = function(contents) { $.setDashSpeed(contents[$.P_SAVE]); };

    // ======== Plugin Commands ======== //

        $.com = {
            /**
             * Sets the global dash speed value.
             * @param {{Value:Number}} args - Plugin command arguments
             */
            setDashSpeed:   function(args) { $.setDashSpeed(args.Value); },
            /**
             * Resets the global dash speed to the plugin parameter value.
             * @param {{}} [args] - [This command has no arguments.]
             */
            resetDashSpeed: function(args) { $.setDashSpeed(); }
        };
        PluginManager.registerCommand(PLUGIN_NAME, 'Set Dash Speed', $.com.setDashSpeed);
        PluginManager.registerCommand(PLUGIN_NAME, 'Reset Dash Speed', $.com.resetDashSpeed);

    // ============ Extends ============ //
    // ========== Alterations ========== //

        // Override! Outsource the dash move speed part.
        Game_CharacterBase.prototype.realMoveSpeed = function() {
            return this._moveSpeed + (this.isDashing() ? $.dashMoveSpeed(this) : 0);
        };

        // Override! Dash handling has been moved up to parent & extended.
        Game_Player.prototype.realMoveSpeed = function() {
            return Game_CharacterBase.prototype.realMoveSpeed.apply(this, arguments);
        };

        $.alias = $.alias || {};        // This plugin's alias namespace

        // Alias! Skip standing frame (1) if appropriate when dashing.
        void (alias => {
            Game_CharacterBase.prototype.updatePattern = function() {
                alias.apply(this, arguments);
                if (!$.dashNoStand || !this.isDashing()) return;
                if (this.pattern() === 1) {
                    this._pattern = (this._pattern + 1) % this.maxPattern();    // next!
                }
            };
        })($.alias.Game_CharacterBase_updatePattern = Game_CharacterBase.prototype.updatePattern);

        // Alias! Let other characters dash if they want to.
        void (alias => {
            Game_CharacterBase.prototype.isDashing = function() {
                return this[$.P_DASHING] || alias.apply(this, arguments);
            };
        })($.alias.Game_CharacterBase_isDashing = Game_CharacterBase.prototype.isDashing);

        // Alias! Initialise plugin data on new game.
        void (alias => {
            DataManager.createGameObjects = function() {
                alias.apply(this, arguments);
                $._init();
            };
        })($.alias.DataManager_createGameObjects = DataManager.createGameObjects);

        // Save/load stuff...
        void (() => { if (!$.save) return;

            // Alias! Add plugin data to save contents.
            void (alias => {
                DataManager.makeSaveContents = function() {
                    return $.mkSave(alias.apply(this, arguments));
                };
            })($.alias.DataManager_makeSaveContents = DataManager.makeSaveContents);

            // Alias! Extract plugin data from save contents.
            void (alias => {
                DataManager.extractSaveContents = function(contents) {
                    alias.apply(this, arguments);
                    $.exSave(contents);
                };
            })($.alias.DataManager_extractSaveContents = DataManager.extractSaveContents);

        })();

    })(CAE[NAMESPACE] = CAE[NAMESPACE] || {}, CAE.Utils = CAE.Utils || {});

})();