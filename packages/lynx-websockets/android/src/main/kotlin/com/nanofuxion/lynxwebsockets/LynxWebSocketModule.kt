// Copyright 2019 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
package com.nanofuxion.lynxwebsockets

import android.content.Context
import android.util.Log
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.JavaOnlyArray
import com.lynx.react.bridge.JavaOnlyMap
import com.lynx.tasm.behavior.LynxContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

class LynxWebSocketModule(context: Context) : LynxModule(context) {

    private val client = OkHttpClient()
    private val webSockets = ConcurrentHashMap<Int, WebSocket>()

    companion object {
        private const val TAG = "LynxWebSocketModule"
    }

    @LynxMethod
    fun connect(url: String, id: Int) {
        Log.d(TAG, "Connecting to WebSocket id: $id, url: $url")
        val request = Request.Builder().url(url).build()
        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket id: $id opened.")
                webSockets[id] = webSocket
                val json = JSONObject().apply { put("id", id) }.toString()
                emitEvent("websocket:open", json)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Message received for WebSocket id: $id, data: $text")
                val json = JSONObject().apply {
                    put("id", id)
                    put("data", text)
                }.toString()
                emitEvent("websocket:message", json)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket id: $id closing with code: $code, reason: $reason")
                webSocket.close(1000, reason)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket id: $id closed with code: $code, reason: $reason")
                val json = JSONObject().apply {
                    put("id", id)
                    put("code", code)
                    put("reason", reason)
                }.toString()
                emitEvent("websocket:close", json)
                webSockets.remove(id)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                val errorMessage = t.message ?: "Unknown error"
                Log.e(TAG, "Failure for WebSocket id: $id, error: $errorMessage")
                val json = JSONObject().apply {
                    put("id", id)
                    put("message", errorMessage)
                }.toString()
                emitEvent("websocket:error", json)
                webSockets.remove(id)
            }
        }
        client.newWebSocket(request, listener)
    }

    @LynxMethod
    fun send(id: Int, message: String) {
        Log.d(TAG, "Sending message to WebSocket id: $id, message: $message")
        webSockets[id]?.send(message)
    }

    @LynxMethod
    fun close(id: Int, code: Int, reason: String) {
        Log.d(TAG, "Closing WebSocket id: $id with code: $code, reason: $reason")
        webSockets[id]?.close(code, reason)
        webSockets.remove(id)
    }

    private fun emitEvent(eventName: String, jsonData: String) {
        Log.d(TAG, "Emitting event: $eventName with payload: $jsonData")
        val lynxContext = mContext as? LynxContext ?: return

        // The JS listener expects a single event object with a 'payload' property.
        val eventDetails = JavaOnlyMap()
        eventDetails.putString("payload", jsonData)

        // The arguments for the JS event listener must be passed in an array.
        val params = JavaOnlyArray()
        params.pushMap(eventDetails)

        // Call sendGlobalEvent with the event name and the array of parameters.
        lynxContext.sendGlobalEvent(eventName, params)
    }
}