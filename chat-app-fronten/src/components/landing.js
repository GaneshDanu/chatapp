import React from "react";
import { Link } from "react-router-dom";

export default function Landing(){
    return <div className="screen">
        <h1>Welcome to Chat App</h1>
        <Link to="/login">Login</Link>
        </div>
}