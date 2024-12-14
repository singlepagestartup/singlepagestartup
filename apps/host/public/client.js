import React from "react";
import ReactDOM from "react-dom";
import { Component } from "./component";

const data = window.__INITIAL_DATA__;

ReactDOM.hydrate(<Component data={data} />, document.getElementById("root"));
