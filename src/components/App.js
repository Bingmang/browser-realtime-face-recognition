import React, { Component } from 'react'
import { Route, Router } from 'react-router-dom'
import createHistory from 'history/createBrowserHistory'
import '../styles/App.css'

import Home from './Home'
import ImageInput from './ImageInput'
import VideoInput from './VideoInput'

class App extends Component {
  render() {
    return (
      <div className="App">
        <Router history={createHistory({ basename: process.env.PUBLIC_URL })}>
          <div className="route">
            <Route exact path="/" component={Home} />
            <Route exact path="/photo" component={ImageInput} />
            <Route exact path="/camera" component={VideoInput} />
          </div>
        </Router>
      </div>
    )
  }
}

export default App
