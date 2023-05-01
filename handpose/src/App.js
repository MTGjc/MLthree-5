//import logo from './logo.svg';
import React, {useRef, useEffect, useState, Suspense} from 'react';
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import './App.css';
import { drawHand } from './utilitiesForHand';

import * as THREE from "three";
import { Canvas, useThree, useFrame, extend } from "react-three-fiber";
import { OrbitControls, useGLTF, Effects } from "@react-three/drei";
import url from "./assets/telepathy1.mp4";


import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass";

extend({BloomPass, GlitchPass});



const Man = () =>{
  const { nodes} = useGLTF('fall.gltf');
  return (
    <group rotation={[Math.PI / 8, Math.PI * 1.2, 0]}>
      <mesh geometry ={nodes.man.geometry}>
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

const Screen = () =>{
  const { nodes } = useGLTF('cube1.gltf');
  const [video] = useState(() => {
    const vid = document.createElement("video");
    vid.src = url;
    vid.crossOrigin = "Anonymous";
    vid.loop = true;
    vid.muted = true;
    vid.play();
    return vid;
  });

  return (
    <group rotation={[Math.PI / 8, Math.PI * 1.2, 0]}>
      <mesh geometry={nodes.Cube.geometry}>
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh rotation={[0, 0, 0]} position={[0, 0, 1.1]}>
        <planeGeometry args={[3.2, 1.9]} />
        <meshStandardMaterial emissive={"white"} side={THREE.DoubleSide}>
          <videoTexture attach="map" args={[video]} />
          <videoTexture attach="emissiveMap" args={[video]} />
        </meshStandardMaterial>
      </mesh>
    </group>
  );
}


function Camera(){
  const camera = useRef(null);
  const [cameraX, setCameraX] = useState(0);
  
  useFrame(({ mouse }) => {
    camera.position.x = cameraX;
    setCameraX((mouse.x * window.innerWidth) / 100);
  }, [camera, cameraX, setCameraX]);

  return (
    <mesh position={[cameraX, 0, 10]} ref={camera}>
      <perspectiveCamera fov={50} />
    </mesh>
  );
}

function App() {
  const webcamRef =useRef(null);
  const canvasRef =useRef(null);


  const runHandpose = async () =>{
    const net = await handpose.load();
    console.log('handpose loaded');

    setInterval(()=>{detect(net)}, 100)
  }
  
  const detect =async (net) => {
    if(
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !==null &&
      webcamRef.current.video.readyState === 4
    ){
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hand = await net.estimateHands(video);
      console.log(hand);

      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);
    }

  }

  runHandpose();

  useEffect(() => {
    const webgazer = window.webgazer;
    window.saveDataAcrossSessions = true;

    webgazer.setGazeListener((data,clock)=>{
      console.log(data,clock)
    }).begin()
  }, []);


  const Floor = () => {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -2, 0]}>
        <planeBufferGeometry args={[100, 100]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    );
  };


  return (
    <div className="App">
      <header className="App-header">
        <Webcam ref={webcamRef}
          style={{
            position:"absolute",
            marginLeft:"auto",
            marginRight:"auto",
            left:0,
            right:0,
            textAlign:"center",
            zindex: 9,
            width:640,
            height:480
          }}
        />
        <canvas ref={canvasRef}
          style={{
            position:"absolute",
            marginLeft:"auto",
            marginRight:"auto",
            left:0,
            right:0,
            textAlign:"center",
            zindex: 9,
            width:640,
            height:480
          }}
        />
        <Canvas>
            <Effects>
              <bloomPass attachArray="passes" />
              <glitchPass attachArray="passes"/>
            </Effects>

            <OrbitControls/>
          {/* <Camera camera={{ position: [cameraX, 0, 20], fov: 50 }}/> */}
          <fog attach="fog" args={["red", 1, 70]} />
          <directionalLight intensity={0.5} />
          <Suspense fallback={null}>
            <Man />
            <Screen />
          </Suspense>
          <Floor />
        </Canvas>

      </header>
    </div>
  );
}

export default App;
