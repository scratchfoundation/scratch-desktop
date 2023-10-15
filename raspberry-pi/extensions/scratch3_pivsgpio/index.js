const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

const fs = window.require('fs');
const cp = window.require('child_process');
const path = window.require('path');
const gpio = window.require(path.join(__static,'gpiolib.node'))

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2YxNWEyNDt9LmNscy0ye2ZpbGw6I2M4YzhjODt9LmNscy0ze2ZpbGw6I2VkMWMyNDt9LmNscy00e2ZpbGw6IzE1OGU2ODt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlNpbXBsZSBFbGVjdHJvbmljcyBTY3JhdGNoIEljb24gTEVEPC90aXRsZT48ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zMC41NiwxOS40NFY1MEg1Mi43OFYxOS40NEExMS4xMiwxMS4xMiwwLDAsMCw0MS42Nyw4LjMzaDBBMTEuMTEsMTEuMTEsMCwwLDAsMzAuNTYsMTkuNDRaIi8+PHJlY3QgY2xhc3M9ImNscy0yIiB4PSIzMS4yNSIgeT0iNTAiIHdpZHRoPSI2LjI1IiBoZWlnaHQ9IjQxLjY3Ii8+PHJlY3QgY2xhc3M9ImNscy0yIiB4PSI0NS44MyIgeT0iNTAiIHdpZHRoPSI2LjI1IiBoZWlnaHQ9IjMzLjMzIi8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIyOS4xNyIgeT0iNDEuNjciIHdpZHRoPSIyNSIgaGVpZ2h0PSI4LjMzIi8+PHBhdGggY2xhc3M9ImNscy00IiBkPSJNODkuNTEsNzQuNjhsLS4yMi0uMzlhNC45MSw0LjkxLDAsMCwwLTIuODYtNC44MmMuNDctLjEyLjk1LS4yMiwxLjA4LS44LjgtLjIsMS0uNTcsMS0xLC4yMS0uMTQuOTEtLjUyLjg0LTEuMTlhMSwxLDAsMCwwLC41LTEuMDljLjQyLS40Ni41My0uODMuMzUtMS4xOEEuODcuODcsMCwwLDAsOTAuMzIsNjNjLjM4LS42NywwLTEuNC0xLTEuMjgtLjQyLS42MS0xLjM0LS40Ny0xLjQ4LS40Ny0uMTYtLjItLjM3LS4zNi0xLS4yOGExLjI0LDEuMjQsMCwwLDAtMS4zNy0uMTNjLS41Ny0uNDQtMS0uMDktMS4zOSwwLS42OS0uMjItLjg1LjA4LTEuMTkuMi0uNzYtLjE1LTEsLjE5LTEuMzUuNTRoLS40MmE0LjY2LDQuNjYsMCwwLDAtMS45MSwyLjY3LDQuNzYsNC43NiwwLDAsMC0xLjkxLTIuNjdoLS40M2MtLjM2LS4zNS0uNTktLjY5LTEuMzUtLjU0LS4zNC0uMTItLjUtLjQyLTEuMTktLjJhMi42NywyLjY3LDAsMCwwLS44Ni0uMjZoMGEuODguODgsMCwwLDAtLjUzLjIxLDEuMjQsMS4yNCwwLDAsMC0xLjM3LjEzYy0uNjUtLjA4LS44Ni4wOC0xLC4yOC0uMTUsMC0xLjA3LS4xNC0xLjQ5LjQ3LTEuMDYtLjEyLTEuNC42MS0xLDEuMjhhLjg4Ljg4LDAsMCwwLC4wNywxLjI3Yy0uMTguMzUtLjA3LjcyLjM1LDEuMThhMSwxLDAsMCwwLC41LDEuMDljLS4wNy42Ny42MywxLjA2Ljg0LDEuMTkuMDguMzkuMjUuNzYsMSwxLC4xMy41OC42Mi42OCwxLjA4LjhhNC44OSw0Ljg5LDAsMCwwLTIuODUsNC44MmwtLjIzLjM5QTQuNjgsNC42OCwwLDAsMCw2OCw4MS44MSwxMy4xNSwxMy4xNSwwLDAsMCw2OC42Myw4NCw1LjI2LDUuMjYsMCwwLDAsNzIsODguMTJhMTEuNCwxMS40LDAsMCwwLDMuMjEsMS43Nyw1LjQ0LDUuNDQsMCwwLDAsNCwxLjcyaC4wNmE1LjQyLDUuNDIsMCwwLDAsMy45NC0xLjcyLDExLjI2LDExLjI2LDAsMCwwLDMuMjEtMS43N0E1LjI3LDUuMjcsMCwwLDAsODkuNzEsODRhMTMuMTgsMTMuMTgsMCwwLDAsLjY3LTIuMTRBNC42OCw0LjY4LDAsMCwwLDg5LjUxLDc0LjY4Wm0tMS4zNi0uNDhjLS4wOSwxLjEzLTYuMDctMy45NC01LTQuMTFDODUuOTEsNjkuNjMsODguMjUsNzEuMjUsODguMTUsNzQuMlptLTIuNjQsNS42NGEzLjY2LDMuNjYsMCwwLDEtNC44NC0xLjM4LDMuMzksMy4zOSwwLDAsMSwuNi00Ljg0QTMuNjcsMy42NywwLDAsMSw4Ni4xMiw3NSwzLjQsMy40LDAsMCwxLDg1LjUxLDc5Ljg0Wk04MS4zNCw2Mi4zOGEuODQuODQsMCwwLDAsLjE4LjQ2LDkuMiw5LjIsMCwwLDEsMS0xLjA1YzAsLjItLjEuNDIuMTUuNTdhMywzLDAsMCwxLDEtLjhjLS4yLjM0LDAsLjQ0LjA3LjU4YTMuMzksMy4zOSwwLDAsMSwxLjE5LS43NWMtLjE2LjE5LS4zOC4zOC0uMTQuNmEzLjQ3LDMuNDcsMCwwLDEsMS40Mi0uNTRjLS4xOC4xOS0uNTQuMzgtLjMyLjU3YTYuNjEsNi42MSwwLDAsMSwxLjM2LS4zM2MtLjI0LjE5LS40NC4zOC0uMjUuNTNhMywzLDAsMCwxLDEuNjItLjE1bC0uMzcuMzZhMTAuNDYsMTAuNDYsMCwwLDAsMS40NywwLDIuODgsMi44OCwwLDAsMC0uNTcsMS4xMWMuMDYuMDYuMzYsMCwuNjQsMC0uMjkuNTktLjc5Ljc0LS45MSwxYS43NS43NSwwLDAsMCwuNjksMCw0LjY2LDQuNjYsMCwwLDEtMSwxLjA1Yy4wOS4wNi4yNC4wOS42LDBhNS42Myw1LjYzLDAsMCwxLTEuMTUuOTFjLjA4LjA5LjM1LjA5LjYxLjA5YTUuNzksNS43OSwwLDAsMS0xLjQzLjg2Ljg1Ljg1LDAsMCwwLC42MS4xMyw0Ljk0LDQuOTQsMCwwLDEtMS41LjYuNTMuNTMsMCwwLDAsLjQzLjI1Yy0uNTguMzItMS40Mi4xOC0xLjY2LjM0YS43My43MywwLDAsMCwuNDEuMzVjLS45NC4wNi0zLjUyLDAtNC0yYTIwLjQ5LDIwLjQ5LDAsMCwxLDUuNzYtMy43OUExOS44NSwxOS44NSwwLDAsMCw4MSw2Ni43M0M3OC44OCw2NS43Nyw4MC4zMiw2My4zNCw4MS4zNCw2Mi4zOFptLTIuMTEsNi45NGgwYzEuNDgsMCwzLjMyLDEuMDcsMy4zMSwyLjFzLTEuMjksMS42NC0zLjMsMS42My0zLjMtLjkyLTMuMjktMS44Uzc3LjU1LDY5LjI4LDc5LjIzLDY5LjMyWm0tNy41Ni0uNzhhLjU1LjU1LDAsMCwwLC40NC0uMjUsNC45NCw0Ljk0LDAsMCwxLTEuNS0uNi44NS44NSwwLDAsMCwuNjEtLjEzLDUuNzksNS43OSwwLDAsMS0xLjQzLS44NmMuMjUsMCwuNTMsMCwuNjEtLjA5YTUuMzcsNS4zNywwLDAsMS0xLjE1LS45MWMuMzYsMCwuNTEsMCwuNTksMGE0Ljg0LDQuODQsMCwwLDEtMS0xLjA1Ljc1Ljc1LDAsMCwwLC42OSwwYy0uMTItLjI2LS42Mi0uNDEtLjkxLTEsLjI4LDAsLjU4LjA2LjY0LDBhMi44OCwyLjg4LDAsMCwwLS41Ny0xLjExLDEzLjI0LDEzLjI0LDAsMCwwLDEuNDYsMGwtLjM3LS4zN2EzLDMsMCwwLDEsMS42Mi4xNWMuMi0uMTUsMC0uMzQtLjI0LS41M2E2LjYxLDYuNjEsMCwwLDEsMS4zNi4zM2MuMjEtLjE5LS4xNC0uMzgtLjMyLS41N2EzLjQ3LDMuNDcsMCwwLDEsMS40Mi41NGMuMjQtLjIyLDAtLjQxLS4xNC0uNmEzLjM5LDMuMzksMCwwLDEsMS4xOS43NWMuMTEtLjE0LjI3LS4yNC4wNy0uNThhMywzLDAsMCwxLDEsLjhjLjI1LS4xNS4xNS0uMzcuMTUtLjU3YTkuMiw5LjIsMCwwLDEsMSwxLjA1Yy4wNywwLC4xMy0uMjEuMTgtLjQ2LDEsMSwyLjQ2LDMuMzkuMzcsNC4zNWExOS42OCwxOS42OCwwLDAsMC02LjI2LTMuMjQsMjAuNTIsMjAuNTIsMCwwLDEsNS43NSwzLjc4Yy0uNDksMS45My0zLjA3LDItNCwyYS43Mi43MiwwLDAsMCwuNDItLjM1QzczLjEsNjguNzIsNzIuMjYsNjguODYsNzEuNjcsNjguNTRaTTc1LjM3LDcwYzEsLjE3LTUsNS4yNC01LDQuMTFDNzAuMjMsNzEuMTYsNzIuNTYsNjkuNTUsNzUuMzcsNzBaTTY5LDgxLjMyYTMuNjksMy42OSwwLDAsMSwuNzctNkM3MS40MSw3NC45NCw3MC4zNCw4MS44OSw2OSw4MS4zMlptNS41OCw1Ljk0Yy0uODIuNDgtMi44MS4yOC00LjIyLTEuNjktMS0xLjY2LS44My0zLjM1LS4xNi0zLjg0LDEtLjU5LDIuNTUuMjEsMy43NCwxLjU1Uzc1LjQ3LDg2LjYzLDc0LjYsODcuMjZaTTczLDgwYTMuMzksMy4zOSwwLDAsMS0uNjEtNC44NCwzLjY2LDMuNjYsMCwwLDEsNC44NC0xLjM4LDMuMzksMy4zOSwwLDAsMSwuNjEsNC44NEEzLjY2LDMuNjYsMCwwLDEsNzMsODBabTYuMjgsMTAuNjNjLTEuOC4wOC0zLjU3LTEuNDMtMy41NS0yLDAtLjc2LDIuMi0xLjM2LDMuNjUtMS4zM3MzLjQxLjQ2LDMuNDIsMS4xNVM4MSw5MC42Nyw3OS4yNiw5MC42NFptMy42MS03LjU3YTMuNjUsMy42NSwwLDAsMS03LjI2LDB2MGEzLjY1LDMuNjUsMCwwLDEsNy4yNiwwWm01LjA2LDIuNTljLTEuNTYsMi4xLTMuNjYsMi4xOC00LjQ1LDEuNTktLjgyLS43NS0uMTktMy4wOC45My00LjM2aDBjMS4yOS0xLjQsMi42Ni0yLjMzLDMuNjItMS42MUEzLjkyLDMuOTIsMCwwLDEsODcuOTMsODUuNjZabTEuNC00LjQzYy0xLjMyLjU3LTIuNC02LjM4LS43Ny02QTMuNywzLjcsMCwwLDEsODkuMzMsODEuMjNaIi8+PHBvbHlnb24gY2xhc3M9ImNscy00IiBwb2ludHM9IjcxLjE4IDYzLjQ4IDcxLjE5IDYzLjQ5IDcxLjE4IDYzLjQ4IDcxLjE4IDYzLjQ4Ii8+PHBvbHlnb24gY2xhc3M9ImNscy00IiBwb2ludHM9Ijg3LjIzIDYzLjQ4IDg3LjIzIDYzLjQ4IDg3LjI0IDYzLjQ4IDg3LjIzIDYzLjQ4Ii8+PC9nPjwvc3ZnPg=='

/**
 * Class for the Raspberry Pi GPIO blocks in Scratch 3.0
 * @constructor
 */
class Scratch3PiVSGPIOBlocks {
    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Raspberry Pi Simple Electronics';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'pivsgpio';
    }
    
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }


    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3PiVSGPIOBlocks.EXTENSION_ID,
            name: Scratch3PiVSGPIOBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'when_gpio',
                    text: formatMessage({
                        id: 'pivsgpio.when_gpio',
                        default: 'when button [GPIO] is [HILO]',
                        description: 'when the button is in the specified state'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        GPIO: {
                            type: ArgumentType.STRING,
                            menu: 'gpios',
                            defaultValue: '0'
                        },
                        HILO: {
                            type: ArgumentType.STRING,
                            menu: 'pressed',
                            defaultValue: 'pressed'
                        }
                    }
                },
                {
                    opcode: 'get_gpio',
                    text: formatMessage({
                        id: 'pivsgpio.get_gpio',
                        default: 'button [GPIO] is [HILO] ?',
                        description: 'is the button in the specified state?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        GPIO: {
                            type: ArgumentType.STRING,
                            menu: 'gpios',
                            defaultValue: '0'
                        },
                        HILO: {
                            type: ArgumentType.STRING,
                            menu: 'pressed',
                            defaultValue: 'pressed'
                        }
                    }
                },
                { 
                    opcode: 'set_gpio',
                    text: formatMessage({
                        id: 'pivsgpio.set_gpio',
                        default: 'turn LED [GPIO] [HILO]',
                        description: 'set the LED to the specified state'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        GPIO: {
                            type: ArgumentType.STRING,
                            menu: 'gpios',
                            defaultValue: '0'
                        },
                        HILO: {
                            type: ArgumentType.STRING,
                            menu: 'onoff',
                            defaultValue: 'on'
                        }
                    }
                },
                { 
                    opcode: 'toggle_gpio',
                    text: formatMessage({
                        id: 'pivsgpio.toggle_gpio',
                        default: 'toggle LED [GPIO]',
                        description: 'change the state of the LED'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        GPIO: {
                            type: ArgumentType.STRING,
                            menu: 'gpios',
                            defaultValue: '0'
                        }
                    }
                },
            ],
            menus: {
                gpios: {
                    acceptReporters: true,
                    items: ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27']
                },
                pressed: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'pivsgpio.pressed',
                                default: 'pressed',
                                description: 'button pressed'
                            }),
                            value: 'pressed'
                        },
                        {
                            text: formatMessage({
                                id: 'pivsgpio.released',
                                default: 'released',
                                description: 'button released'
                            }),
                            value: 'released'
                        }
                    ]
                },
                onoff: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'pivsgpio.on',
                                default: 'on',
                                description: 'LED on'
                            }),
                            value: 'on'
                        },
                        {
                            text: formatMessage({
                                id: 'pivsgpio.off',
                                default: 'off',
                                description: 'LED off'
                            }),
                            value: 'off'
                        }
                    ]
                }
            }
        };
    }

    // Get pin state (set pin as input)    
    when_gpio (args)
    {
        const pin = Cast.toNumber (args.GPIO);
        const val = Cast.toString (args.HILO);

        state = gpio.get(pin,0,2) // Get state of pin, set pin as input, make pull up

        if (state == 1)
        {
            if (val == 'released') return true;
            else return false;
        }
        else
        {
            if (val == 'pressed') return true;
            else return false;
        }
    }

    // Get pin state (set pin as input)    
    get_gpio (args)
    {
        const pin = Cast.toNumber (args.GPIO);
        const val = Cast.toString (args.HILO);

        state = gpio.get(pin,0,2) // Get state of pin, set pin as input, make pull up

        if (state == 1)
        {
            if (val == 'released') return true;
            else return false;
        }
        else
        {
            if (val == 'pressed') return true;
            else return false;
        }
    }

    // Set pin as output and set drive
    set_gpio (args)
    {
        if(Cast.toString(args.HILO) == "on")
            drive = 1;
        else
            drive = 0;

        gpio.set(Cast.toNumber(args.GPIO),drive);        
    }

    // Toggle output pin state
    toggle_gpio (args)
    {
        gpio.toggle(Cast.toNumber(args.GPIO));
    }

}

module.exports = Scratch3PiVSGPIOBlocks;
