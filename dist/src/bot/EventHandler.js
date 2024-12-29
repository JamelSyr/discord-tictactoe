"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventHandler {
    constructor() {
        this.listeners = new Map();
        this.supportEvent('newGame');
        this.supportEvent('win');
        this.supportEvent('tie');
        this.supportEvent("ended");
    }
    registerListener(eventName, callback) {
        const array = this.listeners.get(eventName);
        if (array) {
            array.push(callback);
        }
        else {
            throw new Error(`Cannot register event "${eventName}" because it does not exist`);
        }
    }
    emitEvent(eventName, data) {
        this.listeners.get(eventName)?.forEach(listener => listener(data));
    }
    supportEvent(eventName) {
        this.listeners.set(eventName, []);
    }
}
exports.default = EventHandler;
