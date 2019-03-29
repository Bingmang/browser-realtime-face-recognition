import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import Camera from 'react-html5-camera-photo'
import 'react-html5-camera-photo/build/css/index.css'
import { Spin, Alert } from 'antd'
import { loadModels, getFullFaceDescription, createMatcher } from '../api/face'

// Import face profile
const JSON_PROFILE = require('../descriptors/face-db.json')

const WIDTH = 420
const HEIGHT = 420
const inputSize = 160
const face_scan_interval = 200  // ms

class VideoInput extends Component {
  constructor(props) {
    super(props)
    this.webcam = React.createRef()
    this.state = {
      fullDesc: null,
      detections: null,
      descriptors: null,
      faceMatcher: null,
      match: null,
      facingMode: null,
      loading: true
    }
  }

  async componentWillMount() {
    await loadModels()
    let faceMatcher = await createMatcher(JSON_PROFILE)
    this.setState({ faceMatcher: faceMatcher, loading: false })
    await this.setInputDevice()
  }

  async setInputDevice() {
    let devices = await navigator.mediaDevices.enumerateDevices()
    devices = devices.filter(device => device.kind === 'videoinput')
    let state = {facingMode: {exact: 'environment'}}
    if (devices.length < 2) {
      state.facingMode = 'user'
    }
    this.setState(state)
    this.startCapture()
  }

  startCapture() {
    this.interval = setInterval(() => {
      this.capture()
    }, face_scan_interval)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  async capture() {
    if (!this.webcam.current) {
      return null
    }
    let fullDesc = await getFullFaceDescription(
      this.webcam.current.libCameraPhoto.getDataUri({}),
      inputSize
    )
    if (!!fullDesc) {
      this.setState({
        detections: fullDesc.map(fd => fd.detection),
        descriptors: fullDesc.map(fd => fd.descriptor)
      })
    }

    if (!!this.state.descriptors && !!this.state.faceMatcher) {
      let match = this.state.descriptors.map(descriptor =>
        this.state.faceMatcher.findBestMatch(descriptor)
      )
      this.setState({ match })
    }
  }

  render() {
    if (this.state.loading) {
      return (
        <Spin tip="Loading..." delay="200" size="large">
          <Alert 
            message="模型加载中"
            description="第一次打开时间可能较长，如果一直在加载，这边推荐亲科学上网..."
            type="info"
          />
        </Spin>
      )
    }

    const { detections, match, facingMode } = this.state
    
    let videoConstraints = null
    let camera = facingMode === 'user'? 'Front' : 'Back'
    if (facingMode) {
      videoConstraints = {
        width: WIDTH,
        height: HEIGHT,
        facingMode: facingMode
      }
    }

    let drawBox = null

    // draw bounding box
    if (detections) {
      drawBox = detections.map((detection, i) => {
        let _H = detection.box.height
        let _W = detection.box.width
        let _X = detection.box._x
        let _Y = detection.box._y
        return (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                border: 'solid',
                borderColor: 'blue',
                height: _H,
                width: _W,
                transform: `translate(${_X}px,${_Y}px)`
              }}
            >
              {!!match && !!match[i] ? (
                <p
                  style={{
                    backgroundColor: 'blue',
                    border: 'solid',
                    borderColor: 'blue',
                    width: _W,
                    marginTop: 0,
                    color: '#fff',
                    transform: `translate(0px,${_H}px)`
                  }}
                >
                  {match[i]._label}
                </p>
              ) : null}
            </div>
          </div>
        )
      })
    }

    return (
      <div
        className="Camera"
        style={{
          display: 'flex',
          flexDirection: 'column',
          // alignItems: 'center'
        }}
      >
        <p>Camera: {camera}</p>
        <div style={{ position: 'relative'}}>
          {videoConstraints ? (
            <div className="inner" style={{ position: 'absolute' }}>
              <Camera
                audio={false}
                ref={this.webcam}
                screenshotFormat="image/jpeg"
                // videoConstraints={videoConstraints}
              />
            </div>
          ) : null}
          {drawBox}
        </div>
      </div>
    )
  }
}

export default withRouter(VideoInput)
