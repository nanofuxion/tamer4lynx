import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'
import arrow from './assets/arrow.png?inline'
import lynxLogo from './assets/lynx-logo.png?inline'
import reactLynxLogo from './assets/react-logo.png?inline'

export function App(props: {
  onMounted?: () => void
}) {
  const [alterLogo, setAlterLogo] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    'background only'
    console.info('Hello, ReactLynx')
    props.onMounted?.()

    // --- WebSocket Connection ---
    // Establish connection to the server
    const websocket = new WebSocket('ws://localhost:8008');

    // Called when the connection is successfully opened
    websocket.onopen = () => {
      console.log('WebSocket connection established.');
      // Send initial message after connection is open
      websocket.send('Hello from Lynx!');
    };

    // Called when a message is received from the server
    websocket.onmessage = (event) => {
      console.log('Received message:', event.data);
      // Add the new message directly to our messages array
      setMessages(prevMessages => [...prevMessages, event.data]);
      
      // Echo the received message back to the server
      // websocket.send(`Client received: ${event.data}`);
    };

    // Called when an error occurs
    websocket.onerror = (error: any) => {
      console.error('WebSocket Error:', error.message);
    };

    // Called when the connection is closed
    websocket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
    };

    // Store the websocket reference for use in onTap
    setWs(websocket);

    // Cleanup function: This will be called when the component is unmounted
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [props]) // The effect runs once when the component mounts

  const onTap = useCallback(() => {
    'background only'
    setAlterLogo(prevAlterLogo => !prevAlterLogo)
    // NativeModules.JiggleModule.vibrate(50);
    
    // Send message through the WebSocket instance created in useEffect
    if (ws) {
      ws.send("Hello from Lynx tap!");
    }
  }, [ws])

  return (
    <view>
      <view className='Background' />
      <view className='App'>
        <view className='Banner'>
          <view className='Logo' bindtap={onTap}>
            {alterLogo
              ? <image src={reactLynxLogo} className='Logo--react' />
              : <image src={lynxLogo} className='Logo--lynx' />}
          </view>
          <text className='Title'>React</text>
          <text className='Subtitle'>on Lynx</text>
        </view>
        <view className='Content'>
          {/* Display WebSocket messages */}
          <text className='Description'>Server Messages:</text>
          {messages.map((msg, index) => (
            <text key={index} className='Hint'>{msg}</text>
          ))}
        </view>
        <view style={{ flex: 1 }}></view>
      </view>
    </view>
  )
}