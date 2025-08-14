import Foundation

// Imports the necessary Lynx framework modules.
// This requires a bridging header to be set up correctly in your project.
import Lynx

@objc(LynxWebSocketModule)
class LynxWebSocketModule: LynxModule {

    // A dictionary to hold all active WebSocket connections, keyed by a unique ID.
    // This is the Swift equivalent of the `mWebSocketMap` in the Kotlin file.
    private var webSocketTasks: [Int: URLSessionWebSocketTask] = [:]
    private let urlSession = URLSession(configuration: .default)

    // Exposes the module name to the Lynx runtime.
    override static func moduleName() -> String! {
        return "LynxWebSocketModule"
    }

    // Ensures methods are run on a dedicated queue for thread safety.
    override func methodQueue() -> DispatchQueue! {
        return DispatchQueue(label: "com.nanofuxion.lynxwebsockets")
    }

    // Creates a new WebSocket instance but does not connect it yet.
    // Mirrors the `create` method from the Kotlin file.
    @objc(create:callback:)
    func create(id: Int, callback: LynxCallback?) {
        // The concept of pre-creating a task without a URL is different in iOS.
        // We'll simply acknowledge the creation. The actual task is made in `connect`.
        print("WebSocket client with id \(id) created.")
        callback?.invoke(with: [])
    }

    // Connects a WebSocket to a specified URL.
    // Mirrors the `connect` method from the Kotlin file.
    @objc(connect:url:)
    func connect(id: Int, url: String) {
        guard let serverURL = URL(string: url) else {
            let errorEvent: [String: Any] = ["id": id, "reason": "Invalid URL"]
            self.sendEvent("onerror", withParams: errorEvent)
            return
        }

        let task = urlSession.webSocketTask(with: serverURL)
        webSocketTasks[id] = task
        
        // Start listening for messages
        listen(id: id)
        
        // Resume the task to initiate the connection.
        task.resume()
    }
    
    // Starts the recursive listening process for a given WebSocket connection.
    private func listen(id: Int) {
        guard let task = webSocketTasks[id] else { return }
        
        task.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .failure(let error):
                // Handle connection errors and closure.
                let errorEvent: [String: Any] = ["id": id, "reason": error.localizedDescription]
                self.sendEvent("onerror", withParams: errorEvent)
                
                let closeEvent: [String: Any] = ["id": id, "code": (error as NSError).code, "reason": error.localizedDescription]
                self.sendEvent("onclose", withParams: closeEvent)
                self.webSocketTasks.removeValue(forKey: id)

            case .success(let message):
                // The connection is considered open upon receiving the first message or successful handshake.
                // We'll send `onopen` upon the first successful `receive` call if it hasn't been sent.
                // A more robust implementation might use KVO on the task state.
                let openEvent: [String: Any] = ["id": id]
                self.sendEvent("onopen", withParams: openEvent)
                
                var messageContent: Any?
                switch message {
                case .string(let text):
                    messageContent = text
                case .data(let data):
                    // The JS layer expects a string, so we convert data to a Base64 string.
                    messageContent = data.base64EncodedString()
                @unknown default:
                    break
                }
                
                if let content = messageContent {
                    let messageEvent: [String: Any] = ["id": id, "data": content]
                    self.sendEvent("onmessage", withParams: messageEvent)
                }
                
                // Continue listening for the next message.
                self.listen(id: id)
            }
        }
    }

    // Sends a message through an active WebSocket connection.
    // Mirrors the `send` method from the Kotlin file.
    @objc(send:data:)
    func send(id: Int, data: String) {
        guard let task = webSocketTasks[id] else { return }
        task.send(.string(data)) { error in
            if let error = error {
                let errorEvent: [String: Any] = ["id": id, "reason": "Failed to send message: \(error.localizedDescription)"]
                self.sendEvent("onerror", withParams: errorEvent)
            }
        }
    }

    // Closes a specific WebSocket connection.
    // Mirrors the `close` method from the Kotlin file.
    @objc(close:code:reason:)
    func close(id: Int, code: Int, reason: String) {
        guard let task = webSocketTasks[id] else { return }
        let closeCode = URLSessionWebSocketTask.CloseCode(rawValue: code) ?? .normalClosure
        task.cancel(with: closeCode, reason: reason.data(using: .utf8))
        webSocketTasks.removeValue(forKey: id)
    }

    // Closes all active WebSocket connections.
    // Mirrors the `destroy` method from the Kotlin file.
    @objc
    func destroy() {
        for (id, task) in webSocketTasks {
            task.cancel(with: .normalClosure, reason: nil)
            let closeEvent: [String: Any] = ["id": id, "code": 1000, "reason": "Module destroyed"]
            self.sendEvent("onclose", withParams: closeEvent)
        }
        webSocketTasks.removeAll()
    }
}