import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-500">Hello,</h1>
        <p className="text-gray-700">Welcome to k6 Script Generator.</p>
        <div className="mt-4">
          <Link
            to="/webk6"
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            WEB
          </Link>
          <Link
            to="/apik6"
            className="inline-block bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            API
          </Link>
          <Link
            to="/apigroupk6"
            className="inline-block bg-emerald-600 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
          >
            API-Group
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
