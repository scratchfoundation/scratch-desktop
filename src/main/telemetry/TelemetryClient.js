import nets from 'nets';
import uuidv1 from 'uuid/v1'; // semi-persistent client ID
import uuidv4 from 'uuid/v4'; // random ID

/**
 * Basic telemetry event data. These fields are filled automatically by the `addEvent` call.
 * @typedef {object} BasicTelemetryEvent
 * @property {string} clientID - a UUID for this client
 * @property {string} id - a UUID for this event/packet
 * @property {string} name - the name of this event (taken from `addEvent`'s `eventName` parameter)
 * @property {int} timestamp - a Unix epoch timestamp for this event
 * @property {int} userTimezone - the difference in minutes between UTC and local time
 */

/**
  * Default telemetry service URLs
  */
const TelemetryServerURL = Object.freeze({
    staging: 'http://scratch-telemetry-s.us-east-1.elasticbeanstalk.com/',
    production: 'https://telemetry.scratch.mit.edu/'
});

/**
 * Default interval, in seconds, between delivery attempts
 */
const DefaultDeliveryInterval = 60;

/**
 * Default interval, in seconds, between connectivity checks
 */
const DefaultNetworkCheckInterval = 300;

/**
 * Client interface for the Scratch telemetry service.
 *
 * This class supports delivering generic telemetry events and is designed to be used by any application or service
 * in the Scratch family.
 */
class TelemetryClient {
    /**
     * Construct and initialize a TelemetryClient instance, optionally overriding configuration defaults. Delivery
     * intervals will begin immediately; if the user has not opted in events will be dropped each interval.
     *
     * @param {object} [options] - optional configuration settings for this client
     * @property {string} [clientId] - optional UUID for this client (default: automatically determine a UUID)
     * @property {string} [url] - optional telemetry service endpoint URL (default: automatically choose a server)
     * @property {boolean} [optIn] - optional flag for whether the user opted into telemetry service (default: false)
     * @property {int} [deliveryInterval] - optional number of seconds between delivery attempts (default: 60)
     * @property {int} [networkInterval] - optional number of seconds between connectivity checks (default: 300)
     * @property {int} [queueLimit] - optional limit on the number of queued events (default: 100)
     * @property {int} [attemptLimit] - optional limit on the number of delivery attempts for each event (default: 3)
     */
    constructor (options = null) {
        options = options || {};

        /**
         * Has the user explicitly opted into this service?
         * @type {boolean}
         */
        this._optIn = options.optIn || false;

        /**
         * Semi-persistent unique ID for this client
         */
        this._clientID = options.hasOwnProperty('clientId') ? options.clientId : uuidv1();

        /**
         * Server URL
         */
        this._serverURL = options.url || TelemetryServerURL.staging;

        /**
         * Can we currently reach the telemetry service?
         */
        this._networkIsOnline = false;

        /**
         * Queue for outgoing event packets
         */
        // TODO: packet queue persistence
        this._packetQueue = [];

        /**
         * Try to deliver telemetry packets at this interval
         */
        this._deliveryInterval = (options.deliveryInterval > 0) ? options.deliveryInterval : DefaultDeliveryInterval;

        /**
         * Check for connectivity at this interval
         */
        this._networkCheckInterval =
            (options.networkCheckInterval > 0) ? options.networkCheckInterval : DefaultNetworkCheckInterval;

        /**
         * Bind event handlers
         */
        this._attemptDelivery = this._attemptDelivery.bind(this);
        this._updateNetworkStatus = this._updateNetworkStatus.bind(this);

        /**
         * Begin monitoring network status
         */
        this._networkTimer = setInterval(this._updateNetworkStatus, this._networkCheckInterval * 1000);
        setTimeout(this._updateNetworkStatus, 0);

        /**
         * Begin the delivery interval
         */
        this._deliveryTimer = setInterval(this._attemptDelivery, this._deliveryInterval * 1000);
    }

    /**
     * Stop this client, saving state if appropriate.
     * Do not use this object after disposal.
     */
    dispose () {
        if (this._deliveryInterval !== null) {
            clearInterval(this._deliveryTimer);
            this._deliveryInterval = null;
        }
        // TODO: packet queue persistence
    }

    /**
     * Add an event to the telemetry system. If the user has opted into the telemetry service, this event will be
     * delivered to the telemetry service when possible. Otherwise the event will be ignored.
     *
     * @see {@link BasicTelemetryEvent} for the list of fields which are filled automatically by this method.
     *
     * @param {string} eventName - the name of this telemetry event, such as 'app::open'.
     * @param {object} additionalFields - optional event fields to add or override before sending the event.
     */
    addEvent (eventName, additionalFields = null) {
        const packetId = uuidv4();
        const now = new Date();

        const packet = Object.assign({
            id: packetId,
            clientID: this._clientID,
            name: eventName,
            timestamp: now.getTime(),
            userTimezone: now.getTimezoneOffset()
        }, additionalFields);
        const packetInfo = {
            attempts: 0,
            packet
        };
        this._packetQueue.push(packetInfo);
    }

    /**
     * Attempt to deliver events to the telemetry service. If telemetry is disabled, this will do nothing.
     */
    _attemptDelivery () {
        if (this._busy) {
            return;
        }

        /**
         * Attempt to deliver one event then asynchronously recurse, reenqueueing the event if delivery fails and the
         * event has not yet reached its retry limit. Sets `this._busy` before doing anything else and clears it once
         * the queue is empty or `this._optIn` is cleared.
         */
        const stepDelivery = () => {
            this._busy = true;
            if (!this._optIn || !this._networkIsOnline || this._packetQueue.length < 1) {
                this._busy = false;
                return;
            }
            const packetInfo = this._packetQueue.shift();
            ++packetInfo.attempts;
            const packet = packetInfo.packet;
            nets({
                body: JSON.stringify(packet),
                headers: {'Content-Type': 'application/json'},
                method: 'POST',
                url: this._serverURL
            }, (err, res) => {
                // TODO: check if the failure is because there's no Internet connection and if so refund the attempt
                const packetFailed = err || (res.statusCode !== 200);
                if (packetFailed) {
                    if (packetInfo.attempts < this._attemptsLimit) {
                        this._packetQueue.push(packetInfo);
                    } else {
                        console.warn('Dropping packet which exceeded retry limit', packet);
                    }
                }
                stepDelivery();
            });
        };

        stepDelivery();
    }

    /**
     * Check if the telemetry service is available
     */
    _updateNetworkStatus () {
        nets({
            method: 'GET',
            url: this._serverURL
        }, (err, res) => {
            this._networkIsOnline = !err && (res.statusCode === 200);
        });
    }
}

export default TelemetryClient;
