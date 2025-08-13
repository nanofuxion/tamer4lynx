const webSockets = new Map();
let nextId = 1;

// Remove or comment out this section that creates a separate connection for console.log
(() => {
    'background only'
    NativeModules.LynxWebSocketModule.connect('ws://localhost:8008', 0);
    global.console = {
        ...global.console,
        log: (...args) => {
            NativeModules.LynxWebSocketModule.send(0, args.join(' '));
        }
    };
    console.log('WebSocket connection established.');
})();

(() => {
    'background only'
    const nativeBridge = lynx.getJSModule('GlobalEventEmitter');

    // This listener handles the 'open' event for a WebSocket connection.
    nativeBridge.addListener('websocket:open', (event) => {
        const { id } = JSON.parse(event.payload);
        const ws = webSockets.get(id);
        if (ws && ws.onopen) {
            ws.onopen();
        }
    });

    // This listener handles incoming messages on a WebSocket.
    nativeBridge.addListener('websocket:message', (event) => {
        const { id, data } = JSON.parse(event.payload);
        const ws = webSockets.get(id);
        if (ws && ws.onmessage) {
            ws.onmessage({ data });
        }
    });

    // This listener handles any errors that occur on the WebSocket connection.
    nativeBridge.addListener('websocket:error', (event) => {
        const { id, message } = JSON.parse(event.payload);
        const ws = webSockets.get(id);
        if (ws && ws.onerror) {
            ws.onerror(new Error(message));
        }
    });

    // This listener handles the closing of a WebSocket connection.
    nativeBridge.addListener('websocket:close', (event) => {
        const { id, code, reason } = JSON.parse(event.payload);
        const ws = webSockets.get(id);
        if (ws && ws.onclose) {
            ws.onclose({ code, reason });
        }
        // Clean up the instance after the connection is closed.
        webSockets.delete(id);
    });

    // Polyfill the global WebSocket object.
    global.WebSocket = class WebSocket {
        constructor(url) {
            this.id = nextId++;
            this.url = url;

            // Callback properties to be set by the user.
            this.onopen = null;
            this.onmessage = null;
            this.onerror = null;
            this.onclose = null;

            webSockets.set(this.id, this);
            NativeModules.LynxWebSocketModule.connect(url, this.id);
        }

        send(message) {
            NativeModules.LynxWebSocketModule.send(this.id, message);
        }

        close(code = 1000, reason = 'Normal closure') {
            NativeModules.LynxWebSocketModule.close(this.id, code, reason);
        }
    };
})();